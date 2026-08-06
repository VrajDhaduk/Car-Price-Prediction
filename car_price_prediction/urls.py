"""
URL configuration for car_price_prediction project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path
from predictor import views

urlpatterns = [
    path("", views.home, name="home"),
    path("demo/", views.demo, name="demo"),
    path("insights/", views.insights, name="insights"),
    path("stack/", views.stack, name="stack"),
    path("about/", views.about, name="about"),
    path("predict/", views.predict_price, name="predict-price"),
]