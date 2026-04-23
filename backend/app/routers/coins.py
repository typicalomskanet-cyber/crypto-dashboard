import httpx
from fastapi import APIRouter, HTTPException, Query

from ..config import settings
from ..http import get_client

router = APIRouter(prefix="/coins", tags=["coins"])


@router.get("/markets")
async def markets(
    vs_currency: str = Query("usd", min_length=3, max_length=10),
    per_page: int = Query(50, ge=1, le=250),
    page: int = Query(1, ge=1),
    ids: str | None = None,
) -> list[dict]:
    """Top coins by market cap with current price and 24h change."""
    client = get_client()
    params: dict[str, str | int] = {
        "vs_currency": vs_currency,
        "order": "market_cap_desc",
        "per_page": per_page,
        "page": page,
        "sparkline": "true",
        "price_change_percentage": "1h,24h,7d",
    }
    if ids:
        params["ids"] = ids
    try:
        resp = await client.get(f"{settings.coingecko_base_url}/coins/markets", params=params)
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"CoinGecko error: {exc}") from exc
    return resp.json()


@router.get("/search")
async def search(query: str = Query(..., min_length=1)) -> dict:
    client = get_client()
    try:
        resp = await client.get(
            f"{settings.coingecko_base_url}/search",
            params={"query": query},
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"CoinGecko error: {exc}") from exc
    return resp.json()


@router.get("/{coin_id}")
async def coin_detail(coin_id: str) -> dict:
    client = get_client()
    try:
        resp = await client.get(
            f"{settings.coingecko_base_url}/coins/{coin_id}",
            params={
                "localization": "false",
                "tickers": "false",
                "market_data": "true",
                "community_data": "false",
                "developer_data": "false",
            },
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"CoinGecko error: {exc}") from exc
    return resp.json()


@router.get("/{coin_id}/chart")
async def coin_chart(
    coin_id: str,
    vs_currency: str = Query("usd"),
    days: str = Query("7", description="1, 7, 14, 30, 90, 180, 365, max"),
) -> dict:
    client = get_client()
    try:
        resp = await client.get(
            f"{settings.coingecko_base_url}/coins/{coin_id}/market_chart",
            params={"vs_currency": vs_currency, "days": days},
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"CoinGecko error: {exc}") from exc
    return resp.json()
