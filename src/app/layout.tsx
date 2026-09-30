import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LYAXIS labs™ — ZERO VIP Gatekeeper (All-in-One Vercel)',
  description:
    'Consola táctica ultra-segura de emisión y gestión criptográfica de tokens para Oscar Naim Ambrocio Aguirre (Fundador de LYAXIS labs™).',
  robots: 'noindex, nofollow',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300D9FF"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.54-3.15 8.79-7 9.88-3.85-1.09-7-5.34-7-9.88V6.3l7-3.12z"/></svg>',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#050505] text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
