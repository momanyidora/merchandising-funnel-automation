import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Merchandise Management System",
  description: "Merchandise Management System",
};


export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
