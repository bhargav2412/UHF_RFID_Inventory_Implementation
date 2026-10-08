/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import { useResponsive, useViewport } from '@/hooks';
import { useDemo1Layout } from '../';
import { SidebarContent, SidebarHeader } from './';
import { BrandMark } from './SidebarHeader';
import clsx from 'clsx';
import { getHeight } from '@/utils';
import { usePathname } from '@/providers';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';

export const Sidebar = () => {
  const selfRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [scrollableHeight, setScrollableHeight] = useState<number>(0);
  const scrollableOffset = 40;
  const [viewportHeight] = useViewport();
  const { pathname, prevPathname } = usePathname();


  useEffect(() => {
    if (headerRef.current) {
      const headerHeight = getHeight(headerRef.current);
      const availableHeight = viewportHeight - headerHeight - scrollableOffset;
      setScrollableHeight(availableHeight);
    } else {
      setScrollableHeight(viewportHeight);
    }
  }, [viewportHeight]);

  const desktopMode = useResponsive('up', 'lg');
  const { mobileSidebarOpen, setSidebarMouseLeave, setMobileSidebarOpen } = useDemo1Layout();
  const { layout } = useDemo1Layout();
  // Dark navy sidebar; the `dark` class switches Metronic tokens to their dark values inside it
  const themeClass: string =
    layout.options.sidebar.theme === 'dark' || pathname === '/dark-sidebar'
      ? 'dark [&.dark]:bg-[#0f172a] lg:!border-e-[#1e293b]'
      : 'dark:bg-coal-600';

  const handleMobileSidebarClose = () => {
    setMobileSidebarOpen(false);
  };

  const handleMouseEnter = () => {
    setSidebarMouseLeave(false);
  };

  const handleMouseLeave = () => {
    setSidebarMouseLeave(true);
  };

  const renderContent = () => {
    return (
      <div
        ref={selfRef}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        className={clsx(
          'sidebar bg-light lg:border-e lg:border-e-gray-200 dark:border-e-coal-100 lg:fixed lg:top-0 lg:bottom-0 lg:start-0 lg:z-20 lg:flex flex-col items-stretch shrink-0 h-full lg:h-auto',
          themeClass
        )}
      >
        {desktopMode ? (
          <SidebarHeader ref={headerRef} />
        ) : (
          <div className="flex items-center gap-2.5 px-5 pt-5">
            <BrandMark size="sm" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-gray-900">CVS RFID</span>
              <span className="text-2xs font-medium uppercase tracking-wider text-gray-500">
                Inventory Suite
              </span>
            </div>
          </div>
        )}
        <SidebarContent {...(desktopMode && { height: scrollableHeight })} />
      </div>
    );
  };

  useEffect(() => {
    // Hide drawer on route chnage after menu link click
    if (!desktopMode && prevPathname !== pathname) {
      handleMobileSidebarClose();
    }
  }, [desktopMode, pathname, prevPathname]);

  // if (pathname === '/') return null;


  if (desktopMode) {
    return renderContent();
  } else {
    return (
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          className="border-0 p-0 w-[--tw-sidebar-width] scrollable-y-auto"
          forceMount={true}
          side="left"
          close={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Mobile Menu</SheetTitle>
            <SheetDescription></SheetDescription>
          </SheetHeader>
          {renderContent()}
        </SheetContent>
      </Sheet>
    );
  }
};
