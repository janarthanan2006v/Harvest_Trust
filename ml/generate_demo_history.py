import pandas as pd
import numpy as np
import os

def generate_data():
    print("Generating synthetic historical deliveries...")
    np.random.seed(42)
    n_samples = 400

    # Categorical arrays
    produce_codes = ['PDY', 'GNT', 'MZE', 'TOM', 'BNN', 'CTN', 'MLK', 'PLS']
    collection_points = ['CPE', 'CPW', 'CPN']
    grades = ['A', 'B', 'C']

    # Baseline rates
    base_rates = {
        'PDY': 22.5, 'GNT': 68.0, 'MZE': 21.0, 'TOM': 15.0,
        'BNN': 25.0, 'CTN': 72.0, 'MLK': 35.0, 'PLS': 85.0
    }

    data = []
    for i in range(n_samples):
        prod = np.random.choice(produce_codes)
        cp = np.random.choice(collection_points)
        grade = np.random.choice(grades)

        # Quantity depends on produce
        if prod == 'MLK':
            qty = round(float(np.random.exponential(scale=15) + 2), 2)
        elif prod == 'TOM':
            qty = round(float(np.random.exponential(scale=8) + 1), 2)
        else:
            qty = round(float(np.random.uniform(20, 450)), 2)

        # Rate based on grade
        rate_modifier = 1.0
        if grade == 'B':
            rate_modifier = 0.9
        elif grade == 'C':
            rate_modifier = 0.8
        
        base_rate = base_rates[prod]
        rate = round(base_rate * rate_modifier * np.random.uniform(0.95, 1.05), 2)
        gross = round(qty * rate, 2)

        # Moisture for grains
        moisture = None
        if prod in ['PDY', 'MZE']:
            moisture = round(float(np.random.uniform(10.0, 24.0)), 1)

        hour = int(np.random.choice(list(range(6, 22))))
        day_of_week = int(np.random.choice(list(range(7))))

        # Running features (simulated history)
        prior_deliveries = int(np.random.negative_binomial(n=5, p=0.3))
        prior_att = int(np.random.binomial(n=prior_deliveries, p=0.15)) if prior_deliveries > 0 else 0

        avg_qty = qty * np.random.uniform(0.7, 1.3)
        qty_diff = round(qty - avg_qty, 2)

        median_rate = base_rate * rate_modifier
        rate_diff = round(rate - median_rate, 2)

        has_notes = int(np.random.choice([0, 1], p=[0.85, 0.15]))

        # Define target logic based on rules
        needed_attention = False
        prob = 0.05  # baseline noise

        # Anomaly rules
        if moisture is not None and moisture > 18.0:
            prob += 0.80
        if qty > 380 and grade == 'C':
            prob += 0.75
        if hour < 7 or hour > 19:
            prob += 0.65
        if rate_diff > 5.0:
            prob += 0.70
        if has_notes == 1 and np.random.rand() > 0.3:
            prob += 0.60

        needed_attention = np.random.rand() < prob

        data.append({
            'produceCode': prod,
            'collectionPointCode': cp,
            'quantity': qty,
            'ratePerUnit': rate,
            'grossAmount': gross,
            'qualityGrade': grade,
            'moisturePercent': moisture,
            'hourOfDay': hour,
            'dayOfWeek': day_of_week,
            'qtyDiffFromAvg': qty_diff,
            'rateDiffFromMedian': rate_diff,
            'priorAttentionCount': prior_att,
            'priorDeliveriesCount': prior_deliveries,
            'hasNotes': has_notes,
            'neededAttention': 1 if needed_attention else 0
        })

    df = pd.DataFrame(data)

    # Save directory
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/demo_history.csv', index=False)
    print(f"Dataset generated with {len(df)} samples.")
    print("Class distribution:")
    print(df['neededAttention'].value_counts())

if __name__ == '__main__':
    generate_data()
