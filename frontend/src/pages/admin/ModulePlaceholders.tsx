import { Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription
} from '@/partials/toolbar';
import { useLayout } from '@/providers';

const ModulePlaceholderPage = ({ title, description }: { title: string; description: string }) => {
  const { companyId } = useParams();
  const { currentLayout } = useLayout();

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text={title} />
              <ToolbarDescription>{description}</ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="card p-10 mt-5 text-center border-dashed border-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title} Module</h2>
            <p className="text-gray-700">This module is coming soon. You will be able to manage {title.toLowerCase()} here.</p>
        </div>
      </Container>
    </Fragment>
  );
};

export const ProductPage = () => <ModulePlaceholderPage title="Products" description="Manage box products and categories" />;
export const MaterialPage = () => <ModulePlaceholderPage title="Materials" description="Manage raw materials and inventory" />;
