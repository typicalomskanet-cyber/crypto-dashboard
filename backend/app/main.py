from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .http import close_client
from .routers import coins, convert, exchange, fear_greed, news


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_client()


app = FastAPI(
    title="Crypto Dashboard API",
    version="0.1.0",
    description="Personal cryptocurrency dashboard backend.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
async def health() -> dict:
    return {"status": "ok"}


app.include_router(coins.router)
app.include_router(fear_greed.router)
app.include_router(news.router)
app.include_router(convert.router)
app.include_router(exchange.router)
