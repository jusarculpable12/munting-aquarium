/** Shop viewed through the back glass. Visitors remain behind all aquarium objects. */
export function drawShop(ctx: CanvasRenderingContext2D, time: number, visitorRate: number) {
  const cycle=time%22;
  const active=visitorRate>0;
  const arriving=cycle<5;
  const walking=arriving||cycle>16;
  const progress=arriving?cycle/5:cycle>16?Math.max(0,(21-cycle)/5):1;
  ctx.fillStyle='#c4bd98';ctx.fillRect(0,0,960,600);
  ctx.fillStyle='#817d76';ctx.fillRect(0,450,960,150);
  // Door and supplies belong to the shop beyond the aquarium glass.
  ctx.fillStyle='#5d655f';ctx.fillRect(55,48,180,430);
  ctx.fillStyle='#233e50';ctx.fillRect(65,58,160,410);
  const open=active?(cycle<2?Math.sin(cycle/2*Math.PI):cycle>19&&cycle<21?Math.sin((cycle-19)/2*Math.PI):0):0;
  ctx.save();ctx.translate(65,58);ctx.scale(1-open*.85,1);
  ctx.fillStyle='#bd9767';ctx.fillRect(0,0,160,410);
  ctx.fillStyle='#83b9c1';ctx.fillRect(12,14,136,245);
  ctx.fillStyle='#e6dec0';ctx.fillRect(33,65,94,35);ctx.fillStyle='#36566a';ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText('BUKAS',80,88);
  ctx.fillStyle='#e5c37f';ctx.fillRect(138,295,7,19);ctx.restore();
  for(let row=0;row<3;row++){
    ctx.fillStyle='#716e60';ctx.fillRect(710,90+row*115,220,9);
    for(let jar=0;jar<4;jar++){ctx.fillStyle=['#c2b57a','#86aba0','#b9927f','#83a5b7'][jar];ctx.fillRect(725+jar*50,50+row*115,31,40);ctx.fillStyle='#d5cdb6';ctx.fillRect(725+jar*50,47+row*115,31,7);}
  }
  if(!active||cycle>21)return;
  const x=145+progress*355;
  const bob=walking?Math.sin(time*9)*3:0;
  ctx.save();ctx.translate(x,385+bob);
  ctx.fillStyle='#334967';ctx.fillRect(-28,20,21,100);ctx.fillRect(9,20,21,100);
  ctx.fillStyle='#d58d75';ctx.beginPath();ctx.roundRect(-55,-116,110,150,24);ctx.fill();
  ctx.fillStyle='#d6aa84';ctx.fillRect(-65,-95,16,110);ctx.fillRect(49,-95,16,110);
  ctx.beginPath();ctx.ellipse(0,-157,43,50,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#51433c';ctx.beginPath();ctx.ellipse(0,-177,44,33,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(-43,-178,10,34);
  ctx.fillStyle='#354550';ctx.fillRect(-19,-160,5,7);ctx.fillRect(14,-160,5,7);
  ctx.beginPath();ctx.arc(0,-143,11,.2,Math.PI-.2);ctx.strokeStyle='#986a56';ctx.lineWidth=3;ctx.stroke();
  if(!walking){ctx.fillStyle='#f0e7c9';ctx.beginPath();ctx.roundRect(49,-228,130,38,10);ctx.fill();ctx.fillStyle='#456270';ctx.font='bold 15px monospace';ctx.textAlign='center';ctx.fillText(cycle<10?'Ang ganda!':'Wow, fish!',114,-203);}
  ctx.restore();
}

export function drawBackgroundVisitor(ctx: CanvasRenderingContext2D, time: number, visitorRate: number) {
 if(visitorRate<=0)return;
 const cycle=time%22;if(cycle>21)return;
 const moving=cycle<5||cycle>16;
 const progress=cycle<5?cycle/5:cycle>16?Math.max(0,(21-cycle)/5):1;
 const opening=cycle<2?Math.sin(cycle/2*Math.PI):cycle>19&&cycle<21?Math.sin((cycle-19)/2*Math.PI):0;
 ctx.save();ctx.globalAlpha=.7;
 if(opening>0){ctx.fillStyle='#193c58';ctx.fillRect(826,112,opening*35,87);ctx.strokeStyle='#8be6db';ctx.lineWidth=2;ctx.strokeRect(826,112,opening*35,87);}
 ctx.translate(850-progress*205,270+(moving?Math.sin(time*9)*1.5:0));ctx.scale(.65,.65);
 ctx.fillStyle='#c38163';ctx.beginPath();ctx.roundRect(-35,-70,70,90,15);ctx.fill();ctx.fillStyle='#e7b18b';ctx.fillRect(-45,-52,12,65);ctx.fillRect(33,-52,12,65);
 ctx.beginPath();ctx.ellipse(0,-104,30,36,0,0,7);ctx.fill();ctx.fillStyle='#343442';ctx.beginPath();ctx.ellipse(0,-120,31,23,0,Math.PI,Math.PI*2);ctx.fill();
 ctx.fillStyle='#234355';ctx.fillRect(-13,-108,4,5);ctx.fillRect(10,-108,4,5);ctx.beginPath();ctx.arc(0,-94,8,.2,Math.PI-.2);ctx.strokeStyle='#9c635b';ctx.lineWidth=2;ctx.stroke();
 if(!moving){ctx.fillStyle='#e7edd0';ctx.beginPath();ctx.roundRect(35,-148,110,30,8);ctx.fill();ctx.fillStyle='#3a6371';ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillText('Ang ganda!',90,-128);}
 ctx.restore();
}
