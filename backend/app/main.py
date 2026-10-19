from fastapi import FastAPI

app = FastAPI(title="Movie Reviews System API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
