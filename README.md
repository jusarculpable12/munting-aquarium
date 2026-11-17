# Munting Aquarium

A browser-local, Filipino neighborhood aquarium and fish shop game. Prices, stocking units, care percentages, and timings are fictional game balance values.

## Local setup

Use Node.js 24. Run `npm install`, then `npm run dev`, and open http://localhost:3000. Run `npm test` for the simulation regression tests, `npm run check` for TypeScript, and `npm run build` for the production build.

## Play

- Start with an adult guppy pair. Click or tap the aquarium water directly to drop one pellet per interaction, with no feeding limit. Each fish has its own fullness. Eating a pellet restores 20 fullness only to that fish. Dropped food adds waste, and feeding a fish above 70% fullness adds extra waste. The tank meter shows average fullness; individual levels appear in the collection. Older saves automatically inherit the previous tank fullness. Use partial water changes to recover water quality.
- Healthy stocked tanks earn coins from visitors. Decorations increase the visitor rate. A larger tank adds stocking space and filtration slows waste buildup.
- Buy an adult of either sex at the shop. Mollies need the hard-water setup. All four starter species can share water when their needs are met and there is space. An adult pair can produce fry under suitable conditions. Fry mature after two minutes and have an 8% chance of being lavender.
- Sell an eligible adult to fulfill the current request. After unlocking another tank, use the collection panel to move fish between tanks.
- When the tab is closed, hidden, or suspended, fullness, health, overfeeding stress, water quality, and breeding progress pause. Returning pays up to one hour of visitor earnings based on the saved conditions, once per elapsed period. Fish cannot die while away. Timestamp-based growth still continues. Active play resumes care from the saved conditions.

Partial water changes and controlling waste draw on freshwater husbandry principles. The game simplifies water chemistry and uses a composite water-quality meter. Its values are for play.

## Fish art

