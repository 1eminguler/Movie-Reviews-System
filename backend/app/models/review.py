from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import (
    DateTime,
    Enum,
    FetchedValue,
    ForeignKey,
    Numeric,
    SmallInteger,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import SentimentLabel, SentimentStatus
from app.models.base import Base
from app.models.movie import Movie
from app.models.user import User


def varchar_enum(enum_cls: type[PyEnum]) -> Enum:
    # Şemada VARCHAR(10) + CHECK var; native PG ENUM tipi kullanılmaz.
    return Enum(
        enum_cls,
        native_enum=False,
        create_constraint=False,
        length=10,
        values_callable=lambda members: [m.value for m in members],
    )


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("user_id", "movie_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    rating: Mapped[int] = mapped_column(SmallInteger)
    review_text: Mapped[str | None] = mapped_column(Text)
    # Aşağıdaki alanları reviews trigger'ı da değiştirir; flush sonrası DB'den okunur.
    sentiment_label: Mapped[SentimentLabel | None] = mapped_column(
        varchar_enum(SentimentLabel), server_onupdate=FetchedValue()
    )
    sentiment_score: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2), server_onupdate=FetchedValue()
    )
    sentiment_status: Mapped[SentimentStatus] = mapped_column(
        varchar_enum(SentimentStatus),
        server_default=text("'pending'"),
        server_onupdate=FetchedValue(),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), server_onupdate=FetchedValue()
    )

    movie: Mapped[Movie] = relationship()
    user: Mapped[User] = relationship()

    @property
    def username(self) -> str:
        return self.user.username
