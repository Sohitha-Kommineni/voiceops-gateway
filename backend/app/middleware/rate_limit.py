import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

_buckets: dict[str, deque[float]] = defaultdict(deque)


async def session_create_rate_limit(request: Request) -> None:
    key = request.client.host if request.client else "unknown"
    now = time.monotonic()
    bucket = _buckets[key]
    while bucket and now - bucket[0] > 60:
        bucket.popleft()
    if len(bucket) >= 30:
        raise HTTPException(status_code=429, detail="session creation rate limit exceeded")
    bucket.append(now)
