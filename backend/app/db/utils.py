LIKE_ESCAPE = "\\"


def contains_pattern(text: str) -> str:
    """Kullanıcı metnini ILIKE '%...%' kalıbına çevirir; %, _ ve \\ harfiyen aranır."""
    escaped = (
        text.replace(LIKE_ESCAPE, LIKE_ESCAPE * 2)
        .replace("%", LIKE_ESCAPE + "%")
        .replace("_", LIKE_ESCAPE + "_")
    )
    return f"%{escaped}%"
