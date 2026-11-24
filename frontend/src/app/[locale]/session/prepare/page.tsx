import {useTranslations} from "next-intl";
import {CameraSetup} from "@/components/camera/camera-setup";
import {DemoBanner} from "@/components/ui/demo-banner";

export default function PreparePage() { const t = useTranslations("prepare"); return <div className="container"><DemoBanner/><header className="pageHead"><div className="pageHeadText"><span className="eyebrow">{t("eyebrow")}</span><h1>{t("title")}</h1><p>{t("subtitle")}</p></div></header><CameraSetup/></div>; }
