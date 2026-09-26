from chatbot import AyurvedaChatbot

if __name__ == "__main__":
    print("Testing AyurvedaChatbot RAG...")
    chatbot = AyurvedaChatbot()
    q = "What is Abhyanga?"
    res = chatbot.get_answer_details(q)
    print(f"\nQuestion: {q}")
    print(f"Source: {res['source']} (Retrieved chunks: {res['retrieved_chunks']})")
    print(f"Answer:\n{res['answer']}\n")
