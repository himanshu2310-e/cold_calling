import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "CodeConnect CRM — Smart Cold Calling & Lead Management",
  description:
    "Premium SaaS CRM for cold calling teams. Manage leads, track calls, upload recordings, schedule follow-ups, and analyze performance — all in one place.",
  keywords: [
    "CRM",
    "cold calling",
    "lead management",
    "sales",
    "call tracking",
    "recordings",
    "analytics",
  ],
  authors: [{ name: "CodeConnect" }],
  openGraph: {
    title: "CodeConnect CRM",
    description: "Smart Cold Calling & Lead Management System",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Strip bis_skin_checked attributes injected by browser extensions before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                      if (node.nodeType === 1) {
                        if (node.hasAttribute('bis_skin_checked')) {
                          node.removeAttribute('bis_skin_checked');
                        }
                        node.querySelectorAll('[bis_skin_checked]').forEach((el) => {
                          el.removeAttribute('bis_skin_checked');
                        });
                      }
                    });
                  });
                });
                observer.observe(document.documentElement, {
                  childList: true,
                  subtree: true
                });
              })();
            `
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
