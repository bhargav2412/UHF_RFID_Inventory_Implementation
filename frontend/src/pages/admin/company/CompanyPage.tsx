import { Fragment } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { CompanyList } from '@/pages/admin/company/blocks/CompanyList';

const CompanyPage = () => {
  const { currentLayout } = useLayout();

  return (
    <Fragment>

      <Container>
        <CompanyList />
      </Container>
    </Fragment>
  );
};

export { CompanyPage };
