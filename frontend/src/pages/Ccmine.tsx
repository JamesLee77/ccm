import { useTranslation } from "react-i18next";
import NodeNetwork from "../components/brand/NodeNetwork";
import { PageHero } from "../components/site/PageSection";

export default function Ccmine() {
  const { t } = useTranslation("ccmine");
  return (
    <>
      <PageHero
        pre={t("h1Pre")}
        em={t("h1Em")}
        lead={t("lead")}
        right={<NodeNetwork count={7} size={280} label="MINE" />}
      />
    </>
  );
}
