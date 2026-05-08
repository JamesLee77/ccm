import { useTranslation } from "react-i18next";
import AnchorNav from "../components/site/AnchorNav";
import Hero from "../sections/earth/Hero";
import Market from "../sections/earth/Market";
import Trinity from "../sections/earth/Trinity";
import Problem from "../sections/earth/Problem";
import WrapSim from "../sections/earth/WrapSim";
import Grades from "../sections/earth/Grades";
import Architecture from "../sections/earth/Architecture";
import Mining from "../sections/earth/Mining";
import Tokenomics from "../sections/earth/Tokenomics";
import Scenarios from "../sections/earth/Scenarios";
import Defi from "../sections/earth/Defi";
import Vs from "../sections/earth/Vs";
import Roadmap from "../sections/earth/Roadmap";
import Risks from "../sections/earth/Risks";
import Manifesto from "../sections/earth/Manifesto";

const ANCHOR_KEYS = [
  "vision",
  "market",
  "trinity",
  "problem",
  "wrap",
  "grades",
  "arch",
  "mining",
  "tokenomics",
  "scenarios",
  "defi",
  "vs",
  "roadmap",
  "risks",
  "manifesto",
] as const;

export default function Earth() {
  const { t } = useTranslation("earth");
  const items = ANCHOR_KEYS.map((id) => ({
    id,
    label: t(`anchor.${id}`),
  }));

  return (
    <>
      <AnchorNav items={items} />
      <Hero />
      <Market />
      <Trinity />
      <Problem />
      <WrapSim />
      <Grades />
      <Architecture />
      <Mining />
      <Tokenomics />
      <Scenarios />
      <Defi />
      <Vs />
      <Roadmap />
      <Risks />
      <Manifesto />
    </>
  );
}
