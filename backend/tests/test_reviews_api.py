import pytest
from pydantic import ValidationError

from app.schemas.review import ReviewRead, ReviewUpdate

REVIEW_FIELDS = {
    "id",
    "movie_id",
    "user_id",
    "username",
    "rating",
    "review_text",
    "sentiment_label",
    "sentiment_score",
    "sentiment_status",
    "created_at",
    "updated_at",
}


def test_review_read_has_exactly_frontend_review_fields():
    assert set(ReviewRead.model_fields) == REVIEW_FIELDS


def test_review_update_requires_at_least_one_field():
    with pytest.raises(ValidationError):
        ReviewUpdate()


@pytest.mark.parametrize("rating", [0, 6])
def test_review_update_rejects_rating_out_of_range(rating):
    with pytest.raises(ValidationError):
        ReviewUpdate(rating=rating)


def test_review_update_rating_only_leaves_text_untouched():
    update = ReviewUpdate(rating=3)

    assert update.model_dump(exclude_unset=True) == {"rating": 3}


@pytest.mark.parametrize("text", [None, "", "   "])
def test_review_update_can_clear_text(text):
    update = ReviewUpdate(review_text=text)

    assert update.model_dump(exclude_unset=True) == {"review_text": None}


def test_review_update_rejects_null_rating():
    with pytest.raises(ValidationError):
        ReviewUpdate(rating=None)


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("post", "/movies/1/reviews"),
        ("get", "/movies/1/reviews/me"),
        ("patch", "/movies/1/reviews/me"),
        ("delete", "/movies/1/reviews/me"),
        ("get", "/users/me/reviews"),
    ],
)
def test_protected_review_endpoints_require_token(client, method, path):
    response = client.request(method, path, json={"rating": 4})

    assert response.status_code == 401


@pytest.mark.parametrize("query", ["page=0", "page_size=0", "page_size=101"])
def test_movie_reviews_rejects_invalid_paging(client, query):
    response = client.get(f"/movies/1/reviews?{query}")

    assert response.status_code == 422
    assert isinstance(response.json()["detail"], str)
