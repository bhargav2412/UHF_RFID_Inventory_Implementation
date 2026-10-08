import { type TMenuConfig } from '@/components/menu';

/**
 * Main navigation — follows the "Suggested Menu Structure" of the
 * UHF RFID Inventory Management design document:
 * Dashboard > Inventory > Operations > RFID Tracking > Inventory Audit > Assets > Reports > Alerts > Administration
 */
export const MENU_SIDEBAR: TMenuConfig = [
  {
    title: 'Dashboard',
    icon: 'element-11',
    children: [
      { title: 'Overview', path: '/' },
      { title: 'Executive Dashboard', path: '/dashboard/executive' },
      { title: 'Mobile Dashboard', path: '/dashboard/mobile' }
    ]
  },
  {
    title: 'Inventory',
    icon: 'cube-3',
    children: [
      { title: 'Item Master', path: '/inventory/items' },
      { title: 'RFID Tag Master', path: '/inventory/rfid-tags' },
      { title: 'Location Master', path: '/inventory/warehouses' },
      { title: 'Reader Master', path: '/inventory/machines' },
      { title: 'Stock Ledger', path: '/inventory/stock-entries' }
    ]
  },
  {
    title: 'Operations',
    icon: 'delivery',
    children: [
      { title: 'Goods Receiving', path: '/operations/receiving' },
      { title: 'Put Away', path: '/operations/putaway' },
      { title: 'Stock Transfer', path: '/operations/transfer' },
      { title: 'Stock Adjustment', path: '/operations/adjustment' },
      { title: 'Stock Issue', path: '/operations/issue' }
    ]
  },
  {
    title: 'RFID Tracking',
    icon: 'scan-barcode',
    children: [
      { title: 'Live Monitoring', path: '/tracking/live' },
      { title: 'Item Tracking', path: '/tracking/item' },
      { title: 'Movement History', path: '/tracking/movements' },
      { title: 'Location Tracking', path: '/tracking/locations' },
      { title: 'Tag Health', path: '/tracking/tag-health' },
      { title: 'Geofencing', path: '/tracking/geofencing' }
    ]
  },
  {
    title: 'Inventory Audit',
    icon: 'clipboard',
    children: [
      { title: 'Cycle Counting', path: '/audit/cycle-count' },
      { title: 'Full Physical Count', path: '/audit/physical-count' },
      { title: 'Variance Report', path: '/audit/variance' },
      { title: 'Missing Items', path: '/audit/missing-items' }
    ]
  },
  {
    title: 'Assets',
    icon: 'briefcase',
    children: [
      { title: 'Asset Register', path: '/assets/register' },
      { title: 'Assignments', path: '/assets/assignments' },
      { title: 'Custodians', path: '/assets/custodians' },
      { title: 'Maintenance', path: '/assets/maintenance' },
      { title: 'Lifecycle', path: '/assets/lifecycle' }
    ]
  },
  {
    title: 'Reports',
    icon: 'chart-simple',
    children: [
      { title: 'Reports Dashboard', path: '/reports' },
      { title: 'Inventory Reports', path: '/reports/inventory' },
      { title: 'RFID Reports', path: '/reports/rfid' },
      { title: 'Movement Reports', path: '/reports/movement' },
      { title: 'Exception Reports', path: '/reports/exception' },
      { title: 'AI Insights', path: '/reports/ai-insights' }
    ]
  },
  {
    title: 'Alert Center',
    icon: 'notification-status',
    path: '/alerts'
  },
  {
    title: 'Administration',
    icon: 'setting-2',
    children: [
      { title: 'Users', path: '/admin/users' },
      { title: 'Roles & Permissions', path: '/admin/roles' },
      { title: 'Companies', path: '/admin/companies' },
      { title: 'Integrations & API', path: '/admin/integrations' },
      { title: 'System Settings', path: '/admin/settings' }
    ]
  }
];



export const MENU_SIDEBAR_COMPANY = (companyId: string): TMenuConfig => [
  {
    heading: 'Company Management'
  },
  {
    title: 'Dashboard',
    icon: 'element-11',
    path: `/admin/company/${companyId}`
  },
  {
    title: 'Customers',
    icon: 'profile-circle',
    path: `/admin/company/${companyId}/customers`
  },
  {
    title: 'Users',
    icon: 'users',
    path: `/admin/company/${companyId}/users`
  },
  {
    title: 'Products',
    icon: 'box',
    path: `/admin/company/${companyId}/products`
  },
  {
    title: 'Materials',
    icon: 'cube',
    path: `/admin/company/${companyId}/materials`
  }
];

