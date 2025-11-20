from rest_framework import serializers
from .models import items

class itemsSerializer(serializers.ModelSerializer):
    model = items
    fields = ['id','name','quantity','area']