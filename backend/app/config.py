from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    coingecko_base_url: str = "https://api.coingecko.com/api/v3"
    fear_greed_url: str = "https://api.alternative.me/fng/"
    news_url: str = "https://api.coingecko.com/api/v3/news"

    binance_base_url: str = "https://api.binance.com"
    binance_api_key: str | None = None
    binance_api_secret: str | None = None

    http_timeout: float = 15.0

    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


settings = Settings()
