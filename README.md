![Made with JavaScript](https://forthebadge.com/images/badges/made-with-javascript.svg)

```ascii
 ██████╗ ██╗  ██╗   ██╗██████╗ ██╗  ██╗
██╔════╝ ██║  ╚██╗ ██╔╝██╔══██╗██║  ██║
██║  ███╗██║   ╚████╔╝ ██████╔╝███████║
██║   ██║██║    ╚██╔╝  ██╔═══╝ ██╔══██║
╚██████╔╝███████╗██║   ██║     ██║  ██║
 ╚═════╝ ╚══════╝╚═╝   ╚═╝     ╚═╝  ╚═╝
                                       
       by Hex (@RemiH06)          version 1.0
```

## General Description

GlyphFactory is a standalone browser-based dot matrix editor for designing pixel-art style glyphs (numbers, letters, outfit icons, weather symbols, and UI elements) following the Nothing Phone Glyph Matrix aesthetic. Built as a support tool for my [**Meteoroglyph**](https://github.com/RemiH06/Meteoroglyph) Android app project.

Glyphs are designed on customizable grids (5×5 up to 25×25), saved to a local library, and exported as structured JSON for direct integration into the app.

You can use it by clicking here: https://remih06.github.io/GlyphFactory/

```diff
+ No installation required. Open index.html with a local server and start designing
- Must be served via a local HTTP server (Live Server, Python http.server, etc.)
- Changing grid size clears the current canvas
```

## Installation

1. Clone or download this repository
2. Open the project folder in **VS Code**
3. Install the **Live Server** extension if you don't have it
4. Right-click `index.html` → **Open with Live Server**

Alternatively, serve it with Python:
```bash
python -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

## Usage

### Drawing
- **Click** or **drag** to paint dots
- **Right-click** to erase individual dots
- Use the **shift buttons** (↑ ↓ ← →) to move the pattern around the grid
- Use **↔ ↕** to flip horizontally or vertically

### Keyboard shortcuts
| Key | Action |
|-----|--------|
| `P` | Paint mode |
| `E` | Erase mode |
| `C` | Clear canvas |
| `I` | Invert canvas |
| `S` | Save current glyph |
| `↑ ↓ ← →` | Shift pattern |

### Saving & Exporting
1. Give the glyph a name (e.g. `shirt`, `num_7`, `letter_a`)
2. Select its category (number, letter, outfit, weather, transit, ui, symbol)
3. Click **guardar** or press `S`
4. Export the full library as `glyphfactory_library.json` at any time
5. Re-import previously exported libraries to keep accumulating glyphs

The library persists automatically in `localStorage` between sessions.

## Features

- Dot matrix canvas editor with 7 grid sizes (5×5 to 25×25)
- 9-color palette based on metro_theme tokens
- Adjustable dot brightness/intensity
- Shift and flip tools
- Per-glyph category tagging and filtering
- Live JSON preview with multi-scale preview strip
- Persistent local library via localStorage
- Export full library or individual glyphs as JSON
- Import and merge JSON libraries

## Future Features

- Undo / redo history
- Non-square grid support (e.g. 5×9 for tall letters)
- Animation frames (sequence of glyphs)
- PNG export per glyph
- Import PNG/SVG as reference layer