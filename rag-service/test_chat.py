from chatbot import AyurvedaChatbot

if __name__ == "__main__":
    print("Testing AyurvedaChatbot RAG...")
    chatbot = AyurvedaChatbot()
    q = "What is Abhyanga?"
    ans = chatbot.get_answer(q)
    print(f"\nQuestion: {q}\nAnswer:\n{ans}\n")
