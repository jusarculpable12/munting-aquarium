"use client";
import { colorVariety, fishLabel, rarityOdds } from "../game/varieties";

import { useCallback, useEffect, useRef, useState } from "react";
import { act, advanceVisible, resume, adult, breedingStatus, capacity, fishValue, fullness, happiness, pregnancyProgress, kinds, load, sellable, species, start, unlockPrices, visitors, type Action, type Save, type Species } from "../game/model";
import { decode, key } from "../game/storage";
import { accessoryRefund, accessoryPriceRange, plantCatalog, plantDefinition, accessoryLimit, accessoryLoad, accessoryVisitorBonus, type PlacedPlant } from '../game/accessories';
import AccessoryLayer from './AccessoryLayer';
import PlantPortrait from './PlantPortrait';
import TankScene from "./TankScene";
import FishPortrait from "./FishPortrait";
import FishBook from "./FishBook";
import Tutorial from "./Tutorial";

function withSaveLock(operation: () => void) {
  if (navigator.locks) void navigator.locks.request(key, operation);
  else operation();
}

const tabs = ["Care", "Collection", "Fish shop", "Tanks", "Settings"] as const;
const money = (amount: number) => Math.floor(amount).toLocaleString("en-PH");

export default function Game() {
  const [save, setSave] = useState<Save | null>(null);
  const [ready, setReady] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const tutorialActive = useRef(false);
  const tutorialStep = useRef(0);
  const [tourWater, setTourWater] = useState<number | null>(null);
  const [tourPlant, setTourPlant] = useState<PlacedPlant | null>(null);
  const [tourPage, setTourPage] = useState(0);
  const practiceEvent = (action: string) => document.dispatchEvent(new CustomEvent("aquarium-tour-action", { detail: action }));
  const tourStepChanged = useCallback((step: number) => {
    tutorialStep.current = step;
    setTourPage(step);
    setBookOpen(false);
    setArranging(false);
    setTourPlant(null);
    setPanelOpen([3, 6, 7, 10].includes(step));
    if (step === 3) { setTab("Care"); setTourWater(20); }
    else if (step !== 4) setTourWater(null);
    if (step === 4) setPanelOpen(false);
    if ([6, 7].includes(step)) { setTab("Fish shop"); setShopCategory(step === 6 ? "Fish" : "Accessories"); }
    if (step === 10) setTab("Settings");
  }, []);
  useEffect(() => { if (tutorialOpen && tourWater !== null && tourWater >= 70) practiceEvent("water-clean"); }, [tutorialOpen, tourWater]);
  function openTutorial() {
    if (tutorialActive.current) return;
    tutorialActive.current = true;
    tutorialStep.current = 0; setTourPage(0); setTourWater(null); setTourPlant(null);
    setTutorialOpen(true);
    setPanelOpen(false);
    setBookOpen(false);
    setArranging(false);
  }
  function closeTutorial() {
    withSaveLock(() => {
      let existing = current.current;
      try { const raw = localStorage.getItem(key); if (raw) existing = decode(raw); } catch { /* Use the active save. */ }
      if (existing) persist({ ...resume(existing, Date.now()), tutorialComplete: true });
      tutorialActive.current = false;
      setTourWater(null); setTourPlant(null); setArranging(false);
      setTutorialOpen(false);
    });
  }
  const current = useRef<Save | null>(null);
  const [selected, select] = useState(0);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Collection");
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const locateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (locateTimer.current) clearTimeout(locateTimer.current); }, []);
  function locateFish(id: string, home: number) {
    select(home);
    setHighlighted(id);
    if (locateTimer.current) clearTimeout(locateTimer.current);
    locateTimer.current = setTimeout(() => { setHighlighted(null); locateTimer.current = null; }, 2000);
  }
  const [pendingSale, setPendingSale] = useState<{ fish: string; tank: number; name: string; value: number } | null>(null);
  const saleDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = saleDialog.current;
    if (pendingSale && dialog && !dialog.open) dialog.showModal();
    else if (!pendingSale && dialog?.open) dialog.close();
  }, [pendingSale]);
  const [bookOpen,setBookOpen]=useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [message, say] = useState("");
  const [storageError, setStorageError] = useState(false);

  const [arranging, setArranging] = useState(false);
  const [shopCategory, setShopCategory] = useState<"Fish" | "Accessories">("Fish");
  const [sex, setSex] = useState<"F" | "M">("F");
  async function enterLandscape() {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      const orientation = screen.orientation as ScreenOrientation & { lock?: (direction: 'landscape') => Promise<void> };
      if (orientation?.lock) await orientation.lock('landscape');
    } catch { /* Unsupported browsers use manual rotation. */ }
  }
  useEffect(() => {
    const portrait = window.matchMedia('(max-width: 1024px) and (orientation: portrait)');
    const cancelSale = () => { if (portrait.matches) setPendingSale(null); };
    portrait.addEventListener('change', cancelSale);
    return () => portrait.removeEventListener('change', cancelSale);
  }, []);
  const [notifications, setNotifications] = useState(false);
  const sent = useRef(new Set<string>());

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setPanelOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  function persist(next: Save) {
    current.current = next;
    setSave(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setStorageError(false);
    } catch { setStorageError(true); }
  }

  useEffect(() => {
    function sync() {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) { persist(start(Date.now())); openTutorial(); return; }
        const stored = decode(raw);
        const next = resume(stored, Date.now());
        persist(next);
        if (next.tutorialComplete !== true) openTutorial();
        const earned = Math.floor(next.coins) - Math.floor(stored.coins);
        say("Welcome back! Fish care paused while you were away." + (earned > 0 ? " Visitors left " + earned + " coins." : ""));
      } catch { say("The local save could not be read. Import a backup or start a new game."); }
      finally { setReady(true); }
    }
    withSaveLock(sync);
    function latest() {
      try {
        const raw = localStorage.getItem(key);
        if (raw) return decode(raw);
      } catch { /* Keep the active game when storage is unavailable. */ }
      return current.current;
    }
    const timer = window.setInterval(() => withSaveLock(() => {
      if (document.hidden) return;
      const existing = latest();
      if (!existing) return;
      const next = tutorialActive.current ? resume(existing, Date.now()) : advanceVisible(existing, Date.now());
      if (next !== existing) persist(next);
    }), 1000);
    function update(event: StorageEvent) {
      if (event.key !== key || !event.newValue) return;
      try {
        current.current = decode(event.newValue);
        setSave(current.current);
      } catch { /* Ignore malformed updates from another tab. */ }
    }
    function visibilityChanged() {
      // Hiding settles only the last active tick; returning consumes safe away time.
      withSaveLock(() => {
        const existing = latest();
        if (!existing) return;
        persist(document.hidden && !tutorialActive.current ? advanceVisible(existing, Date.now()) : resume(existing, Date.now()));
      });
    }
    document.addEventListener("visibilitychange", visibilityChanged);
    window.addEventListener("pageshow", visibilityChanged);
    window.addEventListener("storage", update);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", visibilityChanged); window.removeEventListener("pageshow", visibilityChanged); window.removeEventListener("storage", update); };
  }, []);

  useEffect(() => {
    if (!notifications || !save || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    save.tanks.forEach((tank, index) => {
      const alerts = { hungry: tank.fish.length > 0 && tank.fish.some(fish => !fish.diedAt && fish.fullness <= 45), "due for a water change": tank.water <= 60 };
      for (const [label, active] of Object.entries(alerts)) {
        const id = index + label;
        if (!active) sent.current.delete(id);
        else if (!sent.current.has(id)) {
          sent.current.add(id);
          try { new Notification("Munting Aquarium", { body: "Tank " + (index + 1) + " is " + label + "." }); }
          catch { say("Browser notifications are unavailable here. In-game alerts are active."); }
        }
      }
    });
  }, [notifications, save]);

  async function toggleNotifications() {
    if (notifications) { setNotifications(false); return; }
    if (typeof Notification === "undefined") { say("Browser notifications are unavailable here."); return; }
    try {
      const permission = await Notification.requestPermission();
      setNotifications(permission === "granted");
      say(permission === "granted" ? "Notifications enabled for this session." : "Notification permission was declined.");
    } catch { say("Browser notifications are unavailable here."); }
  }

  function run(action: Action) {
    const execute = () => {
      if (document.hidden) return;
      if (tutorialActive.current && action.type === "plant-move" && action.id === "tutorial-sample") {
        setTourPlant(plant => plant ? { ...plant, x: Math.max(.04, Math.min(.93, action.x)), y: Math.max(.82, Math.min(.94, action.y)) } : null);
        if (tourPlant && Math.abs(tourPlant.x - action.x) + Math.abs(tourPlant.y - action.y) > .001) practiceEvent("accessory-moved"); return;
      }
      if (tutorialActive.current && action.type === "plant-layer" && action.id === "tutorial-sample") {
        setTourPlant(plant => plant ? { ...plant, layer: action.layer } : null); return;
      }
      if (tutorialActive.current && action.type === "water" && tutorialStep.current === 3) {
        setTourWater(water => { const next = (water ?? 20) + (100 - (water ?? 20)) * .3; return next; });
        return;
      }
      if (tutorialActive.current && action.type !== "eat" && !(action.type === "feed" && tutorialStep.current === 1) && !(action.type === "water" && tutorialStep.current === 3)) { say("Practice mode: finish or skip the guide before buying, selling, or upgrading."); return; }
      let existing = current.current;
      try {
        const raw = localStorage.getItem(key);
        if (raw && existing) existing = decode(raw);
      } catch { /* Continue from the current in-memory save. */ }
      if (!existing) return;
      const time = Date.now();
      const [next, result] = act(tutorialActive.current ? resume(existing, time) : advanceVisible(existing, time), action, time);
      persist(next);
      say(result);
      if (action.type === "unlock" && next.tanks.length > existing.tanks.length) select(next.tanks.length - 1);
    };
    if (navigator.locks) void navigator.locks.request(key, execute);
    else execute();
  }

  function exportSave() {
    if (!current.current) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(current.current, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "munting-aquarium.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importSave(file?: File) {
    if (!file) return;
    try {
      if (file.size > 250_000) throw new Error();
      const backup = decode(await file.text());
      if (current.current && !window.confirm("Replace your current aquarium with this backup?")) return;
      persist({ ...backup, last: Date.now() });
      select(0);
      say("Backup restored.");
    } catch { say("That file is not a valid aquarium save."); }
  }

  const index = save?.tanks[selected] ? selected : 0;
  const actualTank = save?.tanks[index];
  const tank = actualTank && (tourWater !== null || tourPlant) ? { ...actualTank, water: tourWater ?? actualTank.water, accessories: [...(actualTank.accessories ?? []), ...(tourPlant ? [tourPlant] : [])] } : actualTank;
  const order = save?.order;
  const now = save?.last ?? 0;
  const alerts = save?.tanks.flatMap((resident, i) => [
    ...(resident.fish.length && resident.fish.some(fish => !fish.diedAt && fish.fullness <= 45) ? ["Tank " + (i + 1) + " needs food"] : []),
    ...(resident.fish.some(fish => fish.diedAt) ? ["Tank " + (i + 1) + ": deceased fish · remove from Collection"] : []),
    ...(resident.fish.some(fish => !fish.diedAt && (fish.health < 70 || fish.overfed >= 20)) ? ["Tank " + (i + 1) + ": fish health at risk · check Collection"] : []),
    ...(resident.water <= 60 ? ["Tank " + (i + 1) + " needs a partial water change"] : []),
  ]) ?? [];
  const stock = save?.tanks.flatMap((resident, i) => resident.fish.map(fish => ({ fish, tank: i }))) ?? [];

  return <main className="game-page"><div className="game-shell"><section className="rotate-prompt" aria-labelledby="rotate-title"><div className="rotate-card"><span className="rotate-device" aria-hidden="true">↻ ▭</span><h2 id="rotate-title">Turn your device sideways</h2><p>Munting Aquarium plays in landscape.<br/>Rotate your phone or tablet to see the whole tank.</p><button onClick={() => void enterLandscape()}>Play fullscreen</button><small>If the screen stays upright, disable rotation lock on your device and rotate it manually.</small></div></section>
      <header className="game-banner">
 <div className="game-logo"><span aria-hidden="true">🐟</span><h1>Munting<br/>Aquarium</h1></div>{save && <div className="tank-plaque">Tank {index + 1}{tank && <small>{load(tank)}/{capacity(tank)} space</small>}</div>}
 {tank && <div className="hud-meters"><Meter label="Water quality" value={tank.water} /><Meter label="Fish happy" value={happiness(tank)} /><Meter label="Fullness" value={fullness(tank)} /></div>}
 <div className="banner-meta"><span className="balance">◉ {money(save?.coins ?? 0)}</span><button className="settings-button help-button" aria-label="How to play" title="How to play" onClick={openTutorial}>?</button><button data-tour="settings" className="settings-button" aria-label="Settings" onClick={() => { setTab("Settings"); setPanelOpen(true); }}>⚙</button></div>
</header>
      {alerts.length > 0 && <button className="notice" onClick={() => { setTab("Care"); setPanelOpen(true); }} aria-label="View aquarium care alerts">⚠ {alerts[0]}{alerts.length > 1 ? " · +" + (alerts.length - 1) : ""}</button>}
      {save && tank && order ? <div className="game-board">
        <section data-tour="water-view" className="aquarium" aria-label="Aquarium game">
          <div className={`scene-wrap ${arranging ? "arranging-plants" : ""}`}>
            <AccessoryLayer key={index} plants={tank.accessories ?? []} editing={arranging} onLayer={(id,layer)=>run({type:'plant-layer',tank:index,id,layer})} onMove={(id,x,y)=>run({type:"plant-move",tank:index,id,x,y})}/>
            <TankScene feedingDisabled={arranging} key={index} highlighted={highlighted} tank={tank} onFeed={pellet => run({ type: "feed", tank: index, pellet })} onEat={(fish, pellet) => run({ type: "eat", tank: index, fish, pellet })} />
            <div className="feeding-hint" aria-hidden="true">‹ Tap water to feed ›</div>
          </div>
        </section>
        <aside data-tour="panel" className="controls" hidden={!panelOpen} aria-label="Aquarium management"><div className="drawer-heading"><h2>{tab === "Collection" ? "My fish" : tab === "Fish shop" ? "Shop" : tab === "Care" ? "Water & care" : tab}</h2><button className="close-drawer" aria-label="Close menu" onClick={() => setPanelOpen(false)}>×</button></div>
          <div className="panel">
          {tab === "Care" && <>
            <p className="eyebrow">DAILY CARE</p><h2>Look after your fish</h2>
            <p className="muted">Healthy, well-fed fish attract visitors and may raise fry when there’s room. Their occasional expressions reflect feeding and tank care.</p>
            <p className="hint">Tap anywhere in the water to drop a pellet. You can keep feeding even when fish are full; extra food adds waste.</p>
            <button className="action" data-tour="water" onClick={() => run({ type: "water", tank: index })}><span aria-hidden="true">◈</span><span><strong>Partial water change</strong><small>Replace 30% with treated water</small></span></button>
            <h3>Nursery & pregnancy</h3><p className="hint">Livebearers give birth to swimming fry. Look for the stone nursery cave; expecting females gather nearby and newborns shelter around its crevices. No eggs are laid. Game timing: 1 minute of courtship, then 15–30 minutes of pregnancy depending on species, followed by 2 minutes of rest. Real pregnancies take weeks. Care problems pause progress.</p>
            {kinds.filter(kind => tank.fish.some(f => f.kind === kind)).map(kind => <div className="line" key={kind}><span>{species[kind].name}</span><span>{breedingStatus(tank, kind, now)}</span></div>)}
            {!tank.fish.length && <p className="muted">Visit the fish shop to stock this tank.</p>}
            <p className="hint">Breeding requires a healthy adult pair, suitable water, and space. Each fish loses health below 30% fullness or water quality; 20%+ overfeeding stress causes milder temporary damage. Change water, feed hungry fish, and stop feeding full fish. Prolonged danger can be fatal while playing. Fish care pauses when this tab is hidden or closed.</p>
          </>}
          {tab === "Collection" && <>
            <p className="eyebrow">LIVESTOCK</p><h2 className="collection-title">Fish collection</h2>
            <div className="collection-tanks" role="group" aria-label="My fish tanks">{save.tanks.map((resident, home) => <button key={home} aria-pressed={index === home} onClick={() => { select(home); setHighlighted(null); }}><strong>Tank {home + 1}</strong><small>{resident.fish.length} fish · {load(resident)}/{capacity(resident)} space</small></button>)}</div>
            <div className="stocking-summary collection-stocking"><strong>Tank {index + 1}: {load(tank)}/{capacity(tank)} stocking space</strong><meter min={0} max={capacity(tank)} value={load(tank)} aria-label="Current tank stocking space"/><small>{tank.fish.length} fish · Guppy uses 1 space; platy and molly 2; swordtail 3.</small></div><p className="muted collection-count">Showing {tank.fish.length} fish in Tank {index + 1}.</p>
            {!tank.fish.length && <p>No fish in Tank {index + 1} yet. Buy fish in the shop or move fish here from another tank.</p>}
            {stock.filter(resident => resident.tank === index).map(({ fish, tank: home }) => <div className="list-row fish-row" key={fish.id}><FishPortrait fish={fish} /><div><strong>{fishLabel(fish)} {species[fish.kind].name}</strong><small className={"rarity rarity-" + colorVariety(fish).rarity.toLowerCase()}>{colorVariety(fish).rarity}</small><small>Tank {home + 1} · {fish.sex === "F" ? "Female" : "Male"} · {adult(fish, now) ? "Adult" : fish.motherId ? "Fry" : "Juvenile"}{!adult(fish, now) && ` · Adult in ${Math.ceil(((fish.maturesAt ?? fish.born + 120000) - now) / 60000)} min`}</small>{fish.diedAt ? <small>Deceased</small> : <>{pregnancyProgress(save.tanks[home], fish) > 0 && <small>{breedingStatus(save.tanks[home], fish.kind, now)}</small>}<meter min={0} max={100} value={fish.fullness} aria-label={species[fish.kind].name + " fullness"}/><small>Fullness {Math.round(fish.fullness)}%{fish.fullness <= 45 ? " · Hungry" : ""}</small><small>Health {Math.ceil(fish.health)}%{fish.overfed >= 20 ? " · Overfed — stop feeding; recovering" : fish.health < 70 ? " · Needs care" : ""}</small><small className="fish-value">{sellable(fish, now) ? "Sell value" : "Adult sell value"}: {fishValue(fish)} coins</small></>}</div><div className="fish-actions">{!fish.diedAt && <button disabled={!sellable(fish, now)} title={!sellable(fish, now) ? "Wait until this fish is an adult and settled" : undefined} onClick={() => setPendingSale({ fish: fish.id, tank: home, name: `${fishLabel(fish)} ${species[fish.kind].name} (${fish.sex === "F" ? "female" : "male"})`, value: fishValue(fish) })}>Sell · {fishValue(fish)} coins</button>}<button onClick={() => { locateFish(fish.id, home); }}>Locate</button>{fish.diedAt ? <button onClick={() => run({ type: "remove", tank: home, fish: fish.id })}>Remove</button> : save.tanks.map((_, target) => target !== home && <button key={target} onClick={() => run({ type: "move", tank: home, fish: fish.id, target })}>Move to {target + 1}</button>)}</div></div>)}
          </>}
          {tab === "Fish shop" && <>
            <div className="shop-categories" role="group" aria-label="Shop category">{(["Fish", "Accessories"] as const).map(category => <button data-tour={category === "Accessories" ? "accessories" : undefined} key={category} aria-pressed={shopCategory === category} onClick={() => setShopCategory(category)}>{category}</button>)}</div>
            {shopCategory === "Accessories" ? <section className="accessories-shop">{tutorialOpen && tourPage === 7 && <button data-tour="try-accessory" className="action" onClick={() => { setTourPlant({ id: "tutorial-sample", kind: "coin-bush", x: .5, y: .88, layer: "front" }); setArranging(true); setPanelOpen(false); practiceEvent("accessory-placed"); }}>Try accessory placement · free preview</button>}<h2>Accessories · {accessoryPriceRange.min}–{accessoryPriceRange.max} coins</h2><div className="stocking-summary"><strong>Tank {index+1}: {accessoryLoad(tank)}/{accessoryLimit(tank)} accessory slots</strong><meter min={0} max={accessoryLimit(tank)} value={accessoryLoad(tank)} aria-label="Accessory slots used"/><small>{tank.accessories?.length ?? 0} accessories · separate from fish capacity</small></div>
<button className="action" disabled={!tank.accessories?.length} onClick={()=>{setArranging(true);setPanelOpen(false);}}>Arrange accessories · drag on gravel</button>
<details className="plant-benefits"><summary>Accessory benefits & rules</summary><p>Artificial plants: 15 / 25 / 40 coins by size. Equipment is priced by its benefit, up to 140 coins. These are fictional game values.</p><p>Artificial plants and caves provide shelter. Live Java fern with a plant light slows nutrient buildup by 15%. Sponge/internal filters reduce waste buildup by 15%/25% (best filter only). A heater adds +3 happiness only when basic care is good. Air stones attract fish toward aerated upper water when water is poor. No accessory replaces feeding, water changes or stocking limits.</p><p>Game bonus: +1 visitor coin/min per 2 occupied accessory slots, capped at +2/min in a healthy tank. Current bonus: +{accessoryVisitorBonus(tank)}/min. Accessories do not speed up breeding or increase fish capacity. All effects are fictional balance values.</p><a href="https://www.aqueon.com/articles/artificial-aquarium-plants" target="_blank" rel="noreferrer">Read about artificial plant benefits</a></details>
<p className="hint">Small / medium / tall plants use 1 / 2 / 3 slots. Prices reflect size and benefits. Fictional game prices. Tank upgrades increase the limit from 4 to 6 to 8 slots.</p>
{plantCatalog.map(item=><div className="list-row accessory-shop-row" key={item.id}><PlantPortrait kind={item.id}/><div><strong>{item.name}</strong><small>{item.size} · {item.slots} {item.slots===1?'slot':'slots'} · {item.category}</small><small>{item.benefit}</small></div><button disabled={save.coins<item.price||accessoryLoad(tank)+item.slots>accessoryLimit(tank)||(item.category==='Equipment'&&tank.accessories?.some(p=>p.kind===item.id))} onClick={()=>run({type:'plant-buy',tank:index,kind:item.id})}>Buy · {item.price} coins</button></div>)}
{!!tank.accessories?.length&&<><h3>In Tank {index+1}</h3>{tank.accessories.map(plant=><div className="line" key={plant.id}><span>{plantDefinition(plant.kind).name}</span><label className="depth-setting">Layer <select aria-label={plantDefinition(plant.kind).name+' depth'} value={plant.layer??'front'} onChange={e=>run({type:'plant-layer',tank:index,id:plant.id,layer:e.target.value as 'front'|'back'})}><option value="back">Behind cave</option><option value="front">In front</option></select></label><button onClick={()=>run({type:'plant-return',tank:index,id:plant.id})}>Return · +{accessoryRefund(plant)} coins</button></div>)}<p className="hint">Returning an accessory refunds the coins you originally paid and frees its slots. Older purchases keep their original refund value.</p></>}
</section> : <>
            <p className="eyebrow">CUSTOMER REQUEST</p><h2>{order.rare ? "Lavender " : ""}{species[order.kind].name} <span className="reward">+{order.reward}</span></h2>
            <p className="muted">Choose an adult fish to sell. Newly bought juveniles grow over 30 game minutes before they can be sold.</p>
            {stock.filter(({ fish }) => fish.kind === order.kind && (!order.rare || fish.rare) && sellable(fish, now)).map(({ fish, tank: home }) => <button className="sell" key={fish.id} onClick={() => run({ type: "sell", tank: home, fish: fish.id, order: order.id })}>Sell {fish.rare ? "lavender " : ""}{species[fish.kind].name.toLowerCase()} · {fish.sex} · Tank {home + 1}</button>)}
            <p className="hint">Each purchase rolls a random color. Game rarity odds: {rarityOdds}. Lavender is a fantasy color.</p><div className="shop-heading"><h3>Buy for Tank {index + 1}</h3><select aria-label="Sex of purchased fish" value={sex} onChange={e => setSex(e.target.value as "F" | "M")}><option value="F">Female</option><option value="M">Male</option></select></div>
            {kinds.map((kind: Species) => <div className="list-row" key={kind}><FishPortrait fish={{ kind, sex, rare: false }} /><div><strong>{species[kind].name}</strong><small>{species[kind].load} space · {species[kind].water}% water{kind === "molly" ? " · Hard water" : ""}</small></div><button onClick={() => run({ type: "buy", kind, sex, tank: index })}>{species[kind].price} coins</button></div>)}
          </>}</>}
          {tab === "Tanks" && <>
            <p className="eyebrow">TANK WORKSHOP</p><h2>Make room to grow</h2><div className="stocking-summary"><strong>Tank {index + 1}: {load(tank)}/{capacity(tank)} space used</strong><meter min={0} max={capacity(tank)} value={load(tank)} aria-label="Tank capacity used"/><small>{Math.max(0, capacity(tank) - load(tank))} space available · {tank.fish.length} fish</small></div>
            {(["size", "filter"] as const).map(type => <button className="action" key={type} disabled={tank[type] === 2} onClick={() => run({ type, tank: index })}><span><strong>{type === "size" ? "Larger tank" : "Better filtration"}</strong><small>{type === "size" ? `Capacity ${capacity(tank)} → ${capacity(tank) + 5} space` : "Slower waste buildup"} · Level {tank[type] + 1}</small></span><span>{tank[type] === 2 ? "Max" : (type === "size" ? 65 : 45) * (tank[type] + 1) + " coins"}</span></button>)}
            <button className="action" onClick={() => run({ type: "hard", tank: index })}><span><strong>{tank.hard ? "Switch to standard water" : "Set up hard water"}</strong><small>Mollies require hard water</small></span></button>

          </>}          {tab === "Tanks" && <><p className="eyebrow">YOUR AQUARIUMS</p><p className="muted">Choose a tank or unlock more space.</p><div className="tank-select">{unlockPrices.map((price,i) => <button key={i} aria-pressed={i < save.tanks.length && index === i} disabled={i > save.tanks.length} onClick={() => { if(i < save.tanks.length) select(i); else run({type:"unlock",tank:index}); }}>{i < save.tanks.length ? "Tank " + (i+1) : "Unlock tank " + (i+1) + " · " + price + " coins"}</button>)}</div><p className="hint">{load(tank)} / {capacity(tank)} stocking space · +{visitors(tank)} coins/min from visitors</p></>}
          {tab === "Settings" && <><p className="eyebrow">SAVE & PREFERENCES</p><p>{storageError ? "Local saving unavailable. Export a backup." : "Your aquarium saves automatically in this browser."}</p><button data-tour="export" className="action" onClick={exportSave}>Export save</button><label className="import action">Import save<input type="file" accept=".json,application/json" onChange={e=>{void importSave(e.target.files?.[0]);e.target.value="";}}/></label><button className="action" aria-pressed={notifications} onClick={()=>void toggleNotifications()}>Browser alerts {notifications?"on":"off"}</button><button className="action" onClick={()=>{if(document.fullscreenElement)void document.exitFullscreen();else void document.documentElement.requestFullscreen().catch(()=>say("Fullscreen is unavailable in this browser."));}}>Toggle fullscreen</button><p className="hint">Fish care pauses while away · Visitor earnings capped at 1 hour. Fictional game coins. Browser alerts work while the game is open.</p></>}
          </div>
        </aside>
      </div> : <section className="card welcome">{ready ? <><p className="eyebrow">MABUHAY</p><h2>Open your fish shop</h2><p>Start with a pair of guppies and 85 coins.</p><button className="primary" onClick={() => { persist(start(Date.now())); openTutorial(); say("Your shop is open."); }}>Start game</button></> : <p role="status">Loading your aquarium…</p>}</section>}
      {save && <nav className="game-hotbar" aria-label="Game tools">{([
        ["Collection","🐠","Fish"],["Fish shop","🏪","Shop"],["Care","💧","Water"],["Tanks","🪟","Tanks"]
      ] as const).map(([value,icon,label])=><button data-tour={value === "Collection" ? "fish" : value === "Fish shop" ? "shop" : value === "Tanks" ? "tanks" : undefined} key={value} aria-pressed={panelOpen && tab===value} onClick={()=>{if(tab===value)setPanelOpen(open=>!open);else{setTab(value);setPanelOpen(true);}}}><span className="tool-icon" style={{backgroundPosition:`${value === "Tanks" ? 100 : value === "Care" ? 50 : value === "Fish shop" ? 25 : 0}% center`}} aria-hidden="true" data-icon={icon}/>{label}</button>)}<button data-tour="book" className="book-tool" aria-haspopup="dialog" aria-expanded={bookOpen} onClick={()=>{setArranging(false);setPanelOpen(false);setBookOpen(true);}}><span className="book-tool-icon" aria-hidden="true">▤</span>Book</button></nav>}
      {save && tutorialOpen && <Tutorial onClose={closeTutorial} onStep={tourStepChanged} suspended={bookOpen} />}
      {save&&<FishBook save={save} open={bookOpen} onClose={()=>setBookOpen(false)} tutorial={tutorialOpen && tourPage === 0} onTutorialComplete={() => { setBookOpen(false); practiceEvent("book-guide-complete"); }}/>}
      <div className="arrange-toolbar" hidden={!arranging}><span>Drag accessories on the gravel · arrow keys also work</span><button onClick={()=>setArranging(false)}>Done arranging</button></div><dialog className="sale-dialog" ref={saleDialog} aria-labelledby="sale-title" onCancel={() => setPendingSale(null)}>
        {pendingSale && <><div className="sale-dialog-heading"><h2 id="sale-title">Sell this fish?</h2><button aria-label="Close sell confirmation" onClick={() => setPendingSale(null)}>×</button></div><div className="sale-dialog-content"><span className="sale-fish-icon" aria-hidden="true"/><p><strong>{pendingSale.name}</strong> · Tank {pendingSale.tank + 1}</p><p>You will receive <strong>{pendingSale.value} coins</strong>. This fish will leave your collection.</p><div className="sale-dialog-actions"><button autoFocus onClick={() => setPendingSale(null)}>Keep fish</button><button onClick={() => { run({ type: "sell-fish", tank: pendingSale.tank, fish: pendingSale.fish }); setPendingSale(null); }}>Confirm sale · {pendingSale.value} coins</button></div></div></>}
      </dialog><p className="feedback" role="status">{message}</p>
    </div></main>;
}

function Meter({ label, value }: { label: string; value: number }) {
  return <div className="meter" data-tour={label === "Water quality" ? "water-meter" : undefined}><div><span>{label}</span><strong>{Math.round(value)}%</strong></div><meter min={0} max={100} value={value} aria-label={label} /></div>;
}






























