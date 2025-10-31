import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../../shared/card/card';
import { BarraLateral } from '../../shared/barraLateral/barraLateral';
import { BarraArriba } from '../../shared/barraAriiba/barraArriba';
import styled from 'styled-components';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getCurrentProduction, CurrentProductionResponse, createFilling } from '../../api/dashboard.api';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SensorDataPoint {
  timestamp: number;
  value: number;
}

interface SensorChart {
  id: string;
  title: string;
  description: string;
  unit: string;
  color: string;
  icon: string;
  data: SensorDataPoint[];
  currentValue: number;
  status: string;
}

interface WebSocketMessage {
  type: 'sensor_data' | 'sensor_list' | 'error';
  data?: any;
  // Campos dinámicos del WebSocket
  [key: string]: any;
}


// Configuración genérica para sensores desconocidos
const DEFAULT_SENSOR_CONFIG = {
  title: 'Sensor',
  description: 'Dato de sensor en tiempo real',
  unit: '',
  color: '#888',
  icon: 'fas fa-question',
};

// Configuración personalizada para sensores conocidos
const SENSOR_CONFIGS: { [key: string]: Partial<Omit<SensorChart, 'data' | 'currentValue' | 'status'>> } = {
  temperatura: {
    title: 'Temperatura',
    description: 'Temperatura del biodigestor en tiempo real',
    unit: '°C',
    color: '#26a69a',
    icon: 'fas fa-thermometer-half',
  },
  humedad: {
    title: 'Humedad',
    description: 'Nivel de humedad del ambiente',
    unit: '%',
    color: '#42a5f5',
    icon: 'fas fa-tint',
  },
  presion: {
    title: 'Presión',
    description: 'Presión del sistema en tiempo real',
    unit: 'hPa',
    color: '#ffa726',
    icon: 'fas fa-tachometer-alt',
  },
  calidad: {
    title: 'Calidad',
    description: 'Calidad del biogás generado',
    unit: '%',
    color: '#7e57c2',
    icon: 'fas fa-gas-pump',
  },
  gas_total_m3: {
    title: 'Biogás acumulado',
    description: 'Volumen total de biogás producido',
    unit: 'm³',
    color: '#42a5f5',
    icon: 'fas fa-chart-area',
  },
  biol_total_m3: {
    title: 'Biol acumulado',
    description: 'Volumen total de biol producido',
    unit: 'm³',
    color: '#26a69a',
    icon: 'fas fa-water',
  },
};

// Estado genérico para sensores desconocidos
const getSensorStatus = (sensorId: string, value: number): string => {
  const thresholds: { [key: string]: { high: number; low: number } } = {
    temperatura: { high: 25, low: 15 },
    humedad: { high: 80, low: 40 },
    presion: { high: 1015, low: 990 },
    calidad: { high: 90, low: 60 },
  };
  const threshold = thresholds[sensorId.toLowerCase()];
  if (!threshold) return 'Normal';
  if (value > threshold.high) return 'Alta';
  if (value < threshold.low) return 'Baja';
  return 'Normal';
};

// Styled Components (mantener los mismos estilos)
const Container = styled.div`
  display: flex;
  height: 100vh;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ContentWrapper = styled.div`
  padding: 20px;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
`;

const SummaryCard = styled(Card)<{ $borderColor: string }>`
  display: flex;
  align-items: center;
  padding: 1.25rem;
  border-left: 4px solid ${props => props.$borderColor};
`;

const IconContainer = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.5rem;
  background-color: ${props => props.$color}20;
  color: ${props => props.$color};
`;

const SummaryContent = styled.div`
  flex: 1;
`;

const SummaryLabel = styled.p`
  margin: 0;
  color: #555;
  font-weight: 500;
`;

const SummaryValue = styled.h3`
  margin: 0.25rem 0;
  font-size: 1.75rem;
  color: #333;
`;

const SummaryStatus = styled.small<{ $color: string }>`
  font-weight: 500;
  color: ${props => props.$color};
`;

const ChartCard = styled(Card)`
  display: flex;
  flex-direction: column;
`;

const ChartTitle = styled.h4`
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: #333;
  display: flex;
  align-items: center;
`;

const ChartIcon = styled.i<{ $color: string }>`
  margin-right: 0.5rem;
  color: ${props => props.$color};
`;

const ChartDescription = styled.p`
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: #555;
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 300px;
`;

const ConnectionStatus = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ${props => props.$connected ? '#d4edda' : '#f8d7da'};
  color: ${props => props.$connected ? '#155724' : '#721c24'};
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const NoChartsMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

// Opciones comunes para todos los gráficos
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
    },
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: 'Tiempo',
      },
      ticks: {
        maxTicksLimit: 8,
      },
    },
    y: {
      display: true,
      title: {
        display: true,
        text: 'Valor',
      },
    },
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false,
  },
  elements: {
    line: {
      tension: 0.4,
    },
    point: {
      radius: 3,
      hoverRadius: 6,
    },
  },
  animation: {
    duration: 300,
  },
};

export const Sensors: React.FC = () => {
  const [sidebarAbierta, setSidebarAbierta] = useState(true);
  const [charts, setCharts] = useState<SensorChart[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [prod, setProd] = useState<CurrentProductionResponse | null>(null);
  const [showFillingModal, setShowFillingModal] = useState(false);
  const [fillingForm, setFillingForm] = useState({
    date: new Date().toISOString().slice(0,10),
    number: 1,
    people: '',
    material_type: 'bovino',
    material_amount_kg: 1000,
    material_humidity_pct: 80,
    added_water_m3: 0,
    temperature_c: 35,
  });
  // const location = useLocation();
  const wsRef = useRef<WebSocket | null>(null);

  // Función para preparar datos para Chart.js
  const prepareChartData = (chartData: SensorChart) => {
    const labels = chartData.data.map((point) => {
      const date = new Date(point.timestamp);
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    });

    const data = chartData.data.map(point => point.value);

    return {
      labels,
      datasets: [
        {
          label: chartData.title,
          data: data,
          borderColor: chartData.color,
          backgroundColor: `${chartData.color}20`,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  // Función para crear o actualizar gráficas basadas en datos recibidos
  const updateChartsFromSensorData = (sensorData: { [key: string]: number }) => {
    setCharts(prevCharts => {
      const updatedCharts = [...prevCharts];
      Object.entries(sensorData).forEach(([sensorId, value]) => {
        // Ignorar campos de control o de ticks/caudal instantáneo
        const keyLower = sensorId.toLowerCase();
        const ignoreKeys = ['type', 'timestamp', 'caudal_gas', 'caudal_biol', 'gas_flow', 'biol_flow'];
        if (ignoreKeys.includes(keyLower)) return;
        const id = sensorId;
        const config = SENSOR_CONFIGS[id.toLowerCase()] || DEFAULT_SENSOR_CONFIG;
        const existingChartIndex = updatedCharts.findIndex(chart => chart.id === id);
        if (existingChartIndex >= 0) {
          // Actualizar gráfica existente
          const existingChart = updatedCharts[existingChartIndex];
          const newDataPoint = {
            timestamp: Date.now(),
            value: value
          };
          const newData = [...existingChart.data, newDataPoint].slice(-50);
          updatedCharts[existingChartIndex] = {
            ...existingChart,
            data: newData,
            currentValue: value,
            status: getSensorStatus(id, value)
          };
        } else {
          // Crear nueva gráfica
          updatedCharts.push({
            id,
            title: config.title || id.charAt(0).toUpperCase() + id.slice(1),
            description: config.description || 'Dato de sensor en tiempo real',
            unit: config.unit || '',
            color: config.color || '#888',
            icon: config.icon || 'fas fa-question',
            data: [{
              timestamp: Date.now(),
              value: value
            }],
            currentValue: value,
            status: getSensorStatus(id, value)
          });
        }
      });
      return updatedCharts;
    });
  };

  // Conexión WebSocket
  useEffect(() => {
  const connectWebSocket = () => {
      try {
  // Construir URL de WebSocket a partir de la base HTTP
  // Use same-origin WS via Vite proxy to avoid HTTPS->HTTP mixed content
  const wsUrl = `${window.location.origin.replace(/^http/i, 'ws')}/ws/mqtt/`;
        
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          console.log('WebSocket conectado');
          setIsConnected(true);
          setConnectionError(null);
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            // Extraer todos los campos de sensor del mensaje (excepto type/timestamp)
            if (message.type === 'sensor_data') {
              const sensorData: { [key: string]: number } = {};
              Object.entries(message).forEach(([key, value]) => {
                if (typeof value === 'number' && !['type', 'timestamp'].includes(key.toLowerCase())) {
                  sensorData[key] = value;
                }
              });
              // También buscar en message.data si existe
              if (message.data && typeof message.data === 'object') {
                Object.entries(message.data).forEach(([key, value]) => {
                  if (typeof value === 'number' && !['type', 'timestamp'].includes(key.toLowerCase())) {
                    sensorData[key] = value;
                  }
                });
              }
              if (Object.keys(sensorData).length > 0) {
                updateChartsFromSensorData(sensorData);
              }
            }
          } catch (error) {
            console.error('Error procesando mensaje WebSocket:', error);
          }
        };

        wsRef.current.onclose = () => {
          console.log('WebSocket desconectado');
          setIsConnected(false);
          // Reconectar después de 5 segundos
          setTimeout(connectWebSocket, 5000);
        };

        wsRef.current.onerror = (error) => {
          console.error('Error de WebSocket:', error);
          setIsConnected(false);
          setConnectionError('Error de conexión con el servidor');
        };

      } catch (error) {
        console.error('Error al conectar WebSocket:', error);
        setConnectionError('No se pudo conectar al servidor');
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <Container>
      <BarraLateral abierta={sidebarAbierta} />

      <MainContent>
        <BarraArriba
          vistaActual="Sensores"
          onToggleSidebar={() => setSidebarAbierta(!sidebarAbierta)}
        />
        
        <ContentWrapper>
          {/* Estado de conexión */}
          <ConnectionStatus $connected={isConnected}>
            <i className={`fas ${isConnected ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
            {isConnected ? 'Conectado al servidor en tiempo real' : 'Desconectado'}
            {connectionError && ` - ${connectionError}`}
          </ConnectionStatus>

          {/* Tarjetas de Resumen */}
          {charts.length > 0 && (
            <SummaryGrid>
              {charts.map((chart) => (
                <SummaryCard key={chart.id} $borderColor={chart.color}>
                  <IconContainer $color={chart.color}>
                    <i className={chart.icon}></i>
                  </IconContainer>
                  <SummaryContent>
                    <SummaryLabel>{chart.title}</SummaryLabel>
                    <SummaryValue>
                      {chart.currentValue} {chart.unit}
                    </SummaryValue>
                    <SummaryStatus $color={chart.color}>
                      {chart.status}
                    </SummaryStatus>
                  </SummaryContent>
                </SummaryCard>
              ))}
            </SummaryGrid>
          )}

          {/* Producción esperada vs real */}
          <ChartCard>
            <ChartTitle>
              <ChartIcon $color="#2e7d32" className="fas fa-balance-scale" />
              Comparación: Esperada vs Real (Biogás)
            </ChartTitle>
            <ChartDescription>
              Carga los datos de la etapa activa para ver la serie esperada (modelo) junto a la real (sensores).
            </ChartDescription>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
              <button
                onClick={() => setShowFillingModal(true)}
                style={{ backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: 4, padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Nuevo llenado
              </button>
              <button
                onClick={async () => {
                  try {
                    const data = await getCurrentProduction();
                    setProd(data);
                  } catch (e) {
                    const err: any = e;
                    const status = err?.response?.status;
                    const detail = err?.response?.data?.detail;
                    if (status === 404) {
                      alert(detail || 'No hay etapa activa. Registra un nuevo llenado primero.');
                    } else {
                      alert(detail || 'Hubo un error al cargar la producción actual.');
                    }
                  }
                }}
                style={{
                  backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: 4,
                  padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cargar producción actual
              </button>
              {prod && (
                <small style={{ color: '#555' }}>
                  Etapa #{prod.stage.number} • {prod.stage.material_type} • {new Date(prod.stage.date).toLocaleDateString()}
                </small>
              )}
            </div>
            <ChartContainer>
              {prod ? (
                <Line
                  data={{
                    labels: (prod.expected.days || []).map((d: number) => `Día ${d}`),
                    datasets: [
                      {
                        label: 'Esperado diario (m³/día)',
                        data: prod.expected.daily_biogas_m3,
                        borderColor: '#26a69a',
                        backgroundColor: '#26a69a20',
                        tension: 0.3,
                        yAxisID: 'y1',
                      },
                      {
                        label: 'Esperado acumulado (m³)',
                        data: prod.expected.cumulative_biogas_m3,
                        borderColor: '#42a5f5',
                        backgroundColor: '#42a5f520',
                        tension: 0.3,
                        yAxisID: 'y2',
                      },
                      {
                        label: 'Real diario (m³/día)',
                        data: prod.actual.daily_biogas_m3,
                        borderColor: '#ef5350',
                        backgroundColor: '#ef535020',
                        tension: 0.3,
                        yAxisID: 'y1',
                      },
                      {
                        label: 'Real acumulado (m³)',
                        data: prod.actual.cumulative_biogas_m3,
                        borderColor: '#8d6e63',
                        backgroundColor: '#8d6e6320',
                        tension: 0.3,
                        yAxisID: 'y2',
                      },
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                      y1: { type: 'linear', position: 'left', title: { display: true, text: 'm³/día' } },
                      y2: { type: 'linear', position: 'right', title: { display: true, text: 'm³' }, grid: { drawOnChartArea: false } },
                    },
                    plugins: { legend: { display: true }, title: { display: false } },
                  }}
                />
              ) : (
                <NoChartsMessage>
                  <i className="fas fa-chart-area" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#ccc' }}></i>
                  <div>Carga la producción para ver la comparación.</div>
                </NoChartsMessage>
              )}
            </ChartContainer>
          </ChartCard>

          {/* Modal de Nuevo Llenado */}
          {showFillingModal && (
            <div style={{
              position: 'fixed', inset: 0, background: '#00000066', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
              <div style={{ background: 'white', borderRadius: 8, width: 520, maxWidth: '95vw', padding: '1rem 1.25rem' }}>
                <h3 style={{ marginTop: 0 }}>Registrar nuevo llenado</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label>Fecha</label>
                    <input type="date" value={fillingForm.date} onChange={e => setFillingForm({ ...fillingForm, date: e.target.value })} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label>Número</label>
                    <input type="number" value={fillingForm.number} onChange={e => setFillingForm({ ...fillingForm, number: parseInt(e.target.value || '0', 10) })} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label>Personas</label>
                    <input type="text" value={fillingForm.people} onChange={e => setFillingForm({ ...fillingForm, people: e.target.value })} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label>Tipo de material</label>
                    <select value={fillingForm.material_type} onChange={e => setFillingForm({ ...fillingForm, material_type: e.target.value })} style={{ width: '100%' }}>
                      <option value="bovino">Bovino</option>
                      <option value="porcino">Porcino</option>
                      <option value="vegetal">Vegetal</option>
                    </select>
                  </div>
                  <div>
                    <label>Cantidad (kg)</label>
                    <input type="number" value={fillingForm.material_amount_kg} onChange={e => setFillingForm({ ...fillingForm, material_amount_kg: parseFloat(e.target.value || '0') })} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label>Humedad (%)</label>
                    <input type="number" value={fillingForm.material_humidity_pct} onChange={e => setFillingForm({ ...fillingForm, material_humidity_pct: parseFloat(e.target.value || '0') })} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label>Agua añadida (m³)</label>
                    <input type="number" value={fillingForm.added_water_m3} onChange={e => setFillingForm({ ...fillingForm, added_water_m3: parseFloat(e.target.value || '0') })} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label>Temperatura (°C)</label>
                    <input type="number" value={fillingForm.temperature_c} onChange={e => setFillingForm({ ...fillingForm, temperature_c: parseFloat(e.target.value || '0') })} style={{ width: '100%' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                  <button onClick={() => setShowFillingModal(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>Cancelar</button>
                  <button
                    onClick={async () => {
                      try {
                        // Validaciones básicas antes de enviar
                        if (!fillingForm.people || fillingForm.people.trim() === '') {
                          alert('Por favor, especifica las personas que hicieron el llenado.');
                          return;
                        }
                        if (!fillingForm.number || fillingForm.number <= 0) {
                          alert('El número de llenado debe ser mayor a 0.');
                          return;
                        }
                        if (!fillingForm.material_amount_kg || fillingForm.material_amount_kg <= 0) {
                          alert('La cantidad de material debe ser mayor a 0 kg.');
                          return;
                        }
                        if (fillingForm.material_humidity_pct < 0 || fillingForm.material_humidity_pct > 100) {
                          alert('La humedad debe estar entre 0 y 100%.');
                          return;
                        }
                        await createFilling({
                          date: fillingForm.date,
                          number: fillingForm.number,
                          people: fillingForm.people,
                          material_type: fillingForm.material_type as any,
                          material_amount_kg: fillingForm.material_amount_kg,
                          material_humidity_pct: fillingForm.material_humidity_pct,
                          added_water_m3: fillingForm.added_water_m3,
                          temperature_c: fillingForm.temperature_c,
                        });
                        setShowFillingModal(false);
                        const data = await getCurrentProduction();
                        setProd(data);
                      } catch (e: any) {
                        const detail = e?.response?.data?.detail || JSON.stringify(e?.response?.data || e?.message || e) || '';
                        alert(`No se pudo registrar el llenado. ${detail}`);
                      }
                    }}
                    style={{ padding: '0.5rem 1rem', background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Gráficos Dinámicos con Chart.js */}
          {charts.length > 0 ? (
            <ChartsGrid>
              {charts.map((chart) => (
                <ChartCard key={chart.id}>
                  <ChartTitle>
                    <ChartIcon $color={chart.color} className={chart.icon} />
                    {chart.title}
                  </ChartTitle>
                  <ChartDescription>
                    {chart.description}
                  </ChartDescription>
                  <ChartContainer>
                    <Line 
                      data={prepareChartData(chart)} 
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          title: {
                            display: true,
                            text: `${chart.title} (${chart.unit})`,
                          },
                        },
                        scales: {
                          ...chartOptions.scales,
                          y: {
                            ...chartOptions.scales.y,
                            title: {
                              display: true,
                              text: chart.unit,
                            },
                          },
                        },
                      }}
                    />
                  </ChartContainer>
                </ChartCard>
              ))}
            </ChartsGrid>
          ) : (
            <NoChartsMessage>
              <i className="fas fa-chart-line" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ccc' }}></i>
              <h3>Esperando datos de sensores...</h3>
              <p>Los gráficos aparecerán automáticamente cuando se reciban datos del servidor.</p>
            </NoChartsMessage>
          )}
        </ContentWrapper>
      </MainContent>
    </Container>
  );
};