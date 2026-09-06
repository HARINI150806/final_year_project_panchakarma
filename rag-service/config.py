import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / "backend" / ".env")

KNOWLEDGE_BASE_DIR = BASE_DIR / "knowledge_base"
AYURVEDA_BOOKS_DIR = KNOWLEDGE_BASE_DIR / "ayurveda_books"
AYURVEDA_TEXTS_DIR = KNOWLEDGE_BASE_DIR / "ayurveda_texts"

VECTOR_DB_DIR = BASE_DIR / "vector_db"
FAISS_INDEX_PATH = VECTOR_DB_DIR / "index.faiss"
METADATA_PKL_PATH = VECTOR_DB_DIR / "index.pkl"

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
TOP_K = 5

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
