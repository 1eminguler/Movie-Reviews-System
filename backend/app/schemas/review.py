from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.enums import SentimentLabel, SentimentStatus


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    review_text: str | None = None

    @field_validator("review_text")
    @classmethod
    def blank_text_to_none(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        return value


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    movie_id: int
    user_id: int
    rating: int
    review_text: str | None
    sentiment_label: SentimentLabel | None
    sentiment_score: float | None
    sentiment_status: SentimentStatus
    created_at: datetime
    updated_at: datetime
