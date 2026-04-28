import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider/next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Provider } from "@/components/providers/provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "dolphinflow - Solana Automation Platform",
  description: "Create workflows that react to on-chain events and trigger on-chain actions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <RootProvider theme={{ enabled: false }}>
            <Provider>
              <main>{children}</main>
            </Provider>
          </RootProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
