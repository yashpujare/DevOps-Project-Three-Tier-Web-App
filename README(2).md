# Exit Finder

A small Flask web app that finds the nearest emergency exit on a building
floor plan. The floor is modeled as a grid with walls and rooms, and the
route is computed with breadth-first search — so it routes around walls
through actual doorways instead of just measuring a straight line.

## Run it

```bash
pip install flask
python app.py
```

Then open **http://127.0.0.1:5000** in your browser.

## How to use it

Click anywhere on the floor plan to drop a pin for your position. The app
instantly calculates and draws the shortest walkable route to the nearest
of the three marked exits, along with the direction, distance, and path
length.

## Project structure

```
app.py                # Flask routes + grid/BFS pathfinding logic
templates/index.html  # Page markup
static/style.css      # Design system
static/app.js         # Canvas rendering, click handling, API calls
```

## Adapting it to a real building

- **Change the floor plan**: edit the `grid` and `EXITS` list at the top of
  `app.py`. `grid[row][col] = 1` marks a wall, `0` marks open floor.
- **Multiple floors**: wrap the grid/exits in a dict keyed by floor number
  and add a floor selector to the frontend.
- **Real-world coordinates**: if you have real GPS or indoor-positioning
  (e.g. Bluetooth beacons) data, replace the click handler in `app.js` with
  a call to `navigator.geolocation` or your positioning SDK, and convert
  those coordinates into grid cells before calling `/api/nearest-exit`.
- **Weighted routes**: BFS assumes every step costs the same. If some
  corridors should be avoided (e.g. through a hazard zone), swap the BFS in
  `bfs_from_exits` for Dijkstra with per-cell costs.
