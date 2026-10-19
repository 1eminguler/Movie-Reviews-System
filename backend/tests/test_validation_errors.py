import pytest


def post_register(client, body):
    return client.post("/auth/register", json=body)


VALID = {"username": "mehmet", "email": "mehmet@example.com", "password": "supersecret"}


@pytest.mark.parametrize(
    ("body", "detail"),
    [
        ({}, "username: zorunlu alan"),
        ({**VALID, "username": "ab"}, "username: en az 3 karakter olmalı"),
        ({**VALID, "username": "a" * 51}, "username: en fazla 50 karakter olmalı"),
        ({**VALID, "email": "not-an-email"}, "email: geçerli bir email adresi değil"),
        ({**VALID, "password": "ş" * 40}, "password: Şifre UTF-8'de en fazla 72 bayt olabilir"),
    ],
)
def test_body_validation_returns_string_detail(client, body, detail):
    response = post_register(client, body)

    assert response.status_code == 422
    assert response.json()["detail"] == detail


def test_validation_error_keeps_all_errors_for_debugging(client):
    response = post_register(client, {})

    errors = response.json()["errors"]
    assert {tuple(e["loc"]) for e in errors} == {
        ("body", "username"),
        ("body", "email"),
        ("body", "password"),
    }


def test_invalid_json_body_returns_string_detail(client):
    response = client.post(
        "/auth/register", content="{not json", headers={"Content-Type": "application/json"}
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "body: geçersiz JSON"


def test_login_form_missing_field_returns_string_detail(client):
    response = client.post("/auth/login", data={"username": "mehmet"})

    assert response.status_code == 422
    assert response.json()["detail"] == "password: zorunlu alan"
