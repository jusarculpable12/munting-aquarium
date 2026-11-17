"use client";
import { useEffect, useRef, useState } from "react";

export const tourSteps = [
  { target: "book", title: "Fill your fish book", text: "Unlock every fish variant. Open the Book for a guided introduction to collecting guppy, platy, molly, and swordtail variants.", action: "Open Book and follow its species introduction." },
  { target: "feed", title: "Try feeding your fish", text: "Tap the glowing water to drop one pellet. Each fish has its own fullness. Stop feeding full fish to avoid stress and waste.", action: "Tap the highlighted water once." },
  { target: "fish", title: "Meet your fish", text: "Open Fish, then explore the highlighted My fish panel. Check health, fullness, sex, growth, and value. An adult male and female of the same species can breed with good care and spare space.", action: "Open Fish and inspect your collection." },
  { target: "water", title: "Clean a dirty tank", text: "Demo: water quality starts at 20%. Each partial change replaces 30% of the water. Try three changes and watch it recover: 20 → 44 → 61 → 73%. Your real water and fish stay safe.", action: "Click Partial water change three times." },
  { target: "water-view", title: "See the difference!", text: "The highlighted aquarium now shows the cleaner-water preview. Food and fish waste dirty real water; partial changes and filtration keep it healthy. This demo will restore your original water when you continue.", action: "Look at the clean tank, then continue." },
  { target: "shop", title: "Explore the fish shop", text: "Open Shop, then browse the highlighted panel. Choose a fish and sex before buying. New colors unlock Book entries. Sell adult fish in Fish, or visit Quests for a customer’s exact variant, baby/adult age, and coin offer.", action: "Open Shop. No purchase needed." },
  { target: "accessories", title: "Accessories have a purpose", text: "Open Accessories. Read each benefit and slot cost: plants and caves offer cover; filters slow waste. Accessory slots are separate from fish stocking space. Bigger tanks give you more slots.", action: "Tap Accessories and browse the highlighted shop." },
  { target: "try-accessory", title: "Place an accessory", text: "Try a free sample, then drag it along the gravel (or use arrow keys). Select it to try Behind cave / In front. In normal play: buy in Shop → Accessories, then choose Arrange accessories.", action: "Try the sample, then move it. Preview only—no coins spent." },
  { target: "tanks", title: "Room for a growing family", text: "Open Tanks to inspect stocking space, filtration and unlocks. Leave room for babies. Courtship leads to pregnancy, then swimming fry; young fish must grow before breeding. Happy aquariums earn visitor coins.", action: "Open Tanks to see your upgrades." },
  { target: "settings", title: "Your game saves itself", text: "Open Settings. Progress saves automatically in this browser after actions and during play. Fish care pauses while you are away. Clearing site data or changing browser/device will not carry your save over.", action: "Open Settings to see save controls." },
  { target: "export", title: "Keep a backup", text: "Export save downloads your aquarium as a JSON file. Keep it somewhere safe. Import save restores that file and replaces the current aquarium. No account or cloud save is used. Ready to fill your Book?", action: "Click Export save to keep a backup, or Skip to finish." },
] as const;

