from sqlalchemy.exc import IntegrityError

LIKE_ESCAPE = "\\"


def violated_constraint(exc: IntegrityError) -> str | None:
    """İhlal edilen PostgreSQL constraint'inin adı (örn. 'users_email_key')."""
    return getattr(getattr(exc.orig, "diag", None), "constraint_name", None)


def contains_pattern(text: str) -> str:
    """Kullanıcı metnini ILIKE '%...%' kalıbına çevirir; %, _ ve \\ harfiyen aranır."""
    escaped = (
        text.replace(LIKE_ESCAPE, LIKE_ESCAPE * 2)
        .replace("%", LIKE_ESCAPE + "%")
        .replace("_", LIKE_ESCAPE + "_")
    )
    return f"%{escaped}%"
