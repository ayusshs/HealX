class EmbeddingsModel:
    def __init__(self):
        self.model = None
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            print("Loaded SentenceTransformer ('all-MiniLM-L6-v2') successfully!")
        except Exception as e:
            print(f"SentenceTransformer load failed: {e}. Falling back to simple keyword matching embeddings.")
            self.model = None

    def embed(self, texts):
        if isinstance(texts, str):
            texts = [texts]
            
        if self.model:
            try:
                embeddings = self.model.encode(texts)
                return [list(map(float, emb)) for emb in embeddings]
            except Exception as e:
                print(f"Error encoding with SentenceTransformer: {e}. Using fallback.")
                
        # Fallback bag-of-words embedding (384 dimensions)
        import hashlib
        embeddings = []
        for text in texts:
            emb = [0.0] * 384
            words = text.lower().split()
            if not words:
                embeddings.append(emb)
                continue
            for w in words:
                h = int(hashlib.md5(w.encode('utf-8')).hexdigest(), 16) % 384
                emb[h] += 1.0
            # Normalize
            mag = sum(x**2 for x in emb)**0.5
            if mag > 0:
                emb = [x / mag for x in emb]
            embeddings.append(emb)
        return embeddings

# Global singleton
embeddings_model = EmbeddingsModel()
