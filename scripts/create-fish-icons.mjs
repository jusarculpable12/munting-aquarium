import fs from 'node:fs';
import sharp from 'sharp';

// Reuse the first sprite from the Fish tab, rather than drawing a different logo.
const cell = await sharp('public/art/tool-icons.png').extract({left:0,top:0,width:434,height:724}).png().toBuffer();
const sprite = await sharp(cell).trim({threshold:10}).png().toBuffer();
const icon = size => sharp(sprite).resize({width:Math.round(size*.9),height:Math.round(size*.9),fit:'inside',kernel:'nearest'}).extend({top:0,bottom:0,left:0,right:0}).toBuffer().then(async fish => {
  const {width,height}=await sharp(fish).metadata();
  return sharp({create:{width:size,height:size,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:fish,left:Math.floor((size-width)/2),top:Math.floor((size-height)/2)}]).png().toBuffer();
});
fs.writeFileSync('public/art/fish-logo.png',await icon(256));
fs.writeFileSync('app/icon.png',await icon(192));
fs.writeFileSync('app/apple-icon.png',await icon(180));
const sizes=[16,32,48,64], images=await Promise.all(sizes.map(icon));
const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
let offset=header.length;
for(let i=0;i<sizes.length;i++){const at=6+i*16;header[at]=sizes[i];header[at+1]=sizes[i];header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(images[i].length,at+8);header.writeUInt32LE(offset,at+12);offset+=images[i].length;}
fs.writeFileSync('app/favicon.ico',Buffer.concat([header,...images]));
console.log('Created Fish tab logo, favicon (16/32/48/64), app icon, and Apple icon.');
