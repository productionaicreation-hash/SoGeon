
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SoGeon | Your World, Your Future",
  description:
    "Welcome to SoGeon, a next-generation global digital platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: 0,
        background: "#080808",
        fontFamily: "Arial, sans-serif"
      }}>
        {children}
      </body>
    </html>
  );
  }
