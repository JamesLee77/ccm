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

// Top-level anchor nav — six chapters that map to representative
// section ids. Sub-sections still exist on the page but aren't surfaced
// in the in-page navigator.
const ANCHORS = [
  { id: "market", label: "Problem" },
  { id: "trinity", label: "Unit" },
  { id: "arch", label: "Tech" },
  { id: "tokenomics", label: "Token" },
  { id: "defi", label: "DeFi" },
  { id: "roadmap", label: "Roadmap" },
] as const;

export default function Earth() {
  const items = ANCHORS.map((a) => ({ id: a.id, label: a.label }));

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
