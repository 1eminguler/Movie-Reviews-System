import os

import pytest

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-at-least-32-bytes-long")


class NoDatabase:
    def __getattr__(self, name):
        raise AssertionError("Bu istek veritabanına ulaşmamalıydı")


@pytest.fixture
def client():
    """DB'ye hiç ulaşmaması gereken istekler için (doğrulama, 401 vb.)."""
    from fastapi.testclient import TestClient

    from app.db.session import get_db
    from app.main import app

    app.dependency_overrides[get_db] = lambda: NoDatabase()
    yield TestClient(app)
    app.dependency_overrides.clear()
