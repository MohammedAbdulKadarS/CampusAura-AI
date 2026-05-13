from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Namma database file name inga thaan iruku
SQLALCHEMY_DATABASE_URL = "sqlite:///./campusaura.db"

# Engine create panrom
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

# Database kooda communicate panna session ready panrom
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Idhu thaan base class - namma create panra tables ellam idha vechu thaan build aagum
Base = declarative_base()

# Database connection-ai manage panna intha function venum
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()