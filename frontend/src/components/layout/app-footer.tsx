import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";

export function AppFooter() {
  const t = useTranslations("footer");
  return <footer className="footer"><div className="container footerInner"><span>© 2026 ReMotion · {t("note")}</span><div className="footerLinks"><Link href="/technology">{t("technology")}</Link><Link href="/history">{t("history")}</Link><Link href="/">{t("privacy")}</Link></div></div></footer>;
}
