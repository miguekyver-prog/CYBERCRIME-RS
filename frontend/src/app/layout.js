import "./globals.css";

export const metadata = {
  title: "CyberSafe",
  description: "Cybercrime Reporting System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className="bg-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}