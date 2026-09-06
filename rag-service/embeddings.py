import logging
from typing import List
import numpy as np
from config import GEMINI_API_KEY

logger = logging.getLogger(__name__)

class EmbeddingManager:
    def __init__(self):
        self.use_gemini = False
        self.gemini_client = None
        self.st_model = None

        self.use_gemini = False
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading sentence-transformers/all-MiniLM-L6-v2...")
            self.st_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        except Exception as e:
            logger.error(f"Failed to load SentenceTransformer: {e}")

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        if not texts:
            return np.array([], dtype=np.float32)

        if self.use_gemini and self.gemini_client:
            try:
                embeddings = []
                # Batch embed with Gemini or iterate in chunks if needed
                for i in range(0, len(texts), 100):
                    batch = texts[i:i+100]
                    res = self.gemini_client.embed_content(
                        model="models/gemini-embedding-001",
                        content=batch,
                        task_type="retrieval_document"
                    )
                    if "embedding" in res:
                        embeddings.extend(res["embedding"])
                    else:
                        raise ValueError("Unexpected response format from Gemini Embeddings API")
                return np.array(embeddings, dtype=np.float32)
            except Exception as e:
                logger.warning(f"Gemini embedding failed: {e}. Falling back to SentenceTransformer.")
                if self.st_model is None:
                    from sentence_transformers import SentenceTransformer
                    self.st_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
                embeddings = self.st_model.encode(texts, batch_size=256, show_progress_bar=True)
                return np.array(embeddings, dtype=np.float32)
        else:
            if self.st_model is None:
                from sentence_transformers import SentenceTransformer
                self.st_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            embeddings = self.st_model.encode(texts, batch_size=256, show_progress_bar=True)
            return np.array(embeddings, dtype=np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        if self.use_gemini and self.gemini_client:
            try:
                res = self.gemini_client.embed_content(
                    model="models/gemini-embedding-001",
                    content=query,
                    task_type="retrieval_query"
                )
                if "embedding" in res:
                    return np.array([res["embedding"]], dtype=np.float32)
            except Exception as e:
                logger.warning(f"Gemini query embedding failed: {e}. Falling back to SentenceTransformer.")
        
        if self.st_model is None:
            from sentence_transformers import SentenceTransformer
            self.st_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        embedding = self.st_model.encode([query], show_progress_bar=False)
        return np.array(embedding, dtype=np.float32)
