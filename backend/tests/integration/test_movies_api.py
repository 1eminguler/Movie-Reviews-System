from datetime import date

import pytest
from sqlalchemy import event

from app.models import Director, Genre, Movie, Review, User

pytestmark = pytest.mark.integration


@pytest.fixture
def catalog(db):
    """4 film; puanlar yorumlar üzerinden trigger ile oluşur.

    | film                  | yıl  | süre | yaş   | dil | tür           | yönetmen   | puanlar |
    | Alpha Drama           | 2010 | 120  | PG-13 | en  | Drama         | Nolan      | 5, 4    |
    | Beta Comedy           | 1995 | 90   | R     | fr  | Comedy        | Villeneuve | 3       |
    | Gamma Action          | -    | -    | -     | en  | Action, Drama | ikisi      | -       |
    | Delta Drama 100% Pure | 2020 | 150  | PG-13 | ja  | Drama         | -          | 2       |
    """
    drama = Genre(tmdb_genre_id=900_001, name="Drama")
    comedy = Genre(tmdb_genre_id=900_002, name="Comedy")
    action = Genre(tmdb_genre_id=900_003, name="Action")
    nolan = Director(tmdb_person_id=900_001, name="Christopher Nolan")
    villeneuve = Director(tmdb_person_id=900_002, name="Denis Villeneuve")

    def movie(n, title, **fields):
        return Movie(tmdb_id=900_000 + n, title=title, **fields)

    alpha = movie(
        1, "Alpha Drama", release_date=date(2010, 5, 1), runtime=120,
        certification="PG-13", original_language="en", genres=[drama], directors=[nolan],
    )
    beta = movie(
        2, "Beta Comedy", release_date=date(1995, 1, 1), runtime=90,
        certification="R", original_language="fr", genres=[comedy], directors=[villeneuve],
    )
    gamma = movie(
        3, "Gamma Action", original_language="en",
        genres=[action, drama], directors=[nolan, villeneuve],
    )
    delta = movie(
        4, "Delta Drama 100% Pure", release_date=date(2020, 12, 31), runtime=150,
        certification="PG-13", original_language="ja", genres=[drama],
    )
    users = [
        User(username=f"tdd_{i}", email=f"tdd_{i}@example.com", password_hash="x")
        for i in range(2)
    ]
    db.add_all([alpha, beta, gamma, delta, *users])
    db.flush()
    db.add_all([
        Review(movie_id=alpha.id, user_id=users[0].id, rating=5),
        Review(movie_id=alpha.id, user_id=users[1].id, rating=4),
        Review(movie_id=beta.id, user_id=users[0].id, rating=3),
        Review(movie_id=delta.id, user_id=users[0].id, rating=2),
    ])
    db.flush()
    return {
        "movies": {m.title.split()[0].lower(): m.id for m in (alpha, beta, gamma, delta)},
        "genres": {"drama": drama.id, "comedy": comedy.id, "action": action.id},
        "directors": {"nolan": nolan.id, "villeneuve": villeneuve.id},
    }


def titles(client, query=""):
    response = client.get(f"/movies?{query}")
    assert response.status_code == 200, response.text
    return [item["title"].split()[0] for item in response.json()["items"]]


def test_list_defaults_to_avg_rating_desc_with_nulls_last(client, catalog):
    body = client.get("/movies").json()

    assert [m["title"].split()[0] for m in body["items"]] == ["Alpha", "Beta", "Delta", "Gamma"]
    assert body["total"] == 4
    assert body["page"] == 1
    assert body["page_size"] == 20


def test_list_item_matches_frontend_movie_shape(client, catalog):
    alpha = client.get("/movies").json()["items"][0]

    assert alpha["avg_rating"] == 4.5
    assert isinstance(alpha["avg_rating"], float)
    assert alpha["review_count"] == 2
    assert alpha["release_date"] == "2010-05-01"
    assert alpha["genre_names"] == ["Drama"]
    assert alpha["director_names"] == ["Christopher Nolan"]


@pytest.mark.parametrize(
    ("query", "expected"),
    [
        ("sort=avg_rating&order=asc", ["Delta", "Beta", "Alpha", "Gamma"]),
        ("sort=release_date&order=asc", ["Beta", "Alpha", "Delta", "Gamma"]),
        ("sort=release_date&order=desc", ["Delta", "Alpha", "Beta", "Gamma"]),
        ("sort=title&order=asc", ["Alpha", "Beta", "Delta", "Gamma"]),
        ("sort=title&order=desc", ["Gamma", "Delta", "Beta", "Alpha"]),
    ],
)
def test_sorting_keeps_nulls_last(client, catalog, query, expected):
    assert titles(client, query) == expected


