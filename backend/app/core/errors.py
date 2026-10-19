from collections.abc import Callable
from typing import Any

from fastapi import Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

ErrorDetails = dict[str, Any]

MESSAGES: dict[str, Callable[[dict[str, Any]], str]] = {
    "missing": lambda ctx: "zorunlu alan",
    "greater_than_equal": lambda ctx: f"en az {ctx['ge']} olmalı",
    "greater_than": lambda ctx: f"{ctx['gt']} değerinden büyük olmalı",
    "less_than_equal": lambda ctx: f"en fazla {ctx['le']} olmalı",
    "less_than": lambda ctx: f"{ctx['lt']} değerinden küçük olmalı",
    "int_parsing": lambda ctx: "tam sayı olmalı",
    "int_type": lambda ctx: "tam sayı olmalı",
    "float_parsing": lambda ctx: "sayı olmalı",
    "string_too_short": lambda ctx: f"en az {ctx['min_length']} karakter olmalı",
    "string_too_long": lambda ctx: f"en fazla {ctx['max_length']} karakter olmalı",
    "literal_error": lambda ctx: (
        f"geçersiz değer; izin verilenler: {ctx['expected'].replace(' or ', ' veya ')}"
    ),
    "json_invalid": lambda ctx: "geçersiz JSON",
}


def field_name(error: ErrorDetails) -> str:
    # loc: ("query", "page_size") / ("body", "password") / ("body", 12) -> alan adı
    names = [str(part) for part in error["loc"][1:] if isinstance(part, str)]
    return ".".join(names) or str(error["loc"][0])


def turkish_message(error: ErrorDetails) -> str:
    builder = MESSAGES.get(error["type"])
    if builder is not None:
        return builder(error.get("ctx") or {})
    message = error["msg"]
    if message.startswith("value is not a valid email address"):
        return "geçerli bir email adresi değil"
    # Kendi validator'larımızın (ValueError) mesajları zaten Türkçe.
    return message.removeprefix("Value error, ")


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    errors = exc.errors()
    first = errors[0]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={
            "detail": f"{field_name(first)}: {turkish_message(first)}",
            "errors": jsonable_encoder(errors),
        },
    )
