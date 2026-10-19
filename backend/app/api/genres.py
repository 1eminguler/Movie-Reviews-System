from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import DbSession
from app.models import Genre
from app.schemas.genre import GenreRead

router = APIRouter(prefix="/genres", tags=["genres"])


@router.get("", response_model=list[GenreRead])
def list_genres(db: DbSession) -> list[Genre]:
    return list(db.scalars(select(Genre).order_by(Genre.name)))
