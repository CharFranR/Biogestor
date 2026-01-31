"use client";

import { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { SensorReading } from "@/hooks/useSensorData";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SensorChartProps {
  sensorReading: SensorReading;
  title: string;
  unit: string;
  color: string;
  minValue?: number;
  maxValue?: number;
  onFullscreen?: () => void;
}

export function SensorChart({
  sensorReading,
  title,
  unit,
  color,
  minValue,
  maxValue,
}: SensorChartProps) {
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  // Update chart when data changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update("none");
    }
  }, [sensorReading.values]);

  const labels = sensorReading.timestamps.map((timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  });

  const currentValue =
    sensorReading.values.length > 0
      ? sensorReading.values[sensorReading.values.length - 1]
      : null;

  const data = {
    labels,
    datasets: [
      {
        label: title,
        data: sensorReading.values,
        borderColor: color,
        backgroundColor: `${color}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index",
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed.y?.toFixed(2) ?? "--"} ${unit}`,
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 6,
          font: {
            size: 10,
          },
          color: "#9ca3af",
        },
      },
      y: {
        display: true,
        min: minValue,
        max: maxValue,
        grid: {
          color: "#f3f4f6",
        },
        ticks: {
          font: {
            size: 10,
          },
          color: "#9ca3af",
          callback: (value) => `${value} ${unit}`,
        },
      },
    },
    animation: {
      duration: 0,
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{sensorReading.sensorCode}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color }}>
            {currentValue !== null ? currentValue.toFixed(2) : "--"}
          </p>
          <p className="text-xs text-gray-500">{unit}</p>
        </div>
      </div>

      <div className="h-48">
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}

interface SensorChartConfig {
  sensorCode: string;
  title: string;
  unit: string;
  color: string;
  minValue?: number;
  maxValue?: number;
}

export const DEFAULT_SENSOR_CONFIGS: SensorChartConfig[] = [
  {
    sensorCode: "temperatura",
    title: "Temperatura",
    unit: "°C",
    color: "#26a69a",
    minValue: 0,
    maxValue: 60,
  },
  {
    sensorCode: "humedad",
    title: "Humedad",
    unit: "%",
    color: "#42a5f5",
    minValue: 0,
    maxValue: 100,
  },
  {
    sensorCode: "presion",
    title: "Presión",
    unit: "hPa",
    color: "#ffa726",
    minValue: 900,
    maxValue: 1100,
  },
  {
    sensorCode: "ph",
    title: "pH",
    unit: "",
    color: "#7e57c2",
    minValue: 0,
    maxValue: 14,
  },
  {
    sensorCode: "gas_total_m3",
    title: "Biogás Acumulado",
    unit: "m³",
    color: "#66bb6a",
  },
  {
    sensorCode: "biol_total_m3",
    title: "Biol Acumulado",
    unit: "m³",
    color: "#ef5350",
  },
];
