# Chota Bheem Loves Ladoo

A browser canvas game: steer Bheem around a scrolling space background, collect ladoos and avoid the Kirmada enemies that chase you.

This is a non-commercial, fan-made practice game and the follow-up to [basic-bheem-ladoo-game](https://github.com/AkshayTripathiAI/basic-bheem-ladoo-game). Characters and names belong to their respective owners; this is a non-commercial fan project. Images and audio are used for learning purposes.

**Live demo:** https://akshaytripathiai.github.io/Bheem-Ladoo-2/

## How to play

- Click **Start Game** (or press `Enter`).
- Move with the arrow keys or `WASD`. On touch screens (or with the mouse), press and drag: Bheem walks towards your finger.
- Each ladoo is worth `10 x level` points. Every 5th ladoo is **golden**: `50 x level` points and +1 heart (up to 5).
- Kirmadas chase you with a wobble. Touching one costs a heart (you blink briefly while invulnerable). Lose all hearts and the game is over.
- Every 5 ladoos you level up: enemies get faster and more of them appear.

| Key | Action |
|-----|--------|
| Arrows / `WASD` | Move |
| `P` / `Esc` | Pause / resume |
| `M` | Mute / unmute |
| `R` / `Enter` | Restart / start |

## Features

- Full-window canvas that resizes with the browser and stays sharp on high-DPI screens
- Scrolling space background, background music and an eating sound effect (music only starts after you press Start; mute toggle is remembered)
- Hearts, golden ladoos, level progression with a difficulty ramp and a level progress bar
- All-time high score saved in `localStorage`
- Start, pause, game-over and menu screens
- Frame-rate-independent movement (`requestAnimationFrame` + delta time)

## Tech stack

- HTML5 Canvas, CSS
- Vanilla JavaScript (no libraries, no build step)

## Run locally

```bash
git clone https://github.com/AkshayTripathiAI/Bheem-Ladoo-2.git
cd Bheem-Ladoo-2
npx serve .
```

Or open `index.html` directly in a browser.

## Project structure

```
index.html   # canvas and start / pause / game-over screens
script.js    # game loop, movement, enemies, levels, sound, high score
styles.css   # layout and screens
images/      # sprites and backgrounds
music/       # background music and sound effect
```

## Related projects

- [basic-bheem-ladoo-game](https://github.com/AkshayTripathiAI/basic-bheem-ladoo-game) - the original, simpler version
- [Chota-Bheem-Adventure-game](https://github.com/AkshayTripathiAI/Chota-Bheem-Adventure-game) - a jump-and-dodge runner
- [Adventure-Game](https://github.com/AkshayTripathiAI/Adventure-Game) - bundles this game (as Game 2) with the others in one page
