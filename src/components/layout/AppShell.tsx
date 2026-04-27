import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import './AppShell.css';

const STORAGE_KEY = 'act:sidebarCollapsed';

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === '1',
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  const toggle = () => setCollapsed((c) => !c);

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} />
      <div className="app-shell__main">
        <Topbar collapsed={collapsed} onToggleSidebar={toggle} />
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  );
}
