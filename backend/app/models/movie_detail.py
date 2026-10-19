from datetime import date
from decimal import Decimal

from sqlalchemy import Integer, Numeric, SmallInteger, String, Text, event
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.models.base import Base


class MovieDetailView(Base):
    """movie_details view'ı (salt-okunur): film + tür/yönetmen dizileri."""

    __tablename__ = "movie_details"

    id: Mapped[int] = mapped_column(primary_key=True)
    tmdb_id: Mapped[int]
    title: Mapped[str] = mapped_column(String(255))
    original_title: Mapped[str | None] = mapped_column(String(255))
    original_language: Mapped[str | None] = mapped_column(String(10))
    release_date: Mapped[date | None]
    overview: Mapped[str | None] = mapped_column(Text)
    runtime: Mapped[int | None] = mapped_column(SmallInteger)
    poster_path: Mapped[str | None] = mapped_column(String(255))
    backdrop_path: Mapped[str | None] = mapped_column(String(255))
    certification: Mapped[str | None] = mapped_column(String(5))
    avg_rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 2))
    review_count: Mapped[int]
    genre_ids: Mapped[list[int]] = mapped_column(ARRAY(Integer))
    genre_names: Mapped[list[str]] = mapped_column(ARRAY(String))
    director_ids: Mapped[list[int]] = mapped_column(ARRAY(Integer))
    director_names: Mapped[list[str]] = mapped_column(ARRAY(String))


@event.listens_for(Session, "before_flush")
def _reject_view_writes(session: Session, flush_context: object, instances: object) -> None:
    changed = (*session.new, *session.dirty, *session.deleted)
    if any(isinstance(obj, MovieDetailView) for obj in changed):
        raise RuntimeError("movie_details bir view'dır; yazılamaz")
