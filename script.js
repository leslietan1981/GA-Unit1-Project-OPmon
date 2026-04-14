class MazeTile {
  #styles = ["maze-path", "maze-wall", "maze-tomb-space", "maze-tomb-exit"];
  #rowIndex = -1;
  #columnIndex = -1;
  #element = null;
  #typeID = 0;
  #player = null;
  #collectible = null;
  #ghosts = [];

  constructor(rowIndex, columnIndex, typeID = 0) {
    this.#rowIndex = rowIndex;
    this.#columnIndex = columnIndex;
    this.#element = document.createElement("div");
    this.#typeID = typeID;

    this.#element.id = `tile-${rowIndex}-${columnIndex}`;
    this.#element.classList.add(this.#styles[this.#typeID]);
  }

  get isPath() {
    return this.#typeID === 0;
  }

  get isTombExit() {
    return this.#typeID === 3;
  }

  get element() {
    return this.#element;
  }

  get player() {
    return this.#player;
  }

  get collectible() {
    return this.#collectible;
  }

  hasCollectible() {
    return this.#collectible !== null;
  }

  hasGhost() {
    return this.#ghosts.length > 0;
  }

  getPosition() {
    return [this.#rowIndex, this.#columnIndex];
  }

  addPlayer(player) {
    this.#player = player;
    this.#element.append(player.element);
  }

  removePlayer() {
    if (this.#player) {
      this.#player.element.remove();
      this.#player = null;
    }
  }

  addCollectible(collectible) {
    this.#collectible = collectible;
    this.#element.prepend(collectible.element);
  }

  removeCollectible() {
    if (this.#collectible) {
      this.#collectible.element.remove();
      this.#collectible = null;
    }
  }

  addGhost(ghost) {
    if (!this.#ghosts.includes(ghost)) {
      this.#ghosts.push(ghost);
      this.#element.append(ghost.element);
    }
  }

  removeGhost(ghost) {
    const ghostIdx = this.#ghosts.indexOf(ghost);
    if (ghostIdx != -1) {
      this.#ghosts.splice(ghostIdx, 1);
      ghost.element.remove();
      return true;
    }
    return false;
  }

  removeAllGhosts() {
    const removed = [];
    for (const ghost of this.#ghosts) {
      if (this.removeGhost(ghost)) {
        removed.push(ghost);
      }
    }
    return removed;
  }

  addAvatar(avatar) {
    switch (true) {
      case avatar instanceof Player:
        this.addPlayer(avatar);
        break;
      case avatar instanceof Ghost:
        this.addGhost(avatar);
        break;
    }
  }

  removeAvatar(avatar) {
    switch (true) {
      case avatar instanceof Player:
        this.removePlayer();
        break;
      case avatar instanceof Ghost:
        this.removeGhost(avatar);
        break;
    }
  }
}

class AvatarBase {
  #eyeStateStyles = ["eye-state-up", "eye-state-left", "eye-state-down", "eye-state-right"];

  #eyeChar = "";
  #eyes = [];

  #element = null;
  #direction = -1;

  tile = null;

  constructor(baseStyle, eyeStyle, eyeChar) {
    this.#element = document.createElement("div");
    this.#element.classList.add(baseStyle);

    const createEye = () => {
      const eye = document.createElement("div");
      eye.classList.add(eyeStyle);
      eye.textContent = eyeChar;
      return eye;
    };

    this.#eyeChar = eyeChar;
    this.#eyes.push(createEye(), createEye());
    this.#element.append(...this.#eyes);
  }

  get element() {
    return this.#element;
  }

  get direction() {
    return this.#direction;
  }

  updateDirection(direction = -1) {
    this.#element.classList.remove(...this.#eyeStateStyles);
    this.#direction = direction;
    if (direction >= 0 && direction < this.#eyeStateStyles.length) {
      this.#element.classList.add(this.#eyeStateStyles[direction]);
    } else {
      this.#direction = -1;
    }
  }

  setDisplayedEyes(eyeChar) {
    for (const eye of this.#eyes) {
      eye.textContent = eyeChar;
    }
  }

  resetDisplayedEyes() {
    for (const eye of this.#eyes) {
      eye.textContent = this.#eyeChar;
    }
  }
}

class Player extends AvatarBase {
  #additionalStyles = {
    limbo: "player-recovery",
    dead: "player-dead",
    powerUps: ["player-power-ghost-hunter"],
  };
  #blinkInterval = 100;
  #blinkDuration = 1500;
  #isAlive = true;
  #reviveTimeoutID = null;
  #blinkObj = {
    intervalID: null,
    timeoutID: null,
    styleToRemove: null,
  };
  #powerTimeoutID = null;

  #powerUps = {};

  constructor() {
    super("player-base", "player-eye", "●");
  }

  get isAlive() {
    return this.#isAlive;
  }

  #removeAllAdditionalStyles() {
    for (const { styleKey, styleValue } of Object.entries(this.#additionalStyles)) {
      if (styleKey === "powerUps") {
        for (const powerUpStyle of styleValue) {
          this.element.classList.remove(powerUpStyle);
        }
      } else {
        this.element.classList.remove(styleValue);
      }
    }
  }

  setAlive() {
    clearTimeout(this.#reviveTimeoutID);
    this.#stopCurrentBlink();

    this.#isAlive = true;
    this.resetDisplayedEyes();
    this.#removeAllAdditionalStyles();
  }

  setDead() {
    clearTimeout(this.#reviveTimeoutID);
    this.#stopCurrentBlink();

    this.#isAlive = false;
    this.setDisplayedEyes("x");
    this.element.classList.add(this.#additionalStyles.dead);
  }

  setLimbo() {
    clearTimeout(this.#reviveTimeoutID);
    this.#stopCurrentBlink();

    this.#isAlive = false;
    this.element.classList.add(this.#additionalStyles.limbo);
  }

  revive(delayMs = 0) {
    clearTimeout(this.#reviveTimeoutID);
    this.#stopCurrentBlink();

    if (delayMs > 0) {
      this.#reviveTimeoutID = setTimeout(
        () => {
          this.#blinkFor(
            this.#additionalStyles.limbo,
            delayMs > this.#blinkDuration ? this.#blinkDuration : delayMs,
            () => this.setAlive(),
          );
          this.#reviveTimeoutID = null;
        },
        Math.max(0, delayMs - this.#blinkDuration),
      );
    } else {
      this.setAlive();
    }
  }

  #stopCurrentBlink() {
    clearTimeout(this.#blinkObj.timeoutID);
    clearInterval(this.#blinkObj.intervalID);
    this.element.classList.remove(this.#blinkObj.style);
    this.#blinkObj.timeoutID = null;
    this.#blinkObj.intervalID = null;
    this.#blinkObj.callback = null;
    this.#blinkObj.style = null;
  }

  #blinkFor(styleToRemove, duration, callback) {
    this.#stopCurrentBlink();

    this.#blinkObj.styleToRemove = styleToRemove;
    this.#blinkObj.callback = callback;
    this.#blinkObj.intervalID = setInterval(() => {
      this.element.classList.toggle(styleToRemove);
    }, this.#blinkInterval);

    this.#blinkObj.timeoutID = setTimeout(() => {
      this.#blinkObj.timeoutID = null;
      clearInterval(this.#blinkObj.intervalID);
      this.#blinkObj.intervalID = null;
      callback();
    }, duration);
  }

  addPower(powerType, levelUp = false) {
    clearTimeout(this.#powerTimeoutID);
    this.#stopCurrentBlink();

    this.#powerUps[powerType] = this.#powerUps[powerType] ?? 1;
    if (levelUp) {
      this.increasePowerLevel(powerType);
    }

    this.element.classList.add(this.#additionalStyles.powerUps[powerType]);
  }

  removePower(powerType, delayMs = 0) {
    clearTimeout(this.#powerTimeoutID);
    this.#stopCurrentBlink();

    const removeFn = () => {
      delete this.#powerUps[powerType];
      this.element.classList.remove(this.#additionalStyles.powerUps[powerType]);
    };

    if (delayMs > 0) {
      this.#powerTimeoutID = setTimeout(
        () => {
          this.#blinkFor(
            this.#additionalStyles.powerUps[powerType],
            delayMs > this.#blinkDuration ? this.#blinkDuration : delayMs,
            () => removeFn(),
          );
          this.#powerTimeoutID = null;
        },
        Math.max(0, delayMs - this.#blinkDuration),
      );
    } else {
      removeFn();
    }
  }

  increasePowerLevel(powerType) {
    if (this.#powerUps[powerType]) {
      this.#powerUps[powerType]++;
    }
  }

  hasPowerType(powerType) {
    return this.#powerUps[powerType] ?? 0;
  }
}

class Ghost extends AvatarBase {
  #maxMoveTicks = 5;
  #maxIdleTicks = 2;
  #ticksLeft = 0;
  #timerIDs = {};
  #value = 200;

  constructor() {
    super("ghost-base", "ghost-eye", "▼");
  }

  get value() {
    return this.#value;
  }

  tick() {
    return --this.#ticksLeft <= 0;
  }

  setMoveTick() {
    this.#ticksLeft = Math.ceil(Math.random() * this.#maxMoveTicks);
  }

  setIdleTick() {
    this.#ticksLeft = Math.ceil(Math.random() * this.#maxIdleTicks);
  }

  setAlive(thoughtInterval, callbackAction, ...args) {
    const intervalID = setInterval(callbackAction, thoughtInterval, ...args);
    this.#timerIDs[intervalID] = true;
  }

  kill() {
    for (const timerID in this.#timerIDs) {
      clearInterval(timerID);
    }
  }
}

class Collectible {
  #element = null;
  #value = 0;

  tile = null;

  constructor(style, char, value) {
    this.#element = document.createElement("div");
    this.#element.classList.add(style);
    this.#element.textContent = char;
    this.#value = value;
  }

  get value() {
    return this.#value;
  }

  get element() {
    return this.#element;
  }
}

class Gem extends Collectible {
  constructor() {
    super("collectible-gem", "♦︎", 10);
  }
}

class PowerUp extends Collectible {
  #duration = 0;
  #powerType = 0;

  constructor({ powerType, duration }) {
    super("collectible-powerup", "⚡︎", 100);
    this.#duration = duration;
    this.#powerType = powerType;
  }

  get duration() {
    return this.#duration;
  }

  get powerType() {
    return this.#powerType;
  }
}

// ---------- End of Classes ----------
// ------------------------------------

// -- Hud Containers --
const playerHealthContainer = document.querySelector("#player-health");
const playerScoreContainer = document.querySelector("#player-score");
const playerScoreZeroPrefixContainer = document.querySelector(".score-zero-prefix");
const playerScoreCurrentContainer = document.querySelector(".score-current");
const elapsedGameTimeContainer = document.querySelector("#elapsed-game-time");

// -- Game Screen Containers --
const gameSplashContainer = document.querySelector("#game-splash");
const gameOverContainer = document.querySelector("#game-over");
const gameCountdownContainer = document.querySelector("#game-countdown");

const mazeContainer = document.querySelector("#maze");

const gameScreenShowStyle = "game-screen-show";
const gameCountdownShowStyle = "game-countdown-show";

let countdownTimerID = null;

const mazeSize = { rows: 13, columns: 21 };
const mazeTiles = [];

const player = new Player();
const directionalKeys = ["w", "a", "s", "d"];
let directionalKeysDown = 0;
const moveKeys = ["o", "p"];
let lastMoveKey = "";

let ghostSpawningTile = null;
const ghosts = [new Ghost(), new Ghost(), new Ghost(), new Ghost(), new Ghost()];
const availableGhosts = [];
const ghostSpawnInterval = 5 * 1000;
const ghostDecisionInterval = 200;
let lastGhostTimestamp = -1;

const gems = [];
const gemCoolDownDuration = 5 * 1000;
const removedGems = [];
let lastGemTimestamp = -1;

const powerUpsConfig = [{ powerType: 0, duration: 5 * 1000 }];
const powerUpKey = "powerup";
const powerUpTiles = [];
const powerUps = [];
const powerUpCoolDownDuration = 10 * 1000;
const removedPowerUps = [];
let lastPowerUpTimestamp = -1;

const playerLifeStyle = "player-base";
const playerMaxLives = 3;
const playerRevivalDelay = 4 * 1000;
const playerLives = [];

const gameUpdateInterval = 200;
const gameSessionIDs = {};
const gamePowerTimeoutIDs = { 0: null };

const gameScoreDefaultString = "0000000";

let isPlaying = false;
let currentPlayerHealth = 0;
let currentScore = 0;
let gameStartTime = 0;
let elapsedTime = 0;

// ---------- Game Creation ----------

const buildMaze = () => {
  for (let i = 0; i < mazeLevelData.length; i++) {
    const rowTiles = [];
    mazeTiles.push(rowTiles);
    for (let j = 0; j < mazeLevelData[i].length; j++) {
      const info = mazeLevelData[i][j];
      const tile = new MazeTile(i, j, info.type);
      rowTiles.push(tile);
      mazeContainer.appendChild(tile.element);

      if (tile.isTombExit) {
        ghostSpawningTile = mazeTiles[i - 1][j];
      }

      if (powerUpKey in info) {
        powerUpTiles.push([tile, info[powerUpKey]]);
      }
    }
  }
};

const createPowerUps = () => {
  for (const [tile, powerType] of powerUpTiles) {
    const powerup = new PowerUp(powerUpsConfig[powerType]);
    tile.addCollectible(powerup);
    powerup.tile = tile;
    powerUps.push(powerup);
  }
};

const createGems = () => {
  for (const rowTiles of mazeTiles) {
    for (const tile of rowTiles) {
      if (tile.isPath && !tile.hasCollectible()) {
        const gem = new Gem();
        tile.addCollectible(gem);
        gem.tile = tile;
        gems.push(gem);
      }
    }
  }
};

const createPlayerHealth = () => {
  for (let i = 0; i < playerMaxLives; i++) {
    const playerLife = new Player();
    playerLives.push(playerLife);
  }
};

const buildGame = () => {
  buildMaze();
  createPowerUps();
  createGems();
  createPlayerHealth();
};

// ---------- Game Logic ----------

const checkPathInDirection = (srcTile, direction, steps = 1) => {
  if (srcTile && direction > -1) {
    let [rowIdx, colIdx] = srcTile.getPosition();
    if (direction % 2 === 0) {
      rowIdx += (direction - 1) * steps;
    } else {
      colIdx += (direction - 2) * steps;
    }
    if (rowIdx >= 0 && rowIdx < mazeSize.rows && colIdx >= 0 && colIdx < mazeSize.columns) {
      const destinationTile = mazeTiles[rowIdx][colIdx];
      return destinationTile.isPath ? destinationTile : null;
    }
  }
  return null;
};

const getAvailablePathsFromTile = (tile) => {
  const availablePaths = [];
  if (tile) {
    for (let direction = 0; direction < 4; direction++) {
      const destTile = checkPathInDirection(tile, direction);
      if (destTile) {
        availablePaths.push([direction, destTile]);
      }
    }
  }
  return availablePaths;
};

const spawnGhost = () => {
  const ghost = availableGhosts.shift();
  ghostSpawningTile.addGhost(ghost);
  ghost.tile = ghostSpawningTile;
  ghost.setAlive(ghostDecisionInterval, ghostDecision, ghost);
  getAvailablePathsFromTile(ghost.tile);
  lastGhostTimestamp = Date.now();
  checkTile(ghostSpawningTile);
};

const checkGhosts = () => {
  if (availableGhosts.length > 0) {
    if (lastGhostTimestamp === -1 || (Date.now() - lastGhostTimestamp) / ghostSpawnInterval >= 1) {
      spawnGhost();
    }
  }
};

const ghostDecision = (ghost) => {
  if (!ghost.tick()) {
    let newDirection = -1;
    if (Math.floor(Math.random() * 10) > 2) {
      const availableTiles = getAvailablePathsFromTile(ghost.tile);
      const [direction, tile] = availableTiles[Math.floor(Math.random() * availableTiles.length)];
      newDirection = direction;
      moveAvatarTo(ghost, tile);
    }
    ghost.updateDirection(newDirection);
    newDirection !== -1 ? ghost.setMoveTick() : ghost.setIdleTick();
  } else {
    const destinationTile = checkPathInDirection(ghost.tile, ghost.direction);
    if (destinationTile) {
      moveAvatarTo(ghost, destinationTile);
    } else {
      ghost.updateDirection();
      ghost.setIdleTick();
    }
  }
};

const spawnPlayer = () => {
  const tile = mazeTiles[mazeSize.rows - 1][Math.floor(mazeSize.columns / 2)];
  tile.addPlayer(player);
  player.tile = tile;
  checkTile(tile);
};

const moveAvatarTo = (avatar, tile) => {
  if (avatar.tile) {
    avatar.tile.removeAvatar(avatar);
  }
  tile.addAvatar(avatar);
  avatar.tile = tile;
  checkTile(tile);
};

const collectCollectible = (collectible) => {
  addScore(collectible.value);

  switch (true) {
    case collectible instanceof Gem:
      removedGems.push([collectible, collectible.tile]);
      if (lastGemTimestamp === -1) {
        lastGemTimestamp = Date.now();
      }
      break;
    case collectible instanceof PowerUp:
      addPowerForDuration(collectible);
      removedPowerUps.push([collectible, collectible.tile]);
      if (lastPowerUpTimestamp === -1) {
        lastPowerUpTimestamp = Date.now();
      }
      break;
  }
  collectible.tile.removeCollectible();
  collectible.tile = null;
};

const addCollectibleBack = (collectible, tile) => {
  tile.addCollectible(collectible);
  collectible.tile = tile;
};

const addPowerForDuration = (powerUp) => {
  player.addPower(powerUp.powerType);
  player.removePower(powerUp.powerType, powerUp.duration);
};

const addScore = (value) => {
  currentScore += value;
  updateScore(currentScore);
};

const updateScore = (value) => {
  const digitsLength = value.toString().length;
  playerScoreZeroPrefixContainer.textContent = gameScoreDefaultString.slice(
    0,
    gameScoreDefaultString.length - digitsLength,
  );
  playerScoreCurrentContainer.textContent = value;
};

const checkGems = () => {
  if (lastGemTimestamp !== -1 && removedGems.length > 0) {
    if ((Date.now() - lastGemTimestamp) / gemCoolDownDuration >= 1) {
      addCollectibleBack(...removedGems.shift());
      lastGemTimestamp = removedGems.length > 0 ? Date.now() : -1;
    }
  }
};

const checkPowerUps = () => {
  if (lastPowerUpTimestamp !== -1 && removedPowerUps.length > 0) {
    if ((Date.now() - lastPowerUpTimestamp) / powerUpCoolDownDuration >= 1) {
      addCollectibleBack(...removedPowerUps.shift());
      lastPowerUpTimestamp = removedPowerUps.length > 0 ? Date.now() : -1;
    }
  }
};

const checkTile = (tile) => {
  if (tile.player && player.isAlive) {
    if (tile.collectible instanceof Collectible) {
      collectCollectible(tile.collectible);
    }
    if (tile.hasGhost()) {
      const ghostHunterLevel = player.hasPowerType(0);
      if (ghostHunterLevel) {
        for (const ghost of tile.removeAllGhosts()) {
          ghost.kill();
          addScore(ghost.value * ghostHunterLevel);
          player.increasePowerLevel(0);
          availableGhosts.push(ghost);
        }
      } else {
        playerLives[--currentPlayerHealth].setDead();
        if (currentPlayerHealth > 0) {
          player.setLimbo();
          player.revive(playerRevivalDelay);
        } else {
          player.setDead();
        }
      }
    }
  }
};

const checkGame = () => {
  if (isPlaying && currentPlayerHealth <= 0) {
    isPlaying = false;
    gameOverContainer.classList.add(gameScreenShowStyle);
  }
};

const onInterval = () => {
  elapsedTime = Date.now() - gameStartTime;
  elapsedGameTimeContainer.textContent = new Date(elapsedTime).toISOString().slice(14, 19);
  checkGems();
  checkPowerUps();
  checkGhosts();
  checkGame();
};

// ---------- Game Interactions ----------

const handleKeydown = (e) => {
  if (!isPlaying) {
    return;
  }
  if (directionalKeys.includes(e.key)) {
    player.updateDirection(directionalKeys.indexOf(e.key));
    if (!e.repeat) {
      directionalKeysDown++;
    }
  }

  if (moveKeys.includes(e.key)) {
    // if (lastMoveKey === moveKeys[0] && e.key === moveKeys[1]) {
    if (lastMoveKey !== e.key) {
      const destinationTile = checkPathInDirection(player.tile, player.direction);
      if (destinationTile) {
        moveAvatarTo(player, destinationTile);
      }
    }
    lastMoveKey = e.key;
  }
};

const handleKeyUp = (e) => {
  if (!isPlaying) {
    return;
  }
  if (directionalKeys.includes(e.key)) {
    if (directionalKeysDown > 0) {
      if (--directionalKeysDown === 0) {
        player.updateDirection();
      }
    }
  }
};

const handleGameStart = (e) => {
  if (!isPlaying) {
    gameSplashContainer.classList.remove(gameScreenShowStyle);
    init();
  }
};

const addHandlers = () => {
  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("keyup", handleKeyUp);
  document.querySelector("#game-start-button").addEventListener("click", handleGameStart);
};

// ---------- Game Core ----------

const initGhosts = () => {
  availableGhosts.length = 0;
  availableGhosts.push(...ghosts);
};

const initPlayerLife = () => {
  for (const playerLife of playerLives) {
    playerHealthContainer.append(playerLife.element);
    playerLife.setAlive();
  }
  currentPlayerHealth = playerLives.length;
};

const gameCountdown = (messages) => {
  if (messages.length > 0) {
    const msPerCount = 1000;
    gameCountdownContainer.textContent = messages.shift();
    countdownTimerID = setTimeout(() => {
      countdownTimerID = null;
      gameCountdown(messages);
    }, msPerCount);
  } else {
    gameStart();
  }
};

const gameStart = () => {
  isPlaying = true;
  gameCountdownContainer.classList.remove(gameCountdownShowStyle);
  const intervalID = setInterval(onInterval, gameUpdateInterval);
  gameSessionIDs[intervalID] = true;
  spawnPlayer(player);
  gameStartTime = Date.now();
};

// const clearSessionTimer = () => {
//   for (const timerID in gameSessionTimerIDs) {
//     clearInterval(timerID);
//     delete gameSessionTimerIDs[timerID];
//   }
// };

const init = () => {
  directionalKeysDown = 0;
  currentScore = 0;

  initGhosts();
  initPlayerLife();

  gameCountdownContainer.classList.add(gameCountdownShowStyle);
  gameCountdown(["READY", "OP"]);
};

buildGame();
addHandlers();
