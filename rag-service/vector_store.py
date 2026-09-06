import os
import pickle
import logging
from typing import List, Dict, Any
import faiss
import numpy as np
from config import VECTOR_DB_DIR, FAISS_INDEX_PATH, METADATA_PKL_PATH, TOP_K

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self):
        self.index = None
        self.documents: List[Dict[str, Any]] = []

    def save(self, embeddings: np.ndarray, documents: List[Dict[str, Any]]):
        os.makedirs(VECTOR_DB_DIR, exist_ok=True)
        dimension = embeddings.shape[1]

        # Normalize vectors for cosine similarity
        faiss.normalize_L2(embeddings)
        self.index = faiss.IndexFlatIP(dimension)
        self.index.add(embeddings)
        self.documents = documents

        faiss.write_index(self.index, str(FAISS_INDEX_PATH))
        with open(METADATA_PKL_PATH, "wb") as f:
            pickle.dump(self.documents, f)
        
        logger.info(f"Vector store saved successfully at {VECTOR_DB_DIR} with {len(documents)} document chunks.")

    def load(self) -> bool:
        if not FAISS_INDEX_PATH.exists() or not METADATA_PKL_PATH.exists():
            logger.warning(f"Vector store files missing at {VECTOR_DB_DIR}")
            return False

        try:
            self.index = faiss.read_index(str(FAISS_INDEX_PATH))
            with open(METADATA_PKL_PATH, "rb") as f:
                self.documents = pickle.load(f)
            logger.info(f"Loaded FAISS index with {self.index.ntotal} vectors and {len(self.documents)} metadata items.")
            return True
        except Exception as e:
            logger.error(f"Failed to load FAISS vector store: {e}")
            return False

    def similarity_search(self, query_embedding: np.ndarray, top_k: int = TOP_K) -> List[Dict[str, Any]]:
        if self.index is None or len(self.documents) == 0:
            if not self.load():
                return []

        # Copy and normalize query embedding
        q_emb = np.ascontiguousarray(query_embedding.astype(np.float32))
        faiss.normalize_L2(q_emb)

        scores, indices = self.index.search(q_emb, min(top_k, self.index.ntotal))

        results = []
        if len(indices) > 0:
            for idx, score in zip(indices[0], scores[0]):
                if idx >= 0 and idx < len(self.documents):
                    doc = self.documents[idx].copy()
                    doc["score"] = float(score)
                    results.append(doc)

        return results
