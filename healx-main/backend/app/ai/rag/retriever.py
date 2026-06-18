import os
from app.ai.rag.embeddings import embeddings_model
from app.ai.rag.vector_store import VectorStore

class Retriever:
    def __init__(self, index_path=None):
        if index_path is None:
            # Resolve relative to app/ai/rag/retriever.py
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
            self.index_path = os.path.join(base_dir, 'trained_models', 'rag_index.json')
        else:
            self.index_path = index_path
        self.store = VectorStore()
        self.load_index()
        
    def load_index(self):
        if os.path.exists(self.index_path):
            try:
                self.store.load(self.index_path)
                print(f"Successfully loaded RAG vector index from {self.index_path} (docs size: {len(self.store.documents)})")
            except Exception as e:
                print(f"Error loading RAG vector index: {e}")
                
    def retrieve(self, query, top_k=3):
        # Auto-reload if index exists and store is empty
        if not self.store.documents and os.path.exists(self.index_path):
            self.load_index()
            
        if not self.store.documents:
            print("RAG index is empty. No documents to search.")
            return []
            
        try:
            # Embed query
            query_emb = embeddings_model.embed([query])[0]
            # Search vector store
            matches = self.store.search(query_emb, top_k=top_k)
            return matches
        except Exception as e:
            print(f"Error during RAG retrieval: {e}")
            return []

# Single global instance
retriever = Retriever()
