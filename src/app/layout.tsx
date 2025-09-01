import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Judicial Management System - Republic of Zambia",
  description: "Comprehensive case management system for the Zambian Judiciary with role-based access control.",
  keywords: ["Judicial Management", "Zambia", "Courts", "Case Management", "Legal System"],
  authors: [{ name: "Republic of Zambia Judiciary" }],
  openGraph: {
    title: "Judicial Management System - Zambia",
    description: "Comprehensive case management system for the Zambian Judiciary",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
