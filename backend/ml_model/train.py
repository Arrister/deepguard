import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

# Define column names for NSL-KDD
COLUMNS = [
    "duration", "protocol_type", "service", "flag", "src_bytes", "dst_bytes",
    "land", "wrong_fragment", "urgent", "hot", "num_failed_logins",
    "logged_in", "num_compromised", "root_shell", "su_attempted", "num_root",
    "num_file_creations", "num_shells", "num_access_files", "num_outbound_cmds",
    "is_host_login", "is_guest_login", "count", "srv_count", "serror_rate",
    "srv_serror_rate", "rerror_rate", "srv_rerror_rate", "same_srv_rate",
    "diff_srv_rate", "srv_diff_host_rate", "dst_host_count", "dst_host_srv_count",
    "dst_host_same_srv_rate", "dst_host_diff_srv_rate", "dst_host_same_src_port_rate",
    "dst_host_srv_diff_host_rate", "dst_host_serror_rate", "dst_host_srv_serror_rate",
    "dst_host_rerror_rate", "dst_host_srv_rerror_rate", "label", "difficulty"
]

def load_data(path):
    print(f"Loading data from {path}...")
    df = pd.read_csv(path, names=COLUMNS, index_col=False)
    return df

def preprocess_data(df):
    print("Preprocessing data...")
    # Drop difficulty column as it's not needed for detection
    if 'difficulty' in df.columns:
        df = df.drop('difficulty', axis=1)

    # Encode categorical features
    categorical_cols = ['protocol_type', 'service', 'flag']
    encoders = {}
    
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le

    # Encode label (normal vs attack)
    # We will treat everything not 'normal' as 'attack' for binary classification
    # Or we can do multi-class. For IDS, binary is often a good start.
    # Let's do binary first: normal=0, attack=1
    df['label'] = df['label'].apply(lambda x: 0 if x == 'normal' else 1)
    
    return df, encoders

def train_model():
    data_path = "../data/KDDTrain+.txt"
    if not os.path.exists(data_path):
        print(f"Error: Data file not found at {data_path}")
        return

    df = load_data(data_path)
    df, encoders = preprocess_data(df)

    X = df.drop('label', axis=1)
    y = df['label']

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train model
    print("Training Gradient Boosting model (this may take a while)...")
    # Using GradientBoostingClassifier for better accuracy
    clf = GradientBoostingClassifier(n_estimators=200, learning_rate=0.1, max_depth=5, random_state=42)
    clf.fit(X_train, y_train)

    # Evaluate
    print("Evaluating model...")
    y_pred = clf.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, y_pred)}")
    print(classification_report(y_test, y_pred))

    # Save artifacts
    print("Saving model and encoders...")
    os.makedirs("saved_models", exist_ok=True)
    joblib.dump(clf, "saved_models/rf_model.pkl")
    joblib.dump(encoders, "saved_models/encoders.pkl")
    
    # Also save column names for inference to ensure order
    joblib.dump(list(X.columns), "saved_models/columns.pkl")
    print("Done!")

if __name__ == "__main__":
    train_model()
