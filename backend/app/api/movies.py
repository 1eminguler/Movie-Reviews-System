from datetime import date
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import ColumnElement, exists, func, select

from app.api.deps import DbSession
from app.db.utils import LIKE_ESCAPE, contains_pattern
from app.models import MovieDetailView, movie_directors, movie_genres
from app.schemas.common import Paginated
from app.schemas.movie import MovieFilters, MovieRead

router = APIRouter(prefix="/movies", tags=["movies"])

view = MovieDetailView

SORT_COLUMNS = {
    "avg_rating": view.avg_rating,
    "review_count": view.review_count,
    "release_date": view.release_date,
    "title": view.title,
}


def filter_conditions(filters: MovieFilters) -> list[ColumnElement[bool]]:
    conditions: list[ColumnElement[bool]] = []
    if filters.search:
        conditions.append(view.title.ilike(contains_pattern(filters.search), escape=LIKE_ESCAPE))
    # Tür/yönetmen filtresi bağlantı tablosunda EXISTS ile: indeks kullanılır, film tekrar etmez.
    if filters.genre_id is not None:
        conditions.append(
            exists().where(
                movie_genres.c.movie_id == view.id, movie_genres.c.genre_id == filters.genre_id
            )
        )
    if filters.director_id is not None:
        conditions.append(
            exists().where(
                movie_directors.c.movie_id == view.id,
                movie_directors.c.director_id == filters.director_id,
            )
        )
    if filters.year_min is not None:
        conditions.append(view.release_date >= date(filters.year_min, 1, 1))
    if filters.year_max is not None:
        conditions.append(view.release_date <= date(filters.year_max, 12, 31))
    if filters.runtime_min is not None:
        conditions.append(view.runtime >= filters.runtime_min)
    if filters.runtime_max is not None:
        conditions.append(view.runtime <= filters.runtime_max)
    if filters.certification is not None:
        conditions.append(view.certification == filters.certification)
    if filters.language:
        conditions.append(view.original_language == filters.language)
    return conditions


@router.get("", response_model=Paginated[MovieRead])
def list_movies(filters: Annotated[MovieFilters, Query()], db: DbSession) -> dict:
    conditions = filter_conditions(filters)
    sort_column = SORT_COLUMNS[filters.sort]
    direction = sort_column.asc() if filters.order == "asc" else sort_column.desc()
    ordering = (direction.nulls_last(), view.id)

    total = db.scalar(select(func.count()).select_from(view).where(*conditions))
    # Önce yalnızca sayfadaki id'ler seçilir; view'ın tür/yönetmen dizileri OFFSET ile
    # atlanan satırlar için değil, sadece bu sayfadaki filmler için hesaplanır.
    page_ids = (
        select(view.id)
        .where(*conditions)
        .order_by(*ordering)
        .offset((filters.page - 1) * filters.page_size)
        .limit(filters.page_size)
        .subquery()
    )
    items = db.scalars(
        select(view).join(page_ids, view.id == page_ids.c.id).order_by(*ordering)
    ).all()
    return {"items": items, "total": total, "page": filters.page, "page_size": filters.page_size}


@router.get("/{movie_id}", response_model=MovieRead)
def get_movie(movie_id: int, db: DbSession) -> MovieDetailView:
    movie = db.get(view, movie_id)
    if movie is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Film bulunamadı")
    return movie
