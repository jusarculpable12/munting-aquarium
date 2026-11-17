import { accessorySpriteStyle, plantDefinition, type PlantId } from '../game/accessories';
export default function PlantPortrait({kind}:{kind:PlantId}) {
 return <span className="plant-portrait" role="img" aria-label={plantDefinition(kind).name} style={accessorySpriteStyle(kind)}/>;
}
