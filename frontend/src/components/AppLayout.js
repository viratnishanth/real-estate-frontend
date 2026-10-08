'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Toaster } from 'react-hot-toast';

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem('token');
    
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (!token && pathname !== '/login') {
      router.push('/login');
    } else if (token) {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  // Prevent Next.js Hydration errors by matching Server and Client renders
  if (!isClient) {
    if (pathname === '/login') {
      return <main>{children}</main>;
    }
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0d1e3a', color: 'white'}}>Loading CRM...</div>;
  }

  // Once client loads, show login directly if on login page
  if (pathname === '/login') {
    return (
      <main>
        <Toaster position="top-right" />
        {children}
      </main>
    );
  }

  // Hide protected layout if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="app-container">
      <Toaster position="top-right" />
      <div className="mobile-overlay" onClick={() => {
        document.querySelector('.sidebar')?.classList.remove('mobile-open');
        document.querySelector('.mobile-overlay')?.classList.remove('show');
      }}></div>
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
