from datetime import datetime, timezone
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.models import MovieDetailView, User
from app.schemas.director import DirectorRead
from app.schemas.genre import GenreRead
from app.schemas.movie import MovieRead
from app.schemas.review import ReviewCreate
from app.schemas.user import UserCreate, UserRead


@pytest.mark.parametrize("rating", [0, 6])
def test_review_create_rejects_rating_out_of_range(rating):
    with pytest.raises(ValidationError):
        ReviewCreate(rating=rating)


def test_review_create_requires_rating():
    with pytest.raises(ValidationError):
        ReviewCreate(review_text="Great movie")


@pytest.mark.parametrize("text", ["", "   ", "\n\t "])
def test_review_create_turns_blank_text_into_none(text):
    assert ReviewCreate(rating=4, review_text=text).review_text is None


def test_review_create_keeps_real_text():
    assert ReviewCreate(rating=4, review_text="Great movie").review_text == "Great movie"


def test_user_create_rejects_invalid_email():
    with pytest.raises(ValidationError):
        UserCreate(username="mehmet", email="not-an-email", password="supersecret")


def test_user_create_rejects_password_over_72_bytes():
    password = "çğıöşüçğıöşüçğıöşüçğıöşüçğıöşüçğıöşüçğıö"
    assert len(password) == 40
    assert len(password.encode("utf-8")) > 72

    with pytest.raises(ValidationError):
        UserCreate(username="mehmet", email="mehmet@example.com", password=password)


def test_user_create_accepts_password_of_exactly_72_bytes():
    password = "ş" * 36

    user = UserCreate(username="mehmet", email="mehmet@example.com", password=password)

    assert user.password == password


def test_user_read_never_exposes_password_hash():
    user = User(
        id=1,
        username="mehmet",
        email="mehmet@example.com",
        password_hash="$2b$12$secret",
        created_at=datetime(2026, 10, 19, tzinfo=timezone.utc),
    )

    data = UserRead.model_validate(user).model_dump()

    assert "password_hash" not in data
    assert data["username"] == "mehmet"


MOVIE_FIELDS = {
    "id", "tmdb_id", "title", "original_title", "original_language", "release_date",
    "overview", "runtime", "poster_path", "backdrop_path", "certification", "avg_rating",
    "review_count", "genre_ids", "genre_names", "director_ids", "director_names",
}


def make_view_row(**overrides):
    values = {
        "id": 1,
        "tmdb_id": 1,
        "title": "Heat",
        "avg_rating": Decimal("4.50"),
        "review_count": 2,
        "genre_ids": [1],
        "genre_names": ["Crime"],
        "director_ids": [],
        "director_names": [],
    }
    return MovieDetailView(**{**values, **overrides})


def test_movie_read_has_exactly_frontend_movie_fields():
    data = MovieRead.model_validate(make_view_row()).model_dump()

    assert set(data) == MOVIE_FIELDS


def test_movie_read_serializes_avg_rating_as_number():
    data = MovieRead.model_validate(make_view_row()).model_dump(mode="json")

    assert data["avg_rating"] == 4.5
    assert data["director_names"] == []


def test_genre_and_director_include_tmdb_ids():
    assert set(GenreRead.model_fields) == {"id", "tmdb_genre_id", "name"}
    assert set(DirectorRead.model_fields) == {"id", "tmdb_person_id", "name"}
