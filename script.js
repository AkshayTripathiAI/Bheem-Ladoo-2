// Chota Bheem Loves Ladoo - collect ladoos, dodge the chasing Kirmadas.
// Vanilla JS + canvas. Movement uses requestAnimationFrame + delta time,
// so speed is the same on 60 Hz and 144 Hz screens.
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $("mycanvas");
  var ctx = canvas.getContext("2d");
  var bgMusic = $("bgMusic");
  var eatSound = $("eatSound");

  var BEST_KEY = "highestScore"; // same key as earlier versions, so old high scores carry over
  var MUTE_KEY = "bheemLadoo2.muted";
  var LADOOS_PER_LEVEL = 5;
  var MAX_HEARTS = 5;

  function readStore(key, fallback) {
    try { var v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
  }
  function writeStore(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  // ---- Images ----
  function loadImage(src) { var i = new Image(); i.src = src; return i; }
  var playerImg = loadImage("images/bheem.png");
  var ladooImg = loadImage("images/ladoo.gif");
  var enemyImg = loadImage("images/kirmada.png");
  var background = loadImage("images/space.gif");
  function ready(img) { return img.complete && img.naturalWidth > 0; }

  // ---- Canvas sizing (full window, crisp on high-DPI) ----
  var W = 0, H = 0;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Keep everything on screen after a resize / rotation
    if (player) clampToScreen(player);
    if (ladoo) clampToScreen(ladoo);
    if (enemies) enemies.forEach(clampToScreen);
  }
  function clampToScreen(o) {
    o.x = Math.max(o.radius, Math.min(W - o.radius, o.x));
    o.y = Math.max(o.radius + 34, Math.min(H - o.radius, o.y));
  }
  // Sprites scale a little with screen size so phones are playable
  function unit() { return Math.max(22, Math.min(36, Math.min(W, H) / 16)); }

  // ---- State ----
  var state = "menu"; // menu | playing | paused | over
  var muted = readStore(MUTE_KEY, "0") === "1";
  var highestScore = parseInt(readStore(BEST_KEY, "0"), 10) || 0;
  var player, ladoo, enemies, score, level, hearts, ladoosEaten, invuln, floaters, bgX, shake, time;
  var keys = {};
  var touchTarget = null;

  function resetGame() {
    var r = unit();
    score = 0;
    level = 1;
    hearts = 3;
    ladoosEaten = 0;
    invuln = 0;
    shake = 0;
    time = 0;
    bgX = 0;
    floaters = [];
    player = { x: r * 2, y: H / 2, radius: r, speed: 380 };
    ladoo = { x: 0, y: 0, radius: r * 0.9, golden: false, pulse: 0 };
    placeLadoo();
    spawnEnemies();
  }

  function enemyCount() { return Math.min(3 + Math.floor((level - 1) / 2), 8); }
  function enemySpeed() { return 80 + (level - 1) * 15; }

  // Spawn enemies away from Bheem so a new level never starts with a hit
  function randomPointAwayFrom(p, minDist, r) {
    for (var tries = 0; tries < 30; tries++) {
      var x = r + Math.random() * (W - 2 * r);
      var y = r + 34 + Math.random() * (H - 2 * r - 34);
      if (Math.hypot(x - p.x, y - p.y) > minDist) return { x: x, y: y };
    }
    return { x: W - r, y: H - r };
  }

  function spawnEnemies() {
    var r = unit();
    enemies = [];
    for (var i = 0; i < enemyCount(); i++) {
      var pt = randomPointAwayFrom(player, Math.min(W, H) * 0.45, r);
      enemies.push({ x: pt.x, y: pt.y, radius: r, wobble: Math.random() * Math.PI * 2, speedMul: 0.8 + Math.random() * 0.4, delay: 1.2 });
    }
  }

  function placeLadoo() {
    var pt = randomPointAwayFrom(player, Math.min(W, H) * 0.3, ladoo.radius + 10);
    ladoo.x = pt.x;
    ladoo.y = pt.y;
    // Every 5th ladoo is golden
    ladoo.golden = (ladoosEaten + 1) % LADOOS_PER_LEVEL === 0;
  }

  function addFloater(text, x, y, color) {
    floaters.push({ text: text, x: x, y: y, life: 1.1, color: color });
  }

  // ---- Sounds (only ever started from a user gesture) ----
  function playSound(audio, restart) {
    if (muted) return;
    try {
      if (restart) audio.currentTime = 0;
      var p = audio.play();
      if (p && p.catch) p.catch(function () { /* autoplay blocked: ignore */ });
    } catch (e) { /* ignore */ }
  }

  // ---- Update ----
  function update(dt) {
    time += dt;
    if (invuln > 0) invuln -= dt;
    if (shake > 0) shake -= dt;
    bgX -= 20 * dt;

    // Player movement (keyboard or drag)
    var dx = 0, dy = 0;
    if (keys.ArrowLeft || keys.a || keys.A) dx -= 1;
    if (keys.ArrowRight || keys.d || keys.D) dx += 1;
    if (keys.ArrowUp || keys.w || keys.W) dy -= 1;
    if (keys.ArrowDown || keys.s || keys.S) dy += 1;
    if (dx || dy) {
      var len = Math.hypot(dx, dy);
      player.x += (dx / len) * player.speed * dt;
      player.y += (dy / len) * player.speed * dt;
    } else if (touchTarget) {
      var tx = touchTarget.x - player.x, ty = touchTarget.y - player.y;
      var dist = Math.hypot(tx, ty);
      var step = player.speed * dt;
      if (dist > 2) {
        player.x += (tx / dist) * Math.min(step, dist);
        player.y += (ty / dist) * Math.min(step, dist);
      }
    }
    clampToScreen(player);

    // Enemies chase Bheem with a smooth wobble
    var speed = enemySpeed();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.delay > 0) { e.delay -= dt; continue; } // freshly spawned enemies wait a moment
      e.wobble += dt * 2.5;
      var ex = player.x - e.x, ey = player.y - e.y;
      var d = Math.hypot(ex, ey) || 1;
      var angle = Math.atan2(ey, ex) + Math.sin(e.wobble) * 0.9;
      e.x += Math.cos(angle) * speed * e.speedMul * dt;
      e.y += Math.sin(angle) * speed * e.speedMul * dt;
      clampToScreen(e);

      if (invuln <= 0 && d < (player.radius + e.radius) * 0.8) {
        hearts--;
        invuln = 1.5;
        shake = 0.3;
        addFloater("-1 \u2764", player.x, player.y - player.radius, "#ff6b6b");
        // Push the enemy away so it doesn't sit on top of Bheem
        e.x -= (ex / d) * e.radius * 3;
        e.y -= (ey / d) * e.radius * 3;
        clampToScreen(e);
        if (hearts <= 0) { gameOver(); return; }
      }
    }

    // Ladoo
    ladoo.pulse += dt * 5;
    if (Math.hypot(player.x - ladoo.x, player.y - ladoo.y) < player.radius + ladoo.radius) {
      ladoosEaten++;
      var points = ladoo.golden ? 50 * level : 10 * level;
      score += points;
      addFloater("+" + points, ladoo.x, ladoo.y, ladoo.golden ? "#ffd700" : "#ffffff");
      if (ladoo.golden && hearts < MAX_HEARTS) {
        hearts++;
        addFloater("+1 \u2764", ladoo.x, ladoo.y + 24, "#ff6b6b");
      }
      playSound(eatSound, true);
      if (ladoosEaten % LADOOS_PER_LEVEL === 0) {
        level++;
        addFloater("Level " + level + "!", W / 2 - 50, H / 2, "#7CFC00");
        spawnEnemies();
      }
      placeLadoo();
    }

    for (var f = floaters.length - 1; f >= 0; f--) {
      floaters[f].life -= dt;
      floaters[f].y -= 40 * dt;
      if (floaters[f].life <= 0) floaters.splice(f, 1);
    }
  }

  // ---- Drawing ----
  function drawBackground() {
    if (!ready(background)) { ctx.fillStyle = "#111"; ctx.fillRect(0, 0, W, H); return; }
    var scale = H / background.naturalHeight;
    var bw = background.naturalWidth * scale;
    var x = bgX % bw;
    for (var px = x; px < W; px += bw) ctx.drawImage(background, px, 0, bw, H);
  }

  function drawCircleSprite(img, o, fallback) {
    if (ready(img)) ctx.drawImage(img, o.x - o.radius, o.y - o.radius, o.radius * 2, o.radius * 2);
    else { ctx.fillStyle = fallback; ctx.beginPath(); ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2); ctx.fill(); }
  }

  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    drawBackground();
    if (state !== "menu") {
      // Ladoo with a glow (golden ladoos glow brighter)
      var glow = ladoo.radius * (1.35 + Math.sin(ladoo.pulse) * 0.12);
      var g = ctx.createRadialGradient(ladoo.x, ladoo.y, ladoo.radius * 0.5, ladoo.x, ladoo.y, glow);
      g.addColorStop(0, ladoo.golden ? "rgba(255,215,0,0.8)" : "rgba(255,170,60,0.45)");
      g.addColorStop(1, "rgba(255,170,60,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(ladoo.x, ladoo.y, glow, 0, Math.PI * 2); ctx.fill();
      drawCircleSprite(ladooImg, ladoo, "#f5a623");

      for (var i = 0; i < enemies.length; i++) {
        ctx.globalAlpha = enemies[i].delay > 0 ? 0.45 : 1;
        drawCircleSprite(enemyImg, enemies[i], "#c0392b");
      }
      ctx.globalAlpha = 1;

      if (!(invuln > 0 && Math.floor(invuln * 10) % 2 === 0)) drawCircleSprite(playerImg, player, "#f39c12");

      ctx.font = "bold 20px Trebuchet MS, Arial";
      ctx.textAlign = "center";
      for (var f = 0; f < floaters.length; f++) {
        var fl = floaters[f];
        ctx.globalAlpha = Math.max(0, Math.min(1, fl.life));
        ctx.fillStyle = fl.color;
        ctx.fillText(fl.text, fl.x, fl.y);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
    }
    ctx.restore();
    if (state !== "menu") drawHud();
  }

  function drawHud() {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, W, 34);
    ctx.font = "bold 17px Trebuchet MS, Arial";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText("Score " + score, 10, 17);
    ctx.fillText("Level " + level, Math.min(140, W * 0.28), 17);
    ctx.fillStyle = "#ff6b6b";
    ctx.fillText("\u2764".repeat(hearts), Math.min(250, W * 0.5), 17);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffcc33";
    ctx.fillText("Best " + Math.max(highestScore, score), W - 10, 17);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    // Progress to next level
    var progress = (ladoosEaten % LADOOS_PER_LEVEL) / LADOOS_PER_LEVEL;
    ctx.fillStyle = "#7CFC00";
    ctx.fillRect(0, 32, W * progress, 2);
  }

  // ---- Screens ----
  var screens = ["startContainer", "pauseContainer", "gameOverContainer"];
  function show(id) { screens.forEach(function (s) { $(s).hidden = s !== id; }); }

  function startGame() {
    resetGame();
    state = "playing";
    show(null);
    last = performance.now();
    if (!muted) { bgMusic.currentTime = 0; playSound(bgMusic); }
  }

  function goToMenu() {
    state = "menu";
    bgMusic.pause();
    $("bestStart").textContent = highestScore;
    show("startContainer");
  }

  function togglePause() {
    if (state === "playing") {
      state = "paused";
      bgMusic.pause();
      show("pauseContainer");
    } else if (state === "paused") {
      state = "playing";
      show(null);
      last = performance.now();
      playSound(bgMusic);
    }
  }

  function gameOver() {
    state = "over";
    bgMusic.pause();
    var isBest = score > highestScore;
    if (isBest) { highestScore = score; writeStore(BEST_KEY, String(score)); }
    $("gameOverText").textContent = isBest ? "New High Score!" : "Game Over!";
    $("gameOverInfo").textContent = "Score " + score + " \u2022 Level " + level + " \u2022 " + ladoosEaten + " ladoos \u2022 Best " + highestScore;
    show("gameOverContainer");
  }

  function setMuted(value) {
    muted = value;
    writeStore(MUTE_KEY, muted ? "1" : "0");
    $("muteBtn").innerHTML = muted ? "&#128263;" : "&#128266;";
    if (muted) bgMusic.pause();
    else if (state === "playing") playSound(bgMusic);
  }

  // ---- Input ----
  var GAME_KEYS = { ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, " ": 1 };
  document.addEventListener("keydown", function (e) {
    if (GAME_KEYS[e.key]) e.preventDefault();
    keys[e.key] = true;
    var k = e.key.toLowerCase();
    if (k === "p" || e.key === "Escape") togglePause();
    else if (k === "m") setMuted(!muted);
    else if (e.key === "Enter" || (k === "r" && state !== "menu")) {
      if (state === "paused" && e.key === "Enter") togglePause();
      else if (state !== "playing" || k === "r") startGame();
    }
  });
  document.addEventListener("keyup", function (e) { delete keys[e.key]; });
  window.addEventListener("blur", function () {
    keys = {};
    touchTarget = null;
    if (state === "playing") togglePause();
  });

  // Touch / mouse: Bheem walks towards your finger while it is held down
  function pointerPos(e) { return { x: e.clientX, y: e.clientY }; }
  canvas.addEventListener("pointerdown", function (e) {
    if (state !== "playing") return;
    e.preventDefault();
    touchTarget = pointerPos(e);
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", function (e) { if (touchTarget) touchTarget = pointerPos(e); });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) {
    canvas.addEventListener(t, function () { touchTarget = null; });
  });

  $("startButton").addEventListener("click", startGame);
  $("restartButton").addEventListener("click", startGame);
  $("restartButton1").addEventListener("click", startGame);
  $("resumeButton").addEventListener("click", togglePause);
  $("menuButton").addEventListener("click", goToMenu);
  $("menuButton1").addEventListener("click", goToMenu);
  $("pauseBtn").addEventListener("click", function () { this.blur(); togglePause(); });
  $("muteBtn").addEventListener("click", function () { this.blur(); setMuted(!muted); });
  window.addEventListener("resize", resize);

  // ---- Main loop ----
  var last = performance.now();
  function loop(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (state === "playing") update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  bgMusic.volume = 0.5;
  $("bestStart").textContent = highestScore;
  $("muteBtn").innerHTML = muted ? "&#128263;" : "&#128266;";
  resize();
  resetGame();
  requestAnimationFrame(loop);
})();
