# Accessory artwork v2

Generated with the built-in image generation tool, using `public/art/aquarium-gravel.png` as the primary visual reference and `public/art/tool-icons.png` for the existing palette and icon rendering. No API key or CLI generation was used.

## Final prompt specification

Create a transparent production sprite atlas with three equal columns and seven equal rows. Match the existing aquarium's richly detailed painted pixel texture, golden upper-left sunlight, turquoise ambient shadows, warm natural gravel, crisp fine pixels and illustrated material depth. Avoid flat vector shapes, schematic equipment, chunky low resolution icons, glossy product photography, black plastic plant bases, text, borders and overlapping cells. Center each sprite in its cell with transparent margins and a common ground baseline. Plants grow from tiny gravel/root clumps; equipment uses textured teal materials, clear glass and restrained highlights. Use the aquarium's original stone cave as the reference for the new stone shelter.

Rows, from left to right:
1. Coin-leaf bush; fine grass tuft; mini fern bush.
2. Spear-leaf bunch; oval-leaf stem; scalloped-leaf cluster.
3. Ribbon grass; tall lance-leaf stem; lime-leaf cluster.
4. Branching oval vine; dense leaf thicket; pink-tip leafy stem.
5. Live Java fern on a tiny stone; river-stone shelter cave; porous sponge filter with uplift tube.
6. Internal filter with grille and outlet; porous air stone with translucent tube; glass heater and thermometer.
7. LED lamp on short legs; framed glass cover with small wooden handle; golden river gravel mound.

Cleanup pass: preserve every design and cell position while removing stray colored speckles, fog, glow and matte fringes outside solid silhouettes. Empty space must remain transparent, including gaps between leaves. Preserve actual leaf greens, golden pebbles and blue glass highlights within the objects. No added background, text or outline.

## Integration

The master sheet is `public/art/accessories-v2.png`. `scripts/prepare-accessory-art.mjs` uses hand-checked row gutters to extract its 21 transparent sprite cells without recoloring or resampling them and writes size metadata to `game/accessory-art.ts`. Runtime uses the same PNGs in the shop and aquarium. Shapes have individual display heights so low gravel, lamps and covers are not stretched into tall blocks. Artwork changes do not alter prices, slot costs, save identifiers or behavior.

To re-extract the atlas:

    node scripts/prepare-accessory-art.mjs public/art/accessories-v2.png
