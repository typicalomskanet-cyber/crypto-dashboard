import hashlib
import hmac
import time
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException

from ..config import settings
from ..http import get_client

router = APIRouter(prefix="/exchange", tags=["exchange"])


def _sign(secret: str, query: str) -> str:
    return hmac.new(secret.encode(), query.encode(), hashlib.sha256).hexdigest()


@router.get("/balance")
async def balance() -> dict:
    """Return non-zero spot balances from Binance plus USD valuations.

    Requires BINANCE_API_KEY and BINANCE_API_SECRET env vars (read-only is enough).
    """
    if not settings.binance_api_key or not settings.binance_api_secret:
        raise HTTPException(
            status_code=400,
            detail=(
                "Binance API credentials are not configured. "
                "Set BINANCE_API_KEY and BINANCE_API_SECRET env vars "
                "(read-only keys are sufficient)."
            ),
        )

    client = get_client()
    timestamp = int(time.time() * 1000)
    query = urlencode({"timestamp": timestamp, "recvWindow": 5000})
    signature = _sign(settings.binance_api_secret, query)
    url = f"{settings.binance_base_url}/api/v3/account?{query}&signature={signature}"
    headers = {"X-MBX-APIKEY": settings.binance_api_key}

    try:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Binance error: {detail}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Binance error: {exc}") from exc

    account = resp.json()
    balances = [
        {
            "asset": b["asset"],
            "free": float(b["free"]),
            "locked": float(b["locked"]),
            "total": float(b["free"]) + float(b["locked"]),
        }
        for b in account.get("balances", [])
        if float(b["free"]) + float(b["locked"]) > 0
    ]
    balances.sort(key=lambda b: b["total"], reverse=True)

    # Enrich with USDT price where available using Binance public ticker.
    symbols_to_query = [b["asset"] for b in balances if b["asset"] != "USDT"]
    prices: dict[str, float] = {}
    if symbols_to_query:
        try:
            ticker_resp = await client.get(
                f"{settings.binance_base_url}/api/v3/ticker/price"
            )
            ticker_resp.raise_for_status()
            all_prices = {t["symbol"]: float(t["price"]) for t in ticker_resp.json()}
            for asset in symbols_to_query:
                pair = f"{asset}USDT"
                if pair in all_prices:
                    prices[asset] = all_prices[pair]
        except httpx.HTTPError:
            prices = {}

    total_usd = 0.0
    for bal in balances:
        if bal["asset"] == "USDT":
            bal["usd_value"] = bal["total"]
        elif bal["asset"] in prices:
            bal["usd_value"] = bal["total"] * prices[bal["asset"]]
        else:
            bal["usd_value"] = None
        if bal["usd_value"] is not None:
            total_usd += bal["usd_value"]

    return {
        "balances": balances,
        "total_usd": total_usd,
        "account_type": account.get("accountType"),
        "can_trade": account.get("canTrade"),
    }
