import { NavLink } from 'react-router-dom';
import { useActiveRole } from '../../hooks/useActiveRole';
import { useAuth } from '../../hooks/useAuth';
import { useDeliverables } from '../../hooks/useDeliverables';
import { usePendingReviewsForUser } from '../../hooks/usePendingReviewsForUser';
import { useProject } from '../../hooks/useProject';
import type { Deliverable, PendingReview, Role } from '../../api/types';
import './Sidebar.css';

interface NavItem {
  label: string;
  to: string;
  icon: string;
  roles: Role[];
  badgeKey?: 'deliverables' | 'my-work' | 'reviews';
}

interface NavBadge {
  value: number;
  tone: 'success' | 'accent' | 'warning' | 'danger' | 'muted';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: '▦', roles: ['LEAD', 'PM'] },
  { label: 'My Work', to: '/my-work', icon: '◉', roles: ['LEAD', 'ENGINEER'], badgeKey: 'my-work' },
  {
    label: 'Deliverables',
    to: '/deliverables',
    icon: '≡',
    // Engineers see this tab as read-only (UI §2.1, §10.1, MVP §8.4).
    roles: ['LEAD', 'PM', 'ENGINEER'],
    badgeKey: 'deliverables',
  },
  {
    label: 'My Reviews',
    to: '/my-reviews',
    icon: '✓',
    roles: ['LEAD', 'ENGINEER', 'PM'],
    badgeKey: 'reviews',
  },
  {
    label: 'Alert History',
    to: '/alert-history',
    icon: '!',
    roles: ['LEAD', 'PM'],
  },
];

const ACCOUNT_ITEMS: NavItem[] = [
  // PM gets Settings access too (UI §10.1 v2.1). Lead-only sections inside
  // Settings remain restricted at the page level.
  { label: 'Settings', to: '/settings', icon: '⚙', roles: ['LEAD', 'PM'] },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const role = useActiveRole();
  const { projectId } = useProject();
  const { persona } = useAuth();
  const deliverables = useDeliverables(projectId ?? '');
  const reviews = usePendingReviewsForUser(projectId ?? '', persona?.user_id ?? null);
  const badges = buildBadges(deliverables.data ?? [], reviews.data ?? [], role, persona?.user_id ?? null);

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
          <NavItemLink
            key={item.to}
            item={item}
            collapsed={collapsed}
            badge={item.badgeKey ? badges[item.badgeKey] : null}
          />
        ))}
      </nav>

      {visibleAccount.length > 0 && (
        <>
          {!collapsed && <div className="sidebar__section-label">Account</div>}
          <nav className="sidebar__nav">
            {visibleAccount.map((item) => (
              <NavItemLink key={item.to} item={item} collapsed={collapsed} badge={null} />
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

function NavItemLink({
  item,
  collapsed,
  badge,
}: {
  item: NavItem;
  collapsed: boolean;
  badge: NavBadge | null;
}) {
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
      {!collapsed && badge !== null && badge.value > 0 && (
        <span className={`sidebar__nav-badge sidebar__nav-badge--${badge.tone} mono`}>{badge.value}</span>
      )}
    </NavLink>
  );
}

function buildBadges(
  deliverables: Deliverable[],
  reviews: PendingReview[],
  role: Role | null,
  userId: string | null,
): Record<'deliverables' | 'my-work' | 'reviews', NavBadge | null> {
  const basis = role === 'PM' ? 'client' : 'internal';
  const projectHealth = role === 'ENGINEER' ? null : healthBadge(deliverables, basis);
  const mine = userId ? deliverables.filter((d) => d.owner_user_id === userId) : [];
  const myWorkHealth = healthBadge(
    mine.filter((d) => d.act_phase === 'NOT_STARTED' || d.act_phase === 'DRAFT' || d.act_phase === 'REVISING'),
    'internal',
  );

  return {
    deliverables: projectHealth,
    'my-work': myWorkHealth,
    reviews: reviewBadge(reviews),
  };
}

function reviewBadge(reviews: PendingReview[]): NavBadge | null {
  if (reviews.length === 0) return null;

  const overdue = reviews.filter((review) => review.days_since_sent >= 4).length;
  if (overdue > 0) return { value: overdue, tone: 'danger' };

  const atRisk = reviews.filter((review) => review.days_since_sent >= 2).length;
  if (atRisk > 0) return { value: atRisk, tone: 'warning' };

  return { value: reviews.length, tone: 'accent' };
}

function healthBadge(rows: Deliverable[], basis: 'internal' | 'client'): NavBadge | null {
  const active = rows.filter((d) => d.act_phase !== 'ISSUED');
  if (active.length === 0) return null;

  const daysFor = (d: Deliverable) => (basis === 'client' ? d.days_remaining_client : d.days_remaining_internal);
  const overdue = active.filter((d) => {
    const days = daysFor(d);
    return days !== null && days < 0;
  }).length;
  if (overdue > 0) return { value: overdue, tone: 'danger' };

  const atRiskWindow = basis === 'client' ? 7 : 5;
  const atRisk = active.filter((d) => {
    const days = daysFor(d);
    return days !== null && days >= 0 && days <= atRiskWindow;
  }).length;
  if (atRisk > 0) return { value: atRisk, tone: 'warning' };

  return { value: active.length, tone: 'success' };
}
