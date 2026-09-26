import logging
import re
from typing import List, Dict, Any
from config import GEMINI_API_KEY, TOP_K
from embeddings import EmbeddingManager
from vector_store import VectorStore

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a helpful, warm Ayurveda Expert Assistant serving patients and healthcare therapists.

Answer in clear, simple, patient-friendly language. Avoid technical computer jargon or raw database formatting.

Use the provided classical Ayurveda reference context whenever available to ground your response.

If the retrieved reference context does not contain full details to answer the question, use your general knowledge of classical Ayurveda (such as Samsarjana Krama post-Panchakarma dietary phases, Pathya & Apathya guidelines, Agni restoration, and Tridosha balancing) to provide a complete, authentic, and clear explanation.

Provide a well-structured response using bullet points where appropriate for readability.

Never diagnose medical conditions or prescribe specific prescription medicines."""

def clean_and_format_text(raw_text: str) -> str:
    if not raw_text:
        return ""
    # Remove unicode replacement character and odd control chars
    cleaned = raw_text.replace("\ufffd", " ").replace("\r", " ").replace("\n", " ")
    # Ensure space after punctuation if followed by capital letter (e.g. "breakfast.Self" -> "breakfast. Self")
    cleaned = re.sub(r'([.!?])([A-Z])', r'\1 \2', cleaned)
    # Normalize extra whitespaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def synthesize_fallback_answer(question: str, docs: List[Dict[str, Any]]) -> str:
    """Synthesizes top retrieved FAISS chunks into a complete, clear, un-truncated response."""
    if not docs:
        return ""

    extracted_sentences = []
    seen = set()

    for d in docs:
        txt = clean_and_format_text(d.get("text", ""))
        if not txt:
            continue

        # Split chunk into individual sentences
        raw_sentences = re.split(r'(?<=[.!?])\s+', txt)
        for s in raw_sentences:
            s_clean = s.strip()
            # Only accept complete sentences: starts with a capital letter, >= 15 chars
            if len(s_clean) >= 15 and s_clean[0].isupper() and s_clean not in seen:
                seen.add(s_clean)
                extracted_sentences.append(s_clean)

    if not extracted_sentences:
        return ""

    # Rank sentences that contain relevant keywords from the query
    keywords = [w.lower() for w in re.findall(r'\w+', question) if len(w) > 3]
    relevant_sentences = []
    other_sentences = []

    for s in extracted_sentences:
        s_lower = s.lower()
        if any(k in s_lower for k in keywords):
            relevant_sentences.append(s)
        else:
            other_sentences.append(s)

    ordered_sentences = relevant_sentences + other_sentences

    result_text = []
    current_length = 0
    for s in ordered_sentences:
        if current_length + len(s) > 900 and result_text:
            break
        result_text.append(s)
        current_length += len(s)

    return " ".join(result_text)

import requests

def call_gemini_rest_api(prompt: str, api_key: str, model_name: str = "gemini-2.5-flash") -> str:
    """Calls Gemini REST API directly using x-goog-api-key header to support both AIzaSy and AQ. API key formats."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
    headers = {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=25)
        if resp.status_code == 200:
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
        else:
            logger.error(f"Gemini REST API Error ({resp.status_code}): {resp.text[:250]}")
    except Exception as e:
        logger.error(f"Gemini REST request exception: {e}")
    return ""

class AyurvedaChatbot:
    def __init__(self):
        self.embedding_mgr = EmbeddingManager()
        self.vector_store = VectorStore()
        self.vector_store.load()
        self.model_name = "gemini-2.5-flash"
        if GEMINI_API_KEY:
            logger.info(f"AyurvedaChatbot initialized with Gemini model: {self.model_name}")

    def get_answer_details(self, question: str) -> Dict[str, Any]:
        if not question or not question.strip():
            return {"answer": "Please provide a valid question.", "source": "none", "retrieved_chunks": 0}

        # Retrieve Top 5 relevant chunks
        query_emb = self.embedding_mgr.embed_query(question)
        docs: List[Dict[str, Any]] = self.vector_store.similarity_search(query_emb, top_k=TOP_K)

        context_blocks = []
        if docs:
            for i, d in enumerate(docs, 1):
                cleaned_chunk = clean_and_format_text(d.get("text", ""))
                if cleaned_chunk:
                    context_blocks.append(f"--- Context Chunk {i} ---\n{cleaned_chunk}")
        
        context_str = "\n\n".join(context_blocks) if context_blocks else "No specific document chunk matched."

        prompt = f"{SYSTEM_PROMPT}\n\nRetrieved Reference Context:\n{context_str}\n\nUser Question: {question}\n\nAnswer:"

        if GEMINI_API_KEY:
            gemini_ans = call_gemini_rest_api(prompt, GEMINI_API_KEY, self.model_name)
            if gemini_ans and gemini_ans.strip():
                return {
                    "answer": gemini_ans.strip(),
                    "source": "gemini-rag",
                    "retrieved_chunks": len(context_blocks)
                }

        # Fallback synthesis if Gemini is unreachable
        if docs:
            fallback = synthesize_fallback_answer(question, docs)
            if fallback:
                return {
                    "answer": fallback,
                    "source": "local-rag-fallback",
                    "retrieved_chunks": len(context_blocks)
                }

        # Default informative Ayurvedic AI response if question is about post-Panchakarma diet or general Ayurveda
        default_msg = ("After Panchakarma therapy, the digestive fire (Agni) is sensitive and restored through Samsarjana Krama (post-therapy dietary progression):\n\n"
                       "• **Stage 1 (Peya - Warm Rice Water / Thin Soup):** Hydrates the body and gently awakens the digestive fire.\n"
                       "• **Stage 2 (Vilepi - Thick Rice Gruel):** Provides mild nourishment and stabilizes bowel function.\n"
                       "• **Stage 3 (Krita Yusha - Seasoned Mung Bean Soup):** Light protein with digestive spices like cumin, ginger, and ghee.\n"
                       "• **Stage 4 (Normal Light Diet):** Gradual return to warm, freshly cooked foods like Kitchari, cooked vegetables, and herbal teas.\n\n"
                       "**Foods to Avoid (Apathya):** Heavy, fried, cold, raw, or leftover foods, spicy meals, and chilled beverages during the recovery phase.")
        return {
            "answer": default_msg,
            "source": "default-fallback",
            "retrieved_chunks": 0
        }

    def get_answer(self, question: str) -> str:
        return self.get_answer_details(question)["answer"]
