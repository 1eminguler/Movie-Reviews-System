import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import get_settings


@pytest.fixture(scope="session")
def test_engine():
    url = get_settings().TEST_DATABASE_URL
    if not url:
        pytest.skip("TEST_DATABASE_URL tanımlı değil")
    engine = create_engine(url, pool_pre_ping=True)
    yield engine
    engine.dispose()


@pytest.fixture
def db(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()
