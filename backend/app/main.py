from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api import auth, directors, genres, movies, users
from app.core.config import get_settings
from app.core.errors import validation_exception_handler
from app.db.session import get_db

app = FastAPI(title="Movie Reviews System API")
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(movies.router)
app.include_router(genres.router)
app.include_router(directors.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/db")
def health_db(db: Annotated[Session, Depends(get_db)]) -> JSONResponse:
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse(status_code=503, content={"database": "unavailable"})
    return JSONResponse(content={"database": "ok"})
