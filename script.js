/* ============================================================
   POWER LOKA GIRLIES — main script
   Edit the CONFIG section below to customize content.
   Everything else is game logic, you don't need to touch it.
   ============================================================ */

const CONFIG = {
  // 3 tap-to-reveal messages
  messages: [
    { label: "tap", text: "miss yah saur much, my girlies 💕" },
    { label: "tap", text: "pero feel ko mas namimiss ni girlie si sir rawdem?????" },
    { label: "tap", text: "love y'all, sana mag uli na ang duwa dun tapos ma overnight ulit sa cañezal?? ✨" },
  ],

  // memories gallery
  memories: [
    { src: "memory1.jpg",  caption: "walang tapon, parehas baliw" },
    { src: "memory2.jpg",  caption: "when next cañezal overnight natin?" },
    { src: "memory3.jpg",  caption: "miss ko na si ma'am Boni" },
    { src: "memory4.jpg",  caption: "cute mo talaga girlie" },
    { src: "memory5.jpg",  caption: "aw hain na an transition taaa?!?!" },
    { src: "memory6.jpg",  caption: "aweee friendship goal" },
    { src: "memory7.jpg",  caption: "jejemon yarn HAHAHAHAHA" },
    { src: "memory8.jpg",  caption: "yaaaaaasss slayyy" },
    { src: "memory9.jpg",  caption: "pumunta lang sa karls para mag mirror shot?" },
    { src: "memory10.jpg", caption: "oh pak, smile" },
  ],

  // shop items — type is "photo" or "message"
  shopItems: [
    { id: "s1", type: "photo", name: "buksan mo papasukin ako", price: 20, src: "secret1.jpg" },
    { id: "s2", type: "message", name: "pag di mo binasa kakarmahin ka", price: 15, text: "HAHAHAHHAHAHAHAHHAA siguro naman until now di pa nyo nakakalimutan yung nawara ang shorts ko sa CR? tapos nahanlas ako tas may nakaimod san panty ko??? HAHAHAHAHHAHAHA that was so embarassing! tapos ang pirmi kita nagbabakal bopis sa may guard house? huhu ka-miss. then when ma'am Boni cought girlie na nag che-cheat sa quiz? tapos nagparahibi sa harap ni ma'am? awweeee cute dog HAHAHAHHAHAHAAHAH. tapos ang nag confess ako kan ma'am Mayla then dire ako pinansin pagkaaga? HAHAHAHAHAHHAHA kahiya yun letche. tapos ang nag irihi ako sa pants ko kay inkukulbaan ako mag report????? HAHAHAHAHHAHAHAHAHAHA i kenatttftt. hayssss tara, balik SHS?????" },
    { id: "s3", type: "photo", name: "buksan mo papasukin ako", price: 35, src: "secret2.jpg" },
    { id: "s4", type: "message", name: "oh, nag effort ka naman basahin", price: 30, text: "yadi pa, ang naimod ko ang bulbol ni girlie kay dire nag la-lock san cr? HAHAHAHHAHAHAHAHHAHAHAHAHAHAHAHAHHAHA tas pagksaga nag shave na? cuteeeee dapat hinatag mo kunta saako ang ginupit mo para na keep ko????? tapos ang pag ano ni sir Rawdem saato? HAAHAHAHAHAHAHAH yata saging na brown? mataba ba yan sirch? emeeeee!" },
  ],

  leafGame: {
    roundSeconds: 25,
    spawnIntervalMs: 700,
    pointsPerLeaf: 1,
  },
};

