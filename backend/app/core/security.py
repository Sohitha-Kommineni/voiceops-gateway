from fastapi import Header


async def optional_user_id(x_voiceops_user_id: str | None = Header(default=None)) -> str | None:
    return x_voiceops_user_id