type Rect = { left: number; top: number; width: number; height: number };
export default function Tutorial({ onClose, onStep, suspended }: { onClose: () => void; onStep: (step: number) => void; suspended: boolean }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [rects, setRects] = useState<Rect[]>([]);
  const [position, setPosition] = useState({ left: 12, top: 100 });
  const card = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const lesson = tourSteps[step];
  useEffect(() => {
    heading.current?.focus();
    const find = (name: string) => document.querySelector<HTMLElement>('[data-tour="' + name + '"]');
    const target = find(lesson.target === "try-accessory" && placed ? "demo-plant" : lesson.target);
    function measure() {
      const panel = find("panel");
      const panelVisible = panel && !panel.hidden && panel.getBoundingClientRect().height > 0;
      const names = ["fish", "shop", "accessories", "tanks", "settings", "export"];
      const waterMeter = ["water", "water-view"].includes(lesson.target) ? find("water-meter") : null;
      const elements = [target, waterMeter, ...(names.includes(lesson.target) && panelVisible ? [panel] : [])].filter((e): e is HTMLElement => !!e);
      const regions = elements.map(element => {
        const b = element.getBoundingClientRect();
        return lesson.target === "feed" ? { left: b.left + b.width * .5, top: b.top + b.height * .32, width: b.width * .23, height: b.height * .3 } : { left: Math.max(0, b.left - 5), top: Math.max(0, b.top - 5), width: b.width + 10, height: b.height + 10 };
      });
      // During cleaning, leave the tank visible alongside the actual water button.
      if (["water", "water-view", "try-accessory"].includes(lesson.target)) {
        regions.push({ left: 8, top: 65, width: panelVisible ? Math.max(150, panel!.getBoundingClientRect().left - 24) : innerWidth - 16, height: Math.max(100, innerHeight - 155) });
      }
      setRects(regions);
      const w = card.current?.offsetWidth ?? 330, h = card.current?.offsetHeight ?? 240;
      const r = regions[0];
      const hasPanel = panelVisible && lesson.target !== "feed";
      const left = hasPanel ? Math.max(10, panel!.getBoundingClientRect().left - w - 24) : lesson.target === "feed" ? Math.max(10, (r?.left ?? innerWidth / 2) - w - 22) : 16;
      const toolbarTop = document.querySelector(".game-hotbar")?.getBoundingClientRect().top ?? innerHeight;
      const maxTop = Math.max(10, Math.min(innerHeight - h - 12, toolbarTop - h - 40));
      const top = Math.max(10, Math.min(maxTop, hasPanel ? 95 : innerHeight * .26));
      setPosition({ left, top });
    }
    let frame = 0;
    function interact(event: Event) {
      if (event instanceof KeyboardEvent && !["Enter", " "].includes(event.key)) return;
      if (target?.contains(event.target as Node) && !["book", "water", "try-accessory"].includes(lesson.target)) setDone(true);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }
    function practice(event: Event) {
      const action = (event as CustomEvent<string>).detail;
      if (lesson.target === "book" && action === "book-guide-complete") { onStep(1); setStep(1); setDone(false); }
      if (lesson.target === "water" && action === "water-clean") setDone(true);
      if (lesson.target === "try-accessory" && action === "accessory-placed") setPlaced(true);
      if (lesson.target === "try-accessory" && action === "accessory-moved") setDone(true);
    }
    measure();
    const observer = new ResizeObserver(measure);
    if (target) observer.observe(target);
    const waterMeter = find("water-meter"); if (waterMeter) observer.observe(waterMeter);
    const panel = find("panel"); if (panel) observer.observe(panel);
    if (card.current) observer.observe(card.current);
    window.addEventListener("resize", measure);
    document.addEventListener("scroll", measure, true);
    document.addEventListener("click", interact, true);
    document.addEventListener("keydown", interact, true);
    document.addEventListener("aquarium-tour-action", practice);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", measure); document.removeEventListener("scroll", measure, true); document.removeEventListener("click", interact, true); document.removeEventListener("keydown", interact, true); document.removeEventListener("aquarium-tour-action", practice); };
  }, [lesson.target, suspended, placed, onStep]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape" && !suspended) onClose(); };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [onClose, suspended]);
  function move(next: number) { onStep(next); setDone(next === 4); setPlaced(false); setStep(next); }
  return <div className="guided-tour" hidden={suspended}>
    <svg className="tour-shade" width="100%" height="100%" aria-hidden="true"><defs><mask id="tour-holes"><rect width="100%" height="100%" fill="white"/>{rects.map((r, i) => <rect key={i} {...r} x={r.left} y={r.top} rx="12" fill="black"/>)}</mask></defs><rect width="100%" height="100%" fill="#062c3dbd" mask="url(#tour-holes)"/></svg>
    {rects.map((r, i) => <div key={i} className="tour-spotlight" style={r}>{i === 0 && <span aria-hidden="true">☟</span>}</div>)}
    <section ref={card} className="tour-card" style={position} role="dialog" aria-label="Guided aquarium tutorial" aria-describedby="tour-text">
      <header><span>LET’S TRY IT · {step + 1}/{tourSteps.length}</span><button onClick={onClose} aria-label="Close tutorial">×</button></header>
      <div className="tour-body"><h2 ref={heading} tabIndex={-1}>{lesson.title}</h2><p id="tour-text">{lesson.text}</p><p className="tour-task" role="status">{done ? "✓ Nice! You did it. Continue when ready." : "☞ " + lesson.action}</p>
      <div className="tour-actions"><button onClick={onClose}>Skip</button><div>{step > 0 && <button onClick={() => move(step - 1)}>Back</button>}<button disabled={!done} onClick={() => step === tourSteps.length - 1 ? onClose() : move(step + 1)}>{step === tourSteps.length - 1 ? "Let’s play!" : "Next →"}</button></div></div>
      <small>Care is paused. Reopen with ? beside Settings.</small></div>
    </section>
  </div>;
}
