from datetime import datetime, timedelta, timezone
from decimal import Decimal
from itertools import count

import pytest
from sqlalchemy import event, update

from app.core.enums import SentimentLabel, SentimentStatus
from app.core.security import create_access_token
from app.models import Movie, Review, User

pytestmark = pytest.mark.integration

_ids = count(1)


@pytest.fixture
def make_movie(db):
    def factory(title="TDD Movie"):
        movie = Movie(tmdb_id=900_000 + next(_ids), title=title)
        db.add(movie)
        db.flush()
        return movie

    return factory


@pytest.fixture
def make_user(db):
    def factory(name=None):
        name = name or f"tdd_user_{next(_ids)}"
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
def alice(make_user):
    return make_user("alice")


@pytest.fixture
def bob(make_user):
    return make_user("bob")


def post_review(client, movie_id, user, **body):
    return client.post(f"/movies/{movie_id}/reviews", json=body, headers=user.headers)


def movie_summary(client, movie_id):
    body = client.get(f"/movies/{movie_id}").json()
    return body["avg_rating"], body["review_count"]


# --- 4.1 POST /movies/{id}/reviews ------------------------------------------------


def test_create_review_with_text_returns_201_pending(client, movie, alice):
    response = post_review(client, movie.id, alice, rating=4, review_text="Great movie")

    assert response.status_code == 201
    body = response.json()
    assert body["movie_id"] == movie.id
    assert body["user_id"] == alice.id
    assert body["username"] == "alice"
    assert body["rating"] == 4
    assert body["review_text"] == "Great movie"
    assert body["sentiment_status"] == "pending"
    assert body["sentiment_label"] is None
    assert body["sentiment_score"] is None


def test_create_review_without_text_is_skipped(client, movie, alice):
    body = post_review(client, movie.id, alice, rating=3).json()

    assert body["review_text"] is None
    assert body["sentiment_status"] == "skipped"


def test_create_review_blank_text_is_stored_as_null(client, movie, alice):
    body = post_review(client, movie.id, alice, rating=3, review_text="   ").json()

    assert body["review_text"] is None
    assert body["sentiment_status"] == "skipped"


def test_create_review_for_missing_movie_is_404(client, alice):
    response = post_review(client, 999_999_999, alice, rating=4)

    assert response.status_code == 404
    assert response.json() == {"detail": "Film bulunamadı"}


def test_second_review_for_same_movie_is_409(client, movie, alice):
    post_review(client, movie.id, alice, rating=4)

    response = post_review(client, movie.id, alice, rating=2)

    assert response.status_code == 409
    assert response.json() == {"detail": "Bu filme zaten yorum yaptınız"}


def test_create_review_invalid_rating_is_422(client, movie, alice):
    response = post_review(client, movie.id, alice, rating=6)

    assert response.status_code == 422
    assert response.json()["detail"] == "rating: en fazla 5 olmalı"


# --- 4.2 GET /movies/{id}/reviews ------------------------------------------------


@pytest.fixture
def three_reviews(db, movie, make_user):
    """created_at: r0 en eski, r1 ve r2 aynı an (eşitlikte id desc)."""
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    reviews = []
    for i, created in enumerate([base, base + timedelta(days=1), base + timedelta(days=1)]):
        review = Review(movie_id=movie.id, user_id=make_user(f"rev_{i}").id, rating=i + 3)
        db.add(review)
        db.flush()
        db.execute(update(Review).where(Review.id == review.id).values(created_at=created))
        reviews.append(review)
    return reviews


def test_list_reviews_newest_first_with_username(client, movie, three_reviews):
    body = client.get(f"/movies/{movie.id}/reviews").json()

    r0, r1, r2 = three_reviews
    assert [item["id"] for item in body["items"]] == [r2.id, r1.id, r0.id]
    assert [item["username"] for item in body["items"]] == ["rev_2", "rev_1", "rev_0"]
    assert body["total"] == 3
    assert body["page"] == 1
    assert body["page_size"] == 20


def test_list_reviews_pagination(client, movie, three_reviews):
    first = client.get(f"/movies/{movie.id}/reviews?page=1&page_size=2").json()
    second = client.get(f"/movies/{movie.id}/reviews?page=2&page_size=2").json()

    assert len(first["items"]) == 2
    assert len(second["items"]) == 1
    assert first["total"] == second["total"] == 3
    assert {i["id"] for i in first["items"]}.isdisjoint(i["id"] for i in second["items"])


