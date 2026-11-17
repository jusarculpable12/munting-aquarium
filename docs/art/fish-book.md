# Fish book artwork

Generated using the built-in image generation tool. The aquarium background and existing toolbar art were supplied as visual references before generation. Two production assets are installed: `public/art/fish-book-frame.png` and `public/art/fish-book-icon.png`.

## Frame prompt
Generate a production game UI background for an open fish encyclopedia matching the aquarium and illustrated toolbar: detailed painterly fine pixel-art texture, honey-brown carved wood, golden highlights, dark teal ambient shadows, small tropical leaf details and crisp pixel clusters. Landscape 3:2, straight-on UI view, full bleed. The top 15 percent is a clean blank dark wooden title rail. Tiny leaf clusters belong only at the outer top corners. Below it, two pale cream paper pages are equally divided by a narrow stitched binding. The central paper areas must remain clean, subtly textured, light and readable. Include layered page edges, carved cover sides and tiny brass corner studs. No text, numbers, fish drawings, controls, cards, mock interface, photo styling, blur, chunky pixels, heavy grunge or watermark.

## Icon prompt
Generate one isolated upright closed fish field-guide book with a honey-brown wooden cover, cream paper edges, gold corner protectors, blue fish relief and two small green leaves. Slight three-quarter view. Match the existing toolbar icons and the generated open-book frame: dimensional fine pixel illustration, golden highlights, teal ambient shadows and dark outlines. Strong readable silhouette at toolbar size. Transparent background, no words, scene, external shadow, glow or multiple objects. Transparent margins were trimmed during integration; generated pixels and alpha are otherwise retained.

## UI implementation
`app/book.css` keeps the generated book frame stationary behind real HTML text, buttons and scrollable pages. Fish portraits use the existing game renderer; undiscovered entries remain black silhouettes. No generated text is used. Prices, care simulation and discovery records are unchanged by this visual update.
