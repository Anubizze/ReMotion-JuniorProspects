import {Activity, BrainCircuit, Camera, ChartNoAxesCombined, FileCheck2, GitBranch, ScanLine, TriangleAlert} from "lucide-react";
import {useTranslations} from "next-intl";
import {DemoBanner} from "@/components/ui/demo-banner";

export default function TechnologyPage() {
  const t = useTranslations("technology");
  const steps = [[Camera, "flow1"], [ScanLine, "flow2"], [Activity, "flow3"], [BrainCircuit, "flow4"], [FileCheck2, "flow5"]] as const;
  return <div className="container"><DemoBanner/><header className="pageHead"><div className="pageHeadText"><span className="eyebrow">{t("eyebrow")}</span><h1>{t("title")}</h1><p>{t("subtitle")}</p></div></header>
    <section className="flow" aria-label={t("title")}>{steps.map(([Icon, key], index) => <article className="flowStep card" key={key}><Icon size={30}/><div><span className="muted">0{index + 1}</span><h3>{t(key)}</h3></div></article>)}</section>
    <section className="techGrid"><article className="techCard card"><ScanLine size={30}/><h2>{t("poseTitle")}</h2><p>{t("poseText")}</p></article><article className="techCard card"><BrainCircuit size={30}/><h2>{t("modelTitle")}</h2><p>{t("modelText")}</p></article>
      <article className="metricsUnavailable card"><div><ChartNoAxesCombined size={30}/><h2>{t("metricsTitle")}</h2><h3 style={{marginTop:18}}>{t("unavailable")}</h3><p className="muted">{t("unavailableText")}</p></div><div className="metricGhosts"><div className="metricGhost"><strong>—</strong>{t("balanced")}</div><div className="metricGhost"><strong>—</strong>{t("f1")}</div><div className="metricGhost"><strong>—</strong>{t("matrix")}</div><div className="metricGhost"><strong>—</strong>{t("baseline")}</div></div></article>
      <article className="techCard card"><GitBranch size={30}/><h2>{t("splitTitle")}</h2><p>{t("splitText")}</p></article><article className="techCard card"><TriangleAlert size={30}/><h2>{t("limitsTitle")}</h2><ul><li>{t("limit1")}</li><li>{t("limit2")}</li><li>{t("limit3")}</li></ul></article>
    </section>
  </div>;
}
