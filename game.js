(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("status");
  const selectedEl = document.getElementById("selectedInfo");
  const territoryEl = document.getElementById("territoryInfo");
  const upgradeButton = document.getElementById("upgradeButton");
  const resetButton = document.getElementById("resetButton");

  const TIER = {
    1: { name: "Small Grass", cap: 42, regen: 6, cost: 34 },
    2: { name: "Tall Grass", cap: 62, regen: 8, cost: 48 },
    3: { name: "Wheat Patch", cap: 86, regen: 10, cost: 64 },
    4: { name: "Reed Bundle", cap: 114, regen: 12, cost: 82 },
    5: { name: "Sugar Cane", cap: 146, regen: 14, cost: 102 },
    6: { name: "Giant Bamboo", cap: 184, regen: 16, cost: 0 }
  };

  const STYLE = {
    player: { core: "#79f08d", glow: "rgba(126,245,139,0.36)", deep: "#214d2d", leaf: "#bdff9e", shot: "#a6ffb4" },
    enemy: { core: "#ffb068", glow: "rgba(255,176,104,0.34)", deep: "#67391d", leaf: "#ffdb82", shot: "#ffcb95" },
    neutral: { core: "#8eb287", glow: "rgba(170,220,160,0.14)", deep: "#374736", leaf: "#cae0b4", shot: "#dcedd4" }
  };

  const layout = [
    [0.10, 0.36], [0.19, 0.22], [0.20, 0.50], [0.31, 0.35], [0.33, 0.66],
    [0.46, 0.21], [0.48, 0.49], [0.60, 0.34], [0.58, 0.67], [0.73, 0.22],
    [0.75, 0.49], [0.87, 0.35], [0.84, 0.63]
  ];

  let w = 0;
  let h = 0;
  let dpr = 1;
  let nodes = [];
  let edges = [];
  let spores = [];
  let shots = [];
  let bursts = [];
  let selectedId = null;
  let enemyClock = 0;
  let last = 0;
  let status = "Tap your green growth to begin.";
  let result = "";

  function init() {
    nodes = layout.map((p, id) => ({
      id,
      nx: p[0],
      ny: p[1],
      x: 0,
      y: 0,
      r: 36,
      owner: "neutral",
      tier: 1,
      growth: 22,
      hit: 0,
      bloom: 0,
      phase: Math.random() * Math.PI * 2
    }));

    [
      [0, "player", 1, 32], [1, "player", 2, 42], [2, "player", 1, 28],
      [11, "enemy", 1, 30], [12, "enemy", 2, 44], [10, "enemy", 1, 30],
      [3, "neutral", 2, 36], [4, "neutral", 2, 34], [5, "neutral", 3, 50],
      [6, "neutral", 2, 38], [7, "neutral", 3, 52], [8, "neutral", 2, 34], [9, "neutral", 3, 50]
    ].forEach(([id, owner, tier, growth]) => Object.assign(nodes[id], { owner, tier, growth }));

    edges = [];
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        if (Math.hypot(nodes[i].nx - nodes[j].nx, nodes[i].ny - nodes[j].ny) < 0.195) {
          edges.push([i, j]);
        }
      }
    }

    spores = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: Math.random() * 3 + 1,
      v: Math.random() * 0.03 + 0.01,
      a: Math.random() * 0.35 + 0.12
    }));

    shots = [];
    bursts = [];
    selectedId = 0;
    enemyClock = 0;
    result = "";
    setStatus("Organic battlefield ready.");
    resize();
    syncHud();
  }

  function resize() {
    dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    w = canvas.clientWidth || innerWidth;
    h = canvas.clientHeight || innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const base = Math.min(w, h);
    nodes.forEach((n) => {
      n.x = w * 0.06 + n.nx * w * 0.88;
      n.y = h * 0.10 + n.ny * h * 0.78;
      n.r = base * (0.05 + n.tier * 0.004);
    });
  }

  function setStatus(text) {
    status = text;
  }

  function tier(n) {
    return TIER[n.tier];
  }

  function neighbors(id) {
    return edges.flatMap(([a, b]) => a === id ? [nodes[b]] : b === id ? [nodes[a]] : []);
  }

  function linked(a, b) {
    return edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  }

  function upgrade() {
    if (selectedId == null || result) return;
    const n = nodes[selectedId];
    if (!n || n.owner !== "player") return;

    const info = tier(n);
    if (n.tier >= 6) return setStatus("This growth is already at its current peak.");
    if (n.growth < info.cost) return setStatus(`Need ${info.cost} growth to evolve.`);

    n.growth -= info.cost;
    n.tier += 1;
    n.bloom = 1.2;
    bursts.push({ x: n.x, y: n.y, age: 0, life: 0.8, color: STYLE.player.shot, big: true });
    setStatus(`${tier(n).name} awakened.`);
    resize();
  }

  function send(source, target, ratio = 0.56) {
    if (!source || !target || result) return false;

    if (source.growth < 18) {
      if (source.owner === "player") setStatus("That plot needs more growth before attacking.");
      return false;
    }

    const amount = Math.max(18, Math.floor(source.growth * ratio));
    source.growth -= amount;
    const parts = Math.max(5, Math.min(10, Math.round(amount / 8)));

    for (let i = 0; i < parts; i += 1) {
      shots.push({
        owner: source.owner,
        from: source.id,
        to: target.id,
        power: amount / parts,
        delay: i * 0.045,
        t: 0,
        dur: 0.36 + Math.random() * 0.18,
        arc: (Math.random() - 0.5) * 36
      });
    }

    source.bloom = 0.25;
    return true;
  }

  function impact(shot) {
    const target = nodes[shot.to];
    if (!target) return;

    bursts.push({ x: target.x, y: target.y, age: 0, life: 0.36, color: STYLE[shot.owner].shot, big: false });

    if (target.owner === shot.owner) {
      target.growth = Math.min(tier(target).cap, target.growth + shot.power * 0.78);
      return;
    }

    target.growth -= shot.power;
    target.hit = 0.8;

    if (target.growth <= 0) {
      const overflow = Math.abs(target.growth);
      target.owner = shot.owner;
      target.growth = Math.min(tier(target).cap, 12 + overflow);
      target.hit = 0;
      target.bloom = 1.4;
      bursts.push({ x: target.x, y: target.y, age: 0, life: 0.85, color: STYLE[shot.owner].shot, big: true });
      if (shot.owner === "player") setStatus(`${tier(target).name} plot captured.`);
    }
  }

  function enemyTurn() {
    if (result) return;

    let best = null;

    nodes.forEach((n) => {
      if (n.owner !== "enemy" || n.growth < 20) return;

      neighbors(n.id).forEach((m) => {
        if (m.owner === "enemy") return;
        const score =
          (m.owner === "player" ? 24 : 10) +
          n.growth * 0.35 -
          m.growth * 0.25 +
          (n.tier - m.tier) * 5 +
          Math.random() * 4;

        if (!best || score > best.score) {
          best = { source: n, target: m, score };
        }
      });
    });

    if (best) return send(best.source, best.target, 0.54);

    const up = nodes
      .filter((n) => n.owner === "enemy" && n.tier < 6 && n.growth >= tier(n).cost)
      .sort((a, b) => b.growth - a.growth)[0];

    if (up) {
      up.growth -= tier(up).cost;
      up.tier += 1;
      up.bloom = 1.1;
      resize();
    }
  }

  function update(dt) {
    spores.forEach((s) => {
      s.y -= s.v * dt;
      if (s.y < -0.05) {
        s.y = 1.05;
        s.x = Math.random();
      }
    });

    nodes.forEach((n) => {
      n.growth = Math.min(tier(n).cap, n.growth + tier(n).regen * (n.owner === "neutral" ? 0.35 : 1) * dt);
      n.hit = Math.max(0, n.hit - dt * 1.3);
      n.bloom = Math.max(0, n.bloom - dt * 1.4);
    });

    for (let i = shots.length - 1; i >= 0; i -= 1) {
      const s = shots[i];
      if (s.delay > 0) {
        s.delay -= dt;
        continue;
      }
      s.t += dt / s.dur;
      if (s.t >= 1) {
        impact(s);
        shots.splice(i, 1);
      }
    }

    for (let i = bursts.length - 1; i >= 0; i -= 1) {
      bursts[i].age += dt;
      if (bursts[i].age >= bursts[i].life) bursts.splice(i, 1);
    }

    enemyClock += dt;
    if (enemyClock >= 1.35) {
      enemyTurn();
      enemyClock = 0;
    }

    if (selectedId != null && nodes[selectedId].owner !== "player") {
      selectedId = (nodes.find((n) => n.owner === "player") || {}).id ?? null;
    }

    const p = nodes.filter((n) => n.owner === "player").length;
    const e = nodes.filter((n) => n.owner === "enemy").length;

    if (!result && e === 0) {
      result = "Verdant victory";
      setStatus("You overgrew the entire blight.");
    }

    if (!result && p === 0) {
      result = "Blight victory";
      setStatus("Your growth collapsed. Reset and try again.");
      selectedId = null;
    }

    syncHud();
  }

  function syncHud() {
    const p = nodes.filter((n) => n.owner === "player");
    territoryEl.textContent = `${p.length}/${nodes.length} plots • ${Math.round(p.reduce((sum, n) => sum + n.growth, 0))} growth`;
    selectedEl.textContent =
      selectedId == null
        ? "None"
        : `${tier(nodes[selectedId]).name} • ${Math.round(nodes[selectedId].growth)}/${tier(nodes[selectedId]).cap}`;
    statusEl.textContent = result || status;
  }

  function drawBackground(now) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#09130f");
    g.addColorStop(0.45, "#10251d");
    g.addColorStop(1, "#08110d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w * 0.5, h * 0.48, 60, w * 0.5, h * 0.48, w * 0.5);
    glow.addColorStop(0, "rgba(110,255,170,0.08)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    spores.forEach((s) => {
      ctx.fillStyle = `rgba(220,255,228,${s.a})`;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.s, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = "rgba(180,255,190,0.05)";
    for (let y = h * 0.72; y < h; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(now + y * 0.03) * 4);
      for (let x = 0; x <= w; x += 20) {
        ctx.lineTo(x, y + Math.sin(now * 1.1 + x * 0.028 + y * 0.02) * 6);
      }
      ctx.stroke();
    }
  }

  function drawEdge(a, b, active, now) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    const nx = dx / dist;
    const ny = dy / dist;
    const bend = Math.sin(now * 1.2 + (a.id + b.id) * 0.7) * 6;
    const cx = (a.x + b.x) / 2 - ny * bend;
    const cy = (a.y + b.y) / 2 + nx * bend;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(cx, cy, b.x, b.y);
    ctx.strokeStyle = active ? "rgba(205,255,170,0.42)" : "rgba(136,179,138,0.18)";
    ctx.lineWidth = active ? 6 : 4;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(cx, cy, b.x, b.y);
    ctx.strokeStyle = active ? "rgba(255,255,255,0.45)" : "rgba(220,240,214,0.08)";
    ctx.lineWidth = active ? 2.2 : 1.2;
    ctx.stroke();
  }

  function drawBlob(r) {
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(r * 0.76, -r * 0.92, r * 1.12, -r * 0.24, r, r * 0.28);
    ctx.bezierCurveTo(r * 0.82, r * 0.98, r * 0.18, r * 1.14, -r * 0.22, r * 0.92);
    ctx.bezierCurveTo(-r * 0.92, r * 0.86, -r * 1.14, r * 0.16, -r * 0.86, -r * 0.36);
    ctx.bezierCurveTo(-r * 0.66, -r * 0.96, -r * 0.18, -r * 1.08, 0, -r);
  }

  function drawPlant(n, now, r) {
    const st = STYLE[n.owner];
    const sway = Math.sin(now * 2.8 + n.phase) * 0.22;
    const blades = 4 + n.tier * 2;

    for (let i = 0; i < blades; i += 1) {
      const spread = ((i / Math.max(1, blades - 1)) - 0.5) * r * 0.95;
      const height = r * (0.45 + (i % 3) * 0.12 + n.tier * 0.08);

      ctx.beginPath();
      ctx.moveTo(spread, r * 0.38);
      ctx.quadraticCurveTo(
        spread + r * 0.14 + sway * r * 0.8,
        r * 0.10,
        spread + sway * r * 1.3,
        r * 0.38 - height
      );
      ctx.strokeStyle = i % 2 === 0 ? st.core : st.leaf;
      ctx.lineWidth = Math.max(2, r * 0.08 - i * 0.03);
      ctx.lineCap = "round";
      ctx.stroke();
    }

    if (n.tier >= 3) {
      for (let i = 0; i < Math.min(4, n.tier); i += 1) {
        const offset = ((i / Math.max(1, Math.min(4, n.tier) - 1)) - 0.5) * r * 0.7;

        ctx.beginPath();
        ctx.moveTo(offset, r * 0.18);
        ctx.lineTo(offset + Math.sin(now * 2.2 + n.phase + i) * r * 0.04, -r * (0.48 + i * 0.03));
        ctx.strokeStyle = st.core;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(offset, -r * (0.5 + i * 0.03), r * 0.09, r * 0.18, 0, 0, Math.PI * 2);
        ctx.fillStyle = n.owner === "enemy" ? "#ffd785" : "#f2f29a";
        ctx.fill();
      }
    }

    if (n.tier >= 5) {
      for (let i = -1; i <= 1; i += 1) {
        const x = i * r * 0.22;
        ctx.beginPath();
        ctx.moveTo(x, r * 0.28);
        ctx.lineTo(x, -r * 0.62);
        ctx.strokeStyle = st.core;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    }
  }

  function drawNode(n, now) {
    const st = STYLE[n.owner];
    const pulse = 1 + Math.sin(now * 2.2 + n.phase) * 0.03 + n.bloom * 0.08;
    const r = n.r * pulse;

    ctx.save();
    ctx.translate(n.x, n.y);

    ctx.fillStyle = st.glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.45 + n.hit * 10, 0, Math.PI * 2);
    ctx.fill();

    const soil = ctx.createRadialGradient(-r * 0.25, -r * 0.35, r * 0.2, 0, 0, r * 1.05);
    soil.addColorStop(0, "rgba(255,255,255,0.10)");
    soil.addColorStop(1, st.deep);

    ctx.beginPath();
    drawBlob(r);
    ctx.fillStyle = soil;
    ctx.fill();

    ctx.beginPath();
    drawBlob(r * 0.82);
    ctx.fillStyle = "rgba(27,31,23,0.55)";
    ctx.fill();

    drawPlant(n, now, r);

    const p = Math.max(0, Math.min(1, n.growth / tier(n).cap));

    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 4;
    ctx.arc(0, 0, r * 0.98, -Math.PI / 2, Math.PI * 1.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = st.core;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.arc(0, 0, r * 0.98, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
    ctx.stroke();

    if (selectedId === n.id) {
      ctx.beginPath();
      ctx.strokeStyle = n.owner === "player" ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.28)";
      ctx.lineWidth = 3;
      ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.font = "600 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(n.tier), 0, r + 16);

    ctx.restore();
  }

  function drawShot(s) {
    if (s.delay > 0) return;

    const a = nodes[s.from];
    const b = nodes[s.to];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - 20 + s.arc;
    const x = quad(a.x, mx, b.x, s.t);
    const y = quad(a.y, my, b.y, s.t);
    const tx = quad(a.x, mx, b.x, Math.max(0, s.t - 0.08));
    const ty = quad(a.y, my, b.y, Math.max(0, s.t - 0.08));

    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(x, y);
    ctx.strokeStyle = STYLE[s.owner].shot;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = "#fff8e8";
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBurst(b) {
    const t = b.age / b.life;
    const radius = (b.big ? 36 : 16) * t;
    const rgb = hexToRgb(b.color);

    ctx.beginPath();
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - t})`;
    ctx.lineWidth = b.big ? 5 : 3;
    ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  function render(time) {
    const now = time / 1000;
    ctx.clearRect(0, 0, w, h);

    drawBackground(now);
    edges.forEach(([a, b]) => drawEdge(nodes[a], nodes[b], selectedId != null && (a === selectedId || b === selectedId), now));
    nodes.forEach((n) => drawNode(n, now));
    shots.forEach(drawShot);
    bursts.forEach(drawBurst);

    if (result) {
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      ctx.font = "700 34px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(result, w / 2, h / 2 - 12);
      ctx.font = "500 16px system-ui, sans-serif";
      ctx.fillText("Tap Reset to begin another growth cycle.", w / 2, h / 2 + 20);
    }
  }

  function quad(a, b, c, t) {
    return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.replace("#", ""), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return nodes.find((n) => Math.hypot(n.x - x, n.y - y) <= n.r * 1.15) || null;
  }

  function onPointerDown(event) {
    const hit = pick(event.clientX, event.clientY);

    if (!hit) {
      selectedId = null;
      return;
    }

    if (hit.owner === "player") {
      selectedId = hit.id;
      return;
    }

    if (selectedId == null) return setStatus("Select one of your own green plots first.");

    const source = nodes[selectedId];
    if (!source || source.owner !== "player") return;
    if (!linked(source.id, hit.id)) return setStatus("Plots can only attack across a root connection.");

    send(source, hit, 0.58);
  }

  function loop(time) {
    const dt = Math.min(0.033, (time - last) / 1000 || 0.016);
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