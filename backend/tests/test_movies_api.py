import pytest

ALLOWED = "geçersiz değer; izin verilenler:"


def assert_api_error(response):
    assert response.status_code == 422
    body = response.json()
    assert isinstance(body["detail"], str)
    assert isinstance(body["errors"], list)
    return body


@pytest.mark.parametrize(
    ("query", "detail"),
    [
        ("page=0", "page: en az 1 olmalı"),
        ("page_size=0", "page_size: en az 1 olmalı"),
        ("page_size=101", "page_size: en fazla 100 olmalı"),
        ("sort=foo", f"sort: {ALLOWED} 'avg_rating', 'review_count', 'release_date' veya 'title'"),
        ("order=up", f"order: {ALLOWED} 'asc' veya 'desc'"),
        ("certification=X", f"certification: {ALLOWED} 'G', 'PG', 'PG-13', 'R' veya 'NC-17'"),
        ("year_min=0", "year_min: en az 1 olmalı"),
        ("runtime_min=-1", "runtime_min: en az 0 olmalı"),
        ("genre_id=abc", "genre_id: tam sayı olmalı"),
    ],
)
def test_movies_rejects_invalid_query(client, query, detail):
    body = assert_api_error(client.get(f"/movies?{query}"))

    assert body["detail"] == detail


@pytest.mark.parametrize(
    ("query", "detail"),
    [("limit=0", "limit: en az 1 olmalı"), ("limit=51", "limit: en fazla 50 olmalı")],
)
def test_directors_rejects_invalid_limit(client, query, detail):
    body = assert_api_error(client.get(f"/directors?{query}"))

    assert body["detail"] == detail
