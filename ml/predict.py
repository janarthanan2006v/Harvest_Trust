import sys
import os
import json
import joblib
import pandas as pd

def predict():
    try:
        # 1. Read input JSON from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "Empty input received"}))
            return

        features = json.loads(input_data)

        # 2. Path to model
        model_path = os.path.join(os.path.dirname(__file__), 'model', 'attention_model.joblib')
        if not os.path.exists(model_path):
            # Model not trained yet
            print(json.dumps({
                "predictedClass": None,
                "probability": 0.0,
                "confidenceThreshold": 0.65,
                "modelVersion": "unknown",
                "explanation": "Prediction model not found. Review normally.",
                "error": "MODEL_FILE_NOT_FOUND"
            }))
            return

        model = joblib.load(model_path)

        # 3. Reconstruct DataFrame matching features order in training
        input_df = pd.DataFrame([{
            'quantity': float(features.get('quantity', 0)),
            'ratePerUnit': float(features.get('ratePerUnit', 0)),
            'grossAmount': float(features.get('grossAmount', 0)),
            'moisturePercent': float(features['moisturePercent']) if features.get('moisturePercent') is not None else None,
            'hourOfDay': int(features.get('hourOfDay', 12)),
            'dayOfWeek': int(features.get('dayOfWeek', 0)),
            'qtyDiffFromAvg': float(features.get('qtyDiffFromAvg', 0)),
            'rateDiffFromMedian': float(features.get('rateDiffFromMedian', 0)),
            'priorAttentionCount': int(features.get('priorAttentionCount', 0)),
            'priorDeliveriesCount': int(features.get('priorDeliveriesCount', 0)),
            'hasNotes': int(features.get('hasNotes', 0)),
            'produceCode': str(features.get('produceCode', '')),
            'collectionPointCode': str(features.get('collectionPointCode', '')),
            'qualityGrade': str(features.get('qualityGrade', ''))
        }])

        # 4. Predict
        prob = float(model.predict_proba(input_df)[0][1])  # Probability of class 1 (ATTENTION)
        raw_class = "ATTENTION" if prob >= 0.5 else "NORMAL"
        
        # 5. Apply confidence threshold
        threshold = 0.65
        predicted_class = None
        if prob >= threshold:
            predicted_class = "ATTENTION"
        elif (1.0 - prob) >= threshold:
            predicted_class = "NORMAL"

        # 6. Generate human-readable explanation based on input features contribution
        reasons = []
        moisture = features.get('moisturePercent')
        qty = features.get('quantity', 0)
        grade = features.get('qualityGrade')
        hour = features.get('hourOfDay', 12)
        rate_diff = features.get('rateDiffFromMedian', 0)
        has_notes = features.get('hasNotes', 0)

        if moisture is not None and moisture > 18.0:
            reasons.append(f"High moisture content ({moisture}%) exceeds target safe threshold of 18%.")
        if qty > 380 and grade == 'C':
            reasons.append(f"High quantity delivery ({qty} {features.get('unit', 'kg')}) with low quality grade (C).")
        if hour < 7 or hour > 19:
            reasons.append(f"Recorded at {hour}:00, which is outside standard daytime hours (7:00 - 19:00).")
        if rate_diff > 5.0:
            reasons.append(f"Unit rate is ₹{rate_diff:.2f} higher than prior historical median.")
        if has_notes == 1:
            reasons.append("Operator added custom delivery notes.")

        if predicted_class == "ATTENTION":
            explanation = " | ".join(reasons) if reasons else "Flagged due to combinations of quantity and historical averages."
        elif predicted_class == "NORMAL":
            explanation = "All parameters lie within normal seasonal bounds."
        else:
            explanation = "Prediction confidence is below 65%. Review normally."

        # 7. Print output JSON
        result = {
            "predictedClass": predicted_class,
            "probability": prob if predicted_class == "ATTENTION" else (1.0 - prob if predicted_class == "NORMAL" else max(prob, 1.0 - prob)),
            "confidenceThreshold": threshold,
            "modelVersion": "v1.0.0",
            "explanation": explanation
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({
            "predictedClass": None,
            "probability": 0.0,
            "confidenceThreshold": 0.65,
            "modelVersion": "v1.0.0",
            "explanation": f"Prediction service error: {str(e)}",
            "error": "EXCEPTION"
        }))

if __name__ == '__main__':
    predict()
