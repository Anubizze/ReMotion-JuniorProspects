import {FlaskConical} from "lucide-react";
import {useTranslations} from "next-intl";

export function DemoBanner() { const t = useTranslations("common"); return <div className="demoBanner" role="status"><FlaskConical size={20}/><span><strong>{t("demo")}</strong>{t("demoHint")}</span></div>; }
