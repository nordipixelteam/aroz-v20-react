import type { ReactNode } from 'react';
import './avault-base.css';
import './theme.css';

export default function AvaultLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}