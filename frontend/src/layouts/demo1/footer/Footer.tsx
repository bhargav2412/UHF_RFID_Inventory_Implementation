import { Container } from '@/components/container';
import { generalSettings } from '@/config';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-3 py-5">
          <div className="flex order-2 md:order-1 gap-2 font-normal text-2sm">
            <span className="text-gray-500">{currentYear} &copy;</span>
            <span className="text-gray-600">CoreVista Systems · RFID Inventory</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export { Footer };
