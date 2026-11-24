"use client";

import {Menu, X} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useState} from "react";
import {Link, usePathname, useRouter} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";

const links = [
  ["/", "home"], ["/session/prepare", "prepare"], ["/session/active", "active"],
  ["/session/results", "results"], ["/history", "history"], ["/technology", "technology"]
] as const;

export function AppHeader() {
  const t = useTranslations();
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const setLocale = (next: AppLocale) => { localStorage.setItem("remotion:locale", next); router.replace(pathname, {locale: next}); };
  const nav = (mobile = false) => links.map(([href, label]) => (
    <Link key={href} href={href} className={`navLink ${pathname === href ? "active" : ""}`} onClick={() => mobile && setOpen(false)}>{t(`nav.${label}`)}</Link>
  ));
  return <header className="header">
    <div className="container headerInner">
      <Link href="/" className="brand"><span className="brandMark">R</span><span>ReMotion</span><span className="brandTag">{t("common.brandTag")}</span></Link>
      <nav className="nav" aria-label={t("nav.menu")}>{nav()}</nav>
      <div className="locale" aria-label={t("nav.language")}><button className={locale === "ru" ? "active" : ""} onClick={() => setLocale("ru")}>RU</button><button className={locale === "kk" ? "active" : ""} onClick={() => setLocale("kk")}>KZ</button></div>
      <button className="menuButton" aria-label={open ? t("nav.close") : t("nav.menu")} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={21}/> : <Menu size={21}/>}</button>
    </div>
    <nav className={`container mobileNav ${open ? "open" : ""}`}>{nav(true)}</nav>
  </header>;
}
