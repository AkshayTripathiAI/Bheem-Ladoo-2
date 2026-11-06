# Chota Bheem Loves Ladoo

A browser canvas game: steer Bheem around a scrolling space background, collect ladoos and avoid the Kirmada enemies that chase you.

This is a non-commercial, fan-made practice game and the follow-up to [basic-bheem-ladoo-game](https://github.com/AkshayTripathiAI/basic-bheem-ladoo-game). Characters and names belong to their respective owners; this is a non-commercial fan project. Images and audio are used for learning purposes.

**Live demo:** https://akshaytripathiai.github.io/Bheem-Ladoo-2/

## How to play

- Click **Start Game**, then move with the arrow keys (on touch screens, tap the left or right half of the screen).
- Each ladoo adds 10 points (capped at 200); the ladoo then reappears somewhere else.
- Enemies chase you with some random wobble. Touching one drains your score; at zero the game is over.
- Reaching score milestones raises the level, and enemies get faster each level.

## Features

- Full-window canvas that resizes with the browser
- Scrolling animated background, background music and an eating sound effect
- Level progression with increasing enemy speed
- All-time high score saved in `localStorage`
- Start, Game Over, Restart and Quit screens

## Tech stack

- HTML5 Canvas, CSS
- Vanilla JavaScript (no libraries, no build step)

## Run locally

```bash
git clone https://github.com/AkshayTripathiAI/Bheem-Ladoo-2.git
cd Bheem-Ladoo-2
npx serve .
```

Or open `index.html` directly in a browser. Some browsers only start audio after a click, which the Start button provides.

## Project structure

```
index.html   # start screen, canvas, game-over overlay
script.js    # game loop, movement, enemies, levels, high score
styles.css   # layout and screens
images/      # sprites and backgrounds
music/       # background music and sound effect
```

## Related projects

- [basic-bheem-ladoo-game](https://github.com/AkshayTripathiAI/basic-bheem-ladoo-game) - the original, simpler version
- [Chota-Bheem-Adventure-game](https://github.com/AkshayTripathiAI/Chota-Bheem-Adventure-game) - a jump-and-dodge runner
- [Adventure-Game](https://github.com/AkshayTripathiAI/Adventure-Game) - bundles this game (as Game 2) with the others in one page
