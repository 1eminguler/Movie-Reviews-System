from pydantic import BaseModel, ConfigDict


class GenreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tmdb_genre_id: int
    name: str
