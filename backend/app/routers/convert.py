import httpx
from fastapi import APIRouter, HTTPException, Query

from ..config import settings
from ..http import get_client

router = APIRouter(prefix="/convert", tags=["convert"])


@router.get("")
async def convert(
    from_: str = Query(..., alias="from", min_length=1),
    to: str = Query(..., min_length=1),
    amount: float = Query(1.0, gt=0),
) -> dict:
    """Convert `amount` of `from` coin into `to` currency via CoinGecko simple price."""
    client = get_client()
    try:
        resp = await client.get(
            f"{settings.coingecko_base_url}/simple/price",
            params={"ids": from_.lower(), "vs_currencies": to.lower()},
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"CoinGecko error: {exc}") from exc
    data = resp.json()
    rate = (data.get(from_.lower()) or {}).get(to.lower())
    if rate is None:
        raise HTTPException(
            status_code=404,
            detail=f"Rate not found for {from_} -> {to}",
        )
    return {
        "from": from_.lower(),
        "to": to.lower(),
        "amount": amount,
        "rate": rate,
        "result": amount * rate,
    }
