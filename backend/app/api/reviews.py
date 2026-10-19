from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import ColumnElement, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, contains_eager

from app.api.deps import CurrentUser, DbSession
from app.db.utils import violated_constraint
from app.models import Movie, Review, User
from app.schemas.common import PageParams, Paginated
from app.schemas.review import ReviewCreate, ReviewRead, ReviewUpdate

router = APIRouter(tags=["reviews"])

MOVIE_NOT_FOUND = "Film bulunamadı"
REVIEW_NOT_FOUND = "Bu filme yorumunuz yok"
ALREADY_REVIEWED = "Bu filme zaten yorum yaptınız"

Paging = Annotated[PageParams, Query()]


def not_found(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def paginate_reviews(db: Session, condition: ColumnElement[bool], paging: PageParams) -> dict:
    total = db.scalar(select(func.count()).select_from(Review).where(condition))
    # username için users tek JOIN ile gelir; yorum başına ek sorgu yok.
    items = db.scalars(
        select(Review)
        .join(Review.user)
        .options(contains_eager(Review.user))
        .where(condition)
        .order_by(Review.created_at.desc(), Review.id.desc())
        .offset(paging.offset)
        .limit(paging.page_size)
    ).all()
    return {"items": items, "total": total, "page": paging.page, "page_size": paging.page_size}


def get_own_review(db: Session, movie_id: int, user: User) -> Review:
    review = db.scalar(
        select(Review).where(Review.movie_id == movie_id, Review.user_id == user.id)
    )
    if review is None:
        raise not_found(REVIEW_NOT_FOUND)
    return review


@router.post(
    "/movies/{movie_id}/reviews",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    movie_id: int, payload: ReviewCreate, current_user: CurrentUser, db: DbSession
) -> Review:
    review = Review(
        movie_id=movie_id,
        user_id=current_user.id,
        rating=payload.rating,
        review_text=payload.review_text,
    )
    db.add(review)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        constraint = violated_constraint(exc)
        if constraint == "reviews_user_id_movie_id_key":
            raise HTTPException(status.HTTP_409_CONFLICT, detail=ALREADY_REVIEWED) from None
        if constraint == "reviews_movie_id_fkey":
            raise not_found(MOVIE_NOT_FOUND) from None
        raise
    db.refresh(review)
    return review


@router.get("/movies/{movie_id}/reviews", response_model=Paginated[ReviewRead])
def list_movie_reviews(movie_id: int, paging: Paging, db: DbSession) -> dict:
    if db.get(Movie, movie_id) is None:
        raise not_found(MOVIE_NOT_FOUND)
    return paginate_reviews(db, Review.movie_id == movie_id, paging)


@router.get("/movies/{movie_id}/reviews/me", response_model=ReviewRead)
def read_my_review(movie_id: int, current_user: CurrentUser, db: DbSession) -> Review:
    return get_own_review(db, movie_id, current_user)


@router.patch("/movies/{movie_id}/reviews/me", response_model=ReviewRead)
def update_my_review(
    movie_id: int, payload: ReviewUpdate, current_user: CurrentUser, db: DbSession
) -> Review:
    review = get_own_review(db, movie_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(review, field, value)
    db.commit()
    # avg_rating, sentiment_status ve updated_at'i trigger'lar değiştirir; DB'den oku.
    db.refresh(review)
    return review


@router.delete("/movies/{movie_id}/reviews/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_review(movie_id: int, current_user: CurrentUser, db: DbSession) -> None:
    db.delete(get_own_review(db, movie_id, current_user))
    db.commit()


@router.get("/users/me/reviews", response_model=Paginated[ReviewRead])
def list_my_reviews(current_user: CurrentUser, paging: Paging, db: DbSession) -> dict:
    return paginate_reviews(db, Review.user_id == current_user.id, paging)
