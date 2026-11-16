import type { ReactNode } from 'react';
import {headers} from 'next/headers';

export const metadata = {
  title: 'AROZ Webdesign Agentur',
  description: 'Web design, SEO, AI visibility and copywriting for businesses.',
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const nonce=(await headers()).get('x-nonce')||undefined;
  return (
    <html lang="en">
      <body>{children}<script nonce={nonce} src="/english-validation.js" defer /></body>
    </html>
  );
}
