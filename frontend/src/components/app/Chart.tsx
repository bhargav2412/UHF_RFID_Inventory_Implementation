import ApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { ReactNode } from 'react';

/** Brand-consistent series palette (Metronic CSS variables). */
export const CHART_COLORS = [
  'var(--tw-primary)',
  'var(--tw-success)',
  'var(--tw-warning)',
  'var(--tw-info)',
  'var(--tw-danger)',
  'var(--tw-gray-500)'
];

/** Shared axis/grid/tooltip defaults merged into every chart. */
export const baseChartOptions = (overrides: ApexOptions = {}): ApexOptions => ({
  ...overrides,
  chart: {
    toolbar: { show: false },
    fontFamily: 'inherit',
    zoom: { enabled: false },
    parentHeightOffset: 0,
    ...overrides.chart
  },
  colors: overrides.colors ?? CHART_COLORS,
  dataLabels: { enabled: false, ...overrides.dataLabels },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
    fontSize: '12px',
    labels: { colors: 'var(--tw-gray-600)' },
    markers: { size: 5 },
    ...overrides.legend
  },
  grid: {
    borderColor: 'var(--tw-gray-200)',
    strokeDashArray: 4,
    padding: { left: 8, right: 8 },
    ...overrides.grid
  },
  xaxis: {
    axisBorder: { show: false },
    axisTicks: { show: false },
    ...overrides.xaxis,
    labels: {
      style: { colors: 'var(--tw-gray-500)', fontSize: '11px' },
      ...overrides.xaxis?.labels
    }
  },
  yaxis: Array.isArray(overrides.yaxis)
    ? overrides.yaxis
    : {
        ...overrides.yaxis,
        labels: {
          style: { colors: 'var(--tw-gray-500)', fontSize: '11px' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(overrides.yaxis as any)?.labels
        }
      },
  tooltip: { theme: 'light', ...overrides.tooltip }
});

interface ChartCardProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  options: ApexOptions;
  series: ApexOptions['series'];
  type: 'line' | 'area' | 'bar' | 'donut' | 'pie' | 'radialBar' | 'heatmap' | 'radar';
  height?: number;
  footer?: ReactNode;
  className?: string;
}

/** Card wrapper around an ApexCharts chart with a title and optional actions. */
const ChartCard = ({ title, subtitle, actions, options, series, type, height = 280, footer, className }: ChartCardProps) => (
  <div className={`card h-full min-w-0 ${className ?? ''}`}>
    <div className="card-header flex-wrap gap-2 py-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="card-title">{title}</h3>
        {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
      </div>
      {actions}
    </div>
    <div className="card-body px-2 pt-2 pb-3">
      <ApexChart options={options} series={series} type={type} height={height} width="100%" />
    </div>
    {footer && <div className="card-footer">{footer}</div>}
  </div>
);

export { ChartCard };