The fish are original smooth canvas illustrations, shared by the tank, collection, and shop. They use curved silhouettes, fin rays, highlights, and species markings: male guppies have a larger colorful tail, platies have a deeper body without a sword, mollies have a longer body and prominent dorsal fin, and male swordtails have the lower tail extension. See the FishBase entries for [guppy](https://www.fishbase.se/summary/3228), [platy](https://www.fishbase.se/summary/3232), [molly](https://www.fishbase.se/Fieldguide/FieldGuideSummary.php?c_code=608&genusname=Poecilia&speciesname=sphenops), and [swordtail](https://www.fishbase.se/physiology/Xiphophorus_hellerii). Tail motion and occasional mood bubbles are visual game cues. The mood icons are fictional characterizations, not claims about fish emotions.

## Saves and alerts

Saves stay in local storage for the same browser profile and origin. They normally survive reloads, browser closure, and device restarts. Clearing site data or changing browsers, profiles, or URLs can hide or erase a save. Export JSON to keep a copy. Import replaces progress and resumes from the import time so restoring a backup cannot repeatedly collect historical offline income. Browser alerts are optional per session and depend on browser support and permission while the game is open.

## Vercel

After you commit the project to GitHub, import that repository in Vercel and select the Next.js framework preset. Use the repository root and Node.js 24. The app needs no secrets, database, or environment variables. See https://vercel.com/docs/frameworks/full-stack/nextjs.




## Individual health and mortality

Each fish starts at 100 health. Happiness is the lowest of water quality, its own fullness, and 100 minus its overfeeding stress. Eating beyond 100 fullness adds the excess as stress, which digests at 0.5 points per second. Fullness or water below 30 drains health at one third of a point per second; stress at least 20 causes milder damage of 0.1 per second; otherwise health recovers at 0.2 per second. About five minutes of uninterrupted danger from full health can cause death. Fullness at 100 alone does not kill a fish. Stop feeding an overfed fish, feed a hungry one, and change poor water to allow recovery. These fictional care rules run only during active play; away time preserves care and health. Deceased fish float, occupy space until removed from Collection, and cannot eat, move, breed, or be sold. Existing saves gain full health and zero overfeeding stress automatically.

## Colors and game rarity

New purchases and newborn fish roll a color once: Common 60%, Uncommon 28%, Rare 10%, Legendary 2%. Within a tier each color is equally likely. These are fictional game odds, not real-world rarity or genetics. Purchases cost the same regardless of the result, and colors remain fixed through reloads, exports, and tank moves. Existing fish keep their previous default color or lavender variant. Female and male guppies retain distinct silhouettes.

Variety references: [Aquarium Industries stock catalog](https://www.aquariumindustries.com.au/wp-content/uploads/2025/08/250806_StockBook.pdf) lists cobra/tuxedo guppies and pineapple/kohaku koi swordtails; its [molly profile](https://www.aquariumindustries.com.au/product/molly/) lists gold, silver, black and dalmatian colors. [Coburg Aquarium](https://coburgaquarium.com.au/products/platy-mickey-mouse) describes the platy tail marking. Art interprets these varieties in the game's palette. Lavender is an explicitly fictional Legendary color, retained for compatibility with existing customer requests. Breeding rolls use the same odds rather than simulating genetics.

## Livebearer nursery

The moss-covered nursery stone is a shelter for liveborn fry, not an egg nest. One eligible female per species displays the existing breeding timer as pregnancy progress and approaches the nursery after 65%. Newborns appear in the shelter and remain nearby until adulthood, while still approaching food. Their mother's ID is saved. These are simplified game visuals: the current 3–6 minute timers and one-baby cycles are fictional, and the game does not simulate real gestation, sperm storage, or fry predation. Nursery shelter references: [Aquarium Co-Op livebearers](https://www.aquariumcoop.com/blogs/aquarium/top-10-livebearers) and [raising fry](https://www.aquariumcoop.com/blogs/aquarium/raise-baby-fish).

## Full-screen game presentation

The aquarium now fills the viewport. Floating wooden HUD panels show actual happiness, water quality, fullness, and coins; the bottom hotbar opens closable Fish, Shop, Water, Decor, and Tanks trays. Settings contains export/import, optional notifications, and fullscreen controls. Escape closes a tray. Locate highlights a fish in its home tank. The fictional temperature shown in the concept was replaced by the functioning fullness meter.

`public/art/aquarium-scene.png` is an original background generated with the built-in image generation tool. Prompt: a detailed 8-bit inspired aquarium interior with saturated turquoise water, open swimming space, dense freshwater plants at the edges, a mossy nursery cave lower left, golden sand, and an unoccupied Filipino shop beyond the back glass; no fish, people, text, or UI. Fish, food, nursery behavior, visitor movement, and controls are rendered separately at runtime.

### Reference layout artwork refresh
The full viewport aquarium now uses `public/art/aquarium-scene-v2.png`, with separate transparent `fish-atlas.png` (four species, both sexes) and `tool-icons.png`. These are generated original game assets. Fish are rendered independently from the scenery: their tail motion, turning, feeding, emotions, saved color variety, and individual care remain connected to the simulation. The illustrated shop customer in this environment is static scenery; door entry is not animated in this art revision. New UI: compact corner meters, separate tank plaque, cream wooden tool buttons, fullscreen control, and closed-by-default management drawer. The art is fine pixel illustration rather than hardware-limited 8-bit graphics.

Overfeeding balance: excess food stress falls by 0.5 per simulated second (at most 200 seconds from maximum stress). At stress 20 or above, breeding pauses and health drops slowly by 0.1 per second. When excess clears, health recovers in suitable water with adequate fullness. More food adds stress again; dirty water and starvation retain their separate penalties. These are fictional game timings. Locate rings clear after two seconds, and clicking Locate again restarts that timer.

### Breeding stages (accelerated game timing)
Each species now has 60 seconds of courtship followed by 15 minutes (guppy), 20 minutes (platy), 25 minutes (swordtail), or 30 minutes (molly) of pregnancy, then 120 seconds of recovery. Courtship males follow an eligible same-species female, pregnancy gradually changes the female silhouette, late pregnancy draws her toward the nursery, and birth displays a 12-second announcement. Stages and care blockers replace the floating fry percentage. Good care and space remain necessary; progress pauses if conditions fail. Saves retain existing elapsed breeding seconds and support the new recovery period. This is a simplified single breeding cycle per species per tank, not a genetics or reproductive biology simulation. Real gestation ranges: guppy 21–35 days, platy and swordtail 28–42 days, black molly 40–70 days, per TNAU/ICAR: https://agritech.tnau.ac.in/fishery/fish_cul_ornamental.html

Growth update: newly purchased fish arrive as juveniles at 45% adult size; newborn fry start at 25%. Both grow continuously over 30 minutes of elapsed game time, saved using born/maturesAt timestamps, and cannot breed or fulfill orders until adult. Growth continues across refreshes and offline time. Starter adults and existing saves retain their prior maturity; legacy saves without maturesAt use their previous two-minute growth rule. These are fictional accelerated game timings.

Empty aquarium base: `public/art/aquarium-gravel.png` is an edited background with all foreground aquatic plants and moss removed, retaining golden gravel and the bare stone fry nursery at the lower left. Shop plants behind the glass remain part of the shop environment. Mobile cropping keeps the left nursery visible. This prepares open space for a future accessory placement feature; drag-and-drop accessories are not implemented yet.

Shop navigation: Shop contains Fish and Accessories category buttons. Fish contains buying and customer orders; Accessories currently shows an unstocked empty state pending the accessory-placement feature. The separate Decor toolbar button is removed. Capacity, filtration and water-profile upgrades are available in Tanks.

My Fish shows fictional direct-sale values, with an in-game confirmation dialog naming the fish, tank and coin payout. Only settled adult fish can be sold. Resale is 50/60/70/80% of the species purchase price for Common/Uncommon/Rare/Legendary, rounded down, so rare purchase rolls cannot be farmed for instant profit. Direct sales do not fulfill customer orders and duplicate sales cannot pay twice. Stocking usage appears on the tank plaque, My Fish and Tanks; capacity upgrades show the current and next limits. Stocking units are species-weighted rather than a simple fish count. Removed the nursery text sign while preserving the cave.


Courtship/body presentation: only the eligible adult female and male receive courtship labels/following behavior; fry, juveniles, extra adults and unfit fish are excluded. Crossing from courtship to pregnancy displays a seven-second heart/sparkle success effect (static message with reduced motion). Fullness adds a modest smooth central belly bump above 70%; pregnancy adds a broader rear belly and dark gravid spot, increasing with progress. These sprite deformations are illustrative game indicators. The head, tail and feeding mouth anchor remain unchanged.

Tablet/mobile landscape: portrait viewports up to 1024px show a rotate-device screen. Rotate physically to play; Play fullscreen also attempts landscape orientation locking where supported. Unsupported browsers keep manual-rotation guidance. Compact landscape controls and scrollable drawers fit short phone screens and use safe-area offsets. Rotating back to portrait cancels a pending sale confirmation safely.

My Fish has separate tank selector buttons for each unlocked tank, with a fish count and stocking usage. Selecting one switches both the aquarium and its collection list; empty tanks show a local empty state. Fish moved or sold update the corresponding tank counts automatically. Customer orders still search stock across all tanks.

Responsive visual QA (Browser): checked 1280×720 desktop, 1024×768 tablet landscape, 844×390 and 667×375 phone landscape, and 390×844 portrait. Fixed HUD icon centering, tank-plaque alignment, uniform toolbar geometry, panel/HUD overlap, repeated collection summaries, and fish action wrapping. Compact landscape uses horizontal meters and taller scrollable drawers. Feeding hint hides while a drawer is open. Portrait rotation card remains centered. Desktop DOM check confirmed equal 105×96 toolbar buttons on the same baseline, no horizontal page overflow, and no corner fullscreen button. Screenshots: public/art/qa-phone-landscape.jpg, qa-tablet-landscape.jpg, qa-desktop.jpg. Existing save data was preserved.

Background ambience: `game/shop-ambience.ts` animates regions of the original illustration independently behind fish. The Philippine flag flutters, the left window gently shifts in the breeze, the shopkeeper subtly sways, and each shop display aquarium has moving plants, bubbles, and waterline shimmer. Feathered source-image ribbons preserve the art and fixed shelves/frames. Animation time is separate from simulation time. Reduced-motion preference shows the static background without ambience effects.

### Plant accessories
Twelve original generated artificial plant sprites are in `public/art/plant-atlas.png`. Shop → Accessories sells small plants for 15 coins/1 slot, medium for 25/2, and tall for 40/3. Tanks allow 4/6/8 accessory slots by size; fish stocking capacity remains separate. Buy places a plant immediately; Arrange plants lets you drag with mouse/touch on the gravel or use arrow keys. The nursery entrance is reserved. Done arranging restores feeding. Positions persist in local saves and exports; old saves without accessories still load. Return refunds the purchase price once and frees the slots. Plants stay static (no swaying background animation).
Artificial plants provide visual cover/hiding places; fry now shelter near placed plants. They do not produce oxygen, absorb nitrate, or replace filtration/water changes. Game attraction bonus is +1 coin/min per 2 occupied slots, capped at +2/min and requiring a healthy aquarium. Prices and attraction rates are fictional balance values. Research: https://www.aqueon.com/articles/artificial-aquarium-plants and https://www.fishkeeper.co.uk/faq/are-real-plants-better-for-my-aquarium-than-plastic-plants

### Accessory equipment and depth
Shop → Accessories includes twelve artificial plants plus live Java fern, a stone cave, sponge/internal filters, air stone, heater/thermometer, plant light, cover and gravel mound. Prices are fictional 15–140 coins; the existing 4/6/8 accessory slot limits apply. Equipment is unique per kind per tank. The strongest accessory filter slows waste 15% or 25%; a live fern with light adds 15% (maximum combined 40%). A heater adds 3 happiness only with adequate food/water and no overfeeding stress. These are simplified game effects, not real temperature or oxygen chemistry. The cover is decorative; evaporation and jumping are not simulated.

Fry and resting/expecting fish seek planted cover or caves. In poor water, fish approach upper water near an air stone; bubbles do not clean water. All movement uses persistent swimming positions. Background art remains static; only purchased aeration equipment adds small bubbles, respecting reduced motion.

Arrange accessories supports drag/touch and arrow keys. Select an item to choose Behind cave or In front; these settings also appear in the owned accessory list. Depth and position are saved and exported. Existing placements default to front. Buried sprite bases, static contact shadows and gravel texture anchor objects to the substrate.

Accessory balance: artificial plants 15/25/40 coins by size; live Java fern 60, stone cave 35, sponge filter 80, internal filter 140, air stone 30, heater/thermometer 75, plant light 45, cover 20 and gravel 15. New purchases save paidPrice; returns refund that recorded amount once. Existing accessories without paidPrice refund their original 5 coins per slot, so repricing does not create refund profits.
### Fish encyclopedia and discoveries
The in-game Book button opens a parchment field guide for guppy, platy, molly and swordtail, with all 64 color entries, male/female previews, species care/breeding notes, and per-variant purchase/birth odds. Undiscovered colors use black fish silhouettes and hidden names; discovered entries show their colors and notes. Rarity is fictional game balance, and lavender is explicitly a fantasy palette.

Discoveries are stored in the local save and exported backups. Purchases and births record discoveries immediately; sales, orders, moves and removal never erase them. Older saves recognize all fish still present (including deceased fish) and record those discoveries on the next simulation/action. Fish sold or removed before this feature cannot be reconstructed from old saves. Imports validate discovery IDs and reject duplicates/invalid entries.

Care references: [Aqueon livebearer care](https://www.aqueon.com/resources/care-guides/livebearer), [Aqueon livebearer aquarium](https://www.aqueon.com/articles/livebearer-aquarium), [Aquarium Co-op guppy care](https://www.aquariumcoop.com/blogs/aquarium/guppy-care-guide). These are linked from the book; game scores and accelerated timing are distinguished from real husbandry.

The fish book now uses generated illustrated assets matching the aquarium's wooden toolbar, greenery and golden lighting: `public/art/fish-book-frame.png` and `public/art/fish-book-icon.png`. Presentation lives in `app/book.css`; the generated two-page frame sits behind accessible live text, species selectors and existing fish canvases. Species portraits and variant frames use the aquarium's own water artwork. Unknown fish remain silhouettes and all discovery/save behavior is preserved. Generation prompts and references are documented in `docs/art/fish-book.md`.

### Expanded strain collection
The playable catalog now has 64 entries: 19 guppy, 18 platy, 13 molly and 14 swordtail. Four entries are explicitly fictional lavender palettes. All named color/pattern forms in the research are represented, including Moscow, grass, mosaic, cobra, tuxedo, Mickey Mouse, marble, wagtail, gold-dust and bicolor forms. Named high-fin, pintail, sailfin and lyretail combinations have separate entries and cached fin extensions. This is a curated trade-name collection, not a claim that these are all strains in existence. Existing save/discovery IDs remain valid.

The existing detailed fish silhouettes and animation are retained. A deterministic canvas palette/pattern renderer adds actual dark fins, tail-base markings, spots, contrasting patches and fin forms. Artwork is a stylized identification aid, not a genetic or photorealistic model. Rarity is fictional and remains 60/28/10/2 percent per tier; entries share their tier equally, so individual odds change as the catalog expands. Book odds are rounded to two decimals. Births currently use the same random pool, without parental inheritance. Source catalogs are linked in the book.
