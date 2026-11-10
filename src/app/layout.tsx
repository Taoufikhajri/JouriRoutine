import type { Metadata, Viewport } from "next";
import { Baloo_2, Baloo_Bhaijaan_2, Nunito } from "next/font/google";
import { APP } from "@/config/app";
import { LOCALES } from "@/i18n";
import { I18nProvider } from "@/i18n/client";
import { getLocale } from "@/i18n/server";
import "./globals.css";

const baloo = Baloo_2({ variable: "--font-baloo", subsets: ["latin", "latin-ext"], weight: ["500", "600", "700", "800"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin", "latin-ext"], weight: ["400", "600", "700", "800"] });
// Arabic companion of Baloo 2 — same rounded, friendly look.
const balooAr = Baloo_Bhaijaan_2({ variable: "--font-baloo-ar", subsets: ["arabic"], weight: ["400", "500", "600", "700", "800"], preload: false });

export const metadata: Metadata = {
  title: { default: APP.name, template: `%s · ${APP.name}` },
  description: APP.subtitle,
  applicationName: APP.name,
  appleWebApp: { capable: true, title: APP.shortName, statusBarStyle: "default" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: APP.themeColor,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={LOCALES[locale].dir}
      className={`${baloo.variable} ${nunito.variable} ${balooAr.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
