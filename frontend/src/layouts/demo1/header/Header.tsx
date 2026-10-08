import clsx from 'clsx';
import { useEffect } from 'react';
import { Container } from '@/components/container';
import { HeaderLogo, HeaderTopbar } from './';
import { HeaderSearch } from './HeaderSearch';
import { useDemo1Layout } from '../';

const Header = () => {
  const { headerSticky } = useDemo1Layout();

  useEffect(() => {
    if (headerSticky) {
      document.body.setAttribute('data-sticky-header', 'on');
    } else {
      document.body.removeAttribute('data-sticky-header');
    }
  }, [headerSticky]);

  return (
    <header
      className={clsx(
        'header fixed top-0 z-10 start-0 end-0 flex items-stretch shrink-0 border-b border-transparent bg-[--tw-page-bg] dark:bg-[--tw-page-bg-dark]',
        headerSticky && 'shadow-sm border-gray-200'
      )}
    >
      <Container className="flex justify-between items-center gap-3 lg:gap-4">
        <HeaderLogo />
        <HeaderSearch className="hidden md:flex" />
        <HeaderTopbar />
      </Container>
    </header>
  );
};

export { Header };
