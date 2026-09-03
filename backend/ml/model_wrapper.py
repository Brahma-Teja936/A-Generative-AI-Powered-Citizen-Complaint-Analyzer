class XGBoostModelWrapper:
    """
    Wrapper to bundle XGBClassifier and LabelEncoder for clean end-to-end
    predict and predict_proba with original string class labels.
    """
    def __init__(self, model, label_encoder):
        self.model = model
        self.label_encoder = label_encoder
        self.classes_ = label_encoder.classes_

    def predict(self, X):
        numeric_preds = self.model.predict(X)
        return self.label_encoder.inverse_transform(numeric_preds)

    def predict_proba(self, X):
        return self.model.predict_proba(X)
