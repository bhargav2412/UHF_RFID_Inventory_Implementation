import { Fragment, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
  ToolbarActions
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { UserList } from '@/pages/admin/user/blocks/UserList';
import { UserModal } from '@/pages/admin/user/blocks/UserModal';

const UserPage = () => {
  const { companyId } = useParams();
  const { currentLayout } = useLayout();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUserSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text="Company Users" />
              <ToolbarDescription>Manage administrative and worker accounts</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setIsModalOpen(true)}
              >
                Add User
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <UserList refreshTrigger={refreshTrigger} />

        <UserModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSuccess={handleUserSaved}
          user={null}
        />
      </Container>
    </Fragment>
  );
};

export { UserPage };
