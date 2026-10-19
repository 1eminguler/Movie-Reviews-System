import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.db.session import get_db
from app.main import app


class FakeSession:
    def __init__(self):
        self.statements = []

    def execute(self, statement):
        self.statements.append(str(statement))


class UnreachableSession:
    def execute(self, statement):
        raise OperationalError(str(statement), {}, Exception("connection refused"))


@pytest.fixture
def client():
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_health_db_returns_ok_when_database_responds(client):
    session = FakeSession()
    app.dependency_overrides[get_db] = lambda: session

    response = client.get("/health/db")

    assert response.status_code == 200
    assert response.json() == {"database": "ok"}
    assert session.statements == ["SELECT 1"]


def test_health_db_returns_503_when_database_unreachable(client):
    app.dependency_overrides[get_db] = lambda: UnreachableSession()

    response = client.get("/health/db")

    assert response.status_code == 503
    assert response.json() == {"database": "unavailable"}
