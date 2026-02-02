from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os

# В проде Railway задаёт env сам. .env нужен только локально.
# Поэтому грузим .env только если файл реально существует.
try:
    from dotenv import load_dotenv
    if os.path.exists(".env"):
        load_dotenv()
except Exception:
    pass

DATABASE_URL = os.getenv("DATABASE_URL")

# Явная проверка, чтобы не было "got None"
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set (Railway: Service → Variables)")

# (безопасный лог) покажем только начало строки
print("DATABASE_URL loaded:", DATABASE_URL.split("@")[0] + "@***")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
