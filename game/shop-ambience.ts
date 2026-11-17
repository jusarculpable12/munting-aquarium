/** Subtle animation of the existing shop illustration, behind the playable fish. */
export class ShopAmbience {
  private image: HTMLImageElement;
  private patches: { x: number; y: number; width: number; height: number; amount: number; speed: number; phase: number; layer: HTMLCanvasElement; mask: HTMLCanvasElement }[] = [];
  constructor() {
    this.image = new Image();
    this.image.src = '/art/aquarium-gravel.png';
    const regions = [
      // Flag cloth only: the pole stays still. Window pane gets a tiny breeze movement.
      [247, 155, 104, 116, 6, 2.8], [66, 141, 130, 272, 1.6, 1.15],
      [332, 245, 198, 224, 1.5, .85], // Gentle shopkeeper sway, anchored at the counter.
      // Interiors only, leaving shop tank frames and shelves fixed.
      [1211, 280, 190, 98, 2.6, 1.3], [1209, 449, 191, 77, 2.3, 1.1],
      [1432, 242, 165, 111, 2.8, 1.2], [1430, 459, 164, 87, 2.4, 1.4],
    ];
    regions.forEach(([x,y,width,height,amount,speed],phase) => {
      const layer = document.createElement('canvas'); layer.width=width;layer.height=height;
      const mask = document.createElement('canvas'); mask.width=width;mask.height=height;
      const m=mask.getContext('2d')!;
      const horizontal=m.createLinearGradient(0,0,width,0);
      horizontal.addColorStop(0,'transparent');horizontal.addColorStop(.08,'white');horizontal.addColorStop(.92,'white');horizontal.addColorStop(1,'transparent');
      m.fillStyle=horizontal;m.fillRect(0,0,width,height);m.globalCompositeOperation='destination-in';
      const vertical=m.createLinearGradient(0,0,0,height);
      vertical.addColorStop(0,'transparent');vertical.addColorStop(.08,'white');vertical.addColorStop(.92,'white');vertical.addColorStop(1,'transparent');
      m.fillStyle=vertical;m.fillRect(0,0,width,height);
      this.patches.push({x,y,width,height,amount,speed,phase,layer,mask});
    });
  }
  draw(ctx: CanvasRenderingContext2D, time: number, reducedMotion: boolean) {
    const image=this.image;
    if(!image.complete||!image.naturalWidth)return;
    ctx.save();ctx.scale(960/1672,600/941);ctx.imageSmoothingEnabled=true;
    ctx.drawImage(image,0,0,1672,941);
    if(reducedMotion){ctx.restore();return;}
    for(const patch of this.patches){
      const {x,y,width,height,amount,speed,phase,layer,mask}=patch;
      const p=layer.getContext('2d')!;p.clearRect(0,0,width,height);p.globalCompositeOperation='source-over';
      // Repaint source pixels as a continuous moving ribbon; feathered edges blend into the illustration.
      for(let row=0;row<height;row+=2){
        const bend=Math.sin(time*speed+row*.055+phase)*amount*Math.sin(Math.PI*row/height);
        p.drawImage(image,x-8,y+row,width+16,Math.min(2,height-row),-8+bend,row,width+16,Math.min(2,height-row));
      }
      p.globalCompositeOperation='destination-in';p.drawImage(mask,0,0);p.globalCompositeOperation='source-over';
      ctx.drawImage(layer,x,y);
    }
    const tanks=[{x:1212,y:280,w:188,h:98},{x:1210,y:448,w:188,h:78},{x:1434,y:241,w:160,h:111},{x:1432,y:459,w:160,h:86}];
    tanks.forEach((tank,index)=>{
      ctx.save();ctx.beginPath();ctx.rect(tank.x,tank.y,tank.w,tank.h);ctx.clip();
      for(let bubble=0;bubble<9;bubble++){
        const progress=(time*(.13+index*.014)+bubble/9)%1;
        const x=tank.x+tank.w*(bubble%2?.73:.28)+Math.sin(time*1.8+bubble)*3;
        const y=tank.y+tank.h*(1-progress),radius=1.4+bubble%3*.65;
        ctx.strokeStyle=`rgba(190,255,251,${Math.sin(progress*Math.PI)*.6})`;ctx.lineWidth=1;
        ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle='#e7ffff80';ctx.fillRect(x-1,y-1,1,1);
      }
      // Soft moving waterline glints confined to the background glass.
      ctx.globalAlpha=.12+Math.sin(time*1.6+index)*.06;ctx.fillStyle='#bcffff';
      ctx.fillRect(tank.x,tank.y+3+Math.sin(time*1.2+index)*1.2,tank.w,1.5);ctx.restore();
    });
    ctx.restore();
  }
}

