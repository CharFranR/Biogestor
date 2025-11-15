import math
from typing import Dict, List, Tuple

e = math.e

# Parámetros por defecto
DEFAULTS = {
    "mu_max_ref": 0.35,   # 1/día at T_ref
    "T_ref": 35.0,
    "Q10": 1.07,
    "Ks": 2.0,            # kg/m3
    "k_h": 0.1,
    "Y": 0.35,            # m3 CH4 / kg VS degradado
    "fCH4": 0.60,
    "lag": 2.0,           # días
    "HRT": 30.0           # días por defecto si no hay volumen
}

# Parámetros por tipo de materia orgánica (biodigestor de bolsa)
# Valores de referencia basados en literatura científica (ver README_MODEL.md)
# 
# Referencias:
# - Garfí et al. (2011): Estiércol bovino en biodigestores tubulares en Bolivia
# - Lansing et al. (2008): Estiércol porcino en biodigestores pequeños en Costa Rica  
# - Ferrer et al. (2009): Residuos vegetales en biodigestores de bolsa en Perú
#
MATERIAL_PARAMS: Dict[str, Dict[str, float]] = {
    # Y: m3 CH4 / kg VS degradado; fCH4: fracción metano; lag: días; mu_max_ref: 1/día
    "bovino": {
        "Y": 0.25,           # m3 CH4/kg SV (Garfí et al., 2011: 0.20-0.30)
        "fCH4": 0.60,        # 60% metano en biogás (típico 55-65%)
        "lag": 2.5,          # días de fase de latencia
        "mu_max_ref": 0.25   # tasa máxima de crecimiento a 35°C
    },
    "porcino": {
        "Y": 0.30,           # m3 CH4/kg SV (Lansing et al., 2008: 0.25-0.35)
        "fCH4": 0.62,        # 62% metano (mayor que bovino)
        "lag": 2.0,          # inicio más rápido que bovino
        "mu_max_ref": 0.30   # mayor actividad microbiana
    },
    "vegetal": {
        "Y": 0.20,           # m3 CH4/kg SV (Ferrer et al., 2009: 0.15-0.25)
        "fCH4": 0.55,        # 55% metano (menor que estiércoles)
        "lag": 3.0,          # requiere más tiempo de hidrólisis
        "mu_max_ref": 0.20   # degradación más lenta
    },
}

def adjust_mu_by_temp(mu_ref, T_ref, Q10, T):
    """
    Ajusta la tasa de crecimiento microbiano según la temperatura usando el modelo Q10.
    
    El modelo Q10 es ampliamente utilizado en biocinética para describir cómo
    la temperatura afecta las tasas de reacción biológicas.
    
    Args:
        mu_ref: Tasa de crecimiento a temperatura de referencia (día⁻¹)
        T_ref: Temperatura de referencia (°C), típicamente 35°C (mesofílico)
        Q10: Factor de temperatura (adimensional), típicamente 1.07
        T: Temperatura actual del reactor (°C)
    
    Returns:
        Tasa de crecimiento ajustada (día⁻¹)
    
    Nota:
        - Q10 = 1.07 significa que la tasa aumenta 7% por cada 10°C
        - A 20°C, la tasa es ~76% de la tasa a 35°C
        - A 40°C, la tasa es ~107% de la tasa a 35°C
    """
    return mu_ref * (Q10 ** ((T - T_ref) / 10.0))


def monod_mu(mu_max, S, Ks):
    """
    Calcula la tasa efectiva de crecimiento usando la ecuación de Monod.
    
    La ecuación de Monod describe la limitación por sustrato en procesos
    microbianos. Es análoga a la cinética de Michaelis-Menten en enzimología.
    
    Args:
        mu_max: Tasa máxima de crecimiento (día⁻¹)
        S: Concentración de sustrato (kg SV/m³)
        Ks: Constante de semi-saturación (kg SV/m³)
            - Cuando S = Ks, μ_eff = μ_max/2
            - Ks típico para DA: 1.0-3.0 kg SV/m³
    
    Returns:
        Tasa efectiva de crecimiento (día⁻¹)
    
    Ejemplo:
        Si μ_max = 0.25, S = 4.0, Ks = 2.0:
        μ_eff = 0.25 * (4.0 / (2.0 + 4.0)) = 0.167 día⁻¹
    """
    return mu_max * (S / (Ks + S)) if (Ks + S) > 0 else 0.0


