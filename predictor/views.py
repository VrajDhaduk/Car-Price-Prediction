import json
from datetime import date

import pandas as pd
from django.apps import apps
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST


def home(request):
    return render(request, "predictor/home.html", {"active": "home"})


def demo(request):
    return render(request, "predictor/demo.html", {"active": "demo"})


def insights(request):
    return render(request, "predictor/insights.html", {"active": "insights"})


def stack(request):
    return render(request, "predictor/stack.html", {"active": "stack"})


def about(request):
    return render(request, "predictor/about.html", {"active": "about"})


@require_POST
@csrf_protect
def predict_price(request):
    try:
        data = json.loads(request.body)

        config = apps.get_app_config("predictor")
        model = config.model
        encoders = config.encoders

        year = int(data["year"])
        current_year = date.today().year

        row = {
            "Brand": encoders["Brand"].transform([data["brand"]])[0],
            "Model": encoders["Model"].transform([data["model"]])[0],
            "Year": year,
            "Age": current_year - year,
            "KM_Driven": int(data["km_driven"]),
            "Fuel_Type": encoders["Fuel_Type"].transform([data["fuel_type"]])[0],
            "Transmission": encoders["Transmission"].transform([data["transmission"]])[0],
            "Owner": encoders["Owner"].transform([data["owner"]])[0],
            "City": encoders["City"].transform([data["city"]])[0],
        }

        input_df = pd.DataFrame([row])[model.feature_names_in_]
        prediction = float(model.predict(input_df)[0])
        prediction = max(prediction, 20000)  # floor so junk input can't return negative/near-zero

        return JsonResponse({
            "price": round(prediction),
            "low": round(prediction * 0.91),
            "high": round(prediction * 1.09),
        })

    except KeyError as e:
        return JsonResponse({"error": f"Missing field: {e}"}, status=400)
    except ValueError as e:
        # Raised by LabelEncoder.transform() when a value wasn't seen during training
        return JsonResponse({"error": f"Unrecognised value — {e}"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)