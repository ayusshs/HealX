import os
import sys

# Ensure backend root is in import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))

from app.ai.rag.embeddings import embeddings_model
from app.ai.rag.vector_store import VectorStore

def build_knowledge_index(knowledge_dir='knowledge', index_path='trained_models/rag_index.json'):
    print(f"Crawling knowledge files under '{knowledge_dir}'...")
    store = VectorStore()
    
    if not os.path.exists(knowledge_dir):
        print(f"Knowledge directory '{knowledge_dir}' does not exist!")
        return False
        
    chunks = []
    metadata_list = []
    
    # Read files recursively
    for root, dirs, files in os.walk(knowledge_dir):
        for file in files:
            if file.endswith('.txt') or file.endswith('.md'):
                file_path = os.path.join(root, file)
                category = os.path.basename(root)
                print(f"Indexing file: {file_path}")
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        text = f.read()
                        
                    # Simple sliding-window chunking
                    # Chunk size = 400 chars, overlap = 100 chars
                    chunk_size = 400
                    overlap = 100
                    
                    i = 0
                    while i < len(text):
                        chunk = text[i:i+chunk_size].strip()
                        if len(chunk) > 30: # ignore tiny fragments
                            chunks.append(chunk)
                            metadata_list.append({
                                'source': file,
                                'category': category,
                                'chunk_index': len(chunks) - 1
                            })
                        i += (chunk_size - overlap)
                except Exception as e:
                    print(f"Error reading file {file_path}: {e}")
                    
    if not chunks:
        print("No text chunks found to index!")
        return False
        
    print(f"Generating embeddings for {len(chunks)} text chunks...")
    # Generate embeddings in batch
    try:
        embeddings = embeddings_model.embed(chunks)
    except Exception as e:
        print(f"Failed to generate embeddings: {e}")
        return False
        
    for chunk, emb, meta in zip(chunks, embeddings, metadata_list):
        store.add(chunk, emb, meta)
        
    # Save index
    os.makedirs(os.path.dirname(index_path), exist_ok=True)
    store.save(index_path)
    print(f"Saved RAG index database to {index_path}!")
    return True

if __name__ == '__main__':
    build_knowledge_index()
