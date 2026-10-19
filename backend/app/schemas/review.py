from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.enums import SentimentLabel, SentimentStatus


def blank_to_none(value: str | None) -> str | None:
    # DB boş/boşluk metni reddeder; metin yoksa NULL saklanır.
    if value is None or not value.strip():
        return None
    return value


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    review_text: str | None = None

    _normalize_text = field_validator("review_text")(blank_to_none)


class ReviewUpdate(BaseModel):
    """Frontend ReviewUpdate = Partial<ReviewCreate>; yalnızca gönderilen alanlar değişir."""

    rating: int | None = Field(default=None, ge=1, le=5)
    review_text: str | None = None

    _normalize_text = field_validator("review_text")(blank_to_none)

    @model_validator(mode="after")
    def check_fields(self) -> "ReviewUpdate":
        if not self.model_fields_set:
            raise ValueError("En az bir alan gönderilmeli (rating veya review_text)")
        if "rating" in self.model_fields_set and self.rating is None:
            raise ValueError("rating boş olamaz")
        return self


class ReviewRead(BaseModel):
    """Frontend Review tipi (types.ts)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    movie_id: int
    user_id: int
    username: str
    rating: int
    review_text: str | None
    sentiment_label: SentimentLabel | None
    sentiment_score: float | None
    sentiment_status: SentimentStatus
    created_at: datetime
    updated_at: datetime


class SentimentSummary(BaseModel):
    """Bir filmin yorumlarının duygu dağılımı (analizi biten yorumlar + bekleyenler)."""

    positive: int
    neutral: int
    negative: int
    pending: int
