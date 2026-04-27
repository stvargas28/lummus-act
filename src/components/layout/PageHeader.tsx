import type { ReactNode } from 'react';
import { SyncIndicator } from '../shared/SyncIndicator';
import './PageHeader.css';

interface PageHeaderProps {
  /** Breadcrumb segments — rendered in mono small caps. */
  crumbs: string[];
  title: string;
  rightSlot?: ReactNode;
}

export function PageHeader({ crumbs, title, rightSlot }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__left">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={`${c}-${i}`} className="breadcrumb__seg">
              {c}
              {i < crumbs.length - 1 && <span className="breadcrumb__sep" aria-hidden="true">/</span>}
            </span>
          ))}
        </nav>
        <h1 className="page-header__title">{title}</h1>
      </div>
      <div className="page-header__right">
        {rightSlot ?? <SyncIndicator variant="pill" />}
      </div>
    </header>
  );
}
