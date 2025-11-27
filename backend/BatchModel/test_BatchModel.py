import pytest
from .mathModel import get_derivative_gompertz, simulation, get_cumulative_gompertz

@pytest.fixture
def basic_params_fixture():
    # Mock BasicParams object with required attributes
    class BasicParams:
        TS = 0.85
        VSTS = 0.75
        potencial_production = 1.2
    return BasicParams()

def test_derivative_gompertz_basic():
    specific_mu = 0.05
    delay_time = 10
    potencial_production = 100.0
    time = 5
    e = 2.718281828459045
    derivative = get_derivative_gompertz(specific_mu, delay_time, potencial_production, time, e)
    # Derivative should be a finite positive number for these parameters
    assert isinstance(derivative, float)
    assert derivative > 0

def test_simulation_returns_derivative_and_cumulative_lists(basic_params_fixture):
    basic_params = basic_params_fixture
    filling_mass = 5000
    filling_moisture = 20  # %
    temperature = 35
    added_watter = 1000
    approx_density = 1.0
    delay_time = 12
    result = simulation(basic_params, filling_mass, filling_moisture, temperature, added_watter, approx_density, delay_time)
    # result is a tuple with 9 elements, last two are lists
    assert len(result) == 9
    cumulative = result[7]
    derivative = result[8]
    assert isinstance(cumulative, list) and isinstance(derivative, list)
    # Both lists should have the same length
    assert len(cumulative) == len(derivative)
    # Values should be non‑negative
    assert all(v >= 0 for v in cumulative)
    assert all(v >= 0 for v in derivative)
