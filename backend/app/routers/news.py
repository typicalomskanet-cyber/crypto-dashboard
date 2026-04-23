from __future__ import annotations

import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

import httpx
from fastapi import APIRouter, HTTPException

from ..http import get_client

router = APIRouter(prefix="/news", tags=["news"])

# Cointelegraph RSS is public, no auth required.
_RSS_URL = "https://cointelegraph.com/rss"


def _parse_pub_date(raw: str | None) -> str | None:
    if not raw:
        return None
    try:
        return parsedate_to_datetime(raw).isoformat()
    except (TypeError, ValueError):
        return None


@router.get("")
async def news(limit: int = 30) -> dict:
    """Latest crypto headlines from Cointelegraph RSS."""
    client = get_client()
    try:
        resp = await client.get(_RSS_URL)
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"News provider error: {exc}") from exc

    try:
        root = ET.fromstring(resp.text)
    except ET.ParseError as exc:
        raise HTTPException(status_code=502, detail=f"News parse error: {exc}") from exc

    items: list[dict] = []
    for item in root.iterfind(".//item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub_date = _parse_pub_date(item.findtext("pubDate"))
        guid = (item.findtext("guid") or link).strip()
        category = item.findtext("category")
        items.append(
            {
                "id": guid,
                "title": title,
                "url": link,
                "published_at": pub_date,
                "source": "Cointelegraph",
                "domain": "cointelegraph.com",
                "currencies": [category.upper()] if category else [],
            }
        )
        if len(items) >= limit:
            break

    return {"items": items}
