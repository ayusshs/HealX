import os
import json

class VectorStore:
    def __init__(self):
        self.documents = []
        
    def add(self, text, embedding, metadata=None):
        self.documents.append({
            'text': text,
            'embedding': embedding,
            'metadata': metadata or {}
        })
        
    def save(self, filepath):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(self.documents, f)
            
    def load(self, filepath):
        if not os.path.exists(filepath):
            self.documents = []
            return False
        with open(filepath, 'r') as f:
            self.documents = json.load(f)
        return True
        
    def search(self, query_embedding, top_k=3):
        if not self.documents:
            return []
            
        results = []
        # Query embedding is a list of floats
        q_mag = sum(x**2 for x in query_embedding)**0.5
        
        for doc in self.documents:
            doc_emb = doc['embedding']
            # Calculate cosine similarity
            dot_product = sum(a * b for a, b in zip(query_embedding, doc_emb))
            d_mag = sum(x**2 for x in doc_emb)**0.5
            
            similarity = 0.0
            if q_mag > 0 and d_mag > 0:
                similarity = dot_product / (q_mag * d_mag)
                
            results.append({
                'text': doc['text'],
                'metadata': doc['metadata'],
                'similarity': similarity
            })
            
        # Sort descending by similarity
        results = sorted(results, key=lambda x: x['similarity'], reverse=True)
        return results[:top_k]
