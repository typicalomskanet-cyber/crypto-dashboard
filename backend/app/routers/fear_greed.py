import httpx
from fastapi import APIRouter, HTTPException, Query

from ..config import settings
from ..http import get_client

router = APIRouter(prefix="/fear-greed", tags=["fear-greed"])


@router.get("")
async def fear_greed(limit: int = Query(1, ge=1, le=365)) -> dict:
    client = get_client()
    try:
        resp = await client.get(
            settings.fear_greed_url,
            params={"limit": limit, "format": "json"},
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Fear & Greed error: {exc}") from exc
    return resp.json()
