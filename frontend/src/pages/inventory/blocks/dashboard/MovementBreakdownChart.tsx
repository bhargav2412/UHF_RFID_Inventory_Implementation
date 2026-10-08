import ApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { DashboardStats } from './types';

interface MovementBreakdownChartProps {
  movement: DashboardStats['movement'];
}

const MovementBreakdownChart = ({ movement }: MovementBreakdownChartProps) => {
  const total = movement.inbound + movement.outbound;
  const inboundPct = total > 0 ? Math.round((movement.inbound / total) * 100) : 0;
  const outboundPct = total > 0 ? 100 - inboundPct : 0;

  const options: ApexOptions = {
    series: [movement.inbound, movement.outbound],
    labels: ['Inbound', 'Outbound'],
    colors: ['var(--tw-success)', 'var(--tw-danger)'],
    chart: { type: 'donut' },
    stroke: { show: true, width: 2, colors: ['#fff'] },
    dataLabels: { enabled: false },
    legend: {
      position: 'bottom',
      fontSize: '13px',
      labels: { colors: 'var(--tw-gray-700)' }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Scans',
              fontSize: '13px',
              color: 'var(--tw-gray-500)',
              formatter: () => String(total)
            }
          }
        }
      }
    }
  };

  return (
    <div className="card h-full">
      <div className="card-header">
        <div>
          <h3 className="card-title">Movement Split</h3>
          <p className="text-sm text-gray-500 mt-1">All-time inbound vs outbound</p>
        </div>
      </div>
      <div className="card-body flex flex-col items-center justify-center gap-4 pb-6">
        <ApexChart
          options={options}
          series={options.series}
          type="donut"
          height={240}
          width="100%"
        />
        <div className="grid grid-cols-2 gap-4 w-full px-4">
          <div className="text-center p-3 rounded-lg border border-success-clarity bg-success-clarity">
            <div className="text-lg font-bold text-success">{inboundPct}%</div>
            <div className="text-xs text-gray-700">Inbound</div>
          </div>
          <div className="text-center p-3 rounded-lg border border-danger-clarity bg-danger-clarity">
            <div className="text-lg font-bold text-danger">{outboundPct}%</div>
            <div className="text-xs text-gray-700">Outbound</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { MovementBreakdownChart };
