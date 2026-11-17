"use client";
import { useEffect, useRef, useState } from "react";
import { kinds, species } from "../game/model";
import { varieties } from "../game/varieties";
import { discoveryKeys } from "../game/discoveries";

const descriptions = [
  "Guppies are your starter fish, known for their colorful fan tails. Collect their red, tuxedo, cobra, mosaic, and other game variants by buying fish or raising babies.",
  "Platies have a short, deep body. Build their collection of colors and markings, including Mickey Mouse, wagtail, and other patterns. Each variant gets its own Book entry.",
  "Mollies include black, silver, gold, and dalmatian patterns. In this game they need the hard-water setup. Discover their color and fin variants to complete this section.",
  "Male swordtails have a long lower-tail extension. Collect their red, koi, pineapple, and other color and fin variants. Females belong to the same variant collection.",
];
export default function BookTutorial({ step, onStep }: { step: number; onStep: (step: number) => void }) {
  const card = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [highlight, setHighlight] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [position, setPosition] = useState({ left: 16, top: 160 });
  const kind = kinds[Math.min(step, 3)];
  const heading = step < 4 ? "Collect " + species[kind].name + " variants" : step === 4 ? "Turn silhouettes into discoveries" : "Close the Book to keep learning";
  const text = step < 4 ? descriptions[step] + " This section has " + varieties[kind].length + " entries to discover." : step === 4 ? "Your goal is all " + discoveryKeys.length + " entries across guppy, platy, molly, and swordtail. Black silhouettes mean you have not collected that variant. Buying or breeding it reveals its name and colors forever—even after selling it. Rarity and random color rolls are game rules; lavender is a fantasy color." : "You can reopen the Book anytime to check your collection and care notes. Now click the glowing × at the top-right of the Book. Next, we will practice feeding your fish.";
  useEffect(() => {
    title.current?.focus();
    const target = document.querySelector<HTMLElement>(step < 4 ? '[data-book-tour="' + kind + '"]' : step === 4 ? '.book-collection' : '.book-close');
    const book = document.querySelector<HTMLElement>('.fish-book');
    function measure() {
      if (!target || !book) return;
      const r = target.getBoundingClientRect(), b = book.getBoundingClientRect();
      setHighlight({ left: r.left - 4, top: r.top - 4, width: r.width + 8, height: r.height + 8 });
      const h = card.current?.offsetHeight ?? 270, w = card.current?.offsetWidth ?? 320;
      setPosition({ left: Math.max(12, Math.min(innerWidth - w - 12, b.left + 24)), top: Math.max(12, b.bottom - h - 30) });
    }
    measure(); const observer = new ResizeObserver(measure);
    if (card.current) observer.observe(card.current); if (target) observer.observe(target); if (book) observer.observe(book);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [step, kind]);
  return <div className="book-tutorial">
    <div className="tour-spotlight" style={highlight}><span aria-hidden="true">☟</span></div>
    <section ref={card} className="tour-card" style={position} aria-label="Fish book introduction">
      <header><span>YOUR COLLECTION · {step + 1}/6</span></header>
      <div className="tour-body"><h2 ref={title} tabIndex={-1}>{heading}</h2><p>{text}</p>
        <div className="tour-actions"><div>{step > 0 && <button onClick={() => onStep(step - 1)}>Back</button>}{step < 5 ? <button onClick={() => onStep(step + 1)}>{step === 4 ? "Show me how to close" : "Next fish →"}</button> : <strong className="book-close-instruction">☞ Click the highlighted Book ×</strong>}</div></div>
      </div>
    </section>
  </div>;
}
