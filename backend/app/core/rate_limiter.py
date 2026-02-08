from collections import deque
from datetime import datetime, timedelta
from fastapi import HTTPException, status


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window = timedelta(seconds=window_seconds)
        self.requests: dict[str, deque[datetime]] = {}

    def hit(self, key: str) -> None:
        now = datetime.utcnow()
        queue = self.requests.setdefault(key, deque())
        while queue and (now - queue[0]) > self.window:
            queue.popleft()
        if len(queue) >= self.max_requests:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")
        queue.append(now)
