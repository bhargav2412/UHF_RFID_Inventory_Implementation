import { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AuthPage } from '@/auth';
import { RequireAuth } from '@/auth/RequireAuth';
import { Demo1Layout } from '@/layouts/demo1';
import { ErrorsRouting } from '@/errors';

// Existing modules
import { CompanyPage, CompanyDashboardPage } from '@/pages/admin/company';
import { CustomerPage } from '@/pages/admin/customer';
import { UserPage } from '@/pages/admin/user';
import { ProductPage, MaterialPage } from '@/pages/admin/ModulePlaceholders';
import { ItemsPage } from '@/pages/inventory/items/ItemsPage';
import { StockEntriesPage } from '@/pages/inventory/stock-entries/StockEntriesPage';
import { WarehousesPage } from '@/pages/inventory/warehouses/WarehousesPage';
import { MachinesPage } from '@/pages/inventory/machines/MachinesPage';

// Dashboards
import { MainDashboardPage } from '@/pages/dashboard/MainDashboardPage';
import { ExecutiveDashboardPage } from '@/pages/dashboard/ExecutiveDashboardPage';
import { MobileDashboardPage } from '@/pages/dashboard/MobileDashboardPage';
// Inventory master data
import { RfidTagsPage } from '@/pages/inventory/rfid-tags/RfidTagsPage';
// Operations
import {
  GoodsReceivingPage,
  PutAwayPage,
  StockAdjustmentPage,
  StockIssuePage,
  StockTransferPage
} from '@/pages/operations/OperationPage';
// RFID tracking
import { LiveMonitoringPage } from '@/pages/tracking/LiveMonitoringPage';
import { ItemTrackingPage } from '@/pages/tracking/ItemTrackingPage';
import { MovementHistoryPage } from '@/pages/tracking/MovementHistoryPage';
import { LocationTrackingPage } from '@/pages/tracking/LocationTrackingPage';
import { TagHealthPage } from '@/pages/tracking/TagHealthPage';
import { GeofencingPage } from '@/pages/tracking/GeofencingPage';
// Inventory audit
import { CycleCountPage, PhysicalCountPage } from '@/pages/audit/CountSessionsPage';
import { VarianceReportPage } from '@/pages/audit/VarianceReportPage';
import { MissingItemsPage } from '@/pages/audit/MissingItemsPage';
// Assets
import { AssetRegisterPage } from '@/pages/assets/AssetRegisterPage';
import {
  AssetAssignmentsPage,
  AssetLifecyclePage,
  CustodiansPage,
  MaintenancePage
} from '@/pages/assets/AssetSubPages';
// Reports & alerts
import { AiInsightsPage, ReportCategoryPage, ReportsDashboardPage } from '@/pages/reports/ReportsPages';
import { AlertCenterPage } from '@/pages/alerts/AlertCenterPage';
// Administration
import {
  IntegrationsPage,
  RolesPage,
  SystemSettingsPage,
  UsersAdminPage
} from '@/pages/administration/AdminPages';

const AppRoutingSetup = (): ReactElement => {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route element={<Demo1Layout />}>
          {/* Dashboard */}
          <Route path="/" element={<MainDashboardPage />} />
          <Route path="/dashboard/executive" element={<ExecutiveDashboardPage />} />
          <Route path="/dashboard/mobile" element={<MobileDashboardPage />} />

          {/* Inventory (master data) */}
          <Route path="/inventory/items" element={<ItemsPage />} />
          <Route path="/inventory/rfid-tags" element={<RfidTagsPage />} />
          <Route path="/inventory/warehouses" element={<WarehousesPage />} />
          <Route path="/inventory/machines" element={<MachinesPage />} />
          <Route path="/inventory/stock-entries" element={<StockEntriesPage />} />

          {/* Operations */}
          <Route path="/operations/receiving" element={<GoodsReceivingPage />} />
          <Route path="/operations/putaway" element={<PutAwayPage />} />
          <Route path="/operations/transfer" element={<StockTransferPage />} />
          <Route path="/operations/adjustment" element={<StockAdjustmentPage />} />
          <Route path="/operations/issue" element={<StockIssuePage />} />

          {/* RFID tracking */}
          <Route path="/tracking/live" element={<LiveMonitoringPage />} />
          <Route path="/tracking/item" element={<ItemTrackingPage />} />
          <Route path="/tracking/movements" element={<MovementHistoryPage />} />
          <Route path="/tracking/locations" element={<LocationTrackingPage />} />
          <Route path="/tracking/tag-health" element={<TagHealthPage />} />
          <Route path="/tracking/geofencing" element={<GeofencingPage />} />

          {/* Inventory audit */}
          <Route path="/audit/cycle-count" element={<CycleCountPage />} />
          <Route path="/audit/physical-count" element={<PhysicalCountPage />} />
          <Route path="/audit/variance" element={<VarianceReportPage />} />
          <Route path="/audit/missing-items" element={<MissingItemsPage />} />

          {/* Assets */}
          <Route path="/assets" element={<Navigate to="/assets/register" replace />} />
          <Route path="/assets/register" element={<AssetRegisterPage />} />
          <Route path="/assets/assignments" element={<AssetAssignmentsPage />} />
          <Route path="/assets/custodians" element={<CustodiansPage />} />
          <Route path="/assets/maintenance" element={<MaintenancePage />} />
          <Route path="/assets/lifecycle" element={<AssetLifecyclePage />} />

          {/* Reports */}
          <Route path="/reports" element={<ReportsDashboardPage />} />
          <Route path="/reports/ai-insights" element={<AiInsightsPage />} />
          <Route path="/reports/:category" element={<ReportCategoryPage />} />

          {/* Alerts */}
          <Route path="/alerts" element={<AlertCenterPage />} />

          {/* Administration */}
          <Route path="/admin/users" element={<UsersAdminPage />} />
          <Route path="/admin/roles" element={<RolesPage />} />
          <Route path="/admin/integrations" element={<IntegrationsPage />} />
          <Route path="/admin/settings" element={<SystemSettingsPage />} />
          <Route path="/admin/companies" element={<CompanyPage />} />
          <Route path="/admin/company/:companyId" element={<CompanyDashboardPage />} />
          <Route path="/admin/company/:companyId/customers" element={<CustomerPage />} />
          <Route path="/admin/company/:companyId/users" element={<UserPage />} />
          <Route path="/admin/company/:companyId/products" element={<ProductPage />} />
          <Route path="/admin/company/:companyId/materials" element={<MaterialPage />} />
        </Route>
      </Route>
      <Route path="error/*" element={<ErrorsRouting />} />
      <Route path="auth/*" element={<AuthPage />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Routes>
  );
};

export { AppRoutingSetup };
