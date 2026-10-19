from decimal import Decimal
from itertools import count

import pytest
from sqlalchemy import select, update

from app.core.enums import SentimentLabel, SentimentStatus
from app.core.security import create_access_token
from app.models import Movie, Review, User
from app.services.sentiment import SentimentError, SentimentRateLimitError, SentimentResult

pytestmark = pytest.mark.integration

_ids = count(1)


@pytest.fixture
def make_movie(db):
    def factory():
        movie = Movie(tmdb_id=950_000 + next(_ids), title="Sentiment Movie")
        db.add(movie)
        db.flush()
        return movie

    return factory


@pytest.fixture
def make_user(db):
    def factory():
        name = f"senti_{next(_ids)}"
        user = User(username=name, email=f"{name}@example.com", password_hash="x")
        db.add(user)
        db.flush()
        user.headers = {"Authorization": f"Bearer {create_access_token(user.id)}"}
        return user

    return factory


@pytest.fixture
def movie(make_movie):
    return make_movie()


@pytest.fixture
def user(make_user):
    return make_user()


def post_review(client, movie, user, **body):
    return client.post(f"/movies/{movie.id}/reviews", json=body, headers=user.headers)


def patch_review(client, movie, user, **body):
    return client.patch(f"/movies/{movie.id}/reviews/me", json=body, headers=user.headers)


def my_review(client, movie, user):
    return client.get(f"/movies/{movie.id}/reviews/me", headers=user.headers).json()


# --- 5.2 POST ---------------------------------------------------------------------


def test_post_with_text_responds_pending_then_analysis_marks_done(client, movie, user, sentiment):
    sentiment.result = SentimentResult(label=SentimentLabel.NEGATIVE, score=0.81)

    response = post_review(client, movie, user, rating=5, review_text="Berbat bir filmdi")

    assert response.json()["sentiment_status"] == "pending"
    assert sentiment.calls == ["Berbat bir filmdi"]
    stored = my_review(client, movie, user)
    assert stored["sentiment_status"] == "done"
    assert stored["sentiment_label"] == "negative"
    assert stored["sentiment_score"] == 0.81
    assert stored["rating"] == 5


@pytest.mark.parametrize(
    "error", [SentimentError("bozuk yanıt"), SentimentRateLimitError("429")]
)
def test_provider_error_marks_failed_and_keeps_review(client, movie, user, sentiment, error):
    sentiment.error = error

    response = post_review(client, movie, user, rating=4, review_text="Güzel")

    assert response.status_code == 201
    stored = my_review(client, movie, user)
    assert stored["sentiment_status"] == "failed"
    assert stored["sentiment_label"] is None
    assert stored["review_text"] == "Güzel"


def test_post_without_text_is_skipped_and_provider_not_called(client, movie, user, sentiment):
    post_review(client, movie, user, rating=3)

    assert sentiment.calls == []
    assert my_review(client, movie, user)["sentiment_status"] == "skipped"


def test_analysis_does_not_change_updated_at(client, movie, user):
    created = post_review(client, movie, user, rating=4, review_text="İyi").json()

    assert my_review(client, movie, user)["updated_at"] == created["updated_at"]


# --- 5.2 PATCH --------------------------------------------------------------------


def test_patch_text_reanalyzes(client, movie, user, sentiment):
    post_review(client, movie, user, rating=4, review_text="Harika")
    sentiment.result = SentimentResult(label=SentimentLabel.NEUTRAL, score=0.6)

    response = patch_review(client, movie, user, review_text="Aslında ortalama")

    assert response.json()["sentiment_status"] == "pending"
    assert sentiment.calls == ["Harika", "Aslında ortalama"]
    stored = my_review(client, movie, user)
    assert stored["sentiment_status"] == "done"
    assert stored["sentiment_label"] == "neutral"


def test_patch_rating_only_does_not_reanalyze(client, movie, user, sentiment):
    post_review(client, movie, user, rating=4, review_text="Harika")

    patch_review(client, movie, user, rating=1)

    assert sentiment.calls == ["Harika"]
    assert my_review(client, movie, user)["sentiment_label"] == "positive"


def test_patch_same_text_does_not_reanalyze(client, movie, user, sentiment):
    post_review(client, movie, user, rating=4, review_text="Harika")

    patch_review(client, movie, user, review_text="Harika")

    assert sentiment.calls == ["Harika"]
    assert my_review(client, movie, user)["sentiment_status"] == "done"


def test_patch_clearing_text_does_not_call_provider(client, movie, user, sentiment):
    post_review(client, movie, user, rating=4, review_text="Harika")

    patch_review(client, movie, user, review_text=None)

    assert sentiment.calls == ["Harika"]
    assert my_review(client, movie, user)["sentiment_status"] == "skipped"