def test_list_reviews_only_for_that_movie(client, movie, make_movie, alice):
    other = make_movie("Other")
    post_review(client, other.id, alice, rating=5)

    body = client.get(f"/movies/{movie.id}/reviews").json()

    assert body == {"items": [], "total": 0, "page": 1, "page_size": 20}


def test_list_reviews_for_missing_movie_is_404(client):
    response = client.get("/movies/999999999/reviews")

    assert response.status_code == 404
    assert response.json() == {"detail": "Film bulunamadı"}


@pytest.fixture
def statements(test_engine):
    executed = []

    def record(conn, cursor, statement, parameters, context, executemany):
        executed.append(statement)

    event.listen(test_engine, "before_cursor_execute", record)
    yield executed
    event.remove(test_engine, "before_cursor_execute", record)


def test_list_reviews_query_count_does_not_grow_with_reviews(
    client, db, movie, make_user, statements
):
    def selects_for_listing():
        db.expire_all()
        statements.clear()
        client.get(f"/movies/{movie.id}/reviews")
        return [s for s in statements if s.lstrip().upper().startswith("SELECT")]

    db.add(Review(movie_id=movie.id, user_id=make_user().id, rating=4))
    db.flush()
    with_one = selects_for_listing()
    db.add_all(Review(movie_id=movie.id, user_id=make_user().id, rating=4) for _ in range(5))
    db.flush()

    assert len(selects_for_listing()) == len(with_one) == 3  # film + count + sayfa


# --- 4.3 Trigger doğrulaması (backend avg_rating'e yazmaz) ------------------------


def test_trigger_updates_movie_rating_through_review_lifecycle(client, movie, alice, bob):
    assert movie_summary(client, movie.id) == (None, 0)

    post_review(client, movie.id, alice, rating=5)
    post_review(client, movie.id, bob, rating=2)
    assert movie_summary(client, movie.id) == (3.5, 2)

    client.patch(f"/movies/{movie.id}/reviews/me", json={"rating": 3}, headers=bob.headers)
    assert movie_summary(client, movie.id) == (4.0, 2)

    client.delete(f"/movies/{movie.id}/reviews/me", headers=alice.headers)
    assert movie_summary(client, movie.id) == (3.0, 1)

    client.delete(f"/movies/{movie.id}/reviews/me", headers=bob.headers)
    assert movie_summary(client, movie.id) == (None, 0)


def test_trigger_rounds_avg_rating_to_two_decimals(client, movie, make_user):
    for rating in (5, 4, 4):
        post_review(client, movie.id, make_user(), rating=rating)

    assert movie_summary(client, movie.id) == (4.33, 3)


# --- 4.4 /movies/{id}/reviews/me --------------------------------------------------


def test_get_my_review(client, movie, alice):
    created = post_review(client, movie.id, alice, rating=4, review_text="Nice").json()

    response = client.get(f"/movies/{movie.id}/reviews/me", headers=alice.headers)

    assert response.status_code == 200
    assert response.json() == created


def test_get_my_review_when_none_is_404(client, movie, alice):
    response = client.get(f"/movies/{movie.id}/reviews/me", headers=alice.headers)

    assert response.status_code == 404
    assert response.json() == {"detail": "Bu filme yorumunuz yok"}


def test_get_my_review_ignores_other_users_review(client, movie, alice, bob):
    post_review(client, movie.id, bob, rating=4)

    response = client.get(f"/movies/{movie.id}/reviews/me", headers=alice.headers)

    assert response.status_code == 404


def test_patch_rating_only_keeps_text_and_sentiment(client, db, movie, alice):
    review_id = post_review(client, movie.id, alice, rating=4, review_text="Nice").json()["id"]
    mark_analyzed(db, review_id)

    response = client.patch(
        f"/movies/{movie.id}/reviews/me", json={"rating": 2}, headers=alice.headers
    )

    assert response.status_code == 200
    body = response.json()
    assert body["rating"] == 2
    assert body["review_text"] == "Nice"
    assert body["sentiment_status"] == "done"
    assert body["sentiment_label"] == "positive"


def test_patch_text_resets_sentiment_to_pending(client, db, movie, alice):
    review_id = post_review(client, movie.id, alice, rating=4, review_text="Nice").json()["id"]
    mark_analyzed(db, review_id)

    body = client.patch(
        f"/movies/{movie.id}/reviews/me", json={"review_text": "Actually bad"}, headers=alice.headers
    ).json()

    assert body["review_text"] == "Actually bad"
    assert body["sentiment_status"] == "pending"
    assert body["sentiment_label"] is None
    assert body["sentiment_score"] is None


