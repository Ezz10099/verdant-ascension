(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("status");
  const selectedEl = document.getElementById("selectedInfo");
  const growthEl = document.getElementById("growthInfo");
  const territoryEl = document.getElementById("territoryInfo");
  const upgradeButton = document.getElementById("upgradeButton");
  const resetButton = document.getElementById("resetButton");

  const TIER = {
    1: { name: "Small Grass", cap: 42, regen: 6, cost: 34, blades: 10 },
    2: { name: "Tall Grass", cap: 62, regen: 8, cost: 48, blades: 15 },
    3: { name: "Wheat Patch", cap: 86, regen: 10, cost: 64, blades: 18 },
    4: { name: "Reed Bundle", cap: 114, regen: 12, cost: 82, blades: 19 },
    5: { name: "Sugar Cane", cap: 146, regen: 14, cost: 102, blades: 15 },
    6: { name: "Giant Bamboo", cap: 184, regen: 16, cost: 0, blades: 11 }
  };

  const PALETTE = {
    player: { soil: "#203b28", dark: "#0f2517", leaf: "#65d978", leaf2: "#a7ee83", glow: "rgba(103,226,124,.28)", vein: "#b8ffad" },
    enemy: { soil: "#493321", dark: "#2a1c13", leaf: "#d88752", leaf2: "#eab96c", glow: "rgba(236,139,79,.24)", vein: "#ffd19a" },
    neutral: { soil: "#323b2d", dark: "#1d251b", leaf: "#81997b", leaf2: "#aab99a", glow: "rgba(165,197,157,.10)", vein: "#c8d8bf" }
  };

  const layout = [
    [0.12, 0.31], [0.23, 0.18], [0.23, 0.48], [0.36, 0.31], [0.36, 0.64],
    [0.50, 0.18], [0.50, 0.47], [0.63, 0.31], [0.62, 0.64], [0.76, 0.19],
    [0.77, 0.47], [0.89, 0.31], [0.86, 0.65]
  ];

  let w = 0;
  let h = 0;
  let dpr = 1;
  let nodes = [];
  let edges = [];
  let selectedId = 0;
  let spores = [];
  let tendrils = [];
  let bursts = [];
  let enemyClock = 0;
  let last = 0;
  let message = "Tap a green patch, then tap a nearby patch to attack.";
  let messageAge = 0;
  let result = "";

  function init() {
    nodes = layout.map((p, id) => ({
      id,
      nx: p[0], ny: p[1], x: 0, y: 0, r: 34,
      owner: "neutral", tier: 1, growth: 22,
      hit: 0, bloom: 0, phase: Math.random() * Math.PI * 2,
      shape: makeShape(id), seed: id * 991 + 17
    }));

    [
      [0, "player", 1, 32], [1, "player", 2, 42], [2, "player", 1, 28],
      [10, "enemy", 1, 30], [11, "enemy", 1, 30], [12, "enemy", 2, 44],
      [3, "neutral", 2, 36], [4, "neutral", 2, 34], [5, "neutral", 3, 50],
      [6, "neutral", 2, 38], [7, "neutral", 3, 52], [8, "neutral", 2, 34], [9, "neutral", 3, 50]
    ].forEach(([id, owner, tier, growth]) => Object.assign(nodes[id], { owner, tier, growth }));

    edges = [];
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        if (Math.hypot(nodes[i].nx - nodes[j].nx, nodes[i].ny - nodes[j].ny) < 0.195) edges.push([i, j]);
      }
    }

    spores = Array.from({ length: 32 }, (_, i) => ({
      x: pseudo(i * 3 + 1), y: pseudo(i * 5 + 2),
      size: 0.8 + pseudo(i * 7 + 4) * 2.2,
      speed: 0.008 + pseudo(i * 11 + 3) * 0.022,
      alpha: 0.10 + pseudo(i * 13 + 8) * 0.25
    }));

    tendrils = [];
    bursts = [];
    selectedId = 0;
    enemyClock = 0;
    result = "";
    setMessage("Tap a green patch, then tap a nearby patch to attack.");
    resize();
    syncHud();
  }

  function makeShape(seed) {
    return Array.from({ length: 14 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 14;
      const n = 0.78 + pseudo(seed * 31 + i * 17) * 0.27;
      return { a, n };
    });
  }

  function pseudo(n) {
    const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function resize() {
    dpr = Math.max(1, Math.min(devicePixelRatio || 1, 2));
    w = canvas.clientWidth || innerWidth;
    h = canvas.clientHeight || innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const base = Math.min(w, h);
    nodes.forEach((n) => {
      n.x = w * 0.04 + n.nx * w * 0.92;
      n.y = h * 0.10 + n.ny * h * 0.78;
      n.r = Math.max(31, base * (0.053 + n.tier * 0.003));
    });
  }

  function tier(n) { return TIER[n.tier]; }
  function neighbors(id) { return edges.flatMap(([a, b]) => a === id ? [nodes[b]] : b === id ? [nodes[a]] : []); }
  function linked(a, b) { return edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a)); }

  function setMessage(text) {
    message = text;
    messageAge = 0;
    statusEl.textContent = text;
    statusEl.style.opacity = "1";
    statusEl.style.transform = "translateX(-50%) translateY(0)";
  }

  function upgrade() {
    if (selectedId == null || result) return;
    const n = nodes[selectedId];
    if (!n || n.owner !== "player") return;
    const info = tier(n);
    if (n.tier >= 6) return setMessage("This plant has reached the current prototype peak.");
    if (n.growth < info.cost) return setMessage(`Need ${info.cost} growth to evolve.`);
    n.growth -= info.cost;
    n.tier += 1;
    n.bloom = 1.3;
    bursts.push({ x: n.x, y: n.y, age: 0, life: .9, owner: n.owner, big: true });
    setMessage(`${tier(n).name} evolved.`);
    resize();
  }

  function attack(source, target, ratio = .58) {
    if (!source || !target || result) return false;
    if (source.growth < 18) {
      if (source.owner === "player") setMessage("Let this patch regrow before attacking again.");
      return false;
    }

    const amount = Math.max(18, Math.floor(source.growth * ratio));
    source.growth -= amount;
    tendrils.push({
      owner: source.owner,
      from: source.id,
      to: target.id,
      power: amount,
      t: 0,
      duration: .55,
      sway: (pseudo(source.id * 41 + target.id * 17) - .5) * 70,
      struck: false
    });
    source.bloom = .28;
    return true;
  }

  function resolveHit(t) {
    const target = nodes[t.to];
    if (!target) return;
    bursts.push({ x: target.x, y: target.y, age: 0, life: .42, owner: t.owner, big: false });
    if (target.owner === t.owner) {
      target.growth = Math.min(tier(target).cap, target.growth + t.power * .72);
      return;
    }
    target.growth -= t.power;
    target.hit = 1;
    if (target.growth <= 0) {
      const overflow = Math.abs(target.growth);
      target.owner = t.owner;
      target.growth = Math.min(tier(target).cap, 12 + overflow * .35);
      target.hit = 0;
      target.bloom = 1.4;
      bursts.push({ x: target.x, y: target.y, age: 0, life: .95, owner: t.owner, big: true });
      if (t.owner === "player") setMessage(`${tier(target).name} captured.`);
    }
  }

  function enemyTurn() {
    if (result) return;
    let best = null;
    nodes.forEach((n) => {
      if (n.owner !== "enemy" || n.growth < 20) return;
      neighbors(n.id).forEach((m) => {
        if (m.owner === "enemy") return;
        const score = (m.owner === "player" ? 25 : 10) + n.growth * .32 - m.growth * .24 + (n.tier - m.tier) * 5 + pseudo(performance.now() + n.id + m.id) * 4;
        if (!best || score > best.score) best = { source: n, target: m, score };
      });
    });
    if (best) return attack(best.source, best.target, .54);

    const up = nodes.filter((n) => n.owner === "enemy" && n.tier < 6 && n.growth >= tier(n).cost).sort((a, b) => b.growth - a.growth)[0];
    if (up) {
      up.growth -= tier(up).cost;
      up.tier += 1;
      up.bloom = 1.1;
      resize();
    }
  }

  function update(dt) {
    messageAge += dt;
    if (messageAge > 3.5) {
      statusEl.style.opacity = ".15";
      statusEl.style.transform = "translateX(-50%) translateY(-4px)";
    }

    spores.forEach((s) => {
      s.y -= s.speed * dt;
      s.x += Math.sin(performance.now() * .00025 + s.y * 8) * .00008;
      if (s.y < -.04) { s.y = 1.04; s.x = Math.random(); }
    });

    nodes.forEach((n) => {
      n.growth = Math.min(tier(n).cap, n.growth + tier(n).regen * (n.owner === "neutral" ? .28 : 1) * dt);
      n.hit = Math.max(0, n.hit - dt * 1.6);
      n.bloom = Math.max(0, n.bloom - dt * 1.45);
    });

    for (let i = tendrils.length - 1; i >= 0; i -= 1) {
      const t = tendrils[i];
      t.t += dt / t.duration;
      if (!t.struck && t.t >= .92) { t.struck = true; resolveHit(t); }
      if (t.t >= 1.15) tendrils.splice(i, 1);
    }

    for (let i = bursts.length - 1; i >= 0; i -= 1) {
      bursts[i].age += dt;
      if (bursts[i].age >= bursts[i].life) bursts.splice(i, 1);
    }

    enemyClock += dt;
    if (enemyClock >= 1.6) { enemyTurn(); enemyClock = 0; }

    if (selectedId != null && nodes[selectedId].owner !== "player") {
      selectedId = (nodes.find((n) => n.owner === "player") || {}).id ?? null;
    }

    const players = nodes.filter((n) => n.owner === "player").length;
    const enemies = nodes.filter((n) => n.owner === "enemy").length;
    if (!result && enemies === 0) { result = "Verdant victory"; setMessage("The blight has been completely overgrown."); }
    if (!result && players === 0) { result = "Blight victory"; selectedId = null; setMessage("Your growth collapsed. Reset to try again."); }
    syncHud();
  }

  function syncHud() {
    const owned = nodes.filter((n) => n.owner === "player");
    territoryEl.textContent = `${owned.length} / ${nodes.length}`;
    if (selectedId == null) {
      selectedEl.textContent = "No patch selected";
      growthEl.textContent = "Tap a green patch";
      upgradeButton.disabled = true;
      upgradeButton.style.opacity = ".45";
      return;
    }
    const n = nodes[selectedId];
    selectedEl.textContent = tier(n).name;
    growthEl.textContent = `${Math.round(n.growth)} / ${tier(n).cap} growth${n.tier < 6 ? ` • evolve at ${tier(n).cost}` : " • max tier"}`;
    upgradeButton.disabled = n.owner !== "player";
    upgradeButton.style.opacity = n.owner === "player" ? "1" : ".45";
  }

  function render(time) {
    const now = time / 1000;
    drawWorld(now);
    drawSelectionConnections(now);
    nodes.forEach((n) => drawPatch(n, now));
    tendrils.forEach((t) => drawTendril(t, now));
    bursts.forEach(drawBurst);
    if (result) drawResult();
  }

  function drawWorld(now) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#07130d");
    sky.addColorStop(.42, "#0a1e14");
    sky.addColorStop(1, "#08100b");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const halo = ctx.createRadialGradient(w * .48, h * .43, 10, w * .48, h * .43, w * .55);
    halo.addColorStop(0, "rgba(76, 153, 92, .12)");
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    for (let y = 90; y < h; y += 34) {
      ctx.strokeStyle = `rgba(99, 143, 104, ${.016 + (y / h) * .014})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 24) ctx.lineTo(x, y + Math.sin(x * .028 + y * .013 + now * .35) * 5);
      ctx.stroke();
    }

    spores.forEach((s) => {
      ctx.fillStyle = `rgba(209, 243, 213, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawSelectionConnections(now) {
    if (selectedId == null) return;
    const source = nodes[selectedId];
    neighbors(selectedId).forEach((target, index) => {
      const a = source;
      const b = target;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const nx = dx / dist;
      const ny = dy / dist;
      const bend = Math.sin(now * 1.3 + index) * 7;
      const cx = (a.x + b.x) / 2 - ny * bend;
      const cy = (a.y + b.y) / 2 + nx * bend;
      const enemy = target.owner !== "player";

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(cx, cy, b.x, b.y);
      ctx.strokeStyle = enemy ? "rgba(231, 208, 140, .18)" : "rgba(125, 231, 143, .14)";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.stroke();

      const t = (now * .28 + index * .2) % 1;
      const point = qPoint(a.x, a.y, cx, cy, b.x, b.y, t);
      ctx.fillStyle = enemy ? "rgba(255,211,152,.62)" : "rgba(170,255,181,.5)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPatch(n, now) {
    const p = PALETTE[n.owner];
    const r = n.r * (1 + Math.sin(now * 1.7 + n.phase) * .012 + n.bloom * .055);

    ctx.save();
    ctx.translate(n.x + Math.sin(now * 2.1 + n.phase) * n.hit * 3, n.y);

    ctx.shadowBlur = 20 + n.bloom * 16;
    ctx.shadowColor = p.glow;
    ctx.fillStyle = "rgba(0,0,0,.25)";
    irregularPath(n, r * 1.08, 0, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    const soil = ctx.createRadialGradient(-r * .24, -r * .3, r * .14, 0, 0, r);
    soil.addColorStop(0, lighten(p.soil, 18));
    soil.addColorStop(.72, p.soil);
    soil.addColorStop(1, p.dark);
    ctx.fillStyle = soil;
    irregularPath(n, r, 0, 0);
    ctx.fill();

    ctx.save();
    irregularPath(n, r * .94, 0, 0);
    ctx.clip();
    drawGroundTexture(n, r, p);
    drawPlantCluster(n, r, p, now);
    ctx.restore();

    if (selectedId === n.id && n.owner === "player") {
      ctx.strokeStyle = "rgba(202,255,202,.72)";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 7]);
      ctx.lineDashOffset = -now * 12;
      irregularPath(n, r * 1.09, 0, 0);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (n.hit > 0) {
      ctx.fillStyle = `rgba(255,245,214,${n.hit * .13})`;
      irregularPath(n, r * 1.01, 0, 0);
      ctx.fill();
    }

    const shouldShowBar = selectedId === n.id || n.hit > .02;
    if (shouldShowBar) drawGrowthBar(n, r, p);
    ctx.restore();
  }

  function irregularPath(n, r, ox, oy) {
    ctx.beginPath();
    n.shape.forEach((pt, i) => {
      const rr = r * pt.n;
      const x = Math.cos(pt.a) * rr + ox;
      const y = Math.sin(pt.a) * rr * .82 + oy;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }

  function drawGroundTexture(n, r, p) {
    for (let i = 0; i < 18; i += 1) {
      const a = pseudo(n.seed + i * 19) * Math.PI * 2;
      const d = Math.sqrt(pseudo(n.seed + i * 23 + 3)) * r * .72;
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d * .72;
      ctx.fillStyle = i % 3 === 0 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.08)";
      ctx.beginPath();
      ctx.arc(x, y, 1 + pseudo(i + n.seed) * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlantCluster(n, r, p, now) {
    const info = tier(n);
    const count = info.blades;
    for (let i = 0; i < count; i += 1) {
      const angle = pseudo(n.seed + i * 43) * Math.PI * 2;
      const distance = Math.sqrt(pseudo(n.seed + i * 47 + 2)) * r * .58;
      const x = Math.cos(angle) * distance;
      const baseY = Math.sin(angle) * distance * .52 + r * .19;
      const variance = .72 + pseudo(n.seed + i * 53) * .55;
      const sway = Math.sin(now * (1.6 + n.tier * .08) + n.phase + i * .71) * r * .055;
      drawPlantStem(n.tier, x, baseY, r * variance, sway, p, i);
    }
  }

  function drawPlantStem(t, x, y, r, sway, p, i) {
    let height = r * (.52 + t * .055);
    if (t === 6) height = r * .88;
    const thick = Math.max(1.5, 1.4 + t * .38);
    ctx.lineCap = "round";

    if (t <= 2) {
      ctx.strokeStyle = i % 3 === 0 ? p.leaf2 : p.leaf;
      ctx.lineWidth = thick;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + sway * .35, y - height * .52, x + sway, y - height);
      ctx.stroke();
      return;
    }

    if (t === 3) {
      ctx.strokeStyle = p.leaf;
      ctx.lineWidth = thick * .75;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + sway * .2, y - height * .55, x + sway, y - height);
      ctx.stroke();
      ctx.fillStyle = nudgeColor(p.leaf2, 18);
      ctx.beginPath();
      ctx.ellipse(x + sway, y - height, 2.6, 7, sway * .01, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (t === 4) {
      ctx.strokeStyle = p.leaf;
      ctx.lineWidth = thick * .9;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + sway * .15, y - height * .5, x + sway * .7, y - height);
      ctx.stroke();
      ctx.strokeStyle = p.leaf2;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + sway * .7, y - height);
      ctx.lineTo(x + sway * .85, y - height - 8);
      ctx.stroke();
      return;
    }

    if (t === 5) {
      ctx.strokeStyle = nudgeColor(p.leaf, -10);
      ctx.lineWidth = thick * 1.15;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + sway * .3, y - height);
      ctx.stroke();
      for (let j = 1; j <= 3; j += 1) {
        const ly = y - height * (j / 4);
        ctx.strokeStyle = p.leaf2;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x + sway * .1, ly);
        ctx.quadraticCurveTo(x + 8, ly - 3, x + 13 + sway * .25, ly - 8);
        ctx.stroke();
      }
      return;
    }

    ctx.strokeStyle = nudgeColor(p.leaf, -16);
    ctx.lineWidth = thick * 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + sway * .15, y - height);
    ctx.stroke();
    for (let j = 1; j <= 3; j += 1) {
      const ly = y - height * (j / 4);
      ctx.strokeStyle = p.leaf2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + sway * .1, ly);
      ctx.quadraticCurveTo(x + 10, ly - 2, x + 16 + sway * .25, ly - 10);
      ctx.moveTo(x + sway * .1, ly + 1);
      ctx.quadraticCurveTo(x - 9, ly - 1, x - 14 + sway * .12, ly - 8);
      ctx.stroke();
    }
  }

  function drawGrowthBar(n, r, p) {
    const pct = Math.max(0, Math.min(1, n.growth / tier(n).cap));
    const width = r * 1.15;
    const y = r * .83;
    ctx.fillStyle = "rgba(4,9,6,.58)";
    roundRect(-width / 2, y, width, 5, 3);
    ctx.fill();
    ctx.fillStyle = p.vein;
    roundRect(-width / 2, y, width * pct, 5, 3);
    ctx.fill();
  }

  function drawTendril(t, now) {
    const a = nodes[t.from];
    const b = nodes[t.to];
    const p = PALETTE[t.owner];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    const nx = dx / dist;
    const ny = dy / dist;
    const cx = (a.x + b.x) / 2 - ny * t.sway;
    const cy = (a.y + b.y) / 2 + nx * t.sway;
    const progress = Math.min(1, t.t);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = p.vein;
    ctx.lineWidth = 3.2;
    ctx.shadowColor = p.glow;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    const segments = 22;
    for (let i = 0; i <= segments * progress; i += 1) {
      const q = i / segments;
      const point = qPoint(a.x, a.y, cx, cy, b.x, b.y, q);
      if (i === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    for (let i = 0; i < 4; i += 1) {
      const q = Math.min(progress, .2 + i * .2);
      if (q > progress - .06) continue;
      const point = qPoint(a.x, a.y, cx, cy, b.x, b.y, q);
      ctx.fillStyle = p.leaf2;
      ctx.beginPath();
      ctx.ellipse(point.x + Math.sin(now * 5 + i) * 2, point.y, 4, 2, i * .8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBurst(b) {
    const p = PALETTE[b.owner];
    const t = b.age / b.life;
    const radius = (b.big ? 44 : 22) * easeOut(t);
    ctx.strokeStyle = alphaHex(p.vein, 1 - t);
    ctx.lineWidth = b.big ? 4 : 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < (b.big ? 10 : 5); i += 1) {
      const a = i * 2.399 + t;
      const d = radius * (.5 + pseudo(i + 2) * .8);
      ctx.fillStyle = alphaHex(p.leaf2, 1 - t);
      ctx.beginPath();
      ctx.ellipse(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, 3.2, 1.6, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawResult() {
    ctx.fillStyle = "rgba(3,8,5,.48)";
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f2fff3";
    ctx.font = "800 28px system-ui, sans-serif";
    ctx.fillText(result, w / 2, h * .48);
    ctx.fillStyle = "#a9bcad";
    ctx.font = "500 14px system-ui, sans-serif";
    ctx.fillText("Reset to grow again", w / 2, h * .48 + 26);
  }

  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return nodes
      .map((n) => ({ n, d: Math.hypot(n.x - x, n.y - y) }))
      .filter((o) => o.d <= o.n.r * 1.08)
      .sort((a, b) => a.d - b.d)[0]?.n || null;
  }

  function onPointerDown(event) {
    const hit = pick(event.clientX, event.clientY);
    if (!hit) return;

    if (hit.owner === "player") {
      selectedId = hit.id;
      setMessage(`${tier(hit).name} selected.`);
      syncHud();
      return;
    }

    if (selectedId == null) return setMessage("Select one of your green patches first.");
    const source = nodes[selectedId];
    if (!source || source.owner !== "player") return;
    if (!linked(source.id, hit.id)) return setMessage("That patch is too far away. Choose a nearby one.");
    attack(source, hit);
  }

  function qPoint(ax, ay, cx, cy, bx, by, t) {
    return {
      x: (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * cx + t * t * bx,
      y: (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * cy + t * t * by
    };
  }

  function lighten(hex, amount) { return nudgeColor(hex, amount); }
  function nudgeColor(hex, amount) {
    const v = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (v >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((v >> 8) & 255) + amount));
    const b = Math.max(0, Math.min(255, (v & 255) + amount));
    return `rgb(${r},${g},${b})`;
  }

  function alphaHex(hex, alpha) {
    const v = parseInt(hex.slice(1), 16);
    return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${Math.max(0, Math.min(1, alpha))})`;
  }

  function roundRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function easeOut(t) { return 1 - Math.pow(1 - Math.min(1, t), 3); }

  function loop(time) {
    const dt = Math.min(.033, (time - last) / 1000 || .016);
    last = time;
    update(dt);
    render(time);
    requestAnimationFrame(loop);
  }

  addEventListener("resize", resize);
  canvas.addEventListener("pointerdown", onPointerDown);
  upgradeButton.addEventListener("click", upgrade);
  resetButton.addEventListener("click", init);

  init();
  requestAnimationFrame(loop);
})();
