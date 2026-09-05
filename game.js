(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const wrap = document.getElementById("gameWrap");
  const status = document.getElementById("status");
  const tileCount = document.getElementById("tileCount");
  const resetButton = document.getElementById("resetButton");

  const GRID_RADIUS = 4;
  const SQRT3 = Math.sqrt(3);
  const cells = [];
  const plants = new Map();

  let hexSize = 28;
  let centerX = 0;
  let centerY = 0;

  const keyOf = (q, r) => `${q},${r}`;

  function buildGrid() {
    cells.length = 0;
    for (let q = -GRID_RADIUS; q <= GRID_RADIUS; q++) {
      const rMin = Math.max(-GRID_RADIUS, -q - GRID_RADIUS);
      const rMax = Math.min(GRID_RADIUS, -q + GRID_RADIUS);
      for (let r = rMin; r <= rMax; r++) {
        cells.push({ q, r });
      }
    }
  }

  function resetGame() {
    plants.clear();
    plants.set(keyOf(0, 0), {
      type: "small-grass",
      hp: 10,
      value: 0
    });
    status.textContent = "Tap a hex next to the grass to spread.";
    updateHud();
    draw();
  }

  function updateHud() {
    tileCount.textContent = `Grass: ${plants.size}`;
  }

  function axialToPixel(q, r) {
    return {
      x: centerX + hexSize * SQRT3 * (q + r / 2),
      y: centerY + hexSize * 1.5 * r
    };
  }

  function hexPath(x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function drawGrass(x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y + hexSize * 0.2);
    ctx.strokeStyle = "#78d36f";
    ctx.lineWidth = Math.max(2, hexSize * 0.08);
    ctx.lineCap = "round";

    const h = hexSize * 0.58 * scale;
    const spread = hexSize * 0.34 * scale;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-spread * 0.15, -h * 0.55, -spread * 0.55, -h);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(spread * 0.05, -h * 0.65, spread * 0.08, -h * 1.08);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(spread * 0.2, -h * 0.55, spread * 0.65, -h * 0.85);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-spread * 0.35, -h * 0.35, -spread * 0.85, -h * 0.48);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(spread * 0.35, -h * 0.28, spread * 0.9, -h * 0.4);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, Math.max(width, height) * 0.65
    );
    bg.addColorStop(0, "#233e27");
    bg.addColorStop(1, "#0e1710");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    for (const cell of cells) {
      const { x, y } = axialToPixel(cell.q, cell.r);
      const plant = plants.get(keyOf(cell.q, cell.r));

      hexPath(x, y, hexSize - 1);
      ctx.fillStyle = plant ? "#315f35" : "#243528";
      ctx.fill();
      ctx.strokeStyle = plant ? "#73a969" : "#3b5140";
      ctx.lineWidth = plant ? 1.8 : 1;
      ctx.stroke();

      if (plant) drawGrass(x, y, cell.q === 0 && cell.r === 0 ? 1.08 : 0.9);
    }
  }

  function resize() {
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const widthFit = rect.width / (SQRT3 * (GRID_RADIUS * 2 + 2.2));
    const heightFit = rect.height / (1.5 * (GRID_RADIUS * 2 + 1.8));
    hexSize = Math.max(18, Math.min(42, widthFit, heightFit));

    centerX = rect.width / 2;
    centerY = rect.height / 2;
    draw();
  }

  function isNeighborOfPlant(q, r) {
    const directions = [
      [1, 0], [1, -1], [0, -1],
      [-1, 0], [-1, 1], [0, 1]
    ];
    return directions.some(([dq, dr]) => plants.has(keyOf(q + dq, r + dr)));
  }

  function cellAtPoint(px, py) {
    let best = null;
    let bestDistance = Infinity;

    for (const cell of cells) {
      const { x, y } = axialToPixel(cell.q, cell.r);
      const distance = Math.hypot(px - x, py - y);
      if (distance < bestDistance && distance <= hexSize * 0.95) {
        bestDistance = distance;
        best = cell;
      }
    }
    return best;
  }

  function handlePointer(event) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const cell = cellAtPoint(event.clientX - rect.left, event.clientY - rect.top);
    if (!cell) return;

    const key = keyOf(cell.q, cell.r);
    if (plants.has(key)) {
      status.textContent = "Small green grass — HP 10 (prototype).";
      return;
    }

    if (!isNeighborOfPlant(cell.q, cell.r)) {
      status.textContent = "For this prototype, spread only to an adjacent hex.";
      return;
    }

    plants.set(key, { type: "small-grass", hp: 10, value: 0 });
    status.textContent = "Grass spread. This is only a touch/map test for now.";
    updateHud();
    draw();
  }

  canvas.addEventListener("pointerup", handlePointer, { passive: false });
  resetButton.addEventListener("click", resetGame);
  window.addEventListener("resize", resize);

  buildGrid();
  resetGame();
  requestAnimationFrame(resize);
})();
