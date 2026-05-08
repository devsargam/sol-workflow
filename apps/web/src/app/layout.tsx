import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import { cookies } from "next/headers";
import { RootProvider } from "fumadocs-ui/provider/next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Provider } from "@/components/providers/provider";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { decodeWalletSession, WALLET_SESSION_COOKIE_NAME } from "@/lib/auth-session";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialWalletSession = decodeWalletSession(
    cookieStore.get(WALLET_SESSION_COOKIE_NAME)?.value
  );

  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-background antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <RootProvider theme={{ enabled: false }}>
            <Provider initialWalletSession={initialWalletSession}>
              <TooltipProvider>
                <main>{children}</main>
                <Toaster position="bottom-right" />
              </TooltipProvider>
            </Provider>
          </RootProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
