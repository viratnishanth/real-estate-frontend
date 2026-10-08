import './globals.css';
import AppLayout from '@/components/AppLayout';

export const metadata = {
  title: 'Real Estate CRM',
  description: 'Manage Leads, Properties, and Bookings',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