def gompertz_cumulative(t, A, mu_g, lam):
    """
    Calcula la producción acumulada de biogás usando el modelo de Gompertz modificado.
    
    El modelo de Gompertz describe curvas de crecimiento sigmoidal y es ampliamente
    utilizado para modelar la producción de biogás en digestión anaerobia.
    
    Ecuación: G(t) = A × exp(-exp((μ_g × e / A) × (λ - t) + 1))
    
    Args:
        t: Tiempo transcurrido (días)
        A: Potencial máximo de producción de biogás (m³)
        mu_g: Velocidad máxima de producción (m³/día)
        lam: Fase de latencia (días), tiempo antes de inicio significativo
    
    Returns:
        Producción acumulada de biogás a tiempo t (m³)
    
    Características de la curva:
        - t < lam: Fase de latencia (baja producción)
        - t ≈ lam: Inicio de fase exponencial
        - t >> lam: Aproximación asintótica a A
    
    Referencias:
        - Zwietering et al. (1990): "Modeling of bacterial growth curve"
        - Lay et al. (1997): "Influences of pH and moisture content..."
    """
    return A * math.exp(-math.exp((mu_g * e / A) * (lam - t) + 1.0))


def gompertz_rate(t, A, mu_g, lam):
    """
    Calcula la tasa de producción diaria de biogás (derivada de Gompertz).
    
    Esta es la derivada de gompertz_cumulative con respecto al tiempo,
    representando la producción instantánea.
    
    Ecuación: G'(t) = A × exp(-exp(inner)) × exp(inner) × (μ_g × e / A)
    donde: inner = (μ_g × e / A) × (λ - t) + 1
    
    Args:
        t: Tiempo transcurrido (días)
        A: Potencial máximo de producción (m³)
        mu_g: Velocidad máxima de producción (m³/día)
        lam: Fase de latencia (días)
    
    Returns:
        Tasa de producción diaria en tiempo t (m³/día)
    
    Características:
        - El pico de producción ocurre aproximadamente en t = λ
        - La producción máxima diaria es ~0.368 × μ_g
        - Después del pico, la producción declina gradualmente
    """
    inner = (mu_g * e / A) * (lam - t) + 1.0
    exp_inner = math.exp(inner)
    return A * math.exp(-exp_inner) * exp_inner * (mu_g * e / A)


def estimate_timeseries_for_material(
    material_type: str,
    vs_kg_per_day: float,
    reactor_volume_m3: float | None,
    temperature_c: float,
    target_fraction: float = 0.95,
    max_days: int = 120,
    HRT_days: float | None = None,
) -> Dict[str, List[float]]:
    """
    Genera series de producción diaria y acumulada (m3 de biogás) usando Gompertz modificado
    para biodigestores de bolsa, ajustando por temperatura y tipo de materia.

    Se detiene cuando la producción acumulada alcanza target_fraction del potencial A o
    al llegar a max_days.
    """
    p = DEFAULTS.copy()
    # aplicar parámetros por tipo si existen
    mt = MATERIAL_PARAMS.get(material_type.lower())
    if mt:
        p.update(mt)

    if HRT_days is None:
        HRT_days = p["HRT"]

    # Potencial máximo de metano (m3) para la masa de VS/día
    A_ch4_potential = p["Y"] * vs_kg_per_day
    A_biogas = A_ch4_potential / p["fCH4"] if p["fCH4"] > 0 else A_ch4_potential

    # Concentración S (kg VS / m3)
    if reactor_volume_m3 and reactor_volume_m3 > 0:
        S = vs_kg_per_day / reactor_volume_m3
    else:
        reactor_volume_m3 = (HRT_days * vs_kg_per_day) / 1000.0
        if reactor_volume_m3 <= 0:
            reactor_volume_m3 = 1.0
        S = vs_kg_per_day / reactor_volume_m3

    mu_max = adjust_mu_by_temp(p.get("mu_max_ref", DEFAULTS["mu_max_ref"]), p["T_ref"], p["Q10"], temperature_c)
    mu_eff = monod_mu(mu_max, S, p["Ks"])
    mu_g = mu_eff * A_biogas
    lam = p["lag"]

    days: List[float] = []
    daily: List[float] = []
    cumulative: List[float] = []

    cum = 0.0
    t = 0.0
    dt = 1.0  # días
    target = A_biogas * target_fraction

    while t <= max_days and cum < target:
        rate = max(gompertz_rate(t, A_biogas, mu_g, lam), 0.0)
        cum = max(gompertz_cumulative(t, A_biogas, mu_g, lam), 0.0)
        days.append(t)
        daily.append(rate)
        cumulative.append(cum)
        t += dt

    return {
        "days": days,
        "daily_biogas_m3": daily,
        "cumulative_biogas_m3": cumulative,
        "A_biogas_m3": A_biogas,
        "params": p,
    }

