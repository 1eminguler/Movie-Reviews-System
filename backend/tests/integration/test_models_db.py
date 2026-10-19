from decimal import Decimal

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.enums import SentimentStatus
from app.models import Director, Genre, Movie, MovieDetailView, Review, User

pytestmark = pytest.mark.integration


def make_user(db, name="tdd_user"):
    user = User(username=name, email=f"{name}@example.com", password_hash="hash")
    db.add(user)
    db.flush()
    return user


def make_movie(db, tmdb_id=900_000_001, title="TDD Movie"):
    movie = Movie(tmdb_id=tmdb_id, title=title)
    db.add(movie)
    db.flush()
    return movie


def test_user_insert_and_select(db):
    user = make_user(db)

    found = db.scalars(select(User).where(User.id == user.id)).one()

    assert found.username == "tdd_user"
    assert found.created_at is not None


def test_genre_and_director_insert_and_select(db):
    db.add_all([
        Genre(tmdb_genre_id=900_001, name="TDD Genre"),
        Director(tmdb_person_id=900_001, name="TDD Director"),
    ])
    db.flush()

    assert db.scalars(select(Genre).where(Genre.tmdb_genre_id == 900_001)).one().name == "TDD Genre"
    director = db.scalars(select(Director).where(Director.tmdb_person_id == 900_001)).one()
    assert director.name == "TDD Director"


def test_movie_insert_starts_without_reviews(db):
    movie = make_movie(db)

    found = db.scalars(select(Movie).where(Movie.id == movie.id)).one()

    assert found.review_count == 0
    assert found.avg_rating is None


def test_movie_genres_and_directors_link_tables(db):
    movie = make_movie(db)
    movie.genres.append(Genre(tmdb_genre_id=900_002, name="Zeta"))
    movie.genres.append(Genre(tmdb_genre_id=900_003, name="Alpha"))
    movie.directors.append(Director(tmdb_person_id=900_002, name="TDD Director"))
    db.flush()

    detail = db.scalars(select(MovieDetailView).where(MovieDetailView.id == movie.id)).one()

    assert detail.genre_names == ["Alpha", "Zeta"]
    assert detail.director_names == ["TDD Director"]


def test_movie_detail_has_empty_arrays_without_links(db):
    movie = make_movie(db)

    detail = db.scalars(select(MovieDetailView).where(MovieDetailView.id == movie.id)).one()

    assert detail.genre_ids == []
    assert detail.director_names == []


def test_review_insert_with_text_starts_pending(db):
    review = Review(
        movie_id=make_movie(db).id, user_id=make_user(db).id, rating=4, review_text="Great"
    )
    db.add(review)
    db.flush()

    found = db.scalars(select(Review).where(Review.id == review.id)).one()

    assert found.sentiment_status is SentimentStatus.PENDING
    assert found.created_at is not None
    assert found.updated_at is not None


def test_review_insert_without_text_is_skipped_by_trigger(db):
    review = Review(movie_id=make_movie(db).id, user_id=make_user(db).id, rating=3)
    db.add(review)
    db.flush()

    assert review.sentiment_status is SentimentStatus.SKIPPED


def test_avg_rating_trigger_updates_movie_on_new_review(db):
    movie = make_movie(db)
    db.add_all([
        Review(movie_id=movie.id, user_id=make_user(db, "tdd_a").id, rating=4),
        Review(movie_id=movie.id, user_id=make_user(db, "tdd_b").id, rating=5),
    ])
    db.flush()

    db.refresh(movie)

    assert movie.review_count == 2
    assert movie.avg_rating == Decimal("4.50")


def test_second_review_for_same_user_and_movie_is_rejected(db):
    movie = make_movie(db)
    user = make_user(db)
    db.add(Review(movie_id=movie.id, user_id=user.id, rating=4))
    db.flush()

    db.add(Review(movie_id=movie.id, user_id=user.id, rating=2))
    with pytest.raises(IntegrityError):
        db.flush()