def test_patch_adding_text_to_textless_review_analyzes(client, movie, user, sentiment):
    post_review(client, movie, user, rating=4)

    patch_review(client, movie, user, review_text="Sonradan eklenen yorum")

    assert sentiment.calls == ["Sonradan eklenen yorum"]
    assert my_review(client, movie, user)["sentiment_status"] == "done"


# --- 5.2 yarış durumu -------------------------------------------------------------


def test_stale_result_is_not_written_if_text_changed_during_analysis(
    client, db, movie, user, sentiment
):
    """Analiz sürerken metin değişirse eski metnin sonucu yazılmaz."""

    def user_edits_meanwhile():
        db.execute(
            update(Review)
            .where(Review.movie_id == movie.id, Review.user_id == user.id)
            .values(review_text="Yeni metin")
        )
        sentiment.before_return = None

    sentiment.before_return = user_edits_meanwhile

    post_review(client, movie, user, rating=4, review_text="Eski metin")

    review = db.scalar(select(Review).where(Review.movie_id == movie.id))
    db.refresh(review)
    assert review.review_text == "Yeni metin"
    assert review.sentiment_status is SentimentStatus.PENDING
    assert review.sentiment_label is None


def test_stale_failure_is_not_written_if_text_changed_during_analysis(
    client, db, movie, user, sentiment
):
    def user_edits_meanwhile():
        db.execute(
            update(Review)
            .where(Review.movie_id == movie.id, Review.user_id == user.id)
            .values(review_text="Yeni metin")
        )

    sentiment.before_return = user_edits_meanwhile
    sentiment.error = SentimentError("timeout")

    post_review(client, movie, user, rating=4, review_text="Eski metin")

    review = db.scalar(select(Review).where(Review.movie_id == movie.id))
    db.refresh(review)
    assert review.sentiment_status is SentimentStatus.PENDING


def test_result_for_deleted_review_is_ignored(client, db, movie, user, sentiment):
    def user_deletes_meanwhile():
        db.execute(
            Review.__table__.delete().where(
                Review.movie_id == movie.id, Review.user_id == user.id
            )
        )

    sentiment.before_return = user_deletes_meanwhile

    response = post_review(client, movie, user, rating=4, review_text="Silinecek")

    assert response.status_code == 201
    assert db.scalar(select(Review).where(Review.movie_id == movie.id)) is None


# --- 5.3 sunum --------------------------------------------------------------------


def test_review_list_exposes_sentiment_fields(client, movie, user, sentiment):
    sentiment.result = SentimentResult(label=SentimentLabel.POSITIVE, score=0.95)
    post_review(client, movie, user, rating=5, review_text="Muhteşem")

    item = client.get(f"/movies/{movie.id}/reviews").json()["items"][0]

    assert item["sentiment_label"] == "positive"
    assert item["sentiment_score"] == 0.95
    assert item["sentiment_status"] == "done"


def test_sentiment_summary_counts(client, db, movie, make_movie, make_user):
    def add(label=None, status=SentimentStatus.PENDING, text="metin", target=movie):
        review = Review(movie_id=target.id, user_id=make_user().id, rating=3, review_text=text)
        db.add(review)
        db.flush()
        if label is not None:
            db.execute(
                update(Review)
                .where(Review.id == review.id)
                .values(sentiment_label=label, sentiment_score=Decimal("0.80"), sentiment_status=status)
            )
        elif status is not SentimentStatus.PENDING:
            db.execute(update(Review).where(Review.id == review.id).values(sentiment_status=status))

    for _ in range(3):
        add(SentimentLabel.POSITIVE, SentimentStatus.DONE)
    add(SentimentLabel.NEUTRAL, SentimentStatus.DONE)
    for _ in range(2):
        add(SentimentLabel.NEGATIVE, SentimentStatus.DONE)
    for _ in range(4):
        add()
    add(status=SentimentStatus.FAILED)
    add(text=None)
    add(SentimentLabel.POSITIVE, SentimentStatus.DONE, target=make_movie())

    response = client.get(f"/movies/{movie.id}/sentiment-summary")

    assert response.status_code == 200
    assert response.json() == {"positive": 3, "neutral": 1, "negative": 2, "pending": 4}


def test_sentiment_summary_for_movie_without_reviews(client, movie):
    body = client.get(f"/movies/{movie.id}/sentiment-summary").json()

    assert body == {"positive": 0, "neutral": 0, "negative": 0, "pending": 0}


def test_sentiment_summary_for_missing_movie_is_404(client):
    response = client.get("/movies/999999999/sentiment-summary")

    assert response.status_code == 404
    assert response.json() == {"detail": "Film bulunamadı"}
