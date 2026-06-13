/* =====================================================================
   CONNEXUS IOT — main.js
   Background mesh, brand config, hero effects, and the live demo deck.
   No libraries. No build step. Just open index.html.
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.CONNEXUS_CONFIG || {};

  /* =========================================================
     1. APPLY BRAND CONFIG  (logo / name / colors / contact)
     ========================================================= */
  function applyConfig() {
    var root = document.documentElement;
    if (CFG.colors) {
      if (CFG.colors.accent)  root.style.setProperty("--accent",  CFG.colors.accent);
      if (CFG.colors.accent2) root.style.setProperty("--accent2", CFG.colors.accent2);
      if (CFG.colors.success) root.style.setProperty("--success", CFG.colors.success);
      if (CFG.colors.danger)  root.style.setProperty("--danger",  CFG.colors.danger);
    }

    var name   = CFG.brandName   || "Connexus";
    var suffix = CFG.brandSuffix || "IoT";
    setText("brandName", name);   setText("brandSuffix", suffix);
    setText("footName",  name);   setText("footSuffix",  suffix);
    setText("footCopy",  name + " " + suffix);
    document.title = name + " " + suffix + " — Smart control for every device";

    var logos = [byId("brandLogo"), byId("holoLogo"), byId("footLogo")];
    logos.forEach(function (img) {
      if (!img) return;
      if (CFG.showLogo === false) { img.style.display = "none"; return; }
      if (CFG.logoUrl) img.src = CFG.logoUrl;
      img.onerror = function () { img.style.display = "none"; };
    });

    var email = CFG.contactEmail || "hello@connexusiot.com";
    var phone = (CFG.contactPhone || "").trim();
    setText("emailText", email);
    var emailLink = byId("emailLink");
    if (emailLink) emailLink.href = "mailto:" + email;
    var mailBtn = byId("mailBtn");
    if (mailBtn) mailBtn.href = "mailto:" + email;

    /* show phone + separator only when a real number is configured */
    var phoneEl = byId("phoneText"), sepEl = byId("contactSep");
    if (phone) {
      if (phoneEl) phoneEl.textContent = phone;
      if (sepEl) sepEl.hidden = false;
    } else {
      if (phoneEl) phoneEl.textContent = "";
      if (sepEl) sepEl.hidden = true;
    }

    setText("year", String(new Date().getFullYear()));
  }

  function byId(id) { return document.getElementById(id); }
  function setText(id, txt) { var el = byId(id); if (el) el.textContent = txt; }

  /* =========================================================
     2. PARTICLE MESH BACKGROUND
     ========================================================= */
  function startMesh() {
    var canvas = byId("mesh");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var pts = [], W = 0, H = 0, raf = null;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    function accent(alpha) {
      var c = (CFG.colors && CFG.colors.accent) || "#00e5ff";
      var r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16);
      return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
    }

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      var target = Math.min(110, Math.floor(W * H / 16000));
      pts = [];
      for (var i = 0; i < target; i++) {
        pts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          r: 1 + Math.random() * 1.6
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, W, H);
      var linkDist = Math.min(150, W / 9);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = accent(0.55);
        ctx.fill();
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkDist) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = accent(0.13 * (1 - d / linkDist));
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(step);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; }
      else if (!raf) raf = requestAnimationFrame(step);
    });
    window.addEventListener("resize", resize);
    resize();
    raf = requestAnimationFrame(step);
  }

  /* =========================================================
     3. HERO — typing effect + counters
     ========================================================= */
  function startTyping() {
    var el = byId("typing");
    if (!el) return;
    var lines = (CFG.taglines && CFG.taglines.length) ? CFG.taglines : ["Control Every Device."];
    var li = 0, ci = 0, deleting = false;

    function tick() {
      var line = lines[li];
      if (!deleting) {
        ci++;
        el.textContent = line.slice(0, ci);
        if (ci === line.length) { deleting = true; setTimeout(tick, 1700); return; }
        setTimeout(tick, 55 + Math.random() * 50);
      } else {
        ci--;
        el.textContent = line.slice(0, ci);
        if (ci === 0) { deleting = false; li = (li + 1) % lines.length; setTimeout(tick, 350); return; }
        setTimeout(tick, 26);
      }
    }
    tick();
  }

  function startCounters() {
    var els = document.querySelectorAll(".counter");
    if (!els.length) return;
    var done = false;
    function run() {
      if (done) return;
      done = true;
      els.forEach(function (el) {
        var target = parseFloat(el.getAttribute("data-target")) || 0;
        var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
        var t0 = null;
        function frame(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / 1600);
          k = 1 - Math.pow(1 - k, 3); /* ease-out */
          el.textContent = (target * k).toFixed(decimals);
          if (k < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }
    /* start when hero is on screen (it is, on load) */
    setTimeout(run, 400);
  }

  /* =========================================================
     4. SCROLL REVEAL
     ========================================================= */
  function startReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* =========================================================
     5. MOBILE MENU
     ========================================================= */
  function startMenu() {
    var burger = byId("hamburger"), links = byId("navLinks");
    if (!burger || !links) return;
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("openmenu");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("openmenu");
        burger.classList.remove("open");
      }
    });
  }

  /* =========================================================
     6. CONTROL DECK — live device simulation
     ========================================================= */
  var devices = {
    light:  { on: false, watts: 0 },
    ac:     { on: false, watts: 0, temp: 24 },
    fan:    { on: false, watts: 0, speed: 3 },
    cooler: { on: false, watts: 0, speed: 2 },
    mixer:  { on: false, watts: 0, speed: 1 },
    solar:  { on: false, watts: 0, mode: "solar" },
    bms:    { on: true,  watts: 0 }
  };

  function computeLoad() {
    var online = 1; /* BMS always on */
    var load = 0;
    ["light", "ac", "fan", "cooler", "mixer", "solar"].forEach(function (k) {
      if (devices[k].on) { online++; load += devices[k].watts; }
    });
    return { online: online, load: load };
  }

  function updateHud() {
    var s = computeLoad();
    setText("hudOnline", s.online + " / 7");
    setText("hudLoad", String(Math.round(s.load)));
  }

  function setLed(key, on) {
    var led = document.querySelector('[data-led="' + key + '"]');
    if (led) led.classList.toggle("on", on);
    var card = byId("card-" + key);
    if (card) card.classList.toggle("on", on);
  }

  function bindToggle(swId, key, applyFn) {
    var sw = byId(swId);
    if (!sw) return;
    sw.addEventListener("change", function () {
      devices[key].on = sw.checked;
      setLed(key, sw.checked);
      applyFn();
      updateHud();
    });
  }

  /* --- light --- */
  function setupLight() {
    var bright = byId("lightBright"), hue = byId("lightHue"), card = byId("card-light");
    function apply() {
      var d = devices.light;
      d.watts = d.on ? 4 + (parseInt(bright.value, 10) / 100) * 8 : 0;
      setText("lightWatt", d.watts.toFixed(1) + " W");
      if (card) {
        var color = "hsl(" + hue.value + ", 95%, " + (35 + parseInt(bright.value, 10) * 0.3) + "%)";
        card.style.setProperty("--bulb-color", color);
        var glow = byId("bulbGlow");
        if (glow) glow.style.opacity = d.on ? String(0.3 + parseInt(bright.value, 10) / 160) : "0";
      }
      updateHud();
    }
    bindToggle("swLight", "light", apply);
    if (bright) bright.addEventListener("input", apply);
    if (hue) hue.addEventListener("input", apply);
  }

  /* --- AC --- */
  function setupAc() {
    var minus = byId("acMinus"), plus = byId("acPlus");
    function apply() {
      var d = devices.ac;
      d.watts = d.on ? 900 + (28 - d.temp) * 90 : 0;
      setText("acTemp", d.temp + "°C");
      setText("acTempLabel", d.temp + "°C");
      setText("acWatt", Math.round(d.watts) + " W");
      updateHud();
    }
    bindToggle("swAc", "ac", apply);
    if (minus) minus.addEventListener("click", function () {
      devices.ac.temp = Math.max(16, devices.ac.temp - 1); apply();
    });
    if (plus) plus.addEventListener("click", function () {
      devices.ac.temp = Math.min(30, devices.ac.temp + 1); apply();
    });
    apply();
  }

  /* --- fan --- */
  function setupFan() {
    var speed = byId("fanSpeed"), card = byId("card-fan");
    function apply() {
      var d = devices.fan;
      d.speed = parseInt(speed.value, 10);
      d.watts = d.on ? 12 + d.speed * 12 : 0;
      setText("fanWatt", Math.round(d.watts) + " W");
      if (card) card.style.setProperty("--fan-period", (1.3 - d.speed * 0.21).toFixed(2) + "s");
      updateHud();
    }
    bindToggle("swFan", "fan", apply);
    if (speed) speed.addEventListener("input", apply);
    apply();
  }

  /* --- cooler --- */
  function setupCooler() {
    var speed = byId("coolerSpeed");
    function apply() {
      var d = devices.cooler;
      d.speed = parseInt(speed.value, 10);
      d.watts = d.on ? 90 + d.speed * 55 : 0;
      setText("coolerWatt", Math.round(d.watts) + " W");
      updateHud();
    }
    bindToggle("swCooler", "cooler", apply);
    if (speed) speed.addEventListener("input", apply);
    apply();
  }

  /* --- mixer --- */
  function setupMixer() {
    var seg = byId("mixerSeg"), card = byId("card-mixer");
    function apply() {
      var d = devices.mixer;
      d.watts = d.on ? 250 + d.speed * 150 : 0;
      setText("mixerWatt", Math.round(d.watts) + " W");
      if (card) card.style.setProperty("--mix-period", (0.3 - d.speed * 0.06).toFixed(2) + "s");
      updateHud();
    }
    bindToggle("swMixer", "mixer", apply);
    if (seg) seg.addEventListener("click", function (e) {
      var btn = e.target.closest(".seg-btn");
      if (!btn) return;
      seg.querySelectorAll(".seg-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      devices.mixer.speed = parseInt(btn.getAttribute("data-speed"), 10) || 1;
      apply();
    });
    apply();
  }

  /* --- solar inverter --- */
  function setupSolar() {
    var seg = byId("solarSeg");
    var t = 0;
    function apply() {
      var d = devices.solar;
      var base = d.mode === "solar" ? 3200 : d.mode === "hybrid" ? 2100 : 600;
      d.watts = d.on ? base : 0;
      setText("solarWatt", Math.round(d.watts) + " W");
      updateHud();
    }
    bindToggle("swSolar", "solar", apply);
    if (seg) seg.addEventListener("click", function (e) {
      var btn = e.target.closest(".seg-btn");
      if (!btn) return;
      seg.querySelectorAll(".seg-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      devices.solar.mode = btn.getAttribute("data-mode") || "solar";
      apply();
    });
    /* animated kW readout */
    setInterval(function () {
      t += 0.13;
      var d = devices.solar;
      var kw = d.on ? (d.watts / 1000) + Math.sin(t) * 0.18 : 0;
      setText("solarWattsBig", Math.max(0, kw).toFixed(2));
    }, 220);
    apply();
  }

  /* --- BMS (always-on telemetry simulation) --- */
  function setupBms() {
    var cellsBox = byId("bmsCells");
    var cells = [];
    if (cellsBox) {
      for (var i = 0; i < 16; i++) {
        var c = document.createElement("div");
        c.className = "bms-cell";
        c.style.setProperty("--lvl", (52 + Math.random() * 38).toFixed(0) + "%");
        cellsBox.appendChild(c);
        cells.push(c);
      }
    }
    var pct = 0, target = 87;
    var fill = byId("batteryFill");
    var iv = setInterval(function () {
      pct += 1;
      if (fill) fill.style.height = pct + "%";
      setText("batteryPct", pct + "%");
      if (pct >= target) clearInterval(iv);
    }, 26);

    setInterval(function () {
      setText("bmsVolt", (50.4 + Math.random() * 2.2).toFixed(1) + " V");
      setText("bmsAmp",  (10.5 + Math.random() * 4.5).toFixed(1) + " A");
      setText("bmsTemp", (29.0 + Math.random() * 4.0).toFixed(1) + "°C");
      if (cells.length) {
        var c = cells[Math.floor(Math.random() * cells.length)];
        c.style.setProperty("--lvl", (52 + Math.random() * 38).toFixed(0) + "%");
        if (Math.random() < 0.06) {
          c.classList.add("hot");
          setTimeout(function () { c.classList.remove("hot"); }, 1500);
        }
      }
    }, 1500);
  }

  /* --- uptime ticker --- */
  function startUptime() {
    var start = Date.now();
    setInterval(function () {
      var s = Math.floor((Date.now() - start) / 1000);
      var h = String(Math.floor(s / 3600)).padStart(2, "0");
      var m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      var ss = String(s % 60).padStart(2, "0");
      setText("hudUptime", h + ":" + m + ":" + ss);
    }, 1000);
  }

  /* =========================================================
     7. POWER ON EVERY DEVICE (so the deck looks fully alive)
     ========================================================= */
  function powerOnAll() {
    ["swLight", "swAc", "swFan", "swCooler", "swMixer", "swSolar"].forEach(function (id) {
      var sw = byId(id);
      if (sw && !sw.checked) {
        sw.checked = true;
        sw.dispatchEvent(new Event("change"));
      }
    });
  }

  /* =========================================================
     8. ANALYTICS — live chart + Wink-style fault prediction
     A genuine real-time demo: streams device telemetry, runs a
     rolling z-score anomaly model and renders a risk gauge.
     ========================================================= */
  function cssVar(name, fb) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fb;
    } catch (e) { return fb; }
  }
  function hexA(hex, a) {
    hex = (hex || "").trim();
    if (hex.charAt(0) === "#" && hex.length === 7) {
      var r = parseInt(hex.slice(1, 3), 16),
          g = parseInt(hex.slice(3, 5), 16),
          b = parseInt(hex.slice(5, 7), 16);
      return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    }
    return hex;
  }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  function startAnalytics() {
    var canvas = byId("anChart");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var box = canvas.parentElement;
    var faultArc = byId("faultArc");

    var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    function resize() {
      W = box.clientWidth || 560;
      H = box.clientHeight || 200;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize);
    resize();

    var N = 52, POWER_MAX = 6; /* kW full-scale */
    var powerS = [], healthS = [], buf = [];
    for (var i = 0; i < N; i++) { powerS.push(0); healthS.push(0.34); }
    var risk = 0, anomaly = 0;
    var accent = cssVar("--accent", "#0891b2");
    var accent2 = cssVar("--accent2", "#2563eb");
    var C = 2 * Math.PI * 54;

    function tick() {
      var kw = computeLoad().load / 1000;
      var stress = clamp01(kw / POWER_MAX);

      if (anomaly > 0) anomaly--;
      else if (Math.random() < 0.05) anomaly = 5 + Math.floor(Math.random() * 7);
      var spike = anomaly > 0 ? 0.30 : 0;

      var metric = clamp01(0.30 + stress * 0.35 + (Math.random() - 0.5) * 0.07 + spike);

      /* rolling mean / std over a window → z-score (the "Wink" anomaly model) */
      buf.push(metric);
      if (buf.length > 30) buf.shift();
      var mean = 0, j;
      for (j = 0; j < buf.length; j++) mean += buf[j];
      mean /= buf.length;
      var varc = 0;
      for (j = 0; j < buf.length; j++) { var d = buf[j] - mean; varc += d * d; }
      varc /= Math.max(1, buf.length - 1);
      var sd = Math.sqrt(varc) || 0.0001;
      var z = (metric - mean) / sd;

      var target = clamp01(Math.max(0, z) / 3 * 0.6 + metric * 0.5) * 100;
      risk += (target - risk) * 0.2;

      powerS.push(kw); powerS.shift();
      healthS.push(metric); healthS.shift();

      draw();
      updateGauge();
    }

    function drawSeries(arr, max, color, fill) {
      var n = arr.length, step = W / (n - 1), i, x, y;
      ctx.beginPath();
      for (i = 0; i < n; i++) {
        x = i * step;
        y = H - clamp01(arr[i] / max) * (H * 0.9) - 6;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.stroke();
      if (fill) {
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
        var grd = ctx.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, hexA(color, 0.20));
        grd.addColorStop(1, hexA(color, 0));
        ctx.fillStyle = grd;
        ctx.fill();
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(15,23,42,0.06)";
      ctx.lineWidth = 1;
      for (var g = 1; g < 4; g++) {
        var y = H * g / 4;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      drawSeries(powerS, POWER_MAX, accent, true);
      drawSeries(healthS, 1, "#64748b", false);
    }
    function updateGauge() {
      var r = Math.round(risk);
      setText("faultPct", r + "%");
      var label = r < 30 ? "Healthy" : r < 65 ? "Watch" : "Fault risk";
      setText("faultLabel", label);
      var col = r < 30 ? cssVar("--success", "#10b981")
              : r < 65 ? "#f59e0b"
              : cssVar("--danger", "#ef4444");
      if (faultArc) {
        faultArc.style.strokeDasharray = C.toFixed(1);
        faultArc.style.strokeDashoffset = (C * (1 - r / 100)).toFixed(1);
        faultArc.style.stroke = col;
      }
      var num = byId("faultPct"); if (num) num.style.color = col;
      var lab = byId("faultLabel"); if (lab) lab.style.color = col;
    }

    tick();
    setInterval(tick, 1100);
  }

  /* =========================================================
     BOOT
     ========================================================= */
  document.addEventListener("DOMContentLoaded", function () {
    applyConfig();
    startMesh();
    startTyping();
    startCounters();
    startReveal();
    startMenu();
    setupLight();
    setupAc();
    setupFan();
    setupCooler();
    setupMixer();
    setupSolar();
    setupBms();
    powerOnAll();
    startAnalytics();
    startUptime();
    updateHud();
  });
})();
