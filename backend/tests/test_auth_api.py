from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.db.session import get_db
from app.main import app


class NoDatabase:
    def __getattr__(self, name):
        raise AssertionError("Bu istek veritabanına ulaşmamalıydı")


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = lambda: NoDatabase()
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_users_me_without_token_is_401(client):
    response = client.get("/users/me")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_users_me_with_malformed_token_is_401(client):
    response = client.get("/users/me", headers={"Authorization": "Bearer not-a-jwt"})

    assert response.status_code == 401


def test_users_me_with_expired_token_is_401(client):
    token = create_access_token(1, expires_delta=timedelta(seconds=-1))

    response = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401


def test_openapi_exposes_password_flow_for_swagger_authorize(client):
    schema = client.get("/openapi.json").json()

    scheme = schema["components"]["securitySchemes"]["OAuth2PasswordBearer"]
    assert scheme["flows"]["password"]["tokenUrl"] == "/auth/login"
    assert schema["paths"]["/users/me"]["get"]["security"] == [{"OAuth2PasswordBearer": []}]
