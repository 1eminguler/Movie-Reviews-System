from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import DbSession
from app.core.security import create_access_token, hash_password, verify_password
from app.db.utils import violated_constraint
from app.models import User
from app.schemas.auth import Token
from app.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])

CONFLICT_MESSAGES = {
    "users_username_key": "Bu kullanıcı adı zaten kullanımda",
    "users_email_key": "Bu email zaten kullanımda",
}


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: DbSession) -> User:
    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        detail = CONFLICT_MESSAGES.get(
            violated_constraint(exc), "Kullanıcı adı veya email zaten kullanımda"
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from None
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbSession) -> Token:
    user = db.scalar(select(User).where(User.username == form.username))
    if user is None or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı adı veya şifre hatalı",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(user.id))
