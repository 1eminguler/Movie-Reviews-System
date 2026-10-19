from datetime import date

from pydantic import BaseModel, ConfigDict


class MovieListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    release_date: date | None
    runtime: int | None
    poster_path: str | None
    certification: str | None
    avg_rating: float | None
    review_count: int
    genre_names: list[str]
    director_names: list[str]


class MovieDetail(MovieListItem):
    original_title: str | None
    original_language: str | None
    overview: str | None
    backdrop_path: str | None
    genre_ids: list[int]
    director_ids: list[int]
