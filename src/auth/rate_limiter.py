"""
AuthentiHire - Rate Limiting & Abuse Prevention Architecture
============================================================
Thread-safe sliding window rate limiters for auth endpoints, analysis runs,
and sensitive operations, with extensible backend support (InMemory, Redis-ready).
"""

import time
import threading
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Tuple, Optional
from collections import defaultdict

logger = logging.getLogger("authentihire.rate_limiter")


class BaseRateLimiter(ABC):
    """Abstract Base Class for Rate Limiting Implementations."""

    @abstractmethod
    def is_allowed(
        self,
        identifier: str,
        action: str,
        max_requests: int = 15,
        window_seconds: int = 60,
    ) -> Tuple[bool, int]:
        """
        Checks if the request is permitted within the sliding time window.
        Returns (is_allowed, retry_after_seconds).
        """
        pass

    @abstractmethod
    def reset(self) -> None:
        """Resets rate limiting state (primarily for testing)."""
        pass


class InMemorySlidingWindowLimiter(BaseRateLimiter):
    """
    High-performance thread-safe sliding-window rate limiter in Python memory.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._last_cleanup = time.time()

    def is_allowed(
        self,
        identifier: str,
        action: str,
        max_requests: int = 15,
        window_seconds: int = 60,
    ) -> Tuple[bool, int]:
        now = time.time()
        key = f"{action}:{identifier}"

        with self._lock:
            # Periodic background cleanup of keys older than 5 minutes
            if now - self._last_cleanup > 300:
                self._cleanup(now)
                self._last_cleanup = now

            timestamps = self._requests[key]
            # Evict timestamps outside the sliding window
            cutoff = now - window_seconds
            self._requests[key] = [t for t in timestamps if t > cutoff]

            if len(self._requests[key]) >= max_requests:
                oldest = self._requests[key][0]
                retry_after = max(1, int(oldest + window_seconds - now))
                return False, retry_after

            self._requests[key].append(now)
            return True, 0

    def _cleanup(self, now: float) -> None:
        """Purges stale records older than 10 minutes."""
        cutoff = now - 600
        keys_to_delete = []
        for key, timestamps in self._requests.items():
            valid = [t for t in timestamps if t > cutoff]
            if valid:
                self._requests[key] = valid
            else:
                keys_to_delete.append(key)
        for key in keys_to_delete:
            del self._requests[key]

    def reset(self) -> None:
        """Resets all rate limit tracking."""
        with self._lock:
            self._requests.clear()


class RedisRateLimiter(BaseRateLimiter):
    """
    Redis-backed sliding window rate limiter for multi-instance production setups.
    Falls back gracefully to memory if Redis is unavailable.
    """

    def __init__(self, redis_url: Optional[str] = None):
        self._redis_url = redis_url
        self._fallback = InMemorySlidingWindowLimiter()
        self._redis_client = None

        if redis_url:
            try:
                import redis
                self._redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
                self._redis_client.ping()
                logger.info("Connected to Redis for distributed rate limiting.")
            except Exception as e:
                logger.warning(f"Could not connect to Redis ({e}); using in-memory rate limiter fallback.")
                self._redis_client = None

    def is_allowed(
        self,
        identifier: str,
        action: str,
        max_requests: int = 15,
        window_seconds: int = 60,
    ) -> Tuple[bool, int]:
        if not self._redis_client:
            return self._fallback.is_allowed(identifier, action, max_requests, window_seconds)

        now = time.time()
        key = f"rl:{action}:{identifier}"
        cutoff = now - window_seconds

        try:
            pipe = self._redis_client.pipeline()
            pipe.zremrangebyscore(key, 0, cutoff)
            pipe.zcard(key)
            pipe.zrange(key, 0, 0, withscores=True)
            pipe.zadd(key, {str(now): now})
            pipe.expire(key, window_seconds + 5)
            _, count, oldest_entry, _, _ = pipe.execute()

            if count >= max_requests:
                # Remove the timestamp we just tentatively added
                self._redis_client.zrem(key, str(now))
                oldest_ts = oldest_entry[0][1] if oldest_entry else now
                retry_after = max(1, int(oldest_ts + window_seconds - now))
                return False, retry_after

            return True, 0
        except Exception as e:
            logger.warning(f"Redis rate limiting failed ({e}); falling back to memory.")
            return self._fallback.is_allowed(identifier, action, max_requests, window_seconds)

    def reset(self) -> None:
        if self._redis_client:
            try:
                keys = self._redis_client.keys("rl:*")
                if keys:
                    self._redis_client.delete(*keys)
            except Exception:
                pass
        self._fallback.reset()


# Backward compatibility alias
InMemoryRateLimiter = InMemorySlidingWindowLimiter

# Global rate limiter instances
auth_rate_limiter = InMemorySlidingWindowLimiter()
analysis_rate_limiter = InMemorySlidingWindowLimiter()
