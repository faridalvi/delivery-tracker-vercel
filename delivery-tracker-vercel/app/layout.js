export const metadata = {
  title: 'Delivery Tracker',
  description: 'Consent-based delivery location tracking',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
