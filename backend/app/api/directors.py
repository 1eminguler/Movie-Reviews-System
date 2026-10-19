from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.api.deps import DbSession
from app.db.utils import LIKE_ESCAPE, contains_pattern
from app.models import Director
from app.schemas.director import DirectorRead

router = APIRouter(prefix="/directors", tags=["directors"])


@router.get("", response_model=list[DirectorRead])
def list_directors(
    db: DbSession,
    search: Annotated[str | None, Query(max_length=100)] = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
) -> list[Director]:
    query = select(Director).order_by(Director.name, Director.id).limit(limit)
    if search and search.strip():
        pattern = contains_pattern(search.strip())
        query = query.where(Director.name.ilike(pattern, escape=LIKE_ESCAPE))
    return list(db.scalars(query))
