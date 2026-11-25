import {Activity, BrainCircuit, Camera, ChartNoAxesCombined, FileCheck2, GitBranch, ScanLine, TriangleAlert} from "lucide-react";
import {useTranslations} from "next-intl";
import {DemoBanner} from "@/components/ui/demo-banner";
import evaluation from "@/data/e02-evaluation.json";

function formatPercent(value: number) { return `${Math.round(value * 100)}%`; }

function ConfusionMatrix({label, values, actual, incomplete, complete}: {label: string; values: number[][]; actual: string; incomplete: string; complete: string}) {
  return <div className="matrixBlock"><h3>{label}</h3><table className="matrixTable"><thead><tr><th>{actual}</th><th>{incomplete}</th><th>{complete}</th></tr></thead><tbody><tr><th>{incomplete}</th><td>{values[0][0]}</td><td>{values[0][1]}</td></tr><tr><th>{complete}</th><td>{values[1][0]}</td><td>{values[1][1]}</td></tr></tbody></table></div>;
}

export default function TechnologyPage() {
  const t = useTranslations("technology");
  const steps = [[Camera, "flow1"], [ScanLine, "flow2"], [Activity, "flow3"], [BrainCircuit, "flow4"], [FileCheck2, "flow5"]] as const;
  return <div className="container"><DemoBanner/><header className="pageHead"><div className="pageHeadText"><span className="eyebrow">{t("eyebrow")}</span><h1>{t("title")}</h1><p>{t("subtitle")}</p></div></header>
    <section className="flow" aria-label={t("title")}>{steps.map(([Icon, key], index) => <article className="flowStep card" key={key}><Icon size={30}/><div><span className="muted">0{index + 1}</span><h3>{t(key)}</h3></div></article>)}</section>
    <section className="techGrid"><article className="techCard card"><ScanLine size={30}/><h2>{t("poseTitle")}</h2><p>{t("poseText")}</p></article><article className="techCard card"><BrainCircuit size={30}/><h2>{t("modelTitle")}</h2><p>{t("modelText")}</p></article>
      <article className="techCard card datasetCard"><GitBranch size={30}/><h2>{t("datasetTitle")}</h2><p>{t("datasetText")}</p><div className="datasetStats"><div><strong>491</strong><span>{t("datasetVideos")}</span></div><div><strong>411 / 80</strong><span>{t("datasetTrainTest")}</span></div><div><strong>107 / 20</strong><span>{t("datasetE02")}</span></div></div><small>{t("datasetBalance")}</small></article>
      <article className="modelEvaluation card"><div className="sectionHead"><div><ChartNoAxesCombined size={30}/><h2>{t("metricsTitle")}</h2><p>{t("evaluationSplit", {testVideos: evaluation.testVideos, participants: evaluation.testParticipants})}</p></div><span className="badge">E02 · {t("heldOut")}</span></div>
        <div className="scoreCompare"><div><span>{t("sequenceModel")}</span><strong>{formatPercent(evaluation.modelBalancedAccuracy)}</strong><small>{t("balanced")} · F1 {formatPercent(evaluation.modelF1)}</small></div><div><span>{t("baseline")}</span><strong>{formatPercent(evaluation.baselineBalancedAccuracy)}</strong><small>{t("balanced")} · F1 {formatPercent(evaluation.baselineF1)}</small></div><div><span>{t("trainCv")}</span><strong>{formatPercent(evaluation.trainGroupedBalancedAccuracy)}</strong><small>{t("balanced")} · F1 {formatPercent(evaluation.trainGroupedF1)}</small></div></div>
        <div className="matrixGrid"><ConfusionMatrix label={t("sequenceModel")} values={evaluation.modelConfusionMatrix} actual={t("actual")} incomplete={t("incomplete")} complete={t("complete")}/><ConfusionMatrix label={t("baseline")} values={evaluation.baselineConfusionMatrix} actual={t("actual")} incomplete={t("incomplete")} complete={t("complete")}/></div><p className="evaluationNote" role="note">{t("evaluationCaution", {model: evaluation.modelName})}</p>
      </article>
      <article className="techCard card"><GitBranch size={30}/><h2>{t("splitTitle")}</h2><p>{t("splitText")}</p></article><article className="techCard card"><TriangleAlert size={30}/><h2>{t("limitsTitle")}</h2><ul><li>{t("limit1")}</li><li>{t("limit2")}</li><li>{t("limit3")}</li></ul></article>
    </section>
  </div>;
}
