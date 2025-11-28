from rest_framework import viewsets
from .models import Calibration
from .serializers import CalibrationSerializer

class CalibrationViewSet(viewsets.ModelViewSet):
    queryset = Calibration.objects.all()
    serializer_class = CalibrationSerializer