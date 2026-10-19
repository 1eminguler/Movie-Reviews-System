from contextlib import nullcontext

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.enums import SentimentLabel
from app.db.session import get_db, get_session_factory
from app.main import app
from app.services.sentiment import SentimentError, SentimentResult, get_sentiment_provider


class FakeProvider:
    """Gemini yerine: verilen sonucu döndürür ya da verilen hatayı fırlatır."""

    def __init__(self):
        self.result = SentimentResult(label=SentimentLabel.POSITIVE, score=0.9)
        self.error: SentimentError | None = None
        self.calls: list[str] = []
        self.before_return = None

    def analyze(self, text: str) -> SentimentResult:
        self.calls.append(text)
        if self.before_return is not None:
            self.before_return()
        if self.error is not None:
            raise self.error
        return self.result


@pytest.fixture(scope="session")
def test_engine():
    url = get_settings().TEST_DATABASE_URL
    if not url:
        pytest.skip("TEST_DATABASE_URL tanımlı değil")
    engine = create_engine(url, pool_pre_ping=True)
    yield engine
    engine.dispose()


@pytest.fixture
def db(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def sentiment():
    return FakeProvider()


@pytest.fixture
def client(db, sentiment):
    app.dependency_overrides[get_db] = lambda: db
    # Arka plan analizi de test session'ında çalışır (rollback ile geri alınır).
    app.dependency_overrides[get_session_factory] = lambda: lambda: nullcontext(db)
    app.dependency_overrides[get_sentiment_provider] = lambda: sentiment
    yield TestClient(app)
    app.dependency_overrides.clear()