export const MENU_MEGA: TMenuConfig = [
  {
    title: 'Dashboard',
    path: '/'
  },
  {
    title: 'Warehouses',
    path: '/inventory/warehouses'
  },
  {
    title: 'Machines',
    path: '/inventory/machines'
  },
  {
    title: 'Items',
    path: '/inventory/items'
  },
  {
    title: 'Stock Entries',
    path: '/inventory/stock-entries'
  }
];


export const MENU_ROOT: TMenuConfig = [
  {
    title: 'Public Profile',
    icon: 'profile-circle',
    rootPath: '/public-profile/',
    path: '/public-profile/profiles/default'
  },
  {
    title: 'Account',
    icon: 'setting-2',
    rootPath: '/account/',
    path: '/account/home/overview'
  },
  {
    title: 'Network',
    icon: 'users',
    rootPath: '/network/',
    path: '/network/get-started'
  },
  {
    title: 'Authentication',
    icon: 'security-user',
    rootPath: '/authentication/',
    path: '/authentication/get-started'
  }
];

/*
ORIGINAL MENU CONFIGURATION (Full Reference)

export const MENU_SIDEBAR: TMenuConfig = [
  {
    title: 'Dashboards',
    icon: 'element-11',
    children: [
      {
        title: 'Light Sidebar',
        path: '/'
      },
      {
        title: 'Dark Sidebar',
        path: '/dark-sidebar'
      }
    ]
  },
  {
    heading: 'User'
  },
  {
    title: 'Public Profile',
    icon: 'profile-circle',
    children: [
      {
        title: 'Profiles',
        children: [
          {
            title: 'Default',
            path: '/public-profile/profiles/default'
          },
          {
            title: 'Creator',
            path: '/public-profile/profiles/creator'
          },
          {
            title: 'Company',
            path: '/public-profile/profiles/company'
          },
          {
            title: 'NFT',
            path: '/public-profile/profiles/nft'
          },
          {
            title: 'Blogger',
            path: '/public-profile/profiles/blogger'
          },
          {
            title: 'CRM',
            path: '/public-profile/profiles/crm'
          },
          {
            title: 'More',
            collapse: true,
            collapseTitle: 'Show less',
            expandTitle: 'Show 4 more',
            dropdownProps: {
              placement: 'right-start'
            },
            children: [
              {
                title: 'Gamer',
                path: '/public-profile/profiles/gamer'
              },
              {
                title: 'Feeds',
                path: '/public-profile/profiles/feeds'
              },
              {
                title: 'Plain',
                path: '/public-profile/profiles/plain'
              },
              {
                title: 'Modal',
                path: '/public-profile/profiles/modal'
              }
            ]
          }
        ]
      },
      {
        title: 'Projects',
        children: [
          {
            title: '3 Columns',
            path: '/public-profile/projects/3-columns'
          },
          {
            title: '2 Columns',
            path: '/public-profile/projects/2-columns'
          }
        ]
      },
      {
        title: 'Works',
        path: '/public-profile/works'
      },
      {
        title: 'Teams',
        path: '/public-profile/teams'
      },
      {
        title: 'Network',
        path: '/public-profile/network'
      },
      {
        title: 'Activity',
        path: '/public-profile/activity'
      },
      {
        title: 'More',
        collapse: true,
        collapseTitle: 'Show less',
        expandTitle: 'Show 3 more',
        dropdownProps: {
          placement: 'right-start'
        },
        children: [
          {
            title: 'Campaigns - Card',
            path: '/public-profile/campaigns/card'
          },
          {
            title: 'Campaigns - List',
            path: '/public-profile/campaigns/list'
          },
          {
            title: 'Empty',
            path: '/public-profile/empty'
          }
        ]
      }
    ]
  },
  {
    title: 'My Account',
    icon: 'setting-2',
    children: [
      {
        title: 'Account',
        children: [
          {
            title: 'Get Started',
            path: '/account/home/get-started'
          },
          {
            title: 'User Profile',
            path: '/account/home/user-profile'
          },
          {
            title: 'Company Profile',
            path: '/account/home/company-profile'
          },
          {
            title: 'Settings - With Sidebar',
            path: '/account/home/settings-sidebar'
          },
          {
            title: 'Settings - Enterprise',
            path: '/account/home/settings-enterprise'
          },
          {
            title: 'Settings - Plain',
            path: '/account/home/settings-plain'
          },
          {
            title: 'Settings - Modal',
            path: '/account/home/settings-modal'
          }
        ]
      },
      {
        title: 'Billing',
        children: [
          {
            title: 'Billing - Basic',
            path: '/account/billing/basic'
          },
          {
            title: 'Billing - Enterprise',
            path: '/account/billing/enterprise'
          },
          {
            title: 'Plans',
            path: '/account/billing/plans'
          },
          {
            title: 'Billing History',
            path: '/account/billing/history'
          }
        ]
      },
      {
        title: 'Security',
        children: [
          {
            title: 'Get Started',
            path: '/account/security/get-started'
          },
          {
            title: 'Security Overview',
            path: '/account/security/overview'
          },
          {
            title: 'Allowed IP Addresses',
            path: '/account/security/allowed-ip-addresses'
          },
          {
            title: 'Privacy Settings',
            path: '/account/security/privacy-settings'
          },
          {
            title: 'Device Management',
            path: '/account/security/device-management'
          },
          {
            title: 'Backup & Recovery',
            path: '/account/security/backup-and-recovery'
          },
          {
            title: 'Current Sessions',
            path: '/account/security/current-sessions'
          },
          {
            title: 'Security Log',
            path: '/account/security/security-log'
          }
        ]
      },
      {
        title: 'Members & Roles',
        children: [
          {
            title: 'Teams Starter',
            path: '/account/members/team-starter'
          },
          {
            title: 'Teams',
            path: '/account/members/teams'
          },
          {
            title: 'Team Info',
            path: '/account/members/team-info'
          },
          {
            title: 'Members Starter',
            path: '/account/members/members-starter'
          },
          {
            title: 'Team Members',
            path: '/account/members/team-members'
          },
          {
            title: 'Import Members',
            path: '/account/members/import-members'
          },
          {
            title: 'Roles',
            path: '/account/members/roles'
          },
          {
            title: 'Permissions - Toggler',
            path: '/account/members/permissions-toggle'
          },
          {
            title: 'Permissions - Check',
            path: '/account/members/permissions-check'
          }
        ]
      },
      {
        title: 'Integrations',
        path: '/account/integrations'
      },
      {
        title: 'Notifications',
        path: '/account/notifications'
      },
      {
        title: 'API Keys',
        path: '/account/api-keys'
      },
      {
        title: 'More',
        collapse: true,
        collapseTitle: 'Show less',
        expandTitle: 'Show 3 more',
        dropdownProps: {
          placement: 'right-start'
        },
        children: [
          {
            title: 'Appearance',
            path: '/account/appearance'
          },
          {
            title: 'Invite a Friend',
            path: '/account/invite-a-friend'
          },
          {
            title: 'Activity',
            path: '/account/activity'
          }
        ]
      }
    ]
  },
  {
    title: 'Network',
    icon: 'users',
    children: [
      {
        title: 'Get Started',
        path: '/network/get-started'
      },
      {
        title: 'User Cards',
        children: [
          {
            title: 'Mini Cards',
            path: '/network/user-cards/mini-cards'
          },
          {
            title: 'Team Crew',
            path: '/network/user-cards/team-crew'
          },
          {
            title: 'Author',
            path: '/network/user-cards/author'
          },
          {
            title: 'NFT',
            path: '/network/user-cards/nft'
          },
          {
            title: 'Social',
            path: '/network/user-cards/social'
          }
        ]
      },
      {
        title: 'User Table',
        children: [
          {
            title: 'Team Crew',
            path: '/network/user-table/team-crew'
          },
          {
            title: 'App Roster',
            path: '/network/user-table/app-roster'
          },
          {
            title: 'Market Authors',
            path: '/network/user-table/market-authors'
          },
          {
            title: 'SaaS Users',
            path: '/network/user-table/saas-users'
          },
          {
            title: 'Store Clients',
            path: '/network/user-table/store-clients'
          },
          {
            title: 'Visitors',
            path: '/network/user-table/visitors'
          }
        ]
      }
    ]
  },
  {
    title: 'Authentication',
    icon: 'security-user',
    children: [
      {
        title: 'Classic',
        children: [
          {
            title: 'Sign In',
            path: '/auth/classic/login'
          },
          {
            title: 'Sign Up',
            path: '/auth/classic/signup'
          },
          {
            title: '2FA',
            path: '/auth/classic/2fa'
          },
          {
            title: 'Check Email',
            path: '/auth/classic/check-email'
          }
        ]
      },
      {
        title: 'Branded',
        children: [
          {
            title: 'Sign In',
            path: '/auth/login'
          },
          {
            title: 'Sign Up',
            path: '/auth/signup'
          }
        ]
      }
    ]
  }
];

export const MENU_ROOT: TMenuConfig = [
  {
    title: 'Public Profile',
    icon: 'profile-circle',
    rootPath: '/public-profile/',
    path: 'public-profile/profiles/default',
    childrenIndex: 2
  },
  {
    title: 'Account',
    icon: 'setting-2',
    rootPath: '/account/',
    path: '/',
    childrenIndex: 3
  },
  {
    title: 'Network',
    icon: 'users',
    rootPath: '/network/',
    path: 'network/get-started',
    childrenIndex: 4
  },
  {
    title: 'Authentication',
    icon: 'security-user',
    rootPath: '/authentication/',
    path: 'authentication/get-started',
    childrenIndex: 5
  }
];
*/
