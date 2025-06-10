import { GeistSans, GeistMono } from 'geist/font'
import './globals.css'

export const metadata = {
  title: 'Argus',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}
