from fastapi import APIRouter, Response

from app.metrics.prometheus import metrics_response

router = APIRouter()


@router.get("/metrics")
async def metrics() -> Response:
    return Response(metrics_response(), media_type="text/plain; version=0.0.4")
