import os
import joblib
from django.apps import AppConfig
from django.conf import settings


class PredictorConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "predictor"

    # Populated once in ready(); shared by every request via apps.get_app_config()
    model = None
    encoders = {}

    def ready(self):
        print("Loading ML model...")

        ml_dir = os.path.join(settings.BASE_DIR, "predictor", "ml_model")
        print(ml_dir)

        PredictorConfig.model = joblib.load(
            os.path.join(ml_dir, "car_price_model.pkl")
        )

        print("Model loaded!")

        PredictorConfig.encoders = {
            "Brand": joblib.load(os.path.join(ml_dir, "Brand_encoder.pkl")),
            "Model": joblib.load(os.path.join(ml_dir, "Model_encoder.pkl")),
            "Fuel_Type": joblib.load(os.path.join(ml_dir, "Fuel_encoder.pkl")),
            "Transmission": joblib.load(os.path.join(ml_dir, "Transmission_encoder.pkl")),
            "Owner": joblib.load(os.path.join(ml_dir, "Owner_encoder.pkl")),
            "City": joblib.load(os.path.join(ml_dir, "City_encoder.pkl")),
        }

        print("Encoders loaded!")