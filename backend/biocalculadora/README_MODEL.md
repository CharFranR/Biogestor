# Modelo Matemático del Biodigestor de Bolsa (Tubular)

## Introducción

Este documento describe el modelo matemático utilizado para estimar la producción de biogás en biodigestores de bolsa (tubulares), basado en literatura científica y experiencia práctica con este tipo de reactores.

## Referencias Bibliográficas

1. **Garfí, M., Ferrer-Martí, L., Velo, E., & Ferrer, I. (2012)**. "Evaluating benefits of low-cost household digesters for rural Andean communities". *Renewable and Sustainable Energy Reviews*, 16(1), 575-581.

2. **Martí-Herrero, J., & Cipriano, J. (2012)**. "Design methodology for low cost tubular digesters". *Bioresource Technology*, 108, 21-27.

3. **Garfí, M., Gelman, P., Comas, J., Carrasco, W., & Ferrer, I. (2011)**. "Agricultural reuse of the digestate from low-cost tubular digesters in rural Andean communities". *Waste Management*, 31(12), 2584-2589.

4. **Lansing, S., Botero, R. B., & Martin, J. F. (2008)**. "Waste treatment and biogas quality in small-scale agricultural digesters". *Bioresource Technology*, 99(13), 5881-5890.

5. **Ferrer, I., Gamiz, M., Almeida, M., & Ruiz, A. (2009)**. "Pilot project of biogas production from pig manure and urine mixture at ambient temperature in Ventanilla (Lima, Peru)". *Waste Management*, 29(1), 168-173.

## Características de Biodigestores de Bolsa

Los biodigestores de bolsa (también llamados tubulares o de manga) tienen características específicas que los diferencian de otros tipos:

### Ventajas
- Bajo costo de construcción e instalación
- Fácil operación y mantenimiento
- Adecuados para climas cálidos y templados
- Tiempo de retención hidráulica (HRT) flexible
- Adaptables a diferentes escalas

### Limitaciones
- Sensibles a variaciones de temperatura
- Requieren protección contra daños físicos
- Vida útil limitada del material (5-10 años)
- Menor eficiencia en climas fríos sin calefacción

## Parámetros del Modelo

### 1. Producción de Metano (Y)

El rendimiento de metano varía según el tipo de sustrato:

| Sustrato | Y (m³ CH₄/kg SV) | Rango | Fuente |
|----------|------------------|-------|---------|
| Estiércol bovino | 0.20-0.30 | 0.25 ± 0.05 | Garfí et al. (2011) |
| Estiércol porcino | 0.25-0.35 | 0.30 ± 0.05 | Lansing et al. (2008) |
| Residuos vegetales | 0.15-0.25 | 0.20 ± 0.05 | Ferrer et al. (2009) |

**Valores implementados:**
```python
"bovino": {"Y": 0.25}   # m³ CH₄/kg SV
"porcino": {"Y": 0.30}  # m³ CH₄/kg SV  
"vegetal": {"Y": 0.20}  # m³ CH₄/kg SV
```

### 2. Fracción de Metano (fCH₄)

La composición del biogás en biodigestores de bolsa:

| Componente | Porcentaje típico | Rango |
|------------|-------------------|-------|
| Metano (CH₄) | 55-65% | 50-70% |
| Dióxido de carbono (CO₂) | 30-40% | 25-45% |
| Otros gases | 1-5% | 0-10% |

**Valores implementados:**
```python
"bovino": {"fCH4": 0.60}   # 60% metano
"porcino": {"fCH4": 0.62}  # 62% metano
"vegetal": {"fCH4": 0.55}  # 55% metano
```

### 3. Fase de Latencia (lag)

Tiempo inicial antes del inicio de producción significativa de biogás:

| Sustrato | lag (días) | Notas |
|----------|------------|-------|
| Estiércol bovino | 2-4 | Mayor si el material está fresco |
| Estiércol porcino | 1-3 | Inicio más rápido |
| Residuos vegetales | 3-5 | Requiere más tiempo de adaptación |

**Valores implementados:**
```python
"bovino": {"lag": 2.5}   # días
"porcino": {"lag": 2.0}  # días
"vegetal": {"lag": 3.0}  # días
```

### 4. Tasa Máxima de Crecimiento (μ_max)

Velocidad máxima de crecimiento microbiano:

| Sustrato | μ_max (día⁻¹) | Condiciones |
|----------|---------------|-------------|
| Estiércol bovino | 0.20-0.30 | T = 35°C |
| Estiércol porcino | 0.25-0.35 | T = 35°C |
| Residuos vegetales | 0.15-0.25 | T = 35°C |

**Valores implementados:**
```python
"bovino": {"mu_max_ref": 0.25}   # día⁻¹ a 35°C
"porcino": {"mu_max_ref": 0.30}  # día⁻¹ a 35°C
"vegetal": {"mu_max_ref": 0.20}  # día⁻¹ a 35°C
```

## Modelo de Gompertz Modificado

El modelo utiliza la ecuación de Gompertz modificada para describir la producción acumulada de biogás.

### Referencias Completas

1. Garfí, M., Ferrer-Martí, L., Velo, E., & Ferrer, I. (2012). Evaluating benefits of low-cost household digesters for rural Andean communities. Renewable and Sustainable Energy Reviews, 16(1), 575-581.

2. Martí-Herrero, J., & Cipriano, J. (2012). Design methodology for low cost tubular digesters. Bioresource Technology, 108, 21-27.

---

**Última actualización:** 2025-01-15
**Versión del modelo:** 2.0
**Autores:** Equipo Biogestor ULSA
