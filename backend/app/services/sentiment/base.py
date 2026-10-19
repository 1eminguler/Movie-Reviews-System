from typing import Protocol

from pydantic import BaseModel, Field

from app.core.enums import SentimentLabel


class SentimentResult(BaseModel):
    label: SentimentLabel
    score: float = Field(ge=0, le=1, description="Etiketin güven düzeyi (0-1)")


class SentimentError(Exception):
    """Analiz yapılamadı: geçersiz yanıt, timeout, ağ ya da API hatası."""


class SentimentRateLimitError(SentimentError):
    """Sağlayıcı kotası doldu (HTTP 429); daha sonra yeniden denenebilir."""


class SentimentProvider(Protocol):
    def analyze(self, text: str) -> SentimentResult: ...


class UnavailableProvider:
    """API anahtarı yokken kullanılır: her analiz başarısız olur, yorumlar 'failed' kalır."""

    def __init__(self, reason: str) -> None:
        self.reason = reason

    def analyze(self, text: str) -> SentimentResult:
        raise SentimentError(self.reason)
