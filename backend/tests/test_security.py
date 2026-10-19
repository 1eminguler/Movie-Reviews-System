from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_and_verify_round_trip():
    password_hash = hash_password("supersecret")

    assert password_hash != "supersecret"
    assert verify_password("supersecret", password_hash) is True
    assert verify_password("wrong-password", password_hash) is False


@pytest.mark.parametrize("invalid_hash", ["!imported-no-login", "", "not-a-hash"])
def test_verify_returns_false_for_invalid_hash(invalid_hash):
    assert verify_password("supersecret", invalid_hash) is False


def test_verify_returns_false_for_password_over_72_bytes():
    password_hash = hash_password("supersecret")

    assert verify_password("ş" * 40, password_hash) is False


def test_access_token_round_trip():
    token = create_access_token(42)

    assert decode_access_token(token) == 42


def test_access_token_expires_after_configured_minutes():
    token = create_access_token(42)
    settings = get_settings()

    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    expires_in = datetime.fromtimestamp(payload["exp"], timezone.utc) - datetime.now(timezone.utc)

    expected = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    assert expected - timedelta(seconds=5) < expires_in <= expected


def test_expired_token_is_rejected():
    token = create_access_token(42, expires_delta=timedelta(seconds=-1))

    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(token)


def test_token_signed_with_other_key_is_rejected():
    token = jwt.encode(
        {"sub": "42", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
        "other-key-that-is-long-enough-for-hs256!",
        algorithm="HS256",
    )

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)


def test_token_with_non_numeric_subject_is_rejected():
    token = jwt.encode(
        {"sub": "abc", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
        get_settings().SECRET_KEY,
        algorithm="HS256",
    )

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)