/* ------------------ placeholder images (fallback if real files missing) ------------------ */
function makePlaceholder(label, bg1, bg2) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/>
    </linearGradient></defs>
    <rect width="400" height="400" fill="url(#g)"/>
    <text x="50%" y="50%" font-family="sans-serif" font-size="26" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`;
  return "data:image/svg+xml;base64," + btoa(svg);
}
window.PLG_PLACEHOLDER_GROUP = makePlaceholder("add group-photo.jpg", "#A13D5C", "#5C1A2E");
const PLACEHOLDER_MEMORY = makePlaceholder("add photo", "#E8879F", "#A13D5C");
const PLACEHOLDER_SHOP = makePlaceholder("add photo", "#D9A566", "#A13D5C");

/* ------------------ points storage ------------------ */
const Points = {
  get() { return parseInt(localStorage.getItem("plg_points") || "0", 10); },
  set(v) {
    localStorage.setItem("plg_points", String(v));
    document.querySelectorAll("#points-display, #shop-points-display").forEach(el => el.textContent = v);
  },
  add(n) { this.set(this.get() + n); },
  spend(n) { this.set(this.get() - n); },
};

function getUnlocked() {
  return JSON.parse(localStorage.getItem("plg_unlocked") || "[]");
}
function unlock(id) {
  const arr = getUnlocked();
  if (!arr.includes(id)) { arr.push(id); localStorage.setItem("plg_unlocked", JSON.stringify(arr)); }
}

/* ------------------ toast ------------------ */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ------------------ navigation ------------------ */
function goToScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
document.querySelectorAll("[data-target]").forEach(btn => {
  btn.addEventListener("click", () => goToScreen(btn.dataset.target));
});

/* ============================================================
   1. MATCHING GAME
   ============================================================ */
(function initMatchGame() {
  const icons = ["💖", "⭐", "🌙", "💎", "🌸", "🦋"];
  const deck = [...icons, ...icons]
    .map(v => ({ v, key: Math.random() }))
    .sort((a, b) => a.key - b.key);

  const grid = document.getElementById("card-grid");
  const moveCountEl = document.getElementById("move-count");
  let first = null, second = null, lock = false, moves = 0, matchedCount = 0;

  deck.forEach((card, i) => {
    const el = document.createElement("div");
    el.className = "match-card";
    el.dataset.value = card.v;
    el.dataset.index = i;
    el.textContent = "";
    el.addEventListener("click", () => flip(el));
    grid.appendChild(el);
  });

  function flip(el) {
    if (lock || el.classList.contains("flipped") || el.classList.contains("matched")) return;
    el.classList.add("flipped");
    el.textContent = el.dataset.value;

    if (!first) { first = el; return; }
    second = el;
    moves++;
    moveCountEl.textContent = moves;
    lock = true;

    if (first.dataset.value === second.dataset.value) {
      first.classList.add("matched");
      second.classList.add("matched");
      matchedCount += 2;
      first = null; second = null; lock = false;
      if (matchedCount === deck.length) onGameComplete();
    } else {
      setTimeout(() => {
        first.classList.remove("flipped"); first.textContent = "";
        second.classList.remove("flipped"); second.textContent = "";
        first = null; second = null; lock = false;
      }, 700);
    }
  }

  function onGameComplete() {
    document.getElementById("screen-congrats").classList.add("active");
  }

  document.getElementById("skip-game").addEventListener("click", onGameComplete);
})();

document.getElementById("congrats-continue").addEventListener("click", () => {
  document.getElementById("screen-congrats").classList.remove("active");
  goToScreen("screen-reveal");
});

/* ============================================================
   2. REVEAL SCREEN — swipe up or tap to continue
   ============================================================ */
(function initSwipe() {
  const screen = document.getElementById("screen-reveal");
  const hint = document.getElementById("swipe-hint");
  let startY = null;

  screen.addEventListener("touchstart", e => { startY = e.touches[0].clientY; });
  screen.addEventListener("touchend", e => {
    if (startY === null) return;
    const endY = e.changedTouches[0].clientY;
    if (startY - endY > 60) goToScreen("screen-dashboard");
    startY = null;
  });
  hint.addEventListener("click", () => goToScreen("screen-dashboard"));
})();

/* ============================================================
   3. DASHBOARD points display init
   ============================================================ */
Points.set(Points.get());

/* ============================================================
   4. MUSIC
   ============================================================ */
(function initMusic() {
  const audio = document.getElementById("bg-music");
  const btn = document.getElementById("play-pause-btn");
  const vinyl = document.getElementById("vinyl");
  const fill = document.getElementById("progress-fill");

  function updateProgress() {
    if (!audio.duration) return;
    fill.style.width = (audio.currentTime / audio.duration * 100) + "%";
  }
  audio.addEventListener("timeupdate", updateProgress);

  btn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => showToast("add your mp3 to assets/audio/song.mp3 first!"));
      btn.textContent = "⏸";
      vinyl.classList.add("spinning");
    } else {
      audio.pause();
      btn.textContent = "▶";
      vinyl.classList.remove("spinning");
    }
  });
})();

/* ============================================================
   5. MESSAGES
   ============================================================ */
(function initMessages() {
  const list = document.getElementById("message-list");
  const numColors = ["num-1","num-2","num-3"];
  CONFIG.messages.forEach((m, i) => {
    const item = document.createElement("div");
    item.className = "message-item";
    item.innerHTML = `
      <div class="msg-top">
        <div class="msg-num ${numColors[i] || "num-1"}">${i+1}</div>
        <div class="msg-preview">
          <div class="msg-label">message #${i+1}</div>
          <div class="msg-hint">tap to open 💌</div>
        </div>
        <span class="msg-chevron">⌄</span>
      </div>
      <div class="message-body">${m.text}</div>
    `;
    item.addEventListener("click", () => item.classList.toggle("opened"));
    list.appendChild(item);
  });
})();

/* ============================================================
   6. MEMORIES + LIGHTBOX
   ============================================================ */
(function initMemories() {
  const grid = document.getElementById("memories-grid");
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const lbCap = document.getElementById("lightbox-caption");

  CONFIG.memories.forEach((mem, i) => {
    const card = document.createElement("div");
    card.className = "memory-card";
    card.innerHTML = `
      <img src="${mem.src}" onerror="this.onerror=null;this.src='${PLACEHOLDER_MEMORY}'" alt="memory ${i+1}">
      <div class="memory-card-info">
        <div class="memory-card-num">photo ${i+1}</div>
        <div class="memory-card-caption">${mem.caption}</div>
      </div>
    `;
    card.addEventListener("click", () => {
      lbImg.style.display = "block";
      lbImg.src = card.querySelector("img").src;
      lbCap.textContent = mem.caption;
      lightbox.classList.add("active");
    });
    grid.appendChild(card);
  });

  document.getElementById("lightbox-close").addEventListener("click", () => lightbox.classList.remove("active"));
  lightbox.addEventListener("click", e => { if (e.target === lightbox) lightbox.classList.remove("active"); });
})();

/* ============================================================
   7. LEAF-CATCH GAME
   ============================================================ */
(function initLeafGame() {
  const area = document.getElementById("game-area");
  const basket = document.getElementById("basket");
  const timerEl = document.getElementById("game-timer");
  const scoreEl = document.getElementById("game-score");
  let basketX = 0, dragging = false, spawnTimer = null, tickTimer = null, score = 0, timeLeft = 0;
  let leaves = [];
  let rafId = null;

  function resetBasketPosition() {
    basketX = area.clientWidth / 2 - 35;
    basket.style.left = basketX + "px";
  }

  function onPointerDown(e) { dragging = true; }
  function onPointerMove(e) {
    if (!dragging) return;
    const rect = area.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    basketX = Math.min(Math.max(clientX - rect.left - 35, 0), area.clientWidth - 70);
    basket.style.left = basketX + "px";
  }
  function onPointerUp() { dragging = false; }

  area.addEventListener("mousedown", onPointerDown);
  area.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", onPointerUp);
  area.addEventListener("touchstart", e => { dragging = true; onPointerMove(e); }, { passive: true });
  area.addEventListener("touchmove", onPointerMove, { passive: true });
  area.addEventListener("touchend", onPointerUp);

  function spawnLeaf() {
    const leaf = document.createElement("div");
    leaf.className = "leaf";
    leaf.textContent = "🍂";
    leaf.style.left = Math.random() * (area.clientWidth - 26) + "px";
    leaf.style.top = "-30px";
    area.appendChild(leaf);
    leaves.push({ el: leaf, y: -30, speed: 1.5 + Math.random() * 1.8 });
  }

  function loop() {
    const basketRect = { left: basketX, right: basketX + 70, top: area.clientHeight - 100, bottom: area.clientHeight - 46 };
    leaves.forEach(l => {
      l.y += l.speed;
      l.el.style.top = l.y + "px";
    });
    leaves = leaves.filter(l => {
      const leafLeft = parseFloat(l.el.style.left);
      const caught = l.y + 26 >= basketRect.top && l.y <= basketRect.bottom &&
                     leafLeft + 26 >= basketRect.left && leafLeft <= basketRect.right;
      if (caught) {
        score++;
        scoreEl.textContent = score;
        l.el.remove();
        return false;
      }
      if (l.y > area.clientHeight) { l.el.remove(); return false; }
      return true;
    });
    rafId = requestAnimationFrame(loop);
  }

  function startGame() {
    score = 0; scoreEl.textContent = 0;
    timeLeft = CONFIG.leafGame.roundSeconds;
    timerEl.textContent = timeLeft;
    leaves.forEach(l => l.el.remove());
    leaves = [];
    resetBasketPosition();
    goToScreen("screen-game");
    spawnTimer = setInterval(spawnLeaf, CONFIG.leafGame.spawnIntervalMs);
    tickTimer = setInterval(() => {
      timeLeft--;
      timerEl.textContent = timeLeft;
      if (timeLeft <= 0) endGame();
    }, 1000);
    rafId = requestAnimationFrame(loop);
  }

  function endGame() {
    clearInterval(spawnTimer);
    clearInterval(tickTimer);
    cancelAnimationFrame(rafId);
    leaves.forEach(l => l.el.remove());
    leaves = [];
    const earned = score * CONFIG.leafGame.pointsPerLeaf;
    Points.add(earned);
    document.getElementById("points-earned-count").textContent = earned;
    goToScreen("screen-gameover");
  }

  document.getElementById("start-leaf-game").addEventListener("click", startGame);
  document.getElementById("play-again-btn").addEventListener("click", startGame);
  window.addEventListener("resize", resetBasketPosition);
})();

/* ============================================================
   8. SHOP
   ============================================================ */
(function initShop() {
  const list = document.getElementById("shop-list");

  function render() {
    list.innerHTML = "";
    const unlocked = getUnlocked();
    CONFIG.shopItems.forEach(item => {
      const isUnlocked = unlocked.includes(item.id);
      const row = document.createElement("div");
      row.className = "shop-item" + (isUnlocked ? " unlocked" : "");
      const iconClass = isUnlocked ? "icon-unlocked" : (item.type === "photo" ? "icon-photo" : "icon-letter");
      const iconEmoji = isUnlocked ? "🔓" : (item.type === "photo" ? "📷" : "💌");
      row.innerHTML = `
        ${isUnlocked ? '<div class="ribbon">unlocked ✓</div>' : ""}
        <div class="shop-item-left">
          <div class="shop-icon ${iconClass}">${iconEmoji}</div>
          <div class="shop-item-info">
            <div class="shop-name">${item.name}</div>
            <div class="shop-price ${isUnlocked ? "unlocked-tag" : ""}">
              ${isUnlocked ? "✓ owned · tap to view" : "✨ " + item.price + " pts"}
            </div>
          </div>
        </div>
        <button class="buy-btn ${isUnlocked ? "view-btn" : ""}">${isUnlocked ? "view" : "buy"}</button>
      `;
      const buyBtn = row.querySelector(".buy-btn");
      buyBtn.addEventListener("click", () => handleBuy(item, isUnlocked));
      list.appendChild(row);
    });
  }

  function handleBuy(item, alreadyUnlocked) {
    if (alreadyUnlocked) { reveal(item); return; }
    if (Points.get() < item.price) {
      showToast("insufficient balance 😭 play more games to earn points!");
      return;
    }
    Points.spend(item.price);
    unlock(item.id);
    showToast("success! item unlocked 🎉");
    render();
    reveal(item);
  }

  function reveal(item) {
    const lightbox = document.getElementById("lightbox");
    const lbImg = document.getElementById("lightbox-img");
    const lbCap = document.getElementById("lightbox-caption");
    if (item.type === "photo") {
      lbImg.style.display = "block";
      lbImg.src = item.src;
      lbImg.onerror = () => { lbImg.onerror = null; lbImg.src = PLACEHOLDER_SHOP; };
      lbCap.textContent = item.name;
    } else {
      lbImg.style.display = "none";
      lbCap.textContent = item.text;
    }
    lightbox.classList.add("active");
  }

  document.getElementById("go-shop-btn").addEventListener("click", () => { render(); goToScreen("screen-shop"); });
  render();
})();