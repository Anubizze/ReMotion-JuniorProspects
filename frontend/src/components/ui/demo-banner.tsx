import {FlaskConical} from "lucide-react";
import {useTranslations} from "next-intl";
import {demoMode} from "@/lib/api/client";

export function DemoBanner() { const t = useTranslations("common"); if (!demoMode) return null; return <div className="demoBanner" role="status"><FlaskConical size={20}/><span><strong>{t("demo")}</strong>{t("demoHint")}</span></div>; }
