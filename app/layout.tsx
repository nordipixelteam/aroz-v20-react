import type { ReactNode } from 'react';

export const metadata = {
  title: 'AROZ Webdesign Agentur',
  description: 'Webdesign, SEO, KI-Sichtbarkeit und Copywriting für Unternehmen.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}