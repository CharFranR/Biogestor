import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../../shared/card/card';
import { BarraLateral } from '../../shared/barraLateral/barraLateral';
import { BarraArriba } from '../../shared/barraAriiba/barraArriba';
import { useLocation } from 'react-router-dom';
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
  charts?: Array<{
    id: string;
    title: string;
    description: string;
    unit: string;
    color: string;
    icon: string;
    currentValue: number;
    status: string;
  }>;
  // Campos para el formato actual del WebSocket
  temperatura?: number;
  humedad?: number;
  presion?: number;
  produccionGas?: number;
}

// Styled Components
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

// Configuración inicial de sensores (se actualizará con datos reales)
const initialCharts: SensorChart[] = [
  {
    id: 'temperatura',
    title: 'Temperatura',
    description: 'Temperatura del biodigestor en tiempo real',
    unit: '°C',
    color: '#26a69a',
    icon: 'fas fa-thermometer-half',
    data: [],
    currentValue: 0,
    status: 'Esperando datos'
  },
  {
    id: 'humedad',
    title: 'Humedad',
    description: 'Nivel de humedad del ambiente',
    unit: '%',
    color: '#42a5f5',
    icon: 'fas fa-tint',
    data: [],
    currentValue: 0,
    status: 'Esperando datos'
  },
  {
    id: 'presion',
    title: 'Presión',
    description: 'Presión del sistema en tiempo real',
    unit: 'bar',
    color: '#ffa726',
    icon: 'fas fa-tachometer-alt',
    data: [],
    currentValue: 0,
    status: 'Esperando datos'
  }
];

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
  const [charts, setCharts] = useState<SensorChart[]>(initialCharts);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const location = useLocation();
  const wsRef = useRef<WebSocket | null>(null);

  // Función para preparar datos para Chart.js
  const prepareChartData = (chartData: SensorChart) => {
    const labels = chartData.data.map((point, index) => {
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

  // Conexión WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // Conectar al backend Django en puerto 8000
        const wsUrl = `ws://localhost:8000/ws/mqtt/`;
        
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          console.log('WebSocket conectado');
          setIsConnected(true);
          setConnectionError(null);
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('Mensaje WebSocket recibido:', message);
            
            // Manejar el formato actual del WebSocket
            if (message.type === 'sensor_data') {
              // Actualizar datos de sensores con el formato actual
              setCharts(prevCharts => 
                prevCharts.map(chart => {
                  let newValue: number | undefined;
                  
                  // Mapear los campos del WebSocket actual a nuestros IDs de gráfica
                  if (chart.id === 'temperatura' && message.temperatura !== undefined) {
                    newValue = message.temperatura;
                  } else if (chart.id === 'humedad' && message.humedad !== undefined) {
                    newValue = message.humedad;
                  } else if (chart.id === 'presion' && message.presion !== undefined) {
                    newValue = message.presion;
                  } else if (chart.id === 'produccionGas' && message.produccionGas !== undefined) {
                    newValue = message.produccionGas;
                  }
                  
                  if (newValue !== undefined) {
                    const newDataPoint = {
                      timestamp: Date.now(),
                      value: newValue
                    };
                    
                    // Mantener solo los últimos 50 puntos de datos
                    const newData = [...chart.data, newDataPoint].slice(-50);
                    
                    // Determinar estado basado en el valor
                    let status = 'Normal';
                    if (chart.id === 'temperatura') {
                      status = newValue > 25 ? 'Alta' : newValue < 15 ? 'Baja' : 'Normal';
                    } else if (chart.id === 'humedad') {
                      status = newValue > 80 ? 'Alta' : newValue < 40 ? 'Baja' : 'Normal';
                    } else if (chart.id === 'presion') {
                      status = newValue > 1.5 ? 'Alta' : newValue < 0.8 ? 'Baja' : 'Normal';
                    }
                    
                    return {
                      ...chart,
                      data: newData,
                      currentValue: newValue,
                      status: status
                    };
                  }
                  return chart;
                })
              );
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