from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import uvicorn

try:
    from .schemas import PredictionRequest, PredictionResponse
    from .engine import PredictionEngine
except ImportError:
    if __package__ in (None, ""):
        from schemas import PredictionRequest, PredictionResponse
        from engine import PredictionEngine
    else:
        raise

API_KEY = os.getenv("ML_API_KEY", "dev-secret-key")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized: Invalid API Key")
    return api_key

ml_engine = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    ml_engine["predictor"] = PredictionEngine()
    yield
    ml_engine.clear()

app = FastAPI(
    title="SmartBiz AI - Valuations API", 
    description="Production ML inference API for SmartBiz AI",
    version="1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "engine_ready": "predictor" in ml_engine}

@app.post("/predict", response_model=PredictionResponse)
def predict_growth(request: PredictionRequest, api_key: str = Depends(verify_api_key)):
    try:
        preds, vals, scenarios, confidence, feat_imp = ml_engine["predictor"].predict_and_valuate(request.companies)
        return PredictionResponse(
            predictions=preds,
            valuations=vals,
            scenarios=scenarios,
            confidence=confidence,
            feature_importance=feat_imp,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

if __name__ == "__main__":

    module_target = "main:app" if __package__ in (None, "") else "app.main:app"
    uvicorn.run(module_target, host="0.0.0.0", port=8000, reload=True)