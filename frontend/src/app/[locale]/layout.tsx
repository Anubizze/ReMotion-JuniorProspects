import type {Metadata} from "next";
import {NextIntlClientProvider} from "next-intl";
import {getMessages, getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing} from "@/i18n/routing";
import {AppHeader} from "@/components/layout/app-header";
import {AppFooter} from "@/components/layout/app-footer";
import {PageReveal} from "@/components/ui/page-reveal";
import "../globals.css";

export function generateStaticParams() { return routing.locales.map((locale) => ({locale})); }
export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> { const {locale} = await params; const t = await getTranslations({locale, namespace: "meta"}); return {title: t("title"), description: t("description")}; }

export default async function LocaleLayout({children, params}: {children: React.ReactNode; params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!routing.locales.includes(locale as "ru" | "kk")) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return <html lang={locale} data-scroll-behavior="smooth"><body><NextIntlClientProvider messages={messages}><div className="shell"><AppHeader/><main className="main"><PageReveal>{children}</PageReveal></main><AppFooter/></div></NextIntlClientProvider></body></html>;
}
