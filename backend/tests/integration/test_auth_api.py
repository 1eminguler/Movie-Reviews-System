import pytest

from app.models import User

pytestmark = pytest.mark.integration

PASSWORD = "supersecret"


def register(client, username="tdd_user", email="tdd_user@example.com", password=PASSWORD):
    return client.post(
        "/auth/register", json={"username": username, "email": email, "password": password}
    )


def login(client, username="tdd_user", password=PASSWORD):
    return client.post("/auth/login", data={"username": username, "password": password})


def test_register_returns_201_with_user(client):
    response = register(client)

    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "tdd_user"
    assert body["email"] == "tdd_user@example.com"
    assert "password" not in body
    assert "password_hash" not in body


def test_register_stores_hashed_password(client, db):
    register(client)

    user = db.query(User).filter_by(username="tdd_user").one()

    assert user.password_hash != PASSWORD
    assert user.password_hash.startswith("$2b$")


def test_register_duplicate_username_is_409(client):
    register(client)

    response = register(client, email="other@example.com")

    assert response.status_code == 409


def test_register_duplicate_email_is_409(client):
    register(client)

    response = register(client, username="other_user")

    assert response.status_code == 409


def test_login_returns_bearer_token(client):
    register(client)

    response = login(client)

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_with_wrong_password_is_401(client):
    register(client)

    response = login(client, password="wrong-password")

    assert response.status_code == 401


def test_login_with_unknown_user_is_401(client):
    assert login(client, username="nobody").status_code == 401


def test_login_as_imported_seed_user_is_401(client, db):
    db.add(User(username="seed_user", email="seed@example.com", password_hash="!imported-no-login"))
    db.flush()

    response = login(client, username="seed_user", password="anything")

    assert response.status_code == 401


def test_users_me_with_token_returns_user(client):
    register(client)
    token = login(client).json()["access_token"]

    response = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["username"] == "tdd_user"
    assert "password_hash" not in response.json()


def test_users_me_without_token_is_401(client):
    assert client.get("/users/me").status_code == 401


def test_users_me_with_token_of_deleted_user_is_401(client, db):
    register(client)
    token = login(client).json()["access_token"]
    db.delete(db.query(User).filter_by(username="tdd_user").one())
    db.flush()

    response = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401


def test_swagger_authorize_flow(client):
    """Swagger'ın Authorize butonunun yaptığını taklit eder: tokenUrl'e form post."""
    register(client)
    schema = client.get("/openapi.json").json()
    token_url = schema["components"]["securitySchemes"]["OAuth2PasswordBearer"]["flows"][
        "password"
    ]["tokenUrl"]

    token = client.post(token_url, data={"username": "tdd_user", "password": PASSWORD}).json()

    response = client.get(
        "/users/me", headers={"Authorization": f"{token['token_type']} {token['access_token']}"}
    )
    assert response.status_code == 200
