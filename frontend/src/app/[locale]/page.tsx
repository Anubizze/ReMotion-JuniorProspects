import {ArrowRight, Camera, CheckCircle2, ClipboardCheck, LockKeyhole, Play, ShieldCheck} from "lucide-react";
import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";

export default function HomePage() {
  const t = useTranslations("home");
  const c = useTranslations("common");
  return <div className="container">
    <section className="hero card">
      <div className="heroContent"><span className="eyebrow">{t("eyebrow")}</span><h1>{t("title")}</h1><p>{t("subtitle")}</p><div className="buttonRow"><Link className="btn btnPrimary" href="/session/prepare">{t("start")}<ArrowRight size={19}/></Link><Link className="btn btnSecondary" href="/history">{t("history")}</Link></div></div>
      <article className="exerciseCard card"><div className="exerciseIcon"><Play size={26}/></div><span className="muted">{t("exerciseLabel")}</span><h3>{t("exercise")}</h3><p className="muted">{t("exerciseDesc")}</p><div className="exerciseMeta"><span><strong>E02</strong>{t("exerciseLabel")}</span><span><strong>RU / KZ</strong>{t("ready")}</span></div></article>
    </section>
    <section className="section"><div className="sectionHead"><h2>{t("howTitle")}</h2><p>{c("medical")}</p></div><div className="steps">
      <article className="step card"><span className="stepNo"><Camera size={21}/></span><h3>{t("step1Title")}</h3><p className="muted">{t("step1Text")}</p></article>
      <article className="step card"><span className="stepNo"><CheckCircle2 size={21}/></span><h3>{t("step2Title")}</h3><p className="muted">{t("step2Text")}</p></article>
      <article className="step card"><span className="stepNo"><ClipboardCheck size={21}/></span><h3>{t("step3Title")}</h3><p className="muted">{t("step3Text")}</p></article>
    </div><div className="privacyStrip card"><LockKeyhole size={28}/><div><h3>{t("privacyTitle")}</h3><p className="muted">{t("privacyText")}</p></div><ShieldCheck size={24} style={{marginLeft: "auto"}}/></div></section>
  </div>;
}
