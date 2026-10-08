import ApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { DashboardStats } from './types';

interface WarehouseStockChartProps {
  warehouses: DashboardStats['warehouses'];
}

const WarehouseStockChart = ({ warehouses }: WarehouseStockChartProps) => {
  const labels = warehouses.map((w) => w.name);
  const data = warehouses.map((w) => w.current_stock ?? 0);

  const options: ApexOptions = {
    series: [{ name: 'Current Stock', data }],
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false },
      fontFamily: 'inherit'
    },
    colors: ['var(--tw-primary)'],
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '55%',
        distributed: false
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: 'var(--tw-gray-500)', fontSize: '12px' },
        trim: true,
        maxHeight: 60
      }
    },
    yaxis: {
      labels: {
        style: { colors: 'var(--tw-gray-500)', fontSize: '12px' }
      }
    },
    grid: {
      borderColor: 'var(--tw-gray-200)',
      strokeDashArray: 4
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} units`
      }
    }
  };

  if (warehouses.length === 0) {
    return (
      <div className="card h-full">
        <div className="card-header">
          <h3 className="card-title">Stock by Warehouse</h3>
        </div>
        <div className="card-body flex items-center justify-center h-[300px] text-gray-500">
          No warehouse data yet
        </div>
      </div>
    );
  }

  return (
    <div className="card h-full">
      <div className="card-header">
        <div>
          <h3 className="card-title">Stock by Warehouse</h3>
          <p className="text-sm text-gray-500 mt-1">Current stock levels per location</p>
        </div>
      </div>
      <div className="card-body px-2 pb-4">
        <ApexChart
          options={options}
          series={options.series}
          type="bar"
          height={300}
        />
      </div>
    </div>
  );
};

export { WarehouseStockChart };
