import pytest
from sqlalchemy.orm import Session

from app.core.enums import SentimentLabel, SentimentStatus
from app.models import Movie, MovieDetailView


def test_sentiment_enums_match_schema_values():
    assert {label.value for label in SentimentLabel} == {"positive", "neutral", "negative"}
    assert {status.value for status in SentimentStatus} == {"pending", "done", "failed", "skipped"}


@pytest.mark.parametrize("column", ["avg_rating", "review_count"])
def test_movie_rating_summary_is_read_only(column):
    movie = Movie(tmdb_id=1, title="Heat")

    with pytest.raises(AttributeError):
        setattr(movie, column, 3)


def test_movie_detail_view_cannot_be_written():
    session = Session()
    session.add(MovieDetailView(id=1, tmdb_id=1, title="Heat"))

    with pytest.raises(RuntimeError):
        session.flush()
