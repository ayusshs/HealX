import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

def train_feedback_model():
    print("Generating synthetic feedback corpus...")
    # Corpus of typical patient reviews
    reviews = [
        # Positive
        ("Very friendly doctors and staff, highly recommended!", "positive"),
        ("The treatment was excellent and the clinic was clean.", "positive"),
        ("Booking an appointment was quick and simple, good job.", "positive"),
        ("Dr Ramesh was very professional and patient with me.", "positive"),
        ("Wait times were minimal and staff was polite.", "positive"),
        
        # Neutral
        ("The consultation was okay, nothing special.", "neutral"),
        ("Average service, waited 20 minutes before getting called.", "neutral"),
        ("The billing process took some time, but it was resolved.", "neutral"),
        ("Standard checkup. Doctor was in a rush.", "neutral"),
        ("Clean rooms but parking is difficult.", "neutral"),
        
        # Negative
        ("Horrible experience. Waited 2 hours past my slot!", "negative"),
        ("The billing department charged me twice and refused to refund.", "negative"),
        ("The doctor was extremely rude and dismissive of my pain.", "negative"),
        ("Very dirty waiting rooms, dust everywhere.", "negative"),
        ("Complete waste of time. Doctor did not show up.", "negative")
    ]
    
    # Expand dataset with modifications for training robustness
    expanded_reviews = []
    for text, label in reviews:
        expanded_reviews.append((text, label))
        expanded_reviews.append((text.lower(), label))
        expanded_reviews.append((text + " Thank you.", label))
        expanded_reviews.append((text + " Not satisfied.", label if label == 'negative' else 'neutral'))
        
    texts = [r[0] for r in expanded_reviews]
    labels = [r[1] for r in expanded_reviews]
    
    # Create training pipeline: TF-IDF vectorizer + Naive Bayes Classifier
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
        ('nb', MultinomialNB(alpha=1.0))
    ])
    
    print("Training Naive Bayes Sentiment Classifier...")
    pipeline.fit(texts, labels)
    
    # Save the pipeline
    os.makedirs('trained_models', exist_ok=True)
    joblib.dump(pipeline, 'trained_models/feedback_sentiment_model.joblib')
    print("Saved feedback sentiment model to trained_models/feedback_sentiment_model.joblib")
    return True

if __name__ == '__main__':
    train_feedback_model();
