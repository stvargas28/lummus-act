import { NavLink } from 'react-router-dom';
import { useActiveRole } from '../../hooks/useActiveRole';
import type { Role } from '../../api/types';
import './Sidebar.css';

interface NavItem {
  label: string;
  to: string;
  icon: string;
  roles: Role[];
  /** Tiny badge — populated for items with a count (e.g., Deliverables, Alerts). */
  badgeKey?: 'deliverables' | 'reviews' | 'alerts';
  badgeTone?: 'accent' | 'danger' | 'muted';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: '▦', roles: ['LEAD', 'PM'] },
  { label: 'My Work', to: '/my-work', icon: '◉', roles: ['LEAD', 'ENGINEER'] },
  {
    label: 'Deliverables',
    to: '/deliverables',
    icon: '≡',
    roles: ['LEAD', 'PM'],
    badgeKey: 'deliverables',
    badgeTone: 'danger',
  },
  {
    label: 'My Reviews',
    to: '/my-reviews',
    icon: '✓',
    roles: ['LEAD', 'ENGINEER', 'PM'],
    badgeKey: 'reviews',
    badgeTone: 'accent',
  },
  {
    label: 'Alerts',
    to: '/alerts',
    icon: '!',
    roles: ['LEAD', 'PM'],
    badgeKey: 'alerts',
    badgeTone: 'danger',
  },
];

const ACCOUNT_ITEMS: NavItem[] = [
  { label: 'Settings', to: '/settings', icon: '⚙', roles: ['LEAD'] },
];

// Synthetic counts for now — wired to real counts in a later phase.
const STUB_BADGES: Record<string, number> = { deliverables: 412, reviews: 7, alerts: 3 };

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const role = useActiveRole();

  const visibleNav = role ? NAV_ITEMS.filter((it) => it.roles.includes(role)) : [];
  const visibleAccount = role ? ACCOUNT_ITEMS.filter((it) => it.roles.includes(role)) : [];

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__head">
        <div className="sidebar__brand">
          <span className="sidebar__brand-mark mono" aria-hidden="true">A</span>
          {!collapsed && (
            <div className="sidebar__brand-text">
              <span className="sidebar__brand-name">ACT</span>
              <span className="sidebar__brand-tagline mono">Action · Coordination · Tracker</span>
            </div>
          )}
        </div>
      </div>

      {!collapsed && <div className="sidebar__section-label">Workspace</div>}
      <nav className="sidebar__nav">
        {visibleNav.map((item) => (
          <NavItemLink key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {visibleAccount.length > 0 && (
        <>
          {!collapsed && <div className="sidebar__section-label">Account</div>}
          <nav className="sidebar__nav">
            {visibleAccount.map((item) => (
              <NavItemLink key={item.to} item={item} collapsed={collapsed} />
            ))}
          </nav>
        </>
      )}

      <div className="sidebar__spacer" />

      <div className="sidebar__footer">
        {!collapsed ? (
          <>
            <div className="sidebar__sync">
              <span className="sidebar__sync-dot" aria-hidden="true" />
              <span className="sidebar__sync-label mono">FusionLive · synced</span>
            </div>
            <div className="sidebar__version mono">v0.1.0 · build 001</div>
          </>
        ) : (
          <span className="sidebar__sync-dot sidebar__sync-dot--solo" aria-hidden="true" />
        )}
      </div>
    </aside>
  );
}

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const badge = item.badgeKey ? STUB_BADGES[item.badgeKey] : null;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) => `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
      title={collapsed ? item.label : undefined}
    >
      <span className="sidebar__nav-icon" aria-hidden="true">
        {item.icon}
      </span>
      {!collapsed && <span className="sidebar__nav-label">{item.label}</span>}
      {!collapsed && badge !== null && (
        <span className={`sidebar__nav-badge sidebar__nav-badge--${item.badgeTone ?? 'muted'} mono`}>{badge}</span>
      )}
    </NavLink>
  );
}
