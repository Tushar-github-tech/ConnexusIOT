/* =====================================================================
   CONNEXUS — Self-Healing Mesh demo (self-contained)
   Tap a node to drop it; the mesh re-routes around the gap.
   Isolated: SVG id "cxMeshSvg", pill class "cx-pill".
   ===================================================================== */
(function(){
  const SVGNS="http://www.w3.org/2000/svg";
  const svg=document.getElementById("cxMeshSvg");
  if(!svg) return;
  function el(t,a){const e=document.createElementNS(SVGNS,t);for(const k in a)e.setAttribute(k,a[k]);return e;}

  const ICONS={
    light:'<path class="nicon" d="M9 18h6M10 21h4"/><path class="nicon" d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.85 1 .9 1.65l.05.55h5.3l.05-.55c.05-.65.4-1.25.9-1.65A6 6 0 0 0 12 3Z"/>',
    ac:'<rect class="nicon" x="3" y="5" width="18" height="9" rx="1.5"/><path class="nicon" d="M6 11h12"/><path class="nicon" d="M7 17.5c0-1 .8-1.2.8-2.5M12 18c0-1 .8-1.2.8-2.5M17 17.5c0-1 .8-1.2.8-2.5"/>',
    fan:'<circle class="nicon" cx="12" cy="12" r="1.6"/><path class="nicon" d="M12 10.4c-1.2-3.2.4-6.4 2.6-6 .9.2 1 1.5.3 2.6-.8 1.2-2 2.4-2.9 3.4ZM13.6 12c3.2-1.2 6.4.4 6 2.6-.2.9-1.5 1-2.6.3-1.2-.8-2.4-2-3.4-2.9ZM10.4 12c-3.2 1.2-6.4-.4-6-2.6.2-.9 1.5-1 2.6-.3 1.2.8 2.4 2 3.4 2.9ZM12 13.6c1.2 3.2-.4 6.4-2.6 6-.9-.2-1-1.5-.3-2.6.8-1.2 2-2.4 2.9-3.4Z"/>',
    cooler:'<rect class="nicon" x="4" y="3" width="16" height="18" rx="1.5"/><path class="nicon" d="M4 8h16"/><path class="nicon" d="M8 12v5M12 12v5M16 12v5"/>',
    mixer:'<path class="nicon" d="M8 3h8l-1 5H9L8 3Z"/><path class="nicon" d="M9 8c-1.5 1.2-2 3-2 5v6h10v-6c0-2-.5-3.8-2-5"/><path class="nicon" d="M7 19h10"/>',
    solar:'<rect class="nicon" x="3" y="4" width="18" height="11" rx="1"/><path class="nicon" d="M3 8h18M3 11.5h18M9 4v11M15 4v11"/><path class="nicon" d="M12 18v3M9 21h6"/>',
    battery:'<rect class="nicon" x="3" y="7" width="16" height="10" rx="2"/><path class="nicon" d="M21 10v4"/><path class="nicon" d="M7 12h3l-1.5 3 4-5h-3l1.5-3"/>'
  };
  const I_BOLT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>';
  const I_WARN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>';
  const I_CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  const I_REFRESH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/></svg>';

  const devices=[
    {id:0,name:'Smart Light',icon:'light'},
    {id:1,name:'Air Conditioner',icon:'ac'},
    {id:2,name:'Solar Inverter',icon:'solar'},
    {id:3,name:'Air Cooler',icon:'cooler'},
    {id:4,name:'Mixer Grinder',icon:'mixer'},
    {id:5,name:'Battery · BMS',icon:'battery'},
    {id:6,name:'Ceiling Fan',icon:'fan'}
  ];
  const N=devices.length;
  const cx=600, cy=292, rx=468, ry=196, NR=33, HR=44;
  devices.forEach((d,i)=>{ const a=(-90+i*(360/N))*Math.PI/180; d.x=cx+rx*Math.cos(a); d.y=cy+ry*Math.sin(a); });
  function pos(id){ return id==='hub'?{x:cx,y:cy}:devices[id]; }

  // edges: spokes + ring
  const edges=[];
  function ekey(a,b){ return [String(a),String(b)].sort().join('|'); }
  devices.forEach(d=>edges.push({a:'hub',b:d.id,key:ekey('hub',d.id)}));
  for(let i=0;i<N;i++) edges.push({a:i,b:(i+1)%N,key:ekey(i,(i+1)%N)});
  const edgeByKey={}; edges.forEach(e=>edgeByKey[e.key]=e);

  // adjacency
  const adj={hub:devices.map(d=>d.id)};
  devices.forEach(d=>{ adj[d.id]=['hub',(d.id+1)%N,(d.id+6)%N]; });

  // state
  const online={}; devices.forEach(d=>online[d.id]=true);
  const downLinks=new Set();
  function nodeOn(id){ return id==='hub' || online[id]; }
  function linkUp(a,b){ return !downLinks.has(ekey(a,b)) && nodeOn(a) && nodeOn(b); }

  function route(start){
    if(!nodeOn(start)) return null;
    const q=[[start]], seen=new Set([start]);
    while(q.length){
      const path=q.shift(), last=path[path.length-1];
      if(last==='hub') return path;
      for(const nb of adj[last]){ if(!seen.has(nb)&&nodeOn(nb)&&linkUp(last,nb)){ seen.add(nb); q.push(path.concat(nb)); } }
    }
    return null;
  }

  // ---- build SVG ----
  const defs=el("defs",{});
  defs.innerHTML=`
    <radialGradient id="meshHubG" cx="50%" cy="42%" r="65%"><stop offset="0" stop-color="#f49a52"/><stop offset="1" stop-color="#d8641a"/></radialGradient>
    <radialGradient id="meshHalo"><stop offset="0" stop-color="#ed7a23" stop-opacity=".18"/><stop offset="1" stop-color="#ed7a23" stop-opacity="0"/></radialGradient>
    <filter id="meshNsh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#1c1b1a" flood-opacity="0.10"/></filter>
    <filter id="meshHsh" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="6" stdDeviation="11" flood-color="#c85f12" flood-opacity="0.34"/></filter>`;
  svg.appendChild(defs);

  // background halo
  svg.appendChild(el("circle",{cx:cx,cy:cy,r:240,fill:"url(#meshHalo)"}));

  const gEdges=el("g",{}); svg.appendChild(gEdges);
  const gBreak=el("g",{}); svg.appendChild(gBreak);
  const gPackets=el("g",{}); svg.appendChild(gPackets);
  const gNodes=el("g",{}); svg.appendChild(gNodes);

  // edge elements
  edges.forEach(e=>{
    const p1=pos(e.a), p2=pos(e.b);
    const path=el("line",{x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,class:"edge idle"});
    gEdges.appendChild(path); e.el=path;
    e.mid={x:(p1.x+p2.x)/2,y:(p1.y+p2.y)/2};
  });

  // hub
  (function(){
    const g=el("g",{});
    [0,1,2].forEach(k=>{
      const r=el("circle",{cx:cx,cy:cy,r:HR,fill:"none",stroke:"#ed7a23","stroke-width":2,opacity:0});
      r.innerHTML=`<animate attributeName="r" values="${HR};${HR+70}" dur="2.6s" begin="${k*0.86}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.45;0" dur="2.6s" begin="${k*0.86}s" repeatCount="indefinite"/>`;
      g.appendChild(r);
    });
    g.appendChild(el("circle",{cx:cx,cy:cy,r:HR,fill:"url(#meshHubG)",filter:"url(#meshHsh)"}));
    const mg=el("g",{transform:`translate(${cx-15},${cy-15}) scale(1.25)`,stroke:"#fff","stroke-width":1.5,fill:"none","stroke-linecap":"round"});
    mg.innerHTML='<circle cx="12" cy="6" r="2"/><circle cx="6" cy="16" r="2"/><circle cx="18" cy="16" r="2"/><path d="M10.5 7.6 7.4 14.3M13.5 7.6l3.1 6.7M8 16h8"/>';
    g.appendChild(mg);
    gNodes.appendChild(g);
  })();

  // device nodes
  devices.forEach(d=>{
    const g=el("g",{class:"node","data-id":d.id});
    g.appendChild(el("circle",{cx:d.x,cy:d.y,r:NR+6,class:"glow"}));
    g.appendChild(el("circle",{cx:d.x,cy:d.y,r:NR,class:"ring",filter:"url(#meshNsh)"}));
    const ig=el("g",{transform:`translate(${d.x-12},${d.y-12})`}); ig.innerHTML=ICONS[d.icon]; g.appendChild(ig);
    const sdot=el("circle",{cx:d.x+NR*0.72,cy:d.y-NR*0.72,r:5.5,class:"sdot",fill:"var(--ok)",stroke:"#fff","stroke-width":2}); g.appendChild(sdot); d.sdot=sdot;
    const above=d.y<cy;
    const lbl=el("text",{x:d.x,y:above?d.y-NR-14:d.y+NR+22,"text-anchor":"middle",class:"nlabel"}); lbl.textContent=d.name; g.appendChild(lbl);
    const pill=el("text",{x:d.x,y:above?d.y-NR-30:d.y+NR+38,"text-anchor":"middle",class:"cx-pill",fill:"var(--warn)",opacity:0}); g.appendChild(pill); d.pill=pill;
    g.addEventListener("click",()=>toggleNode(d.id));
    gNodes.appendChild(g); d.g=g;
  });

  // packets (one per device)
  devices.forEach(d=>{
    const grp=el("g",{opacity:0});
    grp.appendChild(el("circle",{r:7,fill:"var(--accent)",opacity:.16}));
    grp.appendChild(el("circle",{r:3.4,fill:"var(--accent)"}));
    gPackets.appendChild(grp);
    d.pkt={el:grp,prog:Math.random()*0.6,poly:null,len:0};
  });

  // ---- rendering ----
  function polyOf(rt){
    const pts=rt.map(pos);
    let len=0; const cum=[0];
    for(let i=1;i<pts.length;i++){ len+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y); cum.push(len); }
    return {pts,cum,len};
  }
  function ptAt(poly,dist){
    const {pts,cum,len}=poly; if(len===0) return pts[0];
    let d=dist%len;
    for(let i=1;i<pts.length;i++){ if(d<=cum[i]){ const t=(d-cum[i-1])/(cum[i]-cum[i-1]||1); return {x:pts[i-1].x+(pts[i].x-pts[i-1].x)*t, y:pts[i-1].y+(pts[i].y-pts[i-1].y)*t}; } }
    return pts[pts.length-1];
  }

  let routes={}, usedKeys=new Set(), healingKeys=new Set();
  function recompute(){
    routes={}; usedKeys=new Set();
    let routed=0, hopSum=0;
    devices.forEach(d=>{
      const rt=online[d.id]?route(d.id):null;
      routes[d.id]=rt;
      if(rt){ routed++; hopSum+=rt.length-1; for(let i=1;i<rt.length;i++) usedKeys.add(ekey(rt[i-1],rt[i])); }
    });
    edges.forEach(e=>{
      let cls="edge ";
      if(downLinks.has(e.key) || !nodeOn(e.a) || !nodeOn(e.b)) cls+="dead";
      else if(healingKeys.has(e.key)) cls+="healing";
      else if(usedKeys.has(e.key)) cls+="inuse";
      else cls+="idle";
      e.el.setAttribute("class",cls);
    });
    devices.forEach(d=>{
      const rt=routes[d.id];
      d.g.classList.toggle("offline",!online[d.id]);
      const rerouting = rt && rt.length>2;
      d.g.classList.toggle("reroute", !!rerouting && online[d.id]);
      if(!online[d.id]){ d.sdot.setAttribute("fill","#cfc9c3"); setPill(d,"offline","var(--muted)"); }
      else if(!rt){ d.sdot.setAttribute("fill","var(--down)"); setPill(d,"isolated","var(--down)"); }
      else if(rerouting){ d.sdot.setAttribute("fill","var(--warn)"); setPill(d,(rt.length-1)+" hops","var(--warn)"); }
      else { d.sdot.setAttribute("fill","var(--ok)"); setPill(d,"",null); }
      if(rt && rt.length>1){ d.pkt.poly=polyOf(rt); d.pkt.el.setAttribute("opacity",1); }
      else { d.pkt.poly=null; d.pkt.el.setAttribute("opacity",0); }
    });
    document.getElementById("stHealth").textContent=Math.round(routed/N*100);
    document.getElementById("stLinks").textContent=[...usedKeys].length + [...edges].filter(e=>!downLinks.has(e.key)&&nodeOn(e.a)&&nodeOn(e.b)&&!usedKeys.has(e.key)).length;
    document.getElementById("stHops").textContent=routed?(hopSum/routed).toFixed(1):"—";
  }
  function setPill(d,txt,color){
    d.pill.textContent=txt;
    d.pill.setAttribute("opacity",txt?1:0);
    if(color) d.pill.setAttribute("fill",color);
  }

  // ---- narration ----
  const nEl=document.getElementById("cxNarrate"), mEl=document.getElementById("cxMsg"),
        icoEl=document.getElementById("cxIco"), tEl=document.getElementById("cxTime");
  function narrate(type,html,time){
    nEl.className="cx-narrate "+type;
    icoEl.innerHTML = type==='down'?I_WARN : type==='ok'?I_CHECK : type==='warn'?I_REFRESH : I_BOLT;
    mEl.innerHTML=html;
    if(time!==undefined) tEl.textContent=time;
  }

  // ---- break marker ----
  function showBreak(x,y){
    const g=el("g",{transform:`translate(${x},${y})`,opacity:0});
    g.appendChild(el("circle",{r:11,fill:"var(--down-soft)",stroke:"var(--down)","stroke-width":1.5}));
    const x1=el("path",{d:"M-4 -4 L4 4 M4 -4 L-4 4",stroke:"var(--down)","stroke-width":2.2,"stroke-linecap":"round"});
    g.appendChild(x1); gBreak.appendChild(g);
    g.animate([{opacity:0,transform:`translate(${x}px,${y}px) scale(.4)`},{opacity:1,transform:`translate(${x}px,${y}px) scale(1)`}],{duration:260,fill:'forwards'});
    setTimeout(()=>{ g.animate([{opacity:1},{opacity:0}],{duration:500,fill:'forwards'}).onfinish=()=>g.remove(); },1500);
  }
  function flashHeal(rt){
    healingKeys=new Set();
    for(let i=1;i<rt.length;i++) healingKeys.add(ekey(rt[i-1],rt[i]));
    recompute();
    setTimeout(()=>{ healingKeys=new Set(); recompute(); },1100);
  }

  // ---- events ----
  function toggleNode(id){
    pauseAuto();
    online[id]=!online[id];
    const d=devices[id];
    if(!online[id]){
      narrate('down',`<b>${d.name}</b> taken offline — neighbours re-routing…`,'rerouting');
      d.g.querySelector('.glow').setAttribute('opacity',0);
      recompute();
      setTimeout(()=>{
        const ms=280+Math.round(Math.random()*360);
        const affected=devices.filter(x=>online[x.id]&&routes[x.id]&&routes[x.id].length>2);
        document.getElementById("stHeal").textContent=ms;
        narrate('ok',affected.length?`Mesh healed — <b>${affected.length}</b> node${affected.length>1?'s':''} re-routed around the gap`:`Mesh stable — no traffic disrupted`, ms+'ms');
        if(affected.length) flashHeal(routes[affected[0].id]);
      },650);
    } else {
      narrate('warn',`<b>${d.name}</b> back online — mesh re-balancing`,'restoring');
      recompute();
      setTimeout(()=>narrate('ok',`All paths optimal · <b>${d.name}</b> rejoined the mesh`,'100%'),700);
    }
  }

  function dropLink(id){
    const k=ekey('hub',id); if(downLinks.has(k)||!online[id]) return false;
    downLinks.add(k);
    const d=devices[id];
    narrate('down',`Direct link <b>Hub ↔ ${d.name}</b> lost — searching new path…`,'rerouting');
    showBreak(edgeByKey[k].mid.x, edgeByKey[k].mid.y);
    recompute();
    setTimeout(()=>{
      const rt=routes[id]; const ms=300+Math.round(Math.random()*420);
      document.getElementById("stHeal").textContent=ms;
      if(rt){
        const via=devices[rt[1]] ? devices[rt[1]].name : 'mesh';
        narrate('ok',`Healed — <b>${d.name}</b> now routes via <b>${via}</b> · ${rt.length-1} hops`, ms+'ms');
        flashHeal(rt);
      } else { narrate('down',`<b>${d.name}</b> isolated — awaiting any neighbour`, ms+'ms'); }
    },680);
    setTimeout(()=>{ if(downLinks.has(k)){ downLinks.delete(k); narrate('warn',`Link <b>Hub ↔ ${d.name}</b> restored — back to direct path`,'optimal'); recompute(); } },4200);
    return true;
  }

  // ---- auto demo ----
  let autoTimer=null, paused=false, pauseT=null;
  function autoStep(){
    if(paused) return;
    const offNodes=devices.filter(d=>!online[d.id]);
    if(offNodes.length){ const d=offNodes[0]; online[d.id]=true; narrate('warn',`<b>${d.name}</b> back online — mesh re-balancing`,'restoring'); recompute(); setTimeout(()=>narrate('ok',`All ${N} nodes online · mesh fully connected`,'100%'),700); return; }
    const r=Math.random();
    if(r<0.62){
      const cands=devices.filter(d=>online[d.id]&&!downLinks.has(ekey('hub',d.id)));
      if(cands.length) dropLink(cands[Math.floor(Math.random()*cands.length)].id);
    } else {
      const cands=devices.filter(d=>online[d.id]);
      if(cands.length){ const d=cands[Math.floor(Math.random()*cands.length)];
        online[d.id]=false; d.g.querySelector('.glow').setAttribute('opacity',0);
        narrate('down',`<b>${d.name}</b> dropped off the network — re-routing…`,'rerouting');
        recompute();
        setTimeout(()=>{ const ms=300+Math.round(Math.random()*380); document.getElementById("stHeal").textContent=ms;
          const aff=devices.filter(x=>online[x.id]&&routes[x.id]&&routes[x.id].length>2);
          narrate('ok',aff.length?`Mesh healed — re-routed around <b>${d.name}</b>`:`Mesh stable — no disruption`, ms+'ms');
          if(aff.length) flashHeal(routes[aff[0].id]); },660);
        setTimeout(()=>{ if(!online[d.id]){ online[d.id]=true; narrate('warn',`<b>${d.name}</b> reconnected`,'restoring'); recompute(); setTimeout(()=>narrate('ok',`All ${N} nodes online · mesh fully connected`,'100%'),600);} },4400);
      }
    }
  }
  function startAuto(){ stopAuto(); autoTimer=setInterval(autoStep,4600); }
  function stopAuto(){ if(autoTimer){clearInterval(autoTimer);autoTimer=null;} }
  function pauseAuto(){ paused=true; if(pauseT)clearTimeout(pauseT); pauseT=setTimeout(()=>{paused=false;},9000); }

  // ---- packet rAF ----
  let last=performance.now();
  function frame(now){
    const dt=(now-last)/1000; last=now;
    const speed=190;
    devices.forEach(d=>{
      const pk=d.pkt; if(!pk.poly){return;}
      pk.prog += dt*speed;
      if(pk.prog>pk.poly.len) pk.prog=0;
      const p=ptAt(pk.poly,pk.prog);
      pk.el.setAttribute("transform",`translate(${p.x},${p.y})`);
    });
    requestAnimationFrame(frame);
  }

  recompute();
  requestAnimationFrame(frame);
  startAuto();
})();
