import logging

from sqlalchemy import update

from app.core.enums import SentimentStatus
from app.db.session import SessionFactory
from app.models import Review
from app.services.sentiment.base import SentimentError, SentimentProvider

logger = logging.getLogger(__name__)


def analyze_review(
    review_id: int, text: str, provider: SentimentProvider, session_factory: SessionFactory
) -> None:
    """Yorumu analiz eder ve sonucu yazar (BackgroundTasks ile, yanıttan sonra çalışır)."""
    try:
        result = provider.analyze(text)
        values = {
            "sentiment_label": result.label,
            "sentiment_score": result.score,
            "sentiment_status": SentimentStatus.DONE,
        }
    except SentimentError as exc:
        logger.warning("Yorum %s analiz edilemedi: %s", review_id, exc)
        values = {"sentiment_status": SentimentStatus.FAILED}

    with session_factory() as db:
        # Analiz sürerken metin değiştiyse ya da yorum silindiyse hiçbir satır güncellenmez;
        # yeni metnin analizi zaten ayrıca planlanmıştır.
        db.execute(
            update(Review)
            .where(Review.id == review_id, Review.review_text == text)
            .values(**values)
        )
        db.commit()
