from rest_framework import serializers
from .models import items, place

class placeSerializer(serializers.ModelSerializer):
    class Meta:
        model = place
        fields = ['id','name']

class itemsSerializer(serializers.ModelSerializer):

    class Meta:
        model = items
        fields = ['id','name','measurement','quantity','place', 'description']