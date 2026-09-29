import pandas as pd

from app.database import Base, SessionLocal, engine
from app.models import DemandHistory, Drug, Inventory


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Find N02BE drug
        drug = (
            db.query(Drug)
            .filter(Drug.code == "N02BE")
            .first()
        )

        # 2. Create it if it doesn't exist
        if drug is None:
            drug = Drug(
                code="N02BE",
                name="Paracetamol"
            )

            db.add(drug)
            db.commit()
            db.refresh(drug)

        # 3. Read historical demand data
        df = pd.read_csv(
            "data/processed/n02be_daily.csv"
        )

        df["datum"] = pd.to_datetime(df["datum"])

        # 4. Insert only dates that are not already stored
        existing_dates = {
            record.date
            for record in (
                db.query(DemandHistory)
                .filter(DemandHistory.drug_id == drug.id)
                .all()
            )
        }

        records = [
            DemandHistory(
                drug_id=drug.id,
                date=row["datum"].date(),
                demand=float(row["demand"])
            )

            for _, row in df.iterrows()
            if row["datum"].date() not in existing_dates
        ]

        if records:
            db.add_all(records)

        # 5. Ensure the dashboard has an initial inventory record
        inventory = (
            db.query(Inventory)
            .filter(Inventory.drug_id == drug.id)
            .first()
        )

        if inventory is None:
            db.add(
                Inventory(
                    drug_id=drug.id,
                    current_stock=500,
                    safety_stock=200,
                    lead_time_days=7,
                )
            )

        db.commit()

        print(
            f"Seed complete for {drug.code}: "
            f"{len(records)} new demand records"
        )

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
