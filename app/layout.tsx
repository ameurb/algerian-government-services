import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
});

const cairo = Cairo({ 
  subsets: ['arabic'],
  variable: '--font-cairo'
});

export const metadata: Metadata = {
  title: 'مساعد الخدمات الحكومية الذكي | AI Government Services Assistant',
  description: 'مساعد ذكي مدعوم بالذكاء الاصطناعي للخدمات الحكومية الجزائرية - AI-powered assistant for Algerian government services',
  keywords: ['Algeria', 'Government Services', 'AI Assistant', 'خدمات حكومية', 'مساعد ذكي'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="auto">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${cairo.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}