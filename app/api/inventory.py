from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.schemas import InventoryCreate, InventoryResponse

from datetime import timedelta

import pandas as pd

from app.models import Drug, Inventory, DemandHistory
from app.model.model_loader import model, features
from app.services.feature_service import build_features

router = APIRouter(
    prefix="/inventory",
    tags=["inventory"],
)

@router.post(
     "",
    response_model=InventoryResponse,
    status_code=201
)
def create_inventory(
        data: InventoryCreate,
        db: Session = Depends(get_db),
):
    drug = (
        db.query(Drug)
        .filter(Drug.id == data.drug_id)
        .first()
    )

    if drug is None:
        raise HTTPException(
            status_code=404,
            detail="Drug not found"
        )

    inventory = Inventory(
        drug_id=data.drug_id,
        current_stock=data.current_stock,
        safety_stock=data.safety_stock,
        lead_time_days=data.lead_time_days
    )

    try:
        db.add(inventory)
        db.commit()
        db.refresh(inventory)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Inventory already exists for this drug"
        )

    return inventory


@router.get(
    "",
    response_model=list[InventoryResponse]
)
def get_inventory(
    db: Session = Depends(get_db)
):
    return db.query(Inventory).all()


@router.get("/{drug_id}/risk")
def get_inventory_risk(
    drug_id: int,
    db: Session = Depends(get_db)
):
    # 1. Find drug
    drug = (
        db.query(Drug)
        .filter(Drug.id == drug_id)
        .first()
    )

    if drug is None:
        raise HTTPException(
            status_code=404,
            detail="Drug not found"
        )

    # 2. Find inventory
    inventory = (
        db.query(Inventory)
        .filter(Inventory.drug_id == drug_id)
        .first()
    )

    if inventory is None:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found"
        )

    # 3. Load demand history
    history_records = (
        db.query(DemandHistory)
        .filter(DemandHistory.drug_id == drug_id)
        .order_by(DemandHistory.date)
        .all()
    )

    if len(history_records) < 28:
        raise HTTPException(
            status_code=400,
            detail="At least 28 days of demand history are required"
        )

    # 4. Convert to DataFrame
    history = pd.DataFrame([
        {
            "date": record.date,
            "demand": record.demand
        }
        for record in history_records
    ])

    # 5. Build tomorrow's features
    last_date = pd.Timestamp(history["date"].max())
    target_date = last_date + timedelta(days=1)

    X = build_features(
        history,
        target_date
    )

    X = X[features]

    # 6. Predict demand
    predicted_demand = float(
        model.predict(X)[0]
    )

    # Demand should not be negative
    predicted_demand = max(
        0.0,
        predicted_demand
    )

    # 7. Calculate remaining stock
    remaining_stock = (
        inventory.current_stock
        - predicted_demand
    )

    # 8. Determine risk
    if remaining_stock < 0:
        risk = "CRITICAL"
        recommendation = "REORDER"

    elif remaining_stock < inventory.safety_stock:
        risk = "HIGH"
        recommendation = "REORDER"

    else:
        risk = "LOW"
        recommendation = "NO ACTION"

    return {
        "drug_id": drug.id,
        "drug_code": drug.code,
        "forecast_date": target_date.date(),
        "current_stock": inventory.current_stock,
        "predicted_demand": round(predicted_demand, 2),
        "remaining_stock": round(remaining_stock, 2),
        "safety_stock": inventory.safety_stock,
        "risk": risk,
        "recommendation": recommendation
    }