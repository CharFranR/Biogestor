from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Fill
from .serializers import FillSerializer


class FillViewSet(viewsets.ModelViewSet):
    queryset = Fill.objects.all()
    serializer_class = FillSerializer

    @action(detail=True, methods=['post'])
    def end_fill(self, request, pk=None):
        active_fill = get_object_or_404(Fill, last_day = None)
        active_fill.last_day = timezone.now().date()
        active_fill.save()

        serializer = FillSerializer(active_fill)

        return Response (serializer.data)
