from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError
from pwdlib.hashers.bcrypt import BcryptHasher

from app.core.config import get_settings

ALGORITHM = "HS256"

_password_hash = PasswordHash((BcryptHasher(),))


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    # Seed kullanıcıların hash'i ("!imported-no-login") geçerli değil; bcrypt 5 de
    # 72 bayttan uzun şifrede ValueError fırlatır. İkisi de "eşleşmedi" demektir.
    try:
        return _password_hash.verify(password, password_hash)
    except (UnknownHashError, ValueError):
        return False


def create_access_token(user_id: int, expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": datetime.now(timezone.utc) + expires_delta}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> int:
    """Token'daki kullanıcı id'sini döndürür; geçersiz/süresi dolmuşsa jwt.InvalidTokenError."""
    payload = jwt.decode(
        token,
        get_settings().SECRET_KEY,
        algorithms=[ALGORITHM],
        options={"require": ["exp", "sub"]},
    )
    try:
        return int(payload["sub"])
    except ValueError as exc:
        raise jwt.InvalidTokenError("Token subject bir kullanıcı id'si değil") from exc
