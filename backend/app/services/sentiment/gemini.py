import httpx
from google import genai
from google.genai import errors, types
from pydantic import ValidationError

from app.core.enums import SentimentLabel
from app.services.sentiment.base import SentimentError, SentimentRateLimitError, SentimentResult

# Çok uzun yorumlar kısaltılarak gönderilir; DB'deki metin değişmez.
MAX_REVIEW_CHARS = 8000

LABELS = ", ".join(f'"{label.value}"' for label in SentimentLabel)

SYSTEM_INSTRUCTION = f"""Sen bir film yorumu duygu analizi sınıflandırıcısısın.
Yorum Türkçe ya da İngilizce olabilir; dili ne olursa olsun yalnızca yorumun
yazarının filme karşı tutumunu değerlendir.
Yanıt olarak SADECE şu JSON nesnesini döndür:
{{"label": {LABELS} etiketlerinden biri, "score": 0.0-1.0}}
score = seçtiğin etiketin güven düzeyi."""


class GeminiProvider:
    def __init__(self, client: genai.Client, model: str, timeout_ms: int | None = None) -> None:
        self.client = client
        self.model = model
        self.timeout_ms = timeout_ms

    def analyze(self, text: str) -> SentimentResult:
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=f'Yorum: """{text[:MAX_REVIEW_CHARS]}"""',
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    response_schema=SentimentResult,
                    temperature=0,
                ),
            )
        except errors.APIError as exc:
            if exc.code == 429:
                raise SentimentRateLimitError("Gemini kotası doldu (429)") from exc
            raise SentimentError(f"Gemini API hatası ({exc.code})") from exc
        except httpx.HTTPError as exc:
            raise SentimentError(f"Gemini'ye ulaşılamadı: {type(exc).__name__}") from exc

        try:
            result = SentimentResult.model_validate_json(response.text or "")
        except ValidationError as exc:
            raise SentimentError("Gemini geçersiz yanıt döndürdü") from exc
        return SentimentResult(label=result.label, score=round(result.score, 2))
