"""
MeetMux Geospatial Intelligence Engine — Cache & Rate Limiting Service
Provides in-memory caching with TTL and optional Redis connection, plus token-bucket rate limiting.
"""

import time
import os
from typing import Any, Optional, Dict, Tuple

try:
    import redis
    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False

class CacheService:
    def __init__(self):
        self._memory_cache: Dict[str, Tuple[Any, float]] = {}
        self._rate_limits: Dict[str, list] = {}
        self._redis_client = None
        self._init_redis()

    def _init_redis(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        if HAS_REDIS and redis_url:
            try:
                self._redis_client = redis.from_url(redis_url, socket_timeout=1.0)
                self._redis_client.ping()
                print("[Cache] Connected to Redis cache.")
            except Exception:
                self._redis_client = None

    def get(self, key: str) -> Optional[Any]:
        if self._redis_client:
            try:
                val = self._redis_client.get(key)
                if val:
                    import json
                    return json.loads(val)
            except Exception:
                pass

        if key in self._memory_cache:
            val, expires_at = self._memory_cache[key]
            if time.time() < expires_at:
                return val
            else:
                del self._memory_cache[key]
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 60):
        expires_at = time.time() + ttl_seconds
        self._memory_cache[key] = (value, expires_at)

        if self._redis_client:
            try:
                import json
                self._redis_client.setex(key, ttl_seconds, json.dumps(value))
            except Exception:
                pass

    def check_rate_limit(self, identifier: str, max_requests: int = 60, window_seconds: int = 60) -> bool:
        """
        Token-bucket / sliding window rate limiter. Returns True if request is allowed, False if exceeded.
        """
        now = time.time()
        if identifier not in self._rate_limits:
            self._rate_limits[identifier] = []

        # Retain only timestamps inside window
        self._rate_limits[identifier] = [ts for ts in self._rate_limits[identifier] if now - ts < window_seconds]

        if len(self._rate_limits[identifier]) >= max_requests:
            return False

        self._rate_limits[identifier].append(now)
        return True

cache_service = CacheService()
