from pydantic import BaseModel, ConfigDict


class DirectorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tmdb_person_id: int
    name: str
