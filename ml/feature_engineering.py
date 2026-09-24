"""
MeetMux Control Tower — ML Feature Engineering Pipeline
Extracts & pre-processes 14 operational telemetry features for XGBoost model inference & training.
"""

import pandas as pd
import numpy as np

FEATURE_COLUMNS = [
    'shipment_distance',
    'current_speed',
    'average_speed',
    'temperature',
    'humidity',
    'route_congestion',
    'historical_delay_rate',
    'number_of_stops',
    'warehouse_load',
    'vehicle_age',
    'previous_route_delays',
    'time_of_day',
    'day_of_week',
    'weather_severity',
    'priority_level'
]

PRIORITY_MAP = {
    'STANDARD': 1,
    'EXPRESS': 2,
    'CRITICAL_SLA': 3
}

def extract_features(df_or_dict):
    """
    Transforms raw JSON shipment payload or DataFrame into model-ready numpy array / DataFrame.
    """
    if isinstance(df_or_dict, dict):
        df = pd.DataFrame([df_or_dict])
    elif isinstance(df_or_dict, list):
        df = pd.DataFrame(df_or_dict)
    else:
        df = df_or_dict.copy()

    # Map categorical fields
    if 'priority' in df.columns:
        df['priority_level'] = df['priority'].map(lambda x: PRIORITY_MAP.get(str(x).upper(), 1))
    elif 'priority_level' not in df.columns:
        df['priority_level'] = 1

    # Fill default values for missing columns
    defaults = {
        'shipment_distance': 150.0,
        'current_speed': 45.0,
        'average_speed': 50.0,
        'temperature': 25.0,
        'humidity': 60.0,
        'route_congestion': 0.3,
        'historical_delay_rate': 0.15,
        'number_of_stops': 2,
        'warehouse_load': 0.65,
        'vehicle_age': 3,
        'previous_route_delays': 1,
        'time_of_day': 14,
        'day_of_week': 2,
        'weather_severity': 3
    }

    for col, default_val in defaults.items():
        if col not in df.columns:
            df[col] = default_val
        else:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(default_val)

    X = df[FEATURE_COLUMNS].copy()
    return X
