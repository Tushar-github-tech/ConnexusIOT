/* =====================================================================
   CONNEXUS — Live IoT Data Flow diagram (self-contained)
   Builds an animated SVG showing devices -> hub -> local/cloud paths.
   ===================================================================== */
(function(){
  const SVGNS="http://www.w3.org/2000/svg";
  const svg=document.getElementById("cxSvg");
  if(!svg) return;
  // ---- icon path builders (24x24 line icons) ----
  const ICONS={
    light:'<path class="icon" d="M9 18h6M10 21h4"/><path class="icon" d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.85 1 .9 1.65l.05.55h5.3l.05-.55c.05-.65.4-1.25.9-1.65A6 6 0 0 0 12 3Z"/>',
    ac:'<rect class="icon" x="3" y="5" width="18" height="9" rx="1.5"/><path class="icon" d="M6 11h12"/><path class="icon" d="M7 17.5c0-1 .8-1.2.8-2.5M12 18c0-1 .8-1.2.8-2.5M17 17.5c0-1 .8-1.2.8-2.5"/>',
    fan:'<circle class="icon" cx="12" cy="12" r="1.6"/><path class="icon" d="M12 10.4c-1.2-3.2.4-6.4 2.6-6 .9.2 1 1.5.3 2.6-.8 1.2-2 2.4-2.9 3.4ZM13.6 12c3.2-1.2 6.4.4 6 2.6-.2.9-1.5 1-2.6.3-1.2-.8-2.4-2-3.4-2.9ZM10.4 12c-3.2 1.2-6.4-.4-6-2.6.2-.9 1.5-1 2.6-.3 1.2.8 2.4 2 3.4 2.9ZM12 13.6c1.2 3.2-.4 6.4-2.6 6-.9-.2-1-1.5-.3-2.6.8-1.2 2-2.4 2.9-3.4Z"/>',
    cooler:'<rect class="icon" x="4" y="3" width="16" height="18" rx="1.5"/><path class="icon" d="M4 8h16"/><path class="icon" d="M8 12v5M12 12v5M16 12v5"/>',
    mixer:'<path class="icon" d="M8 3h8l-1 5H9L8 3Z"/><path class="icon" d="M9 8c-1.5 1.2-2 3-2 5v6h10v-6c0-2-.5-3.8-2-5"/><path class="icon" d="M7 19h10"/>',
    solar:'<rect class="icon" x="3" y="4" width="18" height="11" rx="1"/><path class="icon" d="M3 8h18M3 11.5h18M9 4v11M15 4v11"/><path class="icon" d="M12 18v3M9 21h6"/>',
    battery:'<rect class="icon" x="3" y="7" width="16" height="10" rx="2"/><path class="icon" d="M21 10v4"/><path class="icon" d="M7 12h3l-1.5 3 4-5h-3l1.5-3"/>'
  };
  // ---- devices ----
  const devices=[
    {id:'light', name:'Smart Light', icon:'light', base:12, unit:'W', fmt:v=>Math.round(v), jit:2},
    {id:'ac', name:'Air Conditioner', icon:'ac', base:920, unit:'W', fmt:v=>Math.round(v/10)*10, jit:60},
    {id:'fan', name:'Ceiling Fan', icon:'fan', base:55, unit:'W', fmt:v=>Math.round(v), jit:6},
    {id:'cooler', name:'Air Cooler', icon:'cooler', base:180, unit:'W', fmt:v=>Math.round(v), jit:14},
    {id:'mixer', name:'Mixer Grinder', icon:'mixer', base:600, unit:'W', fmt:v=>Math.round(v/5)*5, jit:40},
    {id:'solar', name:'Solar Inverter', icon:'solar', base:1450, unit:'W', gen:true, fmt:v=>Math.round(v/10)*10, jit:90},
    {id:'battery', name:'Battery · BMS', icon:'battery', base:78, unit:'%', batt:true, fmt:v=>Math.round(v), jit:1}
  ];

  // ---- layout coords ----
  const HUB={x:560,y:380,w:150,h:104};
  const LOCAL={x:812,y:222,w:170,h:78};
  const CLOUD={x:812,y:548,w:170,h:78};
  const APP={x:1050,y:222,w:150,h:78};
  const DASH={x:1050,y:548,w:150,h:78};
  const DEV={x:34,w:194,h:64};
  const devTop=66, devGap=84;

  // helpers
  function el(tag,attrs){const e=document.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e;}
  function cardCenter(c){return {x:c.x+c.w/2,y:c.y+c.h/2};}
  function curve(x1,y1,x2,y2){const mx=(x1+x2)/2;return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;}

  // build defs (filters, gradients)
  const defs=el("defs",{});
  defs.innerHTML=`
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#1c1b1a" flood-opacity="0.06"/>
    </filter>
    <filter id="hubShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#c85f12" flood-opacity="0.30"/>
    </filter>
    <linearGradient id="hubGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f08a37"/><stop offset="1" stop-color="#d8641a"/>
    </linearGradient>
    <radialGradient id="pulseGrad"><stop offset="0" stop-color="#ed7a23" stop-opacity=".22"/><stop offset="1" stop-color="#ed7a23" stop-opacity="0"/></radialGradient>
    <linearGradient id="syncGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ed7a23"/><stop offset="1" stop-color="#3b6fe0"/>
    </linearGradient>`;
  svg.appendChild(defs);

  const gEdges=el("g",{}); svg.appendChild(gEdges);
  const gPackets=el("g",{}); svg.appendChild(gPackets);
  const gNodes=el("g",{}); svg.appendChild(gNodes);

  // dynamic CSS for motion paths
  const cssRules=document.createElement("style");
  document.head.appendChild(cssRules);
  let cssText=`@keyframes flowF{from{offset-distance:0%}to{offset-distance:100%}}@keyframes flowR{from{offset-distance:100%}to{offset-distance:0%}}`;

  const devEdgeEls={};

  // ---- draw device cards + edges to hub ----
  const hubLeft={x:HUB.x, y:HUB.y+HUB.h/2};
  devices.forEach((d,i)=>{
    const y=devTop+i*devGap;
    d.y=y; d.cardTop=y;
    // edge
    const ay=y+DEV.h/2;
    const p=curve(DEV.x+DEV.w, ay, hubLeft.x, hubLeft.y);
    d.path=p;
    const edge=el("path",{d:p,class:"edge devedge","data-dev":d.id});
    gEdges.appendChild(edge); devEdgeEls[d.id]=edge;

    // card group
    const g=el("g",{class:"dev-group","data-dev":d.id});
    const rect=el("rect",{x:DEV.x,y:y,width:DEV.w,height:DEV.h,rx:14,class:"node-card",filter:"url(#cardShadow)"});
    g.appendChild(rect);
    // icon chip
    const chip=el("rect",{x:DEV.x+11,y:y+11,width:42,height:42,rx:11,fill:"var(--accent-soft)"});
    g.appendChild(chip);
    const ig=el("g",{transform:`translate(${DEV.x+20},${y+20}) scale(1.08)`});
    ig.innerHTML=ICONS[d.icon];
    g.appendChild(ig);
    // texts
    const name=el("text",{x:DEV.x+66,y:y+27,class:"dev-name"}); name.textContent=d.name; g.appendChild(name);
    const val=el("text",{x:DEV.x+66,y:y+48,class:"dev-val","data-val":d.id}); val.textContent="—"; g.appendChild(val);
    // status dot
    const sd=el("circle",{cx:DEV.x+DEV.w-16,cy:y+18,r:4,class:"statusdot"}); g.appendChild(sd);
    // hit area
    const hit=el("rect",{x:DEV.x,y:y,width:DEV.w,height:DEV.h,rx:14,class:"hit"});
    g.appendChild(hit);
    g.addEventListener("click",()=>selectDevice(d.id));
    gNodes.appendChild(g);
    d.valEl=val; d.cardEl=g;
  });

  // ---- backbone edges ----
  const hubRight={x:HUB.x+HUB.w, y:HUB.y+HUB.h/2};
  const localL={x:LOCAL.x, y:cardCenter(LOCAL).y};
  const localR={x:LOCAL.x+LOCAL.w, y:cardCenter(LOCAL).y};
  const cloudL={x:CLOUD.x, y:cardCenter(CLOUD).y};
  const cloudR={x:CLOUD.x+CLOUD.w, y:cardCenter(CLOUD).y};
  const appL={x:APP.x, y:cardCenter(APP).y};
  const dashL={x:DASH.x, y:cardCenter(DASH).y};

  const backbone=[
    {id:'h-local', cls:'local', d:curve(hubRight.x, HUB.y+34, localL.x, localL.y)},
    {id:'local-app', cls:'local', d:curve(localR.x, localR.y, appL.x, appL.y)},
    {id:'h-cloud', cls:'cloud', d:curve(hubRight.x, HUB.y+HUB.h-34, cloudL.x, cloudL.y)},
    {id:'cloud-dash', cls:'cloud', d:curve(cloudR.x, cloudR.y, dashL.x, dashL.y)}
  ];
  backbone.forEach(b=>{
    const e=el("path",{d:b.d,class:"edge "+b.cls,"stroke-width":3,"stroke-opacity":.55});
    gEdges.appendChild(e); b.el=e;
  });

  // ---- App <-> Cloud Dashboard sync link ----
  function vcurve(x1,y1,x2,y2,bow){const my=(y1+y2)/2;return `M${x1},${y1} C${x1+bow},${my} ${x2+bow},${my} ${x2},${y2}`;}
  const appBottom={x:APP.x+APP.w/2, y:APP.y+APP.h};
  const dashTop={x:DASH.x+APP.w/2, y:DASH.y};
  const syncPath=vcurve(appBottom.x, appBottom.y, dashTop.x, dashTop.y, 60);
  const syncEdge=el("path",{d:syncPath,class:"edge sync"});
  gEdges.appendChild(syncEdge);

  // ---- node card drawer ----
  function drawNode(c, opts){
    const g=el("g",{});
    const rect=el("rect",{x:c.x,y:c.y,width:c.w,height:c.h,rx:16,class:"node-card",filter:"url(#cardShadow)"});
    if(opts.accent) rect.setAttribute("stroke", opts.accent);
    g.appendChild(rect);
    if(opts.iconSvg){
      const chip=el("rect",{x:c.x+13,y:c.y+13,width:34,height:34,rx:9,fill:opts.chipFill||"var(--accent-soft)"});
      g.appendChild(chip);
      const ig=el("g",{transform:`translate(${c.x+20.3},${c.y+20.3}) scale(.81)`});
      ig.innerHTML=opts.iconSvg; g.appendChild(ig);
    }
    const tx=c.x+(opts.iconSvg?56:16);
    const t=el("text",{x:tx,y:c.y+30,class:"mid-label"}); t.textContent=opts.title; g.appendChild(t);
    if(opts.sub){const s=el("text",{x:tx,y:c.y+49,class:"mid-sub"}); s.textContent=opts.sub; g.appendChild(s);}
    gNodes.appendChild(g);
    return g;
  }

  // mid/right icons
  const IC_ROUTER='<path class="icon" d="M3 13h18v6H3z"/><path class="icon" d="M7 16h.01M11 16h.01"/><path class="icon" d="M12 9V4M12 4l-2.5 2.5M12 4l2.5 2.5"/><path class="icon" d="M16 9c0-2.2-1.8-4-4-4M19 9c0-3.9-3.1-7-7-7" stroke="var(--accent-deep)"/>';
  const IC_CLOUD='<path class="icon" d="M7 18a4 4 0 0 1-.5-7.97A5 5 0 0 1 16 9.5a3.5 3.5 0 0 1 .5 6.97" stroke="var(--cloud-deep)"/><path class="icon" d="M9 14l2 2 4-4" stroke="var(--cloud-deep)"/>';
  const IC_PHONE='<rect class="icon" x="7" y="3" width="10" height="18" rx="2.5"/><path class="icon" d="M10.5 18h3"/>';
  const IC_DASH='<rect class="icon" x="3" y="4" width="18" height="14" rx="2" stroke="var(--cloud-deep)"/><path class="icon" d="M3 9h18M9 21h6M12 18v3" stroke="var(--cloud-deep)"/>';

  // central HUB (orange)
  (function(){
    const g=el("g",{});
    // ambient pulse
    const pulse=el("circle",{cx:HUB.x+HUB.w/2,cy:HUB.y+HUB.h/2,r:90,fill:"url(#pulseGrad)"});
    pulse.innerHTML=`<animate attributeName="r" values="70;104;70" dur="3.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0.2;0.9" dur="3.4s" repeatCount="indefinite"/>`;
    g.appendChild(pulse);
    const rect=el("rect",{x:HUB.x,y:HUB.y,width:HUB.w,height:HUB.h,rx:20,fill:"url(#hubGrad)",filter:"url(#hubShadow)"});
    g.appendChild(rect);
    // mesh glyph
    const mg=el("g",{transform:`translate(${HUB.x+HUB.w/2-16},${HUB.y+16}) scale(1.35)`,stroke:"#fff","stroke-width":1.4,fill:"none","stroke-linecap":"round"});
    mg.innerHTML='<circle cx="12" cy="6" r="2"/><circle cx="6" cy="16" r="2"/><circle cx="18" cy="16" r="2"/><path d="M10.5 7.6 7.4 14.3M13.5 7.6l3.1 6.7M8 16h8"/>';
    g.appendChild(mg);
    const t=el("text",{x:HUB.x+HUB.w/2,y:HUB.y+74,"text-anchor":"middle",class:"hub-label","font-size":15}); t.textContent="Connexus Hub"; g.appendChild(t);
    const s=el("text",{x:HUB.x+HUB.w/2,y:HUB.y+92,"text-anchor":"middle",class:"hub-sub","font-size":10.5}); s.textContent="self-healing mesh"; g.appendChild(s);
    gNodes.appendChild(g);
  })();

  drawNode(LOCAL,{title:"Local Network",sub:"LAN · &lt;20 ms",iconSvg:IC_ROUTER,accent:"var(--accent)"});
  drawNode(CLOUD,{title:"Connexus Cloud",sub:"AES-256 · TLS",iconSvg:IC_CLOUD,chipFill:"var(--cloud-soft)",accent:"var(--cloud)"});
  drawNode(APP,{title:"Mobile App",sub:"instant",iconSvg:IC_PHONE,accent:"var(--accent)"});
  drawNode(DASH,{title:"Dashboard",sub:"access anywhere",iconSvg:IC_DASH,chipFill:"var(--cloud-soft)",accent:"var(--cloud)"});

  // fix sub html entities (textContent won't parse &lt;)
  document.querySelectorAll(".mid-sub").forEach(s=>{s.textContent=s.textContent.replace("&lt;","<");});

  // ---- lane labels ----
  function laneLabel(x,y,text,cls,anchor){
    const t=el("text",{x:x,y:y,class:"lane-label "+cls,"text-anchor":anchor||"start"}); t.textContent=text; gNodes.appendChild(t); return t;
  }
  laneLabel((hubRight.x+localL.x)/2, HUB.y-8, "command ↓ · state ↑","local","middle");
  laneLabel((localR.x+appL.x)/2, localR.y-16, "control","local","middle");
  laneLabel((hubRight.x+cloudL.x)/2, HUB.y+HUB.h+22, "telemetry ↑ · sync","cloud","middle");
  laneLabel((cloudR.x+dashL.x)/2, cloudR.y-20, "analytics","cloud","middle");
  laneLabel(DEV.x+DEV.w+8, devTop-14, "status · telemetry","local","start");
  laneLabel(appBottom.x+72, (appBottom.y+dashTop.y)/2, "live sync","sync","middle");

  // ---- packets ----
  let pktSeq=0;
  function makePacketStream(pathStr, colorVar, count, dur, dir){
    for(let i=0;i<count;i++){
      pktSeq++;
      const cls="pk"+pktSeq;
      cssText+=`.${cls}{offset-path:path('${pathStr}');offset-rotate:0deg;animation:${dir==='r'?'flowR':'flowF'} ${dur}s linear infinite;animation-delay:${(-dur/count*i).toFixed(2)}s;}`;
      const grp=el("g",{class:cls});
      const halo=el("circle",{r:7,fill:colorVar,opacity:.18});
      const dot=el("circle",{r:3.4,fill:colorVar});
      grp.appendChild(halo); grp.appendChild(dot);
      gPackets.appendChild(grp);
    }
  }
  // device -> hub (telemetry, orange, forward)
  devices.forEach(d=>makePacketStream(d.path,"var(--accent)",2,2.6,'f'));
  // hub->local->app (local, two-way)
  makePacketStream(backbone[0].d,"var(--accent)",3,2.0,'f');
  makePacketStream(backbone[1].d,"var(--accent)",2,1.7,'f');
  makePacketStream(backbone[1].d,"var(--cloud)",1,2.2,'r');
  // hub->cloud->dash (cloud, forward telemetry)
  makePacketStream(backbone[2].d,"var(--cloud)",3,2.4,'f');
  makePacketStream(backbone[3].d,"var(--cloud)",2,2.0,'f');
  // app <-> cloud dashboard sync (both directions)
  makePacketStream(syncPath,"var(--accent)",2,2.3,'f');
  makePacketStream(syncPath,"var(--cloud)",2,2.3,'r');

  cssRules.textContent=cssText;

  // ---- live values ----
  function compute(){
    let net=0, online=0;
    devices.forEach(d=>{
      const jitter=(Math.random()-0.5)*2*d.jit;
      let v=d.base+jitter;
      if(d.batt){ d.cur=Math.max(40,Math.min(100, (d.cur||d.base)+(Math.random()-0.45)*0.6)); v=d.cur; d.valEl.textContent=`${d.fmt(v)}% · 51.${String(Math.round(v/10)).padStart(1,'0')}V`; }
      else if(d.gen){ d.valEl.textContent=`+${d.fmt(Math.max(0,v))} W`; net-=Math.max(0,v); }
      else { d.valEl.textContent=`${d.fmt(Math.max(0,v))} ${d.unit}`; net+=Math.max(0,v); }
      online++;
    });
    return {net:Math.round(net), online};
  }
  const stLoad=document.getElementById("stLoad"), stOnline=document.getElementById("stOnline"),
        stLat=document.getElementById("stLat"), stPkt=document.getElementById("stPkt");
  function tick(){
    const r=compute();
    stLoad.textContent=r.net.toLocaleString();
    stOnline.textContent=r.online;
    stLat.textContent=(12+Math.round(Math.random()*6));
    stPkt.textContent=(40+Math.round(Math.random()*70));
  }
  tick(); setInterval(tick,1400);

  // ---- selection / highlight ----
  let selected=null, autoTimer=null;
  const selLabel=document.getElementById("cxSel");
  function applyHighlight(ids){
    const set = ids ? new Set(ids) : null;
    devices.forEach(d=>{
      const on = !set || set.has(d.id);
      d.cardEl.classList.toggle("dimmed", !on);
      devEdgeEls[d.id].classList.toggle("active", set ? set.has(d.id) : false);
      devEdgeEls[d.id].classList.toggle("dimmed", set ? !set.has(d.id) : false);
    });
    if(!set){ selLabel.textContent="auto-cycling"; }
    else if(set.size===1){ selLabel.textContent=devices.find(d=>set.has(d.id)).name; }
    else { selLabel.textContent=set.size+" active streams"; }
  }
  function pickRandom(n){
    const pool=devices.map(d=>d.id);
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    return pool.slice(0,n);
  }
  function selectDevice(id){
    stopAuto();
    if(selected===id){ selected=null; applyHighlight(null); startAuto(); return; }
    selected=id; applyHighlight([id]);
  }
  function startAuto(){
    stopAuto();
    const cycle=()=>applyHighlight(pickRandom(3));
    cycle();
    autoTimer=setInterval(cycle,2000);
  }
  function stopAuto(){ if(autoTimer){clearInterval(autoTimer);autoTimer=null;} }

  startAuto();
})();