def test_patch_clearing_text_marks_skipped(client, movie, alice):
    post_review(client, movie.id, alice, rating=4, review_text="Nice")

    body = client.patch(
        f"/movies/{movie.id}/reviews/me", json={"review_text": None}, headers=alice.headers
    ).json()

    assert body["review_text"] is None
    assert body["sentiment_status"] == "skipped"


def test_patch_adding_text_marks_pending(client, movie, alice):
    post_review(client, movie.id, alice, rating=4)

    body = client.patch(
        f"/movies/{movie.id}/reviews/me", json={"review_text": "Now with text"},
        headers=alice.headers,
    ).json()

    assert body["sentiment_status"] == "pending"


def test_patch_updates_updated_at(client, db, movie, alice):
    created = post_review(client, movie.id, alice, rating=4).json()
    db.execute(
        update(Review)
        .where(Review.id == created["id"])
        .values(updated_at=datetime(2026, 1, 1, tzinfo=timezone.utc))
    )

    body = client.patch(
        f"/movies/{movie.id}/reviews/me", json={"rating": 5}, headers=alice.headers
    ).json()

    assert body["updated_at"] > "2026-01-02"


def test_patch_empty_body_is_422(client, movie, alice):
    post_review(client, movie.id, alice, rating=4)

    response = client.patch(f"/movies/{movie.id}/reviews/me", json={}, headers=alice.headers)

    assert response.status_code == 422
    assert isinstance(response.json()["detail"], str)


def test_patch_without_review_is_404(client, movie, alice):
    response = client.patch(
        f"/movies/{movie.id}/reviews/me", json={"rating": 3}, headers=alice.headers
    )

    assert response.status_code == 404


def test_patch_cannot_touch_other_users_review(client, movie, alice, bob):
    post_review(client, movie.id, bob, rating=5, review_text="Bob's")

    response = client.patch(
        f"/movies/{movie.id}/reviews/me", json={"rating": 1}, headers=alice.headers
    )

    assert response.status_code == 404
    bob_review = client.get(f"/movies/{movie.id}/reviews/me", headers=bob.headers).json()
    assert bob_review["rating"] == 5


def test_delete_my_review_returns_204(client, movie, alice):
    post_review(client, movie.id, alice, rating=4)

    response = client.delete(f"/movies/{movie.id}/reviews/me", headers=alice.headers)

    assert response.status_code == 204
    assert response.content == b""
    me = client.get(f"/movies/{movie.id}/reviews/me", headers=alice.headers)
    assert me.status_code == 404


def test_delete_without_review_is_404(client, movie, alice):
    response = client.delete(f"/movies/{movie.id}/reviews/me", headers=alice.headers)

    assert response.status_code == 404


def test_delete_cannot_touch_other_users_review(client, movie, alice, bob):
    post_review(client, movie.id, bob, rating=5)

    assert client.delete(f"/movies/{movie.id}/reviews/me", headers=alice.headers).status_code == 404
    assert client.get(f"/movies/{movie.id}/reviews/me", headers=bob.headers).status_code == 200


def test_user_can_review_again_after_delete(client, movie, alice):
    post_review(client, movie.id, alice, rating=4)
    client.delete(f"/movies/{movie.id}/reviews/me", headers=alice.headers)

    assert post_review(client, movie.id, alice, rating=2).status_code == 201


# --- GET /users/me/reviews --------------------------------------------------------


def test_my_reviews_lists_only_my_reviews(client, make_movie, alice, bob):
    first, second = make_movie("First"), make_movie("Second")
    post_review(client, first.id, alice, rating=4)
    post_review(client, second.id, alice, rating=5)
    post_review(client, first.id, bob, rating=1)

    body = client.get("/users/me/reviews", headers=alice.headers).json()

    assert body["total"] == 2
    assert {item["movie_id"] for item in body["items"]} == {first.id, second.id}
    assert {item["username"] for item in body["items"]} == {"alice"}


def test_my_reviews_paginates(client, make_movie, alice):
    for i in range(3):
        post_review(client, make_movie(f"M{i}").id, alice, rating=4)

    body = client.get("/users/me/reviews?page=2&page_size=2", headers=alice.headers).json()

    assert len(body["items"]) == 1
    assert body["total"] == 3
    assert body["page"] == 2


def mark_analyzed(db, review_id):
    """Faz 5'teki Gemini sonucunu taklit eder (done + etiket + skor)."""
    db.execute(
        update(Review)
        .where(Review.id == review_id)
        .values(
            sentiment_label=SentimentLabel.POSITIVE,
            sentiment_score=Decimal("0.90"),
            sentiment_status=SentimentStatus.DONE,
        )
    )
    db.expire_all()
