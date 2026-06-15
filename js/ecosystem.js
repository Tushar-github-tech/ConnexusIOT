/* =====================================================================
   CONNEXUS — Connected Ecosystem (hero hub + orbiting devices)
   Isolated: #ecoStage / #ecoPlex / #ecoSvg / .eco-pill
   ===================================================================== */
(function(){
  const svg=document.getElementById('ecoSvg');
  const stage=document.getElementById('ecoStage');
  const cv=document.getElementById('ecoPlex');
  if(!svg||!stage||!cv) return;

  const ICONS={
    light:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.85 1 .9 1.65l.05.55h5.3l.05-.55c.05-.65.4-1.25.9-1.65A6 6 0 0 0 12 3Z"/>',
    ac:'<rect x="3" y="5" width="18" height="9" rx="1.5"/><path d="M6 11h12"/><path d="M7 17.5c0-1 .8-1.2.8-2.5M12 18c0-1 .8-1.2.8-2.5M17 17.5c0-1 .8-1.2.8-2.5"/>',
    solar:'<rect x="3" y="4" width="18" height="11" rx="1"/><path d="M3 8h18M3 11.5h18M9 4v11M15 4v11"/><path d="M12 18v3M9 21h6"/>',
    mixer:'<path d="M8 3h8l-1 5H9L8 3Z"/><path d="M9 8c-1.5 1.2-2 3-2 5v6h10v-6c0-2-.5-3.8-2-5"/><path d="M7 19h10"/>',
    battery:'<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4"/><path d="M7 12h3l-1.5 3 4-5h-3l1.5-3"/>',
    fan:'<circle cx="12" cy="12" r="1.6"/><path d="M12 10.4c-1.2-3.2.4-6.4 2.6-6 .9.2 1 1.5.3 2.6-.8 1.2-2 2.4-2.9 3.4ZM13.6 12c3.2-1.2 6.4.4 6 2.6-.2.9-1.5 1-2.6.3-1.2-.8-2.4-2-3.4-2.9ZM10.4 12c-3.2 1.2-6.4-.4-6-2.6.2-.9 1.5-1 2.6-.3 1.2.8 2.4 2 3.4 2.9ZM12 13.6c1.2 3.2-.4 6.4-2.6 6-.9-.2-1-1.5-.3-2.6.8-1.2 2-2.4 2.9-3.4Z"/>'
  };
  const CX=460, CY=270, RX=312, RY=170;
  const devices=[
    {id:'solar', name:'Solar', icon:'solar', ang:0,   base:1450, val:v=>`+${(v/1000).toFixed(2)} kW`, jit:90, prefix:'Generating'},
    {id:'ac',    name:'AC',    icon:'ac',    ang:-55, base:920,  val:v=>`24°C · ${Math.round(v/10)*10} W`, jit:60, prefix:'Cooling'},
    {id:'lights',name:'Lights',icon:'light', ang:-125,base:12,   val:v=>`${Math.round(v)} W · ON`, jit:2, prefix:'On'},
    {id:'fan',   name:'Fan',   icon:'fan',   ang:180, base:55,   val:v=>`Speed 3 · ${Math.round(v)} W`, jit:5, prefix:'Running'},
    {id:'bms',   name:'BMS',   icon:'battery',ang:125, base:78,  val:v=>`${Math.round(v)}% · 51.2V`, jit:1, prefix:'Charged'},
    {id:'mixer', name:'Mixer', icon:'mixer', ang:55,  base:600,  val:v=>`${Math.round(v/5)*5} W`, jit:40, prefix:'Active'}
  ];
  devices.forEach(d=>{ const a=d.ang*Math.PI/180; d.x=CX+RX*Math.cos(a); d.y=CY+RY*Math.sin(a); });

  const SVGNS="http://www.w3.org/2000/svg";
  function el(t,a){const e=document.createElementNS(SVGNS,t);for(const k in a)e.setAttribute(k,a[k]);return e;}

  // orbit rings
  const og=el('g',{}); svg.appendChild(og);
  og.appendChild(el('ellipse',{cx:CX,cy:CY,rx:150,ry:96,class:'orbit d'}));
  og.appendChild(el('ellipse',{cx:CX,cy:CY,rx:236,ry:150,class:'orbit'}));
  const og2=el('g',{}); svg.appendChild(og2);
  og2.appendChild(el('ellipse',{cx:CX,cy:CY,rx:312,ry:198,class:'orbit d'}));
  og.appendChild(el('animateTransform',{attributeName:'transform',type:'rotate',from:`0 ${CX} ${CY}`,to:`360 ${CX} ${CY}`,dur:'60s',repeatCount:'indefinite'}));
  og2.appendChild(el('animateTransform',{attributeName:'transform',type:'rotate',from:`360 ${CX} ${CY}`,to:`0 ${CX} ${CY}`,dur:'90s',repeatCount:'indefinite'}));

  // spokes + pulses
  const gSpokes=el('g',{}); svg.appendChild(gSpokes);
  const gPulse=el('g',{}); svg.appendChild(gPulse);
  devices.forEach(d=>{
    const dx=d.x-CX, dy=d.y-CY, L=Math.hypot(dx,dy), ux=dx/L, uy=dy/L;
    const x1=CX+ux*64, y1=CY+uy*64, x2=d.x-ux*40, y2=d.y-uy*40;
    d.line={x1,y1,x2,y2};
    const ln=el('line',{x1,y1,x2,y2,class:'spoke','data-dev':d.id}); gSpokes.appendChild(ln); d.spoke=ln;
    const pg=el('g',{});
    pg.appendChild(el('circle',{r:6,fill:'var(--accent)',opacity:.16}));
    pg.appendChild(el('circle',{r:3,fill:'var(--accent)'}));
    gPulse.appendChild(pg);
    d.pulse={el:pg,prog:Math.random()};
  });

  // pills
  let active=null;
  devices.forEach(d=>{
    const b=document.createElement('button');
    b.className='eco-pill'; b.dataset.dev=d.id;
    b.style.left=(d.x/920*100)+'%'; b.style.top=(d.y/520*100)+'%';
    b.innerHTML=`<span class="chip"><svg viewBox="0 0 24 24">${ICONS[d.icon]}</svg></span><span class="lbl">${d.name}</span>`+
      `<span class="tip"><b>${d.name}</b><i data-val="${d.id}">—</i></span>`;
    b.addEventListener('pointerenter',()=>setActive(d.id,true));
    b.addEventListener('pointerleave',()=>{ if(active===d.id){ active=null; refresh(); } });
    b.addEventListener('click',(e)=>{ e.preventDefault(); setActive(d.id,true); pausePing(); });
    stage.appendChild(b); d.btn=b; d.tipEl=b.querySelector('[data-val]');
  });

  function setActive(id,user){ active=id; if(user)pausePing(); refresh(); }
  function refresh(){
    devices.forEach(d=>{
      const on=active===d.id;
      d.btn.classList.toggle('active',on);
      d.spoke.classList.toggle('active',on);
    });
  }

  // live values
  function tick(){
    devices.forEach(d=>{
      const v=Math.max(0,d.base+(Math.random()-0.5)*2*d.jit);
      d.tipEl.textContent=d.val(v);
    });
  }
  tick(); setInterval(tick,1500);

  // ambient ping cycle
  let pingTimer=null, pinged=0, pausedUntil=0;
  function startPing(){ stopPing(); pingTimer=setInterval(()=>{
    if(performance.now()<pausedUntil) return;
    const d=devices[pinged%devices.length]; pinged++;
    active=d.id; refresh();
  },2100); }
  function stopPing(){ if(pingTimer){clearInterval(pingTimer);pingTimer=null;} }
  function pausePing(){ pausedUntil=performance.now()+7000; }

  // plexus canvas
  const ctx=cv.getContext('2d');
  let W=0,H=0,dpr=1,pts=[],mouse={x:-999,y:-999};
  function resize(){
    const r=stage.getBoundingClientRect(); dpr=Math.min(2,window.devicePixelRatio||1);
    W=r.width; H=r.height; cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    const n=Math.round(W*H/13000);
    pts=[]; for(let i=0;i<n;i++) pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22});
  }
  stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;});
  stage.addEventListener('pointerleave',()=>{mouse.x=-999;mouse.y=-999;});

  function drawPlex(){
    ctx.clearRect(0,0,W,H);
    for(const p of pts){ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>W)p.vx*=-1; if(p.y<0||p.y>H)p.vy*=-1; }
    for(let i=0;i<pts.length;i++){
      const a=pts[i];
      for(let j=i+1;j<pts.length;j++){
        const b=pts[j], dx=a.x-b.x, dy=a.y-b.y, dist=Math.hypot(dx,dy);
        if(dist<108){ const o=(1-dist/108)*0.32; ctx.strokeStyle=`rgba(225,170,110,${o})`; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
      }
      const md=Math.hypot(a.x-mouse.x,a.y-mouse.y);
      if(md<150){ const o=(1-md/150)*0.6; ctx.strokeStyle=`rgba(237,122,35,${o})`; ctx.lineWidth=1.1; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(mouse.x,mouse.y); ctx.stroke(); }
      ctx.fillStyle='rgba(220,150,90,.55)'; ctx.beginPath(); ctx.arc(a.x,a.y,1.5,0,7); ctx.fill();
    }
  }

  // main loop
  let last=performance.now();
  function loop(now){
    const dt=(now-last)/1000; last=now;
    drawPlex();
    devices.forEach(d=>{
      const pu=d.pulse; const sp=(active===d.id)?0.9:0.32;
      pu.prog+=dt*sp; if(pu.prog>1) pu.prog-=1;
      const t=pu.prog, x=d.line.x1+(d.line.x2-d.line.x1)*t, y=d.line.y1+(d.line.y2-d.line.y1)*t;
      pu.el.setAttribute('transform',`translate(${x},${y})`);
      pu.el.setAttribute('opacity', active && active!==d.id ? 0.4 : 1);
    });
    requestAnimationFrame(loop);
  }

  resize(); window.addEventListener('resize',resize);
  requestAnimationFrame(loop);
  startPing();
})();
