import { Fragment, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Outlet, useLocation } from 'react-router-dom';
import { useMenuCurrentItem } from '@/components/menu';
import { Footer, Header, Sidebar, useDemo1Layout } from '../';
import { useMenus } from '@/providers';

const Main = () => {
  const { layout } = useDemo1Layout();
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);

  useEffect(() => {
    const bodyClass = document.body.classList;

    // Add a class to the body element
    bodyClass.add('demo1');

    // Fixed sidebar + header on desktop; collapsed state comes from the layout settings
    if (layout.options.sidebar.fixed) bodyClass.add('sidebar-fixed');
    if (layout.options.sidebar.collapse) {
      bodyClass.add('sidebar-collapse');
    } else {
      bodyClass.remove('sidebar-collapse');
    }
    if (layout.options.header.fixed) bodyClass.add('header-fixed');

    // Remove the class when the component is unmounted
    return () => {
      bodyClass.remove('demo1');
      bodyClass.remove('sidebar-fixed');
      bodyClass.remove('sidebar-collapse');
      bodyClass.remove('header-fixed');
    };
  }, [layout, pathname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      document.body.classList.add('layout-initialized');
    }, 1000); // 1000 milliseconds

    // Remove the class when the component is unmounted
    return () => {
      document.body.classList.remove('layout-initialized');
      clearTimeout(timer);
    };
  }, []);

  return (
    <Fragment>
      <Helmet>
        <title>{menuItem?.title ? `${menuItem.title} | CVS RFID Inventory` : 'CVS RFID Inventory'}</title>
      </Helmet>

      <Sidebar />

      <div className="wrapper flex grow flex-col min-w-0">
        <Header />

        <main className="grow content pt-5 lg:pt-7.5" role="content">
          <Outlet />
        </main>

        <Footer />
      </div>
    </Fragment>
  );
};

export { Main };
