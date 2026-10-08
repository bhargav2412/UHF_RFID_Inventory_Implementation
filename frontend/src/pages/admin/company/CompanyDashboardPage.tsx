import { Fragment, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription
} from '@/partials/toolbar';
import { useLayout } from '@/providers';

const CompanyDashboardPage = () => {
  const { companyId } = useParams();
  const { currentLayout } = useLayout();
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/company/${companyId}`);
        setCompany(response.data.data);
      } catch (error) {
        console.error('Error fetching company:', error);
      }
    };

    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text={company?.name || 'Company Dashboard'} />
              <ToolbarDescription>Managing details for {company?.name || 'this company'}</ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="card p-10 mt-5 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Welcome to {company?.name || 'Company Context'}</h2>
            <p className="text-gray-700">Here you will see all details related to {company?.name || 'the selected company'}.</p>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="card p-5 border border-gray-200">
                    <h3 className="font-bold">Inventory</h3>
                    <p className="text-sm text-gray-600">Stock levels and movements</p>
                </div>
                <div className="card p-5 border border-gray-200">
                    <h3 className="font-bold">Orders</h3>
                    <p className="text-sm text-gray-600">Pending and completed orders</p>
                </div>
                <div className="card p-5 border border-gray-200">
                    <h3 className="font-bold">Production</h3>
                    <p className="text-sm text-gray-600">Manufacturing status</p>
                </div>
            </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { CompanyDashboardPage };
