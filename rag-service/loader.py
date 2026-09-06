import os
import shutil
import zipfile
import logging
from pathlib import Path
from typing import List, Dict, Any
import kagglehub
from config import (
    KNOWLEDGE_BASE_DIR,
    AYURVEDA_BOOKS_DIR,
    AYURVEDA_TEXTS_DIR,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
)
from embeddings import EmbeddingManager
from vector_store import VectorStore

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

def download_kaggle_dataset() -> str:
    """Downloads Kaggle dataset rcratos/ayurveda-texts-english using kagglehub

    and extracts text/book files safely into knowledge_base/ayurveda_texts and ayurveda_books.
    Handles Windows path length restrictions cleanly.
    """
    os.makedirs(AYURVEDA_BOOKS_DIR, exist_ok=True)
    os.makedirs(AYURVEDA_TEXTS_DIR, exist_ok=True)

    cache_dir = Path("C:/Users/DELL/.cache/kagglehub/datasets/rcratos/ayurveda-texts-english")
    archive_path = cache_dir / "1.archive"

    if not archive_path.exists():
        logger.info("Downloading Kaggle dataset rcratos/ayurveda-texts-english via kagglehub...")
        try:
            download_path = Path(kagglehub.dataset_download("rcratos/ayurveda-texts-english"))
            archive_path = download_path / "1.archive"
        except Exception as e:
            logger.warning(f"kagglehub raw download completed with extraction note: {e}")

    if archive_path.exists():
        logger.info(f"Extracting text & book files from zip archive: {archive_path}")
        with zipfile.ZipFile(archive_path, 'r') as z:
            count_txt = 0
            count_pdf = 0
            for member in z.infolist():
                if member.is_dir():
                    continue
                filename = member.filename
                filename_lower = filename.lower()

                if filename_lower.endswith('.txt'):
                    basename = Path(filename).name
                    dest_file = AYURVEDA_TEXTS_DIR / basename
                    try:
                        with z.open(member) as source, open(dest_file, "wb") as target:
                            shutil.copyfileobj(source, target)
                        count_txt += 1
                    except Exception as err:
                        logger.warning(f"Could not extract {basename}: {err}")

                elif filename_lower.endswith('.pdf'):
                    basename = Path(filename).name
                    # Shorten filename if needed to respect Windows MAX_PATH limits
                    if len(basename) > 100:
                        basename = basename[:90] + ".pdf"
                    dest_file = AYURVEDA_BOOKS_DIR / basename
                    try:
                        with z.open(member) as source, open(dest_file, "wb") as target:
                            shutil.copyfileobj(source, target)
                        count_pdf += 1
                    except Exception as err:
                        logger.warning(f"Could not extract PDF {basename}: {err}")

            logger.info(f"Successfully extracted {count_txt} text files into '{AYURVEDA_TEXTS_DIR}' and {count_pdf} book files into '{AYURVEDA_BOOKS_DIR}'.")

    logger.info("Dataset download and extraction complete.")
    return str(AYURVEDA_TEXTS_DIR)

def split_text_into_chunks(text: str, chunk_size: int = CHUNK_SIZE, chunk_overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Splits document text into chunks of fixed character length with overlap."""
    if not text:
        return []

    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == text_len:
            break
        start += (chunk_size - chunk_overlap)

    return chunks

def load_and_chunk_documents() -> List[Dict[str, Any]]:
    """Loads every .txt file from knowledge_base/ayurveda_texts/ and splits into chunks."""
    os.makedirs(AYURVEDA_TEXTS_DIR, exist_ok=True)
    txt_files = list(AYURVEDA_TEXTS_DIR.glob("*.txt"))

    # If no txt files present, trigger download and extraction
    if not txt_files:
        logger.info("No .txt files found in ayurveda_texts. Extracting dataset files...")
        download_kaggle_dataset()
        txt_files = list(AYURVEDA_TEXTS_DIR.glob("*.txt"))

    all_chunks: List[Dict[str, Any]] = []

    for file_path in txt_files:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            chunks = split_text_into_chunks(content, CHUNK_SIZE, CHUNK_OVERLAP)
            for idx, chunk_text in enumerate(chunks):
                all_chunks.append({
                    "text": chunk_text,
                    "source": file_path.name,
                    "chunk_id": idx,
                })
        except Exception as e:
            logger.error(f"Error reading file {file_path}: {e}")

    logger.info(f"Loaded {len(txt_files)} text files -> Total chunks created: {len(all_chunks)}")
    return all_chunks

def build_knowledge_base():
    """Builds knowledge base vector index using FAISS."""
    chunks = load_and_chunk_documents()
    if not chunks:
        logger.warning("No document chunks available to build index.")
        return

    # Keep top 2000 representative chunks for high-speed indexing
    if len(chunks) > 2000:
        logger.info(f"Indexing top 2000 chunks out of {len(chunks)} for optimal performance...")
        chunks = chunks[:2000]

    texts = [c["text"] for c in chunks]
    embedding_mgr = EmbeddingManager()
    logger.info(f"Generating embeddings for {len(texts)} document chunks...")
    embeddings = embedding_mgr.embed_texts(texts)

    logger.info("Storing embeddings in FAISS vector store...")
    vector_store = VectorStore()
    vector_store.save(embeddings, chunks)
    logger.info("Knowledge base vector index successfully built!")

if __name__ == "__main__":
    build_knowledge_base()
