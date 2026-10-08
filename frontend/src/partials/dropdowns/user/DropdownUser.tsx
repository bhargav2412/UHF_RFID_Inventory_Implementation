import { ChangeEvent, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useAuthContext } from '@/auth';
import { useLanguage } from '@/i18n';
import { toAbsoluteUrl } from '@/utils';
import { DropdownUserLanguages } from './DropdownUserLanguages';
import { useSettings } from '@/providers/SettingsProvider';
import { DefaultTooltip, KeenIcon } from '@/components';
import {
  MenuItem,
  MenuLink,
  MenuSub,
  MenuTitle,
  MenuSeparator,
  MenuArrow,
  MenuIcon
} from '@/components/menu';

interface IDropdownUserProps {
  menuItemRef: any;
}

const DropdownUser = ({ menuItemRef }: IDropdownUserProps) => {
  const { settings, storeSettings } = useSettings();
  const { logout, currentUser } = useAuthContext();
  const { isRTL } = useLanguage();

  const handleThemeMode = (event: ChangeEvent<HTMLInputElement>) => {
    const newThemeMode = event.target.checked ? 'dark' : 'light';

    storeSettings({
      themeMode: newThemeMode
    });
  };

  const buildHeader = () => {
    return (
      <div className="flex items-center justify-between px-5 py-4 gap-1.5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full border-2 border-success bg-primary-light text-2sm font-semibold text-primary">
            {`${currentUser?.first_name?.[0] ?? ''}${currentUser?.last_name?.[0] ?? ''}`.toUpperCase() || 'U'}
          </span>
          <div className="flex flex-col">
            <span className="text-sm text-gray-800 font-semibold leading-none">
              {currentUser?.first_name} {currentUser?.last_name}
            </span>
            <span className="text-xs text-gray-600 font-medium mt-1">
              {currentUser?.role}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const buildFooter = () => {
    return (
      <div className="flex flex-col p-2">
        <div className="menu-item mb-0.5">
          <Link to="/admin/settings" className="menu-link">
            <span className="menu-icon">
              <KeenIcon icon="setting-2" />
            </span>
            <span className="menu-title">System Settings</span>
          </Link>
        </div>
        <div className="menu-item mb-0.5">
          <Link to="/alerts" className="menu-link">
            <span className="menu-icon">
              <KeenIcon icon="notification-status" />
            </span>
            <span className="menu-title">Alert Center</span>
          </Link>
        </div>
        <MenuSeparator />
        <div className="menu-item mb-0.5">
          <div className="menu-link">
            <span className="menu-icon">
              <KeenIcon icon="moon" />
            </span>
            <span className="menu-title">
              Dark Mode
            </span>
            <label className="switch switch-sm">
              <input
                name="theme"
                type="checkbox"
                checked={settings.themeMode === 'dark'}
                onChange={handleThemeMode}
                value="1"
              />
            </label>
          </div>
        </div>

        <div className="menu-item mt-1">
          <button onClick={logout} className="btn btn-sm btn-light w-full justify-center">
            Logout
          </button>
        </div>
      </div>
    );
  };

  return (
    <MenuSub
      className="menu-default light:border-gray-300 w-[200px] md:w-[250px]"
      rootClassName="p-0"
    >
      {buildHeader()}
      {buildFooter()}
    </MenuSub>
  );
};

export { DropdownUser };