def estimate(biowaste_vs_kg_per_day,
             reactor_volume_m3=None,
             temperature_c=None,
             HRT_days=None,
             params=None,
             vs_cost_per_kg=0.0,
             water_cost_per_m3=0.0,
             water_m3_per_day=0.0,
             additives_cost_per_day=0.0):
    """
    Entrada:
      biowaste_vs_kg_per_day: kg VS/day
      reactor_volume_m3: opcional, si se da, se calcula S
      temperature_c: °C
      HRT_days: opcional (si reactor_volume y HRT no dados, usa DEFAULTS['HRT'])
    Retorna dict con estimaciones.
    """
    p = DEFAULTS.copy()
    if params:
        p.update(params)

    if HRT_days is None:
        HRT_days = p["HRT"]

    # Potencial máximo de metano (m3) de la masa de VS (si todo degradara)
    A_ch4_potential = p["Y"] * biowaste_vs_kg_per_day  # m3 CH4 máximo por día si todo degradado en un día
    # Pero A en Gompertz lo damos como potencial de biogás (m3), asumimos CH4 es fracción
    A_biogas = A_ch4_potential / p["fCH4"] if p["fCH4"] > 0 else A_ch4_potential

    # estimamos concentración S (kg VS / m3)
    if reactor_volume_m3 and reactor_volume_m3 > 0:
        S = biowaste_vs_kg_per_day / reactor_volume_m3
    else:
        # si no hay volumen, asumimos volumen tal que HRT = reactor_volume / (flow = biowaste mass density)
        # simplificamos: reactor_volume = HRT * flujo_vol (flujo_vol deducido de densidad agua 1 kg/L)
        # asumimos densidad ~ 1000 kg/m3 => 1 m3 transporta 1000 kg de agua; considerando sólo VS, S sería pequeña.
        reactor_volume_m3 = (HRT_days * biowaste_vs_kg_per_day) / 1000.0  # simplificación
        if reactor_volume_m3 <= 0:
            reactor_volume_m3 = 1.0
        S = biowaste_vs_kg_per_day / reactor_volume_m3

    # ajustamos mu_max por temperatura
    mu_max = adjust_mu_by_temp(p["mu_max_ref"], p["T_ref"], p["Q10"], temperature_c)

    # monod mu eff
    mu_eff = monod_mu(mu_max, S, p["Ks"])

    # definimos mu_g (velocidad en m3/día) proporcional a mu_eff y potencial A_biogas
    mu_g = mu_eff * A_biogas

    # usamos Gompertz para estimar producción en los próximos HRT días
    t = HRT_days  # horizonte
    cum_biogas_m3 = gompertz_cumulative(t, A_biogas, mu_g, p["lag"])
    # producción diaria aproximada (derivada) en día t
    prod_day = gompertz_rate(t, A_biogas, mu_g, p["lag"])

    # metano
    meth_day = prod_day * p["fCH4"]

    # VS degradado estimado (kg/día) — aproximamos por rendimiento: masa_degradada = (prod_day * p["fCH4"]) / p["Y"]
    vs_degraded = (meth_day / p["Y"]) if p["Y"] > 0 else 0.0

    # biol (volumen de efluente m3/day) simplificado: reactor_vol / HRT
    outflow_m3_day = reactor_volume_m3 / HRT_days if HRT_days > 0 else reactor_volume_m3

        # --- Costos ---
    cost_vs = biowaste_vs_kg_per_day * vs_cost_per_kg
    cost_water = water_m3_per_day * water_cost_per_m3
    total_cost_day = cost_vs + cost_water + additives_cost_per_day

    # sólidos en biol (kg VS/day) = entrada - degradada
    vs_out = max(biowaste_vs_kg_per_day - vs_degraded, 0.0)

    return {
        "reactor_volume_m3": reactor_volume_m3,
        "S_kg_per_m3": S,
        "mu_max_adj_per_day": mu_max,
        "mu_eff_per_day": mu_eff,
        "A_biogas_m3": A_biogas,
        "cumulative_biogas_m3_at_HRT": cum_biogas_m3,
        "biogas_m3_per_day_estimated": prod_day,
        "methane_m3_per_day": meth_day,
        "vs_degraded_kg_per_day": vs_degraded,
        "vs_out_kg_per_day": vs_out,
        "biol_volume_m3_per_day": outflow_m3_day,
        "parameters_used": p,
        "cost_vs_usd_per_day": cost_vs,
        "cost_water_usd_per_day": cost_water,
        "cost_additives_usd_per_day": additives_cost_per_day,
        "total_cost_usd_per_day": total_cost_day,

    }