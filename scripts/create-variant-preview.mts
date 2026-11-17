import {writeFileSync} from 'node:fs';
import {start} from '../game/model.ts';
import {discoveryKeys} from '../game/discoveries.ts';
const save=start(Date.now());save.discoveries=discoveryKeys;save.coins=1000;save.tanks[0].water=100;
writeFileSync('tests/variant-art-preview.json',JSON.stringify(save));
