from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE logs ADD COLUMN is_false_positive BOOLEAN DEFAULT FALSE"))
            conn.commit()
            print("Migration successful: Added is_false_positive column to logs table.")
        except Exception as e:
            print(f"Migration failed (maybe column already exists?): {e}")

if __name__ == "__main__":
    migrate()
