import "./globals.css";
import "./semantic.min.css";
import "./app.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"></meta>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
