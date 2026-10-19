import pytest


@pytest.mark.parametrize(
    "query",
    [
        "page=0",
        "page_size=0",
        "page_size=101",
        "sort=foo",
        "order=up",
        "certification=X",
        "year_min=0",
        "runtime_min=-1",
        "genre_id=abc",
    ],
)
def test_movies_rejects_invalid_query(client, query):
    assert client.get(f"/movies?{query}").status_code == 422


@pytest.mark.parametrize("query", ["limit=0", "limit=51"])
def test_directors_rejects_invalid_limit(client, query):
    assert client.get(f"/directors?{query}").status_code == 422
