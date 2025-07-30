
import React from 'react';

interface PieChartProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
}

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  if (total === 0) {
    return <div className="flex items-center justify-center h-64 text-slate-500">No hay datos para mostrar.</div>;
  }
  
  let accumulatedPercentage = 0;

  const segments = data.map(item => {
    const percentage = (item.value / total) * 100;
    const startAngle = (accumulatedPercentage / 100) * 360;
    accumulatedPercentage += percentage;
    const endAngle = (accumulatedPercentage / 100) * 360;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
    };
  });

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="relative w-48 h-48 md:w-56 md:h-56">
        <svg viewBox="-1 -1 2 2" className="transform -rotate-90">
          {segments.map((segment) => {
            const [startX, startY] = getCoordinatesForPercent(segment.startAngle / 360);
            const [endX, endY] = getCoordinatesForPercent(segment.endAngle / 360);
            const largeArcFlag = segment.percentage > 50 ? 1 : 0;

            const pathData = [
              `M ${startX} ${startY}`, // Move
              `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
              `L 0 0`, // Line to center
            ].join(' ');

            return <path key={segment.label} d={pathData} fill={segment.color} />;
          })}
        </svg>
      </div>
      <div className="flex-grow space-y-3">
        {data.map(item => (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span className="text-slate-300">{item.label}</span>
            </div>
            <span className="font-bold text-slate-100">
              {((item.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChart;
