from . models import BasicParams
# Calculate total solids
def get_total_solids(basic_params, filling_mass, filling_moisture):
  if filling_moisture != 0:
    total_solids = (filling_mass * (1-(filling_moisture/100)))
    return total_solids

  elif filling_moisture == 0:
    solid_percent = basic_params.TS
    total_solids = filling_mass * solid_percent
    return total_solids

  # calcular solidos volatiles
def get_total_valatile_solids(basic_params, total_solids):
  valatile_solids = total_solids * basic_params.VSTS
  return valatile_solids

  # calcular producion potencial
def get_potencial_production(basic_params, total_volatile_solids):
  potencial_production = total_volatile_solids * basic_params.potencial_production
  return potencial_production

  # calcular mu maxima o crecimiento de monod
def get_max_mu(temperature):
  max_mu = (0.012 *temperature)  - 0.086
  return max_mu

  # calcular volumen
def get_solvent_volume(added_watter, filling_mass, valatile_solids, approx_density):
  # solvent_volume = added_watter + ((filling_moisture*filling_mass)/1000)
  solvent_volume = (filling_mass + added_watter)/approx_density

  return solvent_volume

  # calcular concentration
def get_initial_concentration(total_volatile_solids, solvent_volume):
  concentration = total_volatile_solids / solvent_volume
  return concentration

  # calcular mu especifica
def get_specific_mu(max_mu, concentration):
  ks = concentration
  specific_mu = max_mu * (concentration/(ks + concentration))
  return specific_mu

def get_cumulative_gompertz(specific_mu, delay_time, potencial_production, time, e):
  c = (specific_mu * e)/(potencial_production)
  b = e ** ((delay_time * c) + 1)
  y = potencial_production * e ** (-b * e ** (-c * time))
  return y

def simulation (basic_params, filling_mass, filling_moisture, temperature, 
                added_watter, approx_density, delay_time, date_period):
  e = 2.718281828459045

  # get basic data
  total_solids = get_total_solids(basic_params, filling_mass, filling_moisture)
  total_volatile_solids = get_total_valatile_solids(basic_params, total_solids)
  potencial_production = get_potencial_production(basic_params, total_volatile_solids)
  max_mu = get_max_mu(temperature)
  solvent_volume = get_solvent_volume(added_watter, filling_mass, total_volatile_solids, approx_density)
  initial_concentration = get_initial_concentration(total_volatile_solids, solvent_volume)
  specific_mu = get_specific_mu(max_mu, initial_concentration)

  t_concentration = initial_concentration
  cumulative_production = []

  # get data along time
  for i in range (1, date_period + 1):
    # get specific time mu
    t_specific_mu = get_specific_mu(max_mu, initial_concentration)

    # get cumulative time production 
    t_cumulative_production = get_cumulative_gompertz(t_specific_mu, delay_time, potencial_production, i, e)
    cumulative_production.append(t_cumulative_production)

    # get new concentration
    t_concentration = t_concentration - t_cumulative_production

    data = total_solids, total_volatile_solids, potencial_production, max_mu, solvent_volume, initial_concentration, specific_mu, cumulative_production

    return data