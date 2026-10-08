import ApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { DashboardStats } from './types';

interface ActivityTrendChartProps {
  activityChart: DashboardStats['activity_chart'];
}

const ActivityTrendChart = ({ activityChart }: ActivityTrendChartProps) => {
  const options: ApexOptions = {
    series: [
      { name: 'Inbound', data: activityChart.inbound },
      { name: 'Outbound', data: activityChart.outbound }
    ],
    chart: {
      height: 300,
      type: 'area',
      toolbar: { show: false },
      fontFamily: 'inherit'
    },
    colors: ['var(--tw-success)', 'var(--tw-danger)'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.35,
        opacityTo: 0.05
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '13px',
      labels: { colors: 'var(--tw-gray-600)' }
    },
    xaxis: {
      categories: activityChart.labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: 'var(--tw-gray-500)', fontSize: '11px' }
      }
    },
    yaxis: {
      min: 0,
      labels: {
        style: { colors: 'var(--tw-gray-500)', fontSize: '12px' }
      }
    },
    grid: {
      borderColor: 'var(--tw-gray-200)',
      strokeDashArray: 4
    },
    tooltip: {
      shared: true,
      intersect: false
    }
  };

  return (
    <div className="card h-full">
      <div className="card-header">
        <div>
          <h3 className="card-title">Scan Activity</h3>
          <p className="text-sm text-gray-500 mt-1">Inbound vs outbound over the last 14 days</p>
        </div>
      </div>
      <div className="card-body px-2 pb-4">
        <ApexChart
          options={options}
          series={options.series}
          type="area"
          height={300}
        />
      </div>
    </div>
  );
};

export { ActivityTrendChart };
