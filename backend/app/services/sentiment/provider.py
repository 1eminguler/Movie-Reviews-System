from functools import lru_cache

from google import genai
from google.genai import types

from app.core.config import Settings, get_settings
from app.services.sentiment.base import SentimentProvider, UnavailableProvider
from app.services.sentiment.gemini import GeminiProvider


def build_sentiment_provider(settings: Settings) -> SentimentProvider:
    if not settings.GOOGLE_API_KEY:
        return UnavailableProvider("GOOGLE_API_KEY tanımlı değil")
    timeout_ms = int(settings.GEMINI_TIMEOUT_SECONDS * 1000)
    client = genai.Client(
        api_key=settings.GOOGLE_API_KEY,
        http_options=types.HttpOptions(timeout=timeout_ms),
    )
    return GeminiProvider(client=client, model=settings.GEMINI_MODEL, timeout_ms=timeout_ms)


@lru_cache
def get_sentiment_provider() -> SentimentProvider:
    """FastAPI dependency; testlerde dependency_overrides ile değiştirilir."""
    return build_sentiment_provider(get_settings())
