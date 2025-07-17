import React from 'react';
import type { ReactNode } from 'react';

/**
 * Usage:
 *
 * <Layout>
 *   <Layout.Header> ...toolbar... </Layout.Header>
 *   <Layout.Body>
 *     <Layout.Left> ...mods... </Layout.Left>
 *     <Layout.Center> ...canvas... </Layout.Center>
 *     <Layout.Right> ...fx... </Layout.Right>
 *   </Layout.Body>
 * </Layout>
 *
 * Header facoltativo.
 */

interface RegionProps {
  children?: ReactNode;
  className?: string;
}

export function Layout({ children }: { children?: ReactNode }) {
  return (
    <div className="waff-layout-root">
      {children}
    </div>
  );
}

function Header({ children, className = '' }: RegionProps) {
  return (
    <header className={`waff-layout-header ${className}`}>
      {children}
    </header>
  );
}

function Body({ children, className = '' }: RegionProps) {
  return (
    <div className={`waff-layout-body ${className}`}>
      {children}
    </div>
  );
}

function Left({ children, className = '' }: RegionProps) {
  return (
    <aside className={`waff-layout-left ${className}`}>
      {children}
    </aside>
  );
}

function Center({ children, className = '' }: RegionProps) {
  return (
    <main className={`waff-layout-center ${className}`}>
      {children}
    </main>
  );
}

function Right({ children, className = '' }: RegionProps) {
  return (
    <aside className={`waff-layout-right ${className}`}>
      {children}
    </aside>
  );
}

/* namespace-like attachment */
Layout.Header = Header;
Layout.Body = Body;
Layout.Left = Left;
Layout.Center = Center;
Layout.Right = Right;
