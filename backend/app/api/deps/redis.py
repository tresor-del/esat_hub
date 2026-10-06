import os
import redis.asyncio as aioredis
from fastapi import Request

async def get_redis(request: Request) -> aioredis.Redis:
    return request.app.state.redis