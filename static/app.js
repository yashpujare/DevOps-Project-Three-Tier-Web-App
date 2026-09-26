(function () {
  const cfg = window.__FLOORPLAN__;
  const canvas = document.getElementById("plan");
  const ctx = canvas.getContext("2d");
  const cell = cfg.cellSize;

  const planHint = document.getElementById("planHint");
  const posReadout = document.getElementById("posReadout");
  const resultEmpty = document.getElementById("resultEmpty");
  const resultCard = document.getElementById("resultCard");
  const resultError = document.getElementById("resultError");
  const exitName = document.getElementById("exitName");
  const exitDirection = document.getElementById("exitDirection");
  const exitDistance = document.getElementById("exitDistance");
  const exitSteps = document.getElementById("exitSteps");
  const clearBtn = document.getElementById("clearBtn");

  let userCell = null;   // {row, col}
  let currentPath = null; // array of {row, col}
  let pathDistance = null;
  let pathSteps = null;
  let pulse = 0;

  const COLORS = {
    floor: "#1d2429",
    floorAlt: "#212a30",
    wall: "#dee9ea",
    grid: "#141a1e",
    exit: "#ff4438",
    exitGlow: "rgba(31, 209, 90, 0.35)",
    user: "#50da40",
    userGlow: "rgba(255, 68, 56, 0.35)",
    path: "#ffb020",
  };
  const ROOM_LABELS = [
  {
    name: "OFFICE 1",
    row: 2,
    col: 3
  },

  {
    name: "MEETING ROOM",
    row: 2,
    col: 9
  },

  {
    name: "OFFICE 2",
    row: 2,
    col: 16
  },

  {
    name: "CAFETERIA",
    row: 9,
    col: 3
  },

  {
    name: "SERVER ROOM",
    row: 9,
    col: 9
  },

  {
    name: "WASHROOM",
    row: 9,
    col: 16
  }
];
function drawRoomLabels() {
  ctx.save();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ROOM_LABELS.forEach((room) => {

    const x = room.col * cell + cell / 2;
    const y = room.row * cell + cell / 2;

    ctx.fillStyle = "rgba(238, 242, 240, 0.42)";

    ctx.font = `600 ${Math.round(cell * 0.24)}px Inter, sans-serif`;

    ctx.fillText(
      room.name,
      x,
      y
    );
  });

  ctx.restore();
}

function drawCorridorLabel() {
  const x = (cfg.cols * cell) / 2;
  const y = 6 * cell + cell / 2;

  ctx.save();

  // subtle background behind the text
  ctx.fillStyle = "rgba(13, 17, 20, 0.55)";
  ctx.fillRect(
    x - cell * 2.1,
    y - cell * 0.27,
    cell * 4.2,
    cell * 0.54
  );

  ctx.fillStyle = "rgba(238, 242, 240, 0.55)";

  ctx.font = `600 ${Math.round(cell * 0.23)}px Inter, sans-serif`;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    "MAIN CORRIDOR",
    x,
    y
  );

  ctx.restore();
}

function drawDoors() {
  // Array containing the corridor doors and the 4 inner room doors
  const doors = [
    // Main Corridor doors
    { row: 6, col: 3, arc: "south" },
    { row: 6, col: 9, arc: "south" },
    { row: 6, col: 16, arc: "south" },

    // Office 1 <-> Meeting Room doorway
    { row: 3, col: 6, arc: "east" },

    // Meeting Room <-> Office 2 doorway
    { row: 3, col: 13, arc: "east" },

    // Cafeteria <-> Server Room doorway
    { row: 10, col: 6, arc: "east" },

    // Server Room <-> Washroom doorway
    { row: 10, col: 13, arc: "east" }
  ];

  ctx.save();

  doors.forEach((door) => {
    const x = door.col * cell + cell / 2;
    const y = door.row * cell + cell / 2;

    if (door.arc === "east") {
      // Vertical door rendering for inner room walls
      ctx.fillStyle = "#b8894f";
      ctx.fillRect(x - cell * 0.08, y - cell * 0.28, cell * 0.16, cell * 0.56);

      ctx.strokeStyle = "#d4a766";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - cell * 0.08, y - cell * 0.28, cell * 0.16, cell * 0.56);

      ctx.beginPath();
      ctx.strokeStyle = "rgba(212, 167, 102, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.arc(x, y - cell * 0.28, cell * 0.32, 0, Math.PI / 2);
      ctx.stroke();
    } else {
      // Horizontal door rendering for main corridor
      ctx.fillStyle = "#b8894f";
      ctx.fillRect(x - cell * 0.28, y - cell * 0.08, cell * 0.56, cell * 0.16);

      ctx.strokeStyle = "#d4a766";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - cell * 0.28, y - cell * 0.08, cell * 0.56, cell * 0.16);

      ctx.beginPath();
      ctx.strokeStyle = "rgba(212, 167, 102, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.arc(x - cell * 0.28, y, cell * 0.32, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }
  });

  ctx.restore();
}
  function drawFloorPlan() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < cfg.rows; r++) {
  for (let c = 0; c < cfg.cols; c++) {

    const isWall = cfg.grid[r][c] === 1;

    // MAIN CORRIDOR
    const isCorridor = r === 6;

    if (isWall) {
      ctx.fillStyle = COLORS.wall;
    } else if (isCorridor) {
      ctx.fillStyle = "#28353b";
    } else {
      ctx.fillStyle =
        (r + c) % 2 === 0
          ? COLORS.floor
          : COLORS.floorAlt;
    }

    ctx.fillRect(
      c * cell,
      r * cell,
      cell,
      cell
    );
  }
}
drawCorridorLabel();
drawDoors();

    // faint grid lines
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let r = 0; r <= cfg.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cell);
      ctx.lineTo(cfg.cols * cell, r * cell);
      ctx.stroke();
    }
    for (let c = 0; c <= cfg.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cell, 0);
      ctx.lineTo(c * cell, cfg.rows * cell);
      ctx.stroke();
    }
    drawRoomLabels();

    
// path
if (currentPath && currentPath.length > 1) {
  ctx.save();
  ctx.strokeStyle = COLORS.path;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([10, 8]);
  ctx.lineDashOffset = pulse;

  ctx.beginPath();

  currentPath.forEach((p, i) => {
    const x = p.col * cell + cell / 2;
    const y = p.row * cell + cell / 2;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
  ctx.restore();


  // Distance and path length labels
  if (pathDistance !== null && pathSteps !== null) {

    // Find middle of the path
    const middle = currentPath[Math.floor(currentPath.length / 2)];

    const x = middle.col * cell + cell / 2;
    const y = middle.row * cell + cell / 2;

    ctx.save();

    // Label background
    const boxWidth = 120;
    const boxHeight = 48;

    ctx.fillStyle = "rgba(18, 22, 26, 0.92)";
    ctx.fillRect(
      x - boxWidth / 2,
      y - boxHeight / 2,
      boxWidth,
      boxHeight
    );

    // Distance
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffb020";

    ctx.fillText(
      `Distance: ${pathDistance} m`,
      x,
      y - 9
    );

    // Path length
    ctx.fillStyle = "#eef2f0";

    ctx.fillText(
      `Path: ${pathSteps} cells`,
      x,
      y + 10
    );

    ctx.restore();
  }
  
}

    // exits
        
    cfg.exits.forEach((e) => drawMarker(e.row, e.col, COLORS.exit, COLORS.exitGlow, "door"));
    cfg.exits.forEach((e) => drawExitSign(e.row, e.col));

    // user
    if (userCell) drawMarker(userCell.row, userCell.col, COLORS.user, COLORS.userGlow, "pin");
  }
    function drawExitSign(row, col) {
    // Real emergency-exit signs are green with white text. Anchor the
    // badge at the door cell, then nudge it inward off the outer wall
    // so it stays fully inside the canvas (the grid has no margin).
    let x = col * cell + cell / 2;
    let y = row * cell + cell / 2;
    const nudge = cell * 0.85;

    if (row === 0) y += nudge;               // north wall -> push down
    else if (row === cfg.rows - 1) y -= nudge; // south wall -> push up
    else if (col === 0) x += nudge;            // west wall -> push right
    else if (col === cfg.cols - 1) x -= nudge; // east wall -> push left

    const boxW = cell * 1.9;
    const boxH = cell * 0.95;
    const r = 5;

    ctx.save();

    // drop shadow so it reads as a physical sign, not flat paint
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = "#0c7a4a";
    ctx.strokeStyle = "#0a5c38";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - boxW / 2 + r, y - boxH / 2);
    ctx.arcTo(x + boxW / 2, y - boxH / 2, x + boxW / 2, y + boxH / 2, r);
    ctx.arcTo(x + boxW / 2, y + boxH / 2, x - boxW / 2, y + boxH / 2, r);
    ctx.arcTo(x - boxW / 2, y + boxH / 2, x - boxW / 2, y - boxH / 2, r);
    ctx.arcTo(x - boxW / 2, y - boxH / 2, x + boxW / 2, y - boxH / 2, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${Math.round(cell * 0.19)}px Inter, sans-serif`;
    ctx.fillText("EMERGENCY", x, y - boxH * 0.2);
    ctx.font = `800 ${Math.round(cell * 0.27)}px Inter, sans-serif`;
    ctx.fillText("EXIT", x, y + boxH * 0.22);

    ctx.restore();
  }

  function drawMarker(row, col, color, glow, kind) {
    const x = col * cell + cell / 2;
    const y = row * cell + cell / 2;
    const r = cell * 0.34;

    ctx.save();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0d1114";
    ctx.font = `bold ${Math.round(cell * 0.38)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(kind === "door" ? "⎋" : "•", x, y + 1);
    ctx.restore();
  }

  function animate() {
    pulse = (pulse + 0.6) % 18;
    drawFloorPlan();
    requestAnimationFrame(animate);
  }

  function cellFromEvent(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (evt.clientX - rect.left) * scaleX;
    const y = (evt.clientY - rect.top) * scaleY;
    return { row: Math.floor(y / cell), col: Math.floor(x / cell) };
  }

  function setError(msg) {
    resultError.textContent = msg;
    resultError.classList.remove("hidden");
    resultCard.classList.add("hidden");
    resultEmpty.classList.add("hidden");
  }

  function showResult(data) {
    resultError.classList.add("hidden");
    resultEmpty.classList.add("hidden");
    resultCard.classList.remove("hidden");

    exitName.textContent = data.exit.name;
    exitDirection.textContent = data.direction;
    exitDistance.textContent = `${data.approx_meters} m`;
    exitSteps.textContent = `${data.steps} cells`;
  }

  async function findNearestExit(row, col) {
    try {
      const res = await fetch("/api/nearest-exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ row, col }),
      });
      const data = await res.json();

      if (!data.ok) {
        currentPath = null;
        setError(data.error || "Couldn't find a route from there.");
        return;
      }

      currentPath = data.path;
      pathDistance = data.approx_meters;
      pathSteps = data.steps;
      showResult(data);
    } catch (err) {
      currentPath = null;
      setError("Couldn't reach the server. Is the Flask app running?");
    }
  }

  canvas.addEventListener("click", (evt) => {
    const { row, col } = cellFromEvent(evt);
    if (row < 0 || row >= cfg.rows || col < 0 || col >= cfg.cols) return;
    if (cfg.grid[row][col] === 1) {
      currentPath = null;
      userCell = null;
      posReadout.textContent = "that's a wall — pick open floor";
      setError("You clicked on a wall. Try an open area of the floor.");
      return;
    }

    userCell = { row, col };
    posReadout.textContent = `row ${row}, col ${col}`;
    planHint.classList.add("hidden");
    findNearestExit(row, col);
  });

  clearBtn.addEventListener("click", () => {
    userCell = null;
    currentPath = null;
    pathDistance = null;
    pathSteps = null;
    posReadout.textContent = "not set";
    planHint.classList.remove("hidden");
    resultEmpty.classList.remove("hidden");
    resultCard.classList.add("hidden");
    resultError.classList.add("hidden");
  });

  animate();
})();
