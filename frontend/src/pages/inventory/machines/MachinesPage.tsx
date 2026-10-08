import { Fragment, useState } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
  ToolbarActions
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { MachineList } from './blocks/MachineList';
import { MachineModal } from './blocks/MachineModal';

const MachinesPage = () => {
  const { currentLayout } = useLayout();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [search, setSearch] = useState('');

  const handleMachineSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text="Reading Machines" />
              <ToolbarDescription>Manage RFID readers linked to warehouses</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setIsModalOpen(true)}
              >
                Add Machine
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="card p-5 mb-5 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <input
              type="text"
              className="input input-sm w-full"
              placeholder="Search by Machine ID, Name, or Reader ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              className="btn btn-sm btn-primary px-5"
              onClick={() => setRefreshTrigger(p => p + 1)}
            >
              Search
            </button>
            <button
              className="btn btn-sm btn-light px-5"
              onClick={() => {
                setSearch('');
                setRefreshTrigger(p => p + 1);
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <MachineList refreshTrigger={refreshTrigger} search={search} />

        <MachineModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSuccess={handleMachineSaved}
          machine={null}
        />
      </Container>
    </Fragment>
  );
};

export { MachinesPage };
