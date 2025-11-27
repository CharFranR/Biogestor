# calcular solidos totales
def calcular_solidos_totales(masa_llenado, humedad_llenado, tipo_material):
  if humedad_llenado != 0:
    solidos_totales = (masa_llenado * (1-(humedad_llenado/100)))
    return solidos_totales

  elif humedad_llenado == 0:
    pocentaje_solido = parametros_basicos[tipo_material]['sólidos_totales']
    solidos_totales = masa_llenado * pocentaje_solido
    return solidos_totales

  # calcular solidos volatiles
def calcular_solidos_volatiles(solidos_totales, tipo_material):
  solidos_volatiles = solidos_totales * parametros_basicos[tipo_material]['volátiles_en_sólidos']
  return solidos_volatiles

  # calcular producion potencial
def calcular_produccion_potencial(solidos_volatiles, tipo_material):
  produccion_potencial = solidos_volatiles * parametros_basicos[tipo_material]['produccion_potencial']
  return produccion_potencial

  # calcular mu maxima o crecimiento de monod
def calcular_mu_maxima(temp):
  mu_maxima = (0.012 *temp)  - 0.086
  return mu_maxima

  # calcular volumen
def calcular_volumen_solvente(agua_agregada, masa_llenado, solidos_volatiles, densidad_aprox):
  # volumen_solvente = agua_agregada + ((humedad_llenado*masa_llenado)/1000)
  volumen_solvente = (masa_llenado + agua_agregada)/densidad_aprox

  return volumen_solvente

  # calcular concentracion
def calcular_concentracion_inicial(solidos_volatiles, volumen_solvente):
  concentracion = solidos_volatiles / volumen_solvente
  return concentracion

  # calcular mu especifica
def calcular_mu_especifica(mu_maxima, concentracion):
  ks = concentracion
  mu_especifica = mu_maxima * (concentracion/(ks + concentracion))
  return mu_especifica

def calcular_gompertz_acumulada(mu_especifica, tiempo_de_retardo, produccion_potencial, tiempo, e):
  c = (mu_especifica * e)/(produccion_potencial)
  b = e ** ((tiempo_de_retardo * c) + 1)
  y = produccion_potencial * e ** (-b * e ** (-c * tiempo))
  return y