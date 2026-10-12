import { toAbsoluteUrl } from '@/utils';

const ScreenLoader = () => {
  return (
    <div className="flex flex-col items-center gap-2 justify-center fixed inset-0 z-50 bg-light transition-opacity duration-700 ease-in-out">
      <img
        className="h-[56px] w-auto max-w-none animate-pulse"
        src={toAbsoluteUrl('/media/app/corevista-mark.png')}
        alt="CoreVista Systems"
      />
      <div className="text-gray-500 font-medium text-sm">Loading...</div>
    </div>
  );
};

export { ScreenLoader };
