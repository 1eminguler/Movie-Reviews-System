from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Column,
    DateTime,
    FetchedValue,
    ForeignKey,
    Numeric,
    SmallInteger,
    String,
    Table,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from app.models.base import Base

movie_genres = Table(
    "movie_genres",
    Base.metadata,
    Column("movie_id", ForeignKey("movies.id", ondelete="CASCADE"), primary_key=True),
    Column("genre_id", ForeignKey("genres.id", ondelete="CASCADE"), primary_key=True),
)

movie_directors = Table(
    "movie_directors",
    Base.metadata,
    Column("movie_id", ForeignKey("movies.id", ondelete="CASCADE"), primary_key=True),
    Column("director_id", ForeignKey("directors.id", ondelete="CASCADE"), primary_key=True),
)


class Genre(Base):
    __tablename__ = "genres"

    id: Mapped[int] = mapped_column(primary_key=True)
    tmdb_genre_id: Mapped[int] = mapped_column(unique=True)
    name: Mapped[str] = mapped_column(String(100))


class Director(Base):
    __tablename__ = "directors"

    id: Mapped[int] = mapped_column(primary_key=True)
    tmdb_person_id: Mapped[int] = mapped_column(unique=True)
    name: Mapped[str] = mapped_column(String(255))


class Movie(Base):
    __tablename__ = "movies"

    id: Mapped[int] = mapped_column(primary_key=True)
    tmdb_id: Mapped[int] = mapped_column(unique=True)
    title: Mapped[str] = mapped_column(String(255))
    original_title: Mapped[str | None] = mapped_column(String(255))
    original_language: Mapped[str | None] = mapped_column(String(10))
    release_date: Mapped[date | None]
    overview: Mapped[str | None] = mapped_column(Text)
    runtime: Mapped[int | None] = mapped_column(SmallInteger)
    poster_path: Mapped[str | None] = mapped_column(String(255))
    backdrop_path: Mapped[str | None] = mapped_column(String(255))
    certification: Mapped[str | None] = mapped_column(String(5))
    # reviews tablosundaki trigger yönetir; backend yazmaz.
    avg_rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 2), server_default=FetchedValue())
    review_count: Mapped[int] = mapped_column(server_default=FetchedValue())
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    genres: Mapped[list[Genre]] = relationship(secondary=movie_genres)
    directors: Mapped[list[Director]] = relationship(secondary=movie_directors)

    @validates("avg_rating", "review_count")
    def _reject_write(self, key: str, value: object) -> object:
        raise AttributeError(f"movies.{key} DB trigger'ı tarafından yönetilir; backend yazamaz")
