import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfigProvider, theme } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ManHunt",
  description: "Location-based tracking application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ConfigProvider
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              colorPrimary: "#000000",
              borderRadius: 5,
              colorText: "#000000",
              fontSize: 16,
              colorBgContainer: "#ffffff",
            },
            components: {
              Button: {
                colorPrimary: "#000000",
                algorithm: true,
                controlHeight: 35,
              },
              Input: {
                colorBorder: "#e8e8e8",
                colorTextPlaceholder: "#bbbbbb",
                algorithm: false,
              },
              Form: {
                labelColor: "#000000",
                algorithm: theme.defaultAlgorithm,
              },
            },
          }}
        >
          <AntdRegistry>{children}</AntdRegistry>
        </ConfigProvider>
      </body>
    </html>
  );
}