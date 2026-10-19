from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

Certification = Literal["G", "PG", "PG-13", "R", "NC-17"]
MovieSort = Literal["avg_rating", "review_count", "release_date", "title"]


class MovieRead(BaseModel):
    """Frontend'deki Movie tipi (types.ts); liste ve detay aynı şekli kullanır."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    tmdb_id: int
    title: str
    original_title: str | None
    original_language: str | None
    release_date: date | None
    overview: str | None
    runtime: int | None
    poster_path: str | None
    backdrop_path: str | None
    certification: Certification | None
    avg_rating: float | None
    review_count: int
    genre_ids: list[int]
    genre_names: list[str]
    director_ids: list[int]
    director_names: list[str]


class MovieFilters(BaseModel):
    """Frontend'deki MovieFilters tipi; GET /movies query parametreleri."""

    search: str | None = Field(default=None, max_length=100)
    genre_id: int | None = None
    director_id: int | None = None
    year_min: int | None = Field(default=None, ge=1, le=9999)
    year_max: int | None = Field(default=None, ge=1, le=9999)
    runtime_min: int | None = Field(default=None, ge=0)
    runtime_max: int | None = Field(default=None, ge=0)
    certification: Certification | None = None
    language: str | None = Field(default=None, max_length=10)
    sort: MovieSort = "avg_rating"
    order: Literal["asc", "desc"] = "desc"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

    @field_validator("search")
    @classmethod
    def blank_search_to_none(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        return value.strip()