def test_sort_by_review_count(client, catalog):
    result = titles(client, "sort=review_count&order=desc")

    assert result[0] == "Alpha"
    assert result[-1] == "Gamma"


@pytest.mark.parametrize(
    ("query", "expected"),
    [
        ("search=drama", {"Alpha", "Delta"}),
        ("search=DRAMA", {"Alpha", "Delta"}),
        ("search=100%25", {"Delta"}),
        ("search=%25", {"Delta"}),
        ("search=_", set()),
        ("year_min=2000", {"Alpha", "Delta"}),
        ("year_max=2010", {"Alpha", "Beta"}),
        ("year_min=2000&year_max=2015", {"Alpha"}),
        ("year_min=2020&year_max=2020", {"Delta"}),
        ("runtime_min=100", {"Alpha", "Delta"}),
        ("runtime_max=100", {"Beta"}),
        ("certification=PG-13", {"Alpha", "Delta"}),
        ("language=en", {"Alpha", "Gamma"}),
    ],
)
def test_single_filters(client, catalog, query, expected):
    assert set(titles(client, query)) == expected


def test_genre_filter(client, catalog):
    query = f"genre_id={catalog['genres']['drama']}"

    assert set(titles(client, query)) == {"Alpha", "Gamma", "Delta"}


def test_director_filter(client, catalog):
    query = f"director_id={catalog['directors']['nolan']}"

    assert set(titles(client, query)) == {"Alpha", "Gamma"}


def test_combined_filters(client, catalog):
    query = f"genre_id={catalog['genres']['drama']}&language=en&runtime_min=100"

    assert titles(client, query) == ["Alpha"]


def test_filters_report_filtered_total(client, catalog):
    body = client.get(f"/movies?genre_id={catalog['genres']['drama']}&page_size=1").json()

    assert body["total"] == 3
    assert len(body["items"]) == 1


@pytest.mark.parametrize(("page", "expected"), [(1, 3), (2, 1), (3, 0)])
def test_pagination(client, catalog, page, expected):
    body = client.get(f"/movies?page={page}&page_size=3").json()

    assert len(body["items"]) == expected
    assert body["total"] == 4
    assert body["page"] == page
    assert body["page_size"] == 3


def test_pages_do_not_overlap(client, catalog):
    first = titles(client, "page=1&page_size=2")
    second = titles(client, "page=2&page_size=2")

    assert set(first).isdisjoint(second)
    assert len(first + second) == 4


def test_get_movie_returns_detail(client, catalog):
    response = client.get(f"/movies/{catalog['movies']['gamma']}")

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Gamma Action"
    assert body["genre_names"] == ["Action", "Drama"]
    assert body["director_names"] == ["Christopher Nolan", "Denis Villeneuve"]
    assert body["avg_rating"] is None
    assert body["review_count"] == 0


def test_get_missing_movie_is_404(client, catalog):
    response = client.get("/movies/999999999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Film bulunamadı"}


def test_genres_sorted_by_name(client, catalog):
    body = client.get("/genres").json()

    assert [g["name"] for g in body] == ["Action", "Comedy", "Drama"]
    assert body[0]["tmdb_genre_id"] == 900_003


def test_directors_search(client, catalog):
    body = client.get("/directors?search=villen").json()

    assert body == [
        {"id": catalog["directors"]["villeneuve"], "tmdb_person_id": 900_002,
         "name": "Denis Villeneuve"},
    ]


def test_directors_without_search_sorted_and_limited(client, catalog):
    assert [d["name"] for d in client.get("/directors").json()] == [
        "Christopher Nolan",
        "Denis Villeneuve",
    ]
    assert len(client.get("/directors?limit=1").json()) == 1


@pytest.fixture
def statements(test_engine):
    executed = []

    def record(conn, cursor, statement, parameters, context, executemany):
        executed.append(statement)

    event.listen(test_engine, "before_cursor_execute", record)
    yield executed
    event.remove(test_engine, "before_cursor_execute", record)


def test_list_uses_one_count_and_one_page_query(client, catalog, statements):
    client.get(f"/movies?genre_id={catalog['genres']['drama']}&page_size=100")

    selects = [s for s in statements if s.lstrip().upper().startswith("SELECT")]
    assert len(selects) == 2
