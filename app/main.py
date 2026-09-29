import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import PredictionInput
from app.services.forecast_service import make_prediction
from app.model.model_loader import model, features, metrics

from app.database import engine, Base
from app import models
from app.api.drugs import router as drugs_router
from app.api.inventory import router as inventory_router


app = FastAPI(title="PharmaML API", version="1.0.0")

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(drugs_router)
app.include_router(inventory_router)

Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "service": "PharmaML API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/model/info")
def model_info():
    return {
        "model_type": type(model).__name__,
        "features": features,
        "metrics": metrics
    }


@app.post("/predict")
def predict(data: PredictionInput):
    prediction = make_prediction(
        data,
        model,
        features
    )

    return {
        "prediction": prediction
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }
