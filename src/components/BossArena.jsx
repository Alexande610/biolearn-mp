import { useEffect, useRef } from 'react';
import {arenaTime,jumpHeight} from '../utils/bossMotion';
const W=1080,H=450,G=346,PX=164;
const colors=['#33e8ce','#99c9ff','#f3a56e','#c6a1ff','#f2ca68','#78d9fa','#98eeaa','#ffb07b','#baadff','#ffc4db'];
function box(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function orb(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
export default function BossArena({snapshot,onJump,busy,jumpCue}){
 const canvas=useRef(null),state=useRef({snapshot,at:0,attackAt:-10000,renderTime:0,anchor:0,jumpAt:-10000});
 useEffect(()=>{const prev=state.current;
  const isNewAttack=snapshot?.feedback?.kind==='correct'&&snapshot.feedback.questionId!==prev.snapshot?.feedback?.questionId;
  const now=performance.now(),base=Number(snapshot?.worldTime||0);
  const running=snapshot?.status==='active'&&!snapshot.question;
  const sameRun=running&&prev.snapshot?.id===snapshot.id&&prev.snapshot?.status==='active'&&!prev.snapshot.question;
  const newJump=Number(snapshot?.lastJump??-100)>Number(prev.snapshot?.lastJump??-100);
  state.current={...prev,snapshot,at:now,anchor:sameRun?Math.max(base,prev.renderTime):base,
   jumpAt:newJump&&!prev.localAnimation?now-Math.max(0,base-Number(snapshot.lastJump))*1000:prev.jumpAt,
   attackAt:isNewAttack?now:prev.attackAt};},[snapshot]);
 useEffect(()=>{if(jumpCue){state.current.jumpAt=jumpCue.at;state.current.localAnimation=true;}},[jumpCue]);
 useEffect(()=>{
  const c=canvas.current.getContext('2d');let frame;
  function render(stamp){
   const {snapshot:s,at,attackAt,anchor,jumpAt}=state.current;const run=s?.status==='active'&&!s.question;
   const time=arenaTime(anchor,at,stamp,s?.nextWeaponAt,run);state.current.renderTime=time;
   const light=document.body.classList.contains('light-theme');
   const color=colors[(Number(s?.lessonId||1)-1)%10];
   const bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,light?'#ecf8ff':'#071d2d');bg.addColorStop(1,light?'#cfede1':'#092e33');c.fillStyle=bg;c.fillRect(0,0,W,H);
   for(let l=0;l<3;l++)for(let i=0;i<11;i++){
    const x=((i*139+l*71-time*(8+l*11))%1200+1200)%1200-60,y=45+(i*79+l*57)%250,r=20+(i*13+l*11)%42;
    c.strokeStyle=light?`rgba(31,127,114,${.12+l*.025})`:`rgba(99,214,205,${.04+l*.018})`;c.lineWidth=2;c.beginPath();c.ellipse(x,y,r,r*.7,i*.3,0,Math.PI*2);c.stroke();orb(c,x+7,y-3,r*.18,light?'rgba(31,127,114,.1)':'rgba(114,226,206,.06)');
   }
   for(let i=0;i<35;i++)orb(c,(i*151+time*6)%W,25+(i*83)%288,1.2,'rgba(210,255,248,.24)');
   c.fillStyle=light?'#abd7c4':'#0d3e43';c.fillRect(0,G,W,H-G);c.fillStyle=light?'#438c77':'#2b7975';c.fillRect(0,G,W,3);
   for(let i=0;i<19;i++){const x=((i*76-time*102)%W+W)%W;c.strokeStyle='rgba(80,191,168,.25)';c.beginPath();c.moveTo(x,G+25);c.lineTo(x+25,G+25);c.stroke();orb(c,x+39,G+64,3,'#174e4e');}
   const bx=902,by=210+Math.sin(stamp/650)*9;c.save();c.translate(bx,by);
   const glow=c.createRadialGradient(0,0,12,0,0,125);glow.addColorStop(0,`${color}44`);glow.addColorStop(1,`${color}00`);c.fillStyle=glow;c.fillRect(-125,-125,250,250);
   for(let i=0;i<12;i++){const a=i*Math.PI/6,bend=Math.sin(stamp/430+i)*15;c.strokeStyle=color;c.globalAlpha=.7;c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(Math.cos(a)*55,Math.sin(a)*55);c.quadraticCurveTo(Math.cos(a)*85+bend,Math.sin(a)*85,Math.cos(a)*100,Math.sin(a)*100+bend);c.stroke();orb(c,Math.cos(a)*100,Math.sin(a)*100+bend,5,color);}
   c.globalAlpha=1;orb(c,0,0,66,'#16434b');c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.arc(0,0,66,0,Math.PI*2);c.stroke();
   orb(c,-25,-20,14,'#e3fcf6');orb(c,25,-20,14,'#e3fcf6');orb(c,-29,-17,7,'#061a22');orb(c,21,-17,7,'#061a22');c.strokeStyle='#e3fcf6';c.lineWidth=5;c.beginPath();c.moveTo(-20,20);c.quadraticCurveTo(0,7,20,20);c.stroke();orb(c,0,42,7,color);c.restore();
   c.fillStyle=light?'#315d54':'#89aaa9';c.font='600 12px system-ui';c.textAlign='center';c.fillText(`BOSS • ${s?.bossHp??100} HP`,bx,90);
   const events=s?.status==='offered'?[{at:1.5,kind:'obstacle'},{at:3,kind:'hint'},{at:4.5,kind:'projectile'},{at:6,kind:'shield'}]:(s?.courseEvents||[]);
   for(const event of events){
    const x=PX+(Number(event.at)-time)*140;if(x<PX-40||x>790)continue;const kind=event.kind;
    if(kind==='obstacle'){c.fillStyle='#fc9174';c.beginPath();c.moveTo(x-23,G);c.lineTo(x-12,G-43);c.lineTo(x,G-23);c.lineTo(x+14,G-47);c.lineTo(x+26,G);c.fill();c.strokeStyle='#ffd4a3';c.lineWidth=2;c.stroke();}
    else if(kind==='projectile'){orb(c,x,G-27,14,'#fd756a');orb(c,x-5,G-30,5,'#ffd3b3');c.strokeStyle='rgba(253,117,106,.35)';c.lineWidth=6;c.beginPath();c.moveTo(x+18,G-27);c.lineTo(x+48,G-27);c.stroke();}
    else if(kind==='weapon'){c.save();c.translate(x,G-26);c.rotate(Math.sin(stamp/500)*.2);box(c,-20,-7,40,14,5,color);box(c,-10,3,11,16,3,'#c1fff4');orb(c,18,0,4,'white');c.restore();c.fillStyle=light?'#19765b':color;c.font='11px system-ui';c.fillText('VŨ KHÍ',x,G-58);}
    else if(kind==='hint'){orb(c,x,G-27,15,'#ffce69');c.fillStyle='#483c21';c.font='bold 20px system-ui';c.fillText('?',x,G-20);}
    else if(kind==='potion'){box(c,x-11,G-42,22,31,7,'#fa99ae');box(c,x-7,G-49,14,9,2,'#f4e5ed');c.fillStyle='white';c.fillRect(x-2,G-35,4,14);c.fillRect(x-7,G-30,14,4);}
    else if(kind==='shield'){c.fillStyle='#86c7ff';c.beginPath();c.moveTo(x,G-49);c.lineTo(x+17,G-42);c.lineTo(x+12,G-18);c.lineTo(x,G-10);c.lineTo(x-12,G-18);c.lineTo(x-17,G-42);c.fill();}
   }
   const lift=jumpHeight(stamp,jumpAt),py=G-30-lift;
   c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.ellipse(PX,G+3,29-lift*.07,7,0,0,Math.PI*2);c.fill();c.save();c.translate(PX,py);
   if(s?.shield){c.strokeStyle='rgba(134,199,255,.8)';c.lineWidth=3;c.beginPath();c.arc(0,-6,44,0,Math.PI*2);c.stroke();}
   box(c,-29,-25,15,35,5,'#427e85');box(c,-21,-27,42,48,14,'#e7fff7');box(c,-17,-22,34,21,8,'#082e41');box(c,-12,-18,24,6,3,'#7ce7d8');
   const step=run&&!lift?Math.sin(stamp/100)*5:0;box(c,-16,15,12,14+step,4,'#83c8bc');box(c,5,15,12,14-step,4,'#83c8bc');box(c,16,-7,25,11,4,color);box(c,35,-10,8,14,3,'#c2fff6');c.restore();
   c.textAlign='left';c.fillStyle=light?'#315d54':'#9ac7c4';c.font='12px system-ui';c.fillText('KHU VỰC SINH HỌC / LỚP 6',25,31);c.textAlign='right';c.fillText(s?.question?'ĐÃ NHẶT VŨ KHÍ • CHỌN ĐÁP ÁN':'SPACE / ↑ / CHẠM ĐỂ NHẢY',W-25,H-25);
   if(stamp-attackAt<550){c.strokeStyle=color;c.lineWidth=5;c.beginPath();c.moveTo(PX+35,py-5);c.lineTo(bx-60,by);c.stroke();}
   frame=requestAnimationFrame(render);
  }
  frame=requestAnimationFrame(render);return()=>cancelAnimationFrame(frame);
 },[]);
 return <div className="boss-arena" role="button" tabIndex={0} aria-label="Chạm để nhảy né chướng ngại"
   onPointerDown={e=>{e.preventDefault();if(!busy)onJump();}}>
   <canvas ref={canvas} width={W} height={H} aria-label="Nhân vật và boss trong đường chạy sinh học"/>
 </div>;
}
