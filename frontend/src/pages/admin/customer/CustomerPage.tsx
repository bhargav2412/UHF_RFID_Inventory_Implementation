import { Fragment } from 'react';
import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import { CustomerList } from '@/pages/admin/customer/blocks/CustomerList';

const CustomerPage = () => {
  const { currentLayout } = useLayout();

  return (
    <Fragment>
      <Container>
        <CustomerList />
      </Container>
    </Fragment>
  );
};

export { CustomerPage };
