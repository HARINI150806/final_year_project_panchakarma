import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from loader import build_knowledge_base
from chatbot import AyurvedaChatbot
from config import FAISS_INDEX_PATH

logger = logging.getLogger("rag_service")
logging.basicConfig(level=logging.INFO)

chatbot_instance = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global chatbot_instance
    logger.info("Initializing Ayurveda RAG FastAPI Service...")
    
    # Check if vector index exists; if not, build it automatically
    if not FAISS_INDEX_PATH.exists():
        logger.info("FAISS index not found. Building RAG Knowledge Base...")
        try:
            build_knowledge_base()
        except Exception as e:
            logger.error(f"Error building knowledge base on startup: {e}")
            
    chatbot_instance = AyurvedaChatbot()
    logger.info("Ayurveda RAG Service Startup Complete.")
    yield
    logger.info("Shutting down Ayurveda RAG Service...")

app = FastAPI(
    title="Ayurveda AI Assistant RAG Service",
    description="Independent RAG service for Ayurveda knowledge queries using FastAPI, FAISS, and Gemini API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from predictor import predict_recovery_xgboost

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str
    source: str = "gemini-rag"
    retrieved_chunks: int = 0

from typing import Optional

class PredictRequest(BaseModel):
    age: int = 35
    gender: str = "FEMALE"
    therapy_type: str = "Abhyanga"
    medical_condition: Optional[str] = "None"
    session_number: int = 1
    total_sessions: int = 7
    pain_level: int = 5
    sleep_quality: int = 6
    energy_level: int = 6
    overall_condition: int = 7
    current_recovery_percentage: Optional[float] = 47.0

class PredictResponse(BaseModel):
    predicted_final_recovery: float
    predicted_current_recovery: Optional[float] = None
    model_version: str
    status: str

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Ayurveda RAG Service"}

@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    global chatbot_instance
    if not request.question or not request.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question field cannot be empty."
        )

    try:
        if chatbot_instance is None:
            chatbot_instance = AyurvedaChatbot()

        res_details = chatbot_instance.get_answer_details(request.question)
        logger.info(f"Chat answer generated via source: '{res_details['source']}' ({res_details['retrieved_chunks']} FAISS chunks grounded)")
        return ChatResponse(**res_details)
    except Exception as e:
        logger.error(f"Error processing chat request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while retrieving answer: {str(e)}"
        )

@app.post("/api/predict-recovery", response_model=PredictResponse)
def predict_recovery_endpoint(request: PredictRequest):
    try:
        res = predict_recovery_xgboost(
            age=request.age,
            gender=request.gender,
            therapy_type=request.therapy_type,
            medical_condition=request.medical_condition or "None",
            session_number=request.session_number,
            total_sessions=request.total_sessions,
            pain_level=request.pain_level,
            sleep_quality=request.sleep_quality,
            energy_level=request.energy_level,
            overall_condition=request.overall_condition,
            current_recovery_percentage=request.current_recovery_percentage
        )
        return PredictResponse(**res)
    except Exception as e:
        logger.error(f"Error executing XGBoost recovery prediction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
