from rest_framework import serializers
from .models import items, place

class itemsSerializer(serializers.ModelSerializer):
    model = items
    fields = ['id','name','quantity','area']

class placeSerializer(serializers.ModelSerializer):
    model = place
    field = ['name']