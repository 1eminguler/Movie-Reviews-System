from types import SimpleNamespace
from unittest.mock import MagicMock

import httpx
import pytest
from google.genai import errors

from app.core.config import Settings
from app.core.enums import SentimentLabel
from app.services.sentiment import (
    GeminiProvider,
    SentimentError,
    SentimentRateLimitError,
    SentimentResult,
    build_sentiment_provider,
)


def make_provider(*, text=None, raises=None, model="test-model"):
    client = MagicMock()
    if raises is not None:
        client.models.generate_content.side_effect = raises
    else:
        client.models.generate_content.return_value = SimpleNamespace(text=text)
    return GeminiProvider(client=client, model=model), client


def api_error(code, status):
    return errors.APIError(code, {"error": {"code": code, "message": "x", "status": status}})


def test_valid_json_returns_result():
    provider, _ = make_provider(text='{"label": "positive", "score": 0.923}')

    result = provider.analyze("Harika bir filmdi")

    assert result == SentimentResult(label=SentimentLabel.POSITIVE, score=0.92)


def test_request_uses_configured_model_and_json_schema():
    provider, client = make_provider(text='{"label": "neutral", "score": 0.5}', model="gem-x")

    provider.analyze("Fena değildi")

    kwargs = client.models.generate_content.call_args.kwargs
    assert kwargs["model"] == "gem-x"
    assert "Fena değildi" in kwargs["contents"]
    config = kwargs["config"]
    assert config.response_mime_type == "application/json"
    assert config.response_schema is SentimentResult
    for label in SentimentLabel:
        assert label.value in config.system_instruction


def test_long_review_is_truncated_before_sending():
    provider, client = make_provider(text='{"label": "neutral", "score": 0.5}')

    provider.analyze("a" * 50_000)

    assert len(client.models.generate_content.call_args.kwargs["contents"]) < 10_000


@pytest.mark.parametrize(
    "text",
    [
        "not json",
        "",
        None,
        '{"label": "happy", "score": 0.5}',
        '{"label": "positive", "score": 1.5}',
        '{"label": "positive"}',
    ],
)
def test_invalid_response_raises_sentiment_error(text):
    provider, _ = make_provider(text=text)

    with pytest.raises(SentimentError):
        provider.analyze("Bir yorum")


def test_rate_limit_raises_rate_limit_error():
    provider, _ = make_provider(raises=api_error(429, "RESOURCE_EXHAUSTED"))

    with pytest.raises(SentimentRateLimitError):
        provider.analyze("Bir yorum")


@pytest.mark.parametrize(
    "exc",
    [
        api_error(500, "INTERNAL"),
        api_error(400, "INVALID_ARGUMENT"),
        httpx.ReadTimeout("timed out"),
        httpx.ConnectError("no route"),
    ],
)
def test_api_timeout_and_network_errors_raise_sentiment_error(exc):
    provider, _ = make_provider(raises=exc)

    with pytest.raises(SentimentError) as info:
        provider.analyze("Bir yorum")

    assert not isinstance(info.value, SentimentRateLimitError)


def settings(**overrides):
    values = {
        "DATABASE_URL": "postgresql+psycopg://x:x@localhost/x",
        "SECRET_KEY": "k" * 32,
        "GEMINI_MODEL": "gem-x",
        "GOOGLE_API_KEY": "fake-key",
        "GEMINI_TIMEOUT_SECONDS": 7,
    }
    return Settings(_env_file=None, **{**values, **overrides})


def test_build_provider_uses_settings():
    provider = build_sentiment_provider(settings())

    assert isinstance(provider, GeminiProvider)
    assert provider.model == "gem-x"
    assert provider.timeout_ms == 7000


@pytest.mark.parametrize("key", [None, ""])
def test_build_provider_without_api_key_always_fails(key):
    provider = build_sentiment_provider(settings(GOOGLE_API_KEY=key))

    with pytest.raises(SentimentError):
        provider.analyze("Bir yorum")


def test_default_gemini_model_is_flash_lite(monkeypatch):
    monkeypatch.delenv("GEMINI_MODEL", raising=False)

    config = Settings(_env_file=None, DATABASE_URL="postgresql+psycopg://x@y/z", SECRET_KEY="k")

    assert config.GEMINI_MODEL == "gemini-3.5-flash-lite"
