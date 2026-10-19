import pytest
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

from app.models import Base

pytestmark = pytest.mark.integration

DIALECT = postgresql.dialect()
VIEWS = {"movie_details"}
TABLES = sorted(Base.metadata.tables)


def compiled(type_):
    return type_.compile(dialect=DIALECT)


def test_every_db_table_and_view_has_a_model(test_engine):
    inspector = inspect(test_engine)
    db_relations = set(inspector.get_table_names()) | set(inspector.get_view_names())

    assert db_relations == set(TABLES)


@pytest.mark.parametrize("table_name", TABLES)
def test_model_columns_match_database(test_engine, table_name):
    db_columns = {c["name"]: c for c in inspect(test_engine).get_columns(table_name)}
    model_columns = Base.metadata.tables[table_name].columns

    assert set(db_columns) == {c.name for c in model_columns}
    for column in model_columns:
        db_column = db_columns[column.name]
        assert compiled(column.type) == compiled(db_column["type"]), column.name
        if table_name not in VIEWS:
            assert column.nullable == db_column["nullable"], column.name


@pytest.mark.parametrize("table_name", sorted(set(TABLES) - VIEWS))
def test_model_unique_constraints_match_database(test_engine, table_name):
    inspector = inspect(test_engine)
    db_unique = {tuple(u["column_names"]) for u in inspector.get_unique_constraints(table_name)}
    table = Base.metadata.tables[table_name]
    model_unique = {(c.name,) for c in table.columns if c.unique} | {
        tuple(c.name for c in constraint.columns)
        for constraint in table.constraints
        if constraint.__class__.__name__ == "UniqueConstraint"
    }

    assert model_unique == db_unique


@pytest.mark.parametrize("table_name", sorted(set(TABLES) - VIEWS))
def test_model_primary_keys_match_database(test_engine, table_name):
    db_pk = inspect(test_engine).get_pk_constraint(table_name)["constrained_columns"]
    model_pk = [c.name for c in Base.metadata.tables[table_name].primary_key]

    assert sorted(model_pk) == sorted(db_pk)
