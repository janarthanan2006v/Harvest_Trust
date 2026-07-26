import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix

def train_model():
    print("Training attention classifier...")
    # Load dataset
    data_path = 'data/demo_history.csv'
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Missing training data at {data_path}. Please run generate_demo_history.py first.")
    
    df = pd.read_csv(data_path)

    # 1. Define pre-outcome features and target
    target = 'neededAttention'
    
    # Feature columns
    num_features = [
        'quantity', 'ratePerUnit', 'grossAmount', 'moisturePercent',
        'hourOfDay', 'dayOfWeek', 'qtyDiffFromAvg', 'rateDiffFromMedian',
        'priorAttentionCount', 'priorDeliveriesCount', 'hasNotes'
    ]
    cat_features = ['produceCode', 'collectionPointCode', 'qualityGrade']
    
    features = num_features + cat_features

    # Leakage Check: verify target is not in features
    assert target not in features, "Feature leakage detected! Target variable is included in features."
    
    X = df[features]
    y = df[target]

    print(f"Total samples: {len(df)}")
    print(f"Features: {features}")
    print(f"Class distribution: {y.value_counts(normalize=True).to_dict()}")

    # 2. Split dataset
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 3. Create Preprocessing Pipeline
    num_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value=0)),
        ('scaler', StandardScaler())
    ])

    cat_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='UNKNOWN')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_transformer, num_features),
            ('cat', cat_transformer, cat_features)
        ]
    )

    # 4. Define model pipeline
    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42, max_depth=6))
    ])

    # 5. Fit the model
    model_pipeline.fit(X_train, y_train)
    print("Model training complete.")

    # 6. Evaluate model
    y_pred = model_pipeline.predict(X_test)
    y_prob = model_pipeline.predict_proba(X_test)[:, 1]

    print("\n--- Model Evaluation ---")
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Save model artifact
    os.makedirs('model', exist_ok=True)
    model_file = 'model/attention_model.joblib'
    joblib.dump(model_pipeline, model_file)
    print(f"Saved model pipeline to {model_file}")

    # Generate metadata report
    import json
    metadata = {
        "modelVersion": "v1.0.0",
        "modelName": "HarvestTrust Attention Classifier",
        "algorithm": "RandomForestClassifier",
        "confidenceThreshold": 0.65,
        "features": features,
        "metrics": {
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "class_distribution": y.value_counts().to_dict(),
        }
    }
    with open('model/metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    print("Metadata report written to model/metadata.json")

if __name__ == '__main__':
    train_model()
