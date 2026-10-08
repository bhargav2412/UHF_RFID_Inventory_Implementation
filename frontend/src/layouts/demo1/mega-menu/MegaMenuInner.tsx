import { Fragment, useEffect, useState } from 'react';
import { TMenuConfig, MenuItem, MenuLink, MenuTitle, Menu } from '@/components/menu';
import { useDemo1Layout } from '../Demo1LayoutProvider';
import { MENU_MEGA } from '@/config';

const MegaMenuInner = () => {
  const [disabled, setDisabled] = useState(true);
  const { layout, sidebarMouseLeave, setMegaMenuEnabled } = useDemo1Layout();

  useEffect(() => {
    setDisabled(true);
    const timer = setTimeout(() => {
      setDisabled(false);
    }, 100); 

    return () => clearTimeout(timer);
  }, [layout.options.sidebar.collapse, sidebarMouseLeave]);

  useEffect(() => {
    setMegaMenuEnabled(true);
  }, []);

  const build = (items: TMenuConfig) => {
    const linkClass =
      'menu-link text-sm text-gray-700 font-medium menu-link-hover:text-primary menu-item-active:text-gray-900 menu-item-show:text-primary menu-item-here:text-gray-900';
    const titleClass = 'text-nowrap';

    return items.map((item, index) => (
      <MenuItem key={index}>
        <MenuLink path={item.path} className={linkClass}>
          <MenuTitle className={titleClass}>{item.title}</MenuTitle>
        </MenuLink>
      </MenuItem>
    ));
  };

  return (
    <Menu
      multipleExpand={true}
      disabled={disabled}
      highlight={true}
      className="flex-col lg:flex-row gap-2 lg:gap-5 p-5 lg:p-0"
    >
      {build(MENU_MEGA)}
    </Menu>
  );
};

export { MegaMenuInner };
