// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './components/auth/AuthProvider'
import { Navbar } from './components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ecommerce Seguro',
  description: 'Plataforma de ecommerce con seguridad en base de datos',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <AuthProvider>
                    <Navbar />
                    {children}
                    <Toaster position="top-right" />
                </AuthProvider>
            </body>
        </html>
    )
}