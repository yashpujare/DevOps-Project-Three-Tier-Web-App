"""
Emergency Exit Finder
----------------------
A small Flask app that models a building floor as a grid, lets a user
place their position by clicking on the floor plan, and returns the
nearest emergency exit found via breadth-first search (so walls/rooms
are actually routed around, not just measured as straight-line distance).
"""

from collections import deque
from flask import Flask, jsonify, render_template, request
from database import get_exits, save_evacuation_log

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Floor plan definition
# ---------------------------------------------------------------------------

ROWS, COLS = 14, 20
CELL_SIZE = 40

# 0 = walkable floor
# 1 = wall / obstacle

grid = [[0 for _ in range(COLS)] for _ in range(ROWS)]


# ---------------------------------------------------------------------------
# Outer building walls
# ---------------------------------------------------------------------------

for c in range(COLS):
    grid[0][c] = 1
    grid[ROWS - 1][c] = 1

for r in range(ROWS):
    grid[r][0] = 1
    grid[r][COLS - 1] = 1


# ---------------------------------------------------------------------------
# TOP SECTION
#
# Office 1 | Meeting Room | Office 2
# ---------------------------------------------------------------------------

# Wall between Office 1 and Meeting Room
for r in range(1, 6):
    if r != 3:          # doorway
        grid[r][6] = 1


# Wall between Meeting Room and Office 2
for r in range(1, 6):
    if r != 3:          # doorway
        grid[r][13] = 1


# ---------------------------------------------------------------------------
# MAIN CENTRAL CORRIDOR
#
# This wall separates the top rooms from the lower rooms.
# Door gaps allow BFS to move between sections.
# ---------------------------------------------------------------------------

for c in range(1, 19):

    # Door openings
    if c not in [3, 9, 16]:
        grid[6][c] = 1


# ---------------------------------------------------------------------------
# BOTTOM SECTION
#
# Cafeteria | Server Room | Washroom
# ---------------------------------------------------------------------------

# Wall between Cafeteria and Server Room
for r in range(7, 13):
    if r != 10:         # doorway
        grid[r][6] = 1


# Wall between Server Room and Washroom
for r in range(7, 13):
    if r != 10:         # doorway
        grid[r][13] = 1


# ---------------------------------------------------------------------------
# Emergency exits
# ---------------------------------------------------------------------------

# Get emergency exits from MySQL
EXITS = get_exits()


# Make exit cells walkable
for e in EXITS:
    grid[e["row"]][e["col"]] = 0

def in_bounds(r, c):
    return 0 <= r < ROWS and 0 <= c < COLS


def is_walkable(r, c):
    return in_bounds(r, c) and grid[r][c] == 0


def bfs_from_exits(start_r, start_c):
    """
    Multi-source BFS seeded at every exit simultaneously. The first
    exit whose search frontier reaches the user's cell is the nearest
    one by walking distance, and we can reconstruct the path back to it.
    """
    if not is_walkable(start_r, start_c):
        return None

    visited = [[False] * COLS for _ in range(ROWS)]
    parent = {}
    source_of = {}
    q = deque()

    for e in EXITS:
        r, c = e["row"], e["col"]
        if is_walkable(r, c):
            visited[r][c] = True
            source_of[(r, c)] = e["id"]
            q.append((r, c))

    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    while q:
        r, c = q.popleft()
        if (r, c) == (start_r, start_c):
            # Reconstruct path from user's cell back to the exit
            path = [(r, c)]
            cur = (r, c)
            while cur in parent:
                cur = parent[cur]
                path.append(cur)
            path.reverse()  # exit -> user
            steps = len(path) - 1
            return {
                "exit_id": source_of[path[0]],
                "path": path,
                "steps": steps,
            }
        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if is_walkable(nr, nc) and not visited[nr][nc]:
                visited[nr][nc] = True
                parent[(nr, nc)] = (r, c)
                source_of[(nr, nc)] = source_of[(r, c)]
                q.append((nr, nc))

    return None


def compass_direction(from_rc, to_rc):
    """Rough 8-point compass direction from the user's cell toward the exit."""
    dr = to_rc[0] - from_rc[0]  # positive = south (down the grid)
    dc = to_rc[1] - from_rc[1]  # positive = east (right)

    ns = "south" if dr > 1 else "north" if dr < -1 else ""
    ew = "east" if dc > 1 else "west" if dc < -1 else ""

    if ns and ew:
        return f"{ns}-{ew}"
    return ns or ew or "here"


@app.route("/")
def index():
    return render_template(
        "index.html",
        rows=ROWS,
        cols=COLS,
        cell_size=CELL_SIZE,
        grid=grid,
        exits=EXITS,
    )


@app.route("/api/nearest-exit", methods=["POST"])
def nearest_exit():
    data = request.get_json(silent=True) or {}
    row, col = data.get("row"), data.get("col")

    if row is None or col is None:
        return jsonify({"ok": False, "error": "Missing row/col."}), 400
    if not in_bounds(row, col):
        return jsonify({"ok": False, "error": "Position is outside the floor plan."}), 400
    if not is_walkable(row, col):
        return jsonify({"ok": False, "error": "That spot is a wall — click on open floor."}), 400

    result = bfs_from_exits(row, col)
    if result is None:
        return jsonify({"ok": False, "error": "No reachable exit was found from that position."}), 404

    exit_info = next(e for e in EXITS if e["id"] == result["exit_id"])
    direction = compass_direction((row, col), (exit_info["row"], exit_info["col"]))
    distance = round(result["steps"] * 1.2, 1)

    save_evacuation_log(
    row,
    col,
    exit_info["name"],
    distance
)

    return jsonify({
    "ok": True,
    "exit": exit_info,
    "steps": result["steps"],
    "approx_meters": distance,
    "direction": direction,
    "path": [{"row": r, "col": c} for r, c in result["path"]]
})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
