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

  get isTomb() {
    return this.#typeID === 2;
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
    this.#ghosts.length = 0;
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

  clear() {
    this.removePlayer();
    this.removeAllGhosts();
    this.removeCollectible();
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

  get eyeStateStyles() {
    return this.#eyeStateStyles;
  }

  get element() {
    return this.#element;
  }

  get direction() {
    return this.#direction;
  }

  updateDirection(direction = -1) {
    this.#element.classList.remove(...this.eyeStateStyles);
    this.#direction = direction;
    if (direction >= 0 && direction < this.eyeStateStyles.length) {
      this.#element.classList.add(this.eyeStateStyles[direction]);
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
    for (const [styleKey, styleValue] of Object.entries(this.#additionalStyles)) {
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
  #intervalID = null;
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
    clearInterval(this.#intervalID);
    this.#intervalID = setInterval(callbackAction, thoughtInterval, ...args);
  }

  kill() {
    clearInterval(this.#intervalID);
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

// -- General variables
const directionalKeys = ["w", "a", "s", "d"];
const moveKeys = ["o", "p"];

// -- Out-of-game variables
const gameSplashContainer = document.querySelector("#game-splash");
const gameSplashLeaderboardContainer = document.querySelector("#game-splash-leaderboard");
const gameCountdownContainer = document.querySelector("#game-countdown");
const gameCountAnimationContainer = document.querySelector("#countdown-message");
const gameStartButton = document.querySelector("#game-start-button");

const gameOverContainer = document.querySelector("#game-over");
const resultsScoreContainer = document.querySelector(".results-score-time");
const gameOverLeaderboardContainer = document.querySelector("#game-over-leaderboard");
const initialsContainer = document.querySelector("#leaderboard-initials");
const inputContainers = [...initialsContainer.querySelectorAll(".initials-char")];
const initialsMazeContainer = document.querySelector("#initials-maze");
const initialsTiles = [];
const initialsPlayer = new Player();
const leaderboardObj = {};
const leaderboardListStyle = "leaderboard-list";
const initialsCharStyle = "initials-char";

const onboardingMazeContainer = document.querySelector("#onboarding-maze");
const onboardingMessageContainer = document.querySelector("#onboarding-instruction");
const outOfGameKeys = { directionalKeysDown: 0, lastMoveKey: "" };
const onboardingTiles = [];
const onboardingPlayer = new Player();
const onboardingTargets = {};

let targetTile = null;

const hiddenStyle = "is-hidden";
const gameScreenShowStyle = "game-screen-show";
const gameCountdownShowStyle = "game-countdown-show";
const countdownAnimationStyle = "count-animation";

const charactersList = "abcdefghijklmnopqrstuvwxyz1234567890~!@#$.-:".toUpperCase().split("");

let countdownTimerID = null;

// -- In-game variables
const playerHealthContainer = document.querySelector("#hud-player-health");
const playerScoreContainer = document.querySelector("#hud-player-score");
const playerScoreZeroPrefixContainer = document.querySelector(".hud-score-zero-prefix");
const playerScoreCurrentContainer = document.querySelector(".hud-score-current");
const elapsedGameTimeContainer = document.querySelector("#hud-elapsed-game-time");
const mazeContainer = document.querySelector("#maze");

const mazeSize = { rows: 13, columns: 21 };
const mazeTiles = [];
const tombTiles = [];

const player = new Player();
const playerLifeStyle = "player-base";
const playerMaxLives = 3;
const playerRevivalDelay = 4 * 1000;
const playerLives = [];
const inGameKeys = { directionalKeysDown: 0, lastMoveKey: "" };

let ghostSpawningTile = null;
const ghosts = [new Ghost(), new Ghost(), new Ghost(), new Ghost(), new Ghost()];
const availableGhosts = [];
const roamingGhosts = [];
const ghostSpawnInterval = 2 * 1000;
const ghostDecisionIntervalMax = 200;
const ghostDecisionFactor = 150;
let ghostDecisionInterval = 0;
let lastGhostTimestamp = -1;

const gems = [];
const gemCoolDownDuration = 1 * 1000;
const removedGems = [];
let lastGemTimestamp = -1;

const powerUpsConfig = [{ powerType: 0, duration: 5 * 1000 }];
const powerUpKey = "powerup";
const powerUpTiles = [];
const powerUps = [];
const powerUpCoolDownDuration = 20 * 1000;
const removedPowerUps = [];
let lastPowerUpTimestamp = -1;

const gameUpdateInterval = 10;
let gameIntervalID = null;

const gameScoreDefaultString = "0000000";

let isPlaying = false;
let currentPlayerHealth = 0;
let currentScore = 0;
let gameStartTime = 0;
let elapsedTime = 0;

const timeLimit = 60 * 1000;

// ---------- Sound ----------

const moveKeysSounds = [new Audio("sound/o.mp3"), new Audio("sound/p.mp3")];
const powerUpSound = new Audio("sound/powerup.mp3");
const gemSound = new Audio("sound/gem.mp3");
const eatGhostSound = new Audio("sound/eatghost.mp3");
const gameOverSound = new Audio("sound/gameover.mp3");
const damageSound = new Audio("sound/damage.mp3");

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

      switch (true) {
        case tile.isTomb:
          tombTiles.push(tile);
          break;
        case tile.isTombExit:
          ghostSpawningTile = mazeTiles[i - 1][j];
          break;
        case powerUpKey in info:
          powerUpTiles.push([tile, info[powerUpKey]]);
          break;
      }
    }
  }
};

const createPowerUps = () => {
  const stockPowerUps = [...powerUps];
  for (const [tile, powerType] of powerUpTiles) {
    let powerup = stockPowerUps.shift();
    if (!powerup) {
      powerup = new PowerUp(powerUpsConfig[powerType]);
      powerUps.push(powerup);
    }
    tile.addCollectible(powerup);
    powerup.tile = tile;
  }
};

const createGems = () => {
  const stockGems = [...gems];
  for (const rowTiles of mazeTiles) {
    for (const tile of rowTiles) {
      if (tile.isPath && !tile.hasCollectible()) {
        let gem = stockGems.shift();
        if (!gem) {
          gem = new Gem();
          gems.push(gem);
        }
        tile.addCollectible(gem);
        gem.tile = tile;
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

const setupSounds = () => {
  for (const audioObj of moveKeysSounds) {
    audioObj.volume = 0.1;
  }
};

const buildGame = () => {
  buildMaze();
  createPowerUps();
  createGems();
  createPlayerHealth();
  setupSounds();
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

const getClosestPath = (srcTile, destTile) => {
  let closestTile = null;
  let closestTileDist = -1;
  let tileDirection = -1;
  const destTilePos = destTile.getPosition();

  if (srcTile) {
    for (let direction = 0; direction < 4; direction++) {
      const checkTile = checkPathInDirection(srcTile, direction);
      if (checkTile) {
        const checkTileDist = getDistance(checkTile.getPosition(), destTilePos);
        if ((closestTile && checkTileDist < closestTileDist) || !closestTile) {
          closestTile = checkTile;
          closestTileDist = checkTileDist;
          tileDirection = direction;
        }
      }
    }
  }
  return [tileDirection, closestTile];
};

const getFurthestPath = (srcTile, destTile) => {
  let furthestTile = null;
  let furthestTileDist = -1;
  let tileDirection = -1;
  const destTilePos = destTile.getPosition();

  if (srcTile) {
    for (let direction = 0; direction < 4; direction++) {
      const checkTile = checkPathInDirection(srcTile, direction);
      if (checkTile) {
        const checkTileDist = getDistance(checkTile.getPosition(), destTilePos);
        if ((furthestTile && checkTileDist > furthestTileDist) || !furthestTile) {
          furthestTile = checkTile;
          furthestTileDist = checkTileDist;
          tileDirection = direction;
        }
      }
    }
  }
  return [tileDirection, furthestTile];
};

const spawnGhost = () => {
  if (availableGhosts.length > 0) {
    const ghost = availableGhosts.shift();
    ghost.tile.removeGhost(ghost);
    roamingGhosts.push(ghost);
    ghostSpawningTile.addGhost(ghost);
    ghost.tile = ghostSpawningTile;
    ghost.setAlive(ghostDecisionInterval, ghostDecision, ghost);
    lastGhostTimestamp = Date.now();
    checkTile(ghostSpawningTile);
  }
};

const checkToSpawnGhost = () => {
  if (availableGhosts.length > 0) {
    if (lastGhostTimestamp === -1 || (Date.now() - lastGhostTimestamp) / ghostSpawnInterval >= 1) {
      spawnGhost();
    }
  }
};

const ghostDecision = (ghost) => {
  const availableTiles = getAvailablePathsFromTile(ghost.tile);

  if (ghostSeesPlayer(ghost)) {
    if (player.hasPowerType(0)) {
      const [tileDirection, furthestTile] = getFurthestPath(ghost.tile, player.tile);
      if (furthestTile) {
        moveAvatarTo(ghost, furthestTile);
        ghost.updateDirection(tileDirection);
        ghost.setMoveTick();
        return;
      }
    } else if (player.isAlive) {
      const [tileDirection, closestTile] = getClosestPath(ghost.tile, player.tile);
      if (closestTile) {
        moveAvatarTo(ghost, closestTile);
        ghost.updateDirection(tileDirection);
        ghost.setMoveTick();
        return;
      }
    }
  }

  let destTile = null;
  let direction = -1;

  if (!ghost.tick()) {
    if (Math.floor(Math.random() * 10) > 2) {
      [direction, destTile] = availableTiles[Math.floor(Math.random() * availableTiles.length)];
    }
    ghost.updateDirection(direction);
    direction !== -1 ? ghost.setMoveTick() : ghost.setIdleTick();
  } else {
    destTile = checkPathInDirection(ghost.tile, ghost.direction);
  }

  if (destTile) {
    moveAvatarTo(ghost, destTile);
  } else {
    ghost.updateDirection();
    ghost.setIdleTick();
  }
};

const ghostSeesPlayer = (ghost) => {
  const ghostTilePos = ghost.tile.getPosition();
  const playerTilePos = player.tile.getPosition();
  return getDistance(ghostTilePos, playerTilePos) <= 4;
};

function getDistance(pos1, pos2) {
  const dx = pos2[0] - pos1[0];
  const dy = pos2[1] - pos1[1];
  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}

const killGhost = (ghost) => {
  ghost.kill();
  ghost.updateDirection();
  ghost.tile = null;
  roamingGhosts.splice(roamingGhosts.indexOf(ghost), 1);
  for (const tile of tombTiles) {
    if (!tile.hasGhost()) {
      tile.addGhost(ghost);
      ghost.tile = tile;
      break;
    }
  }
  availableGhosts.push(ghost);
};

const spawnPlayer = () => {
  player.setAlive();
  player.updateDirection();
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
  addToScore(collectible.value);

  switch (true) {
    case collectible instanceof Gem:
      removedGems.push([collectible, collectible.tile]);
      if (lastGemTimestamp === -1) {
        lastGemTimestamp = Date.now();
      }
      playSound(gemSound);
      break;
    case collectible instanceof PowerUp:
      addPowerForDuration(collectible);
      removedPowerUps.push([collectible, collectible.tile]);
      if (lastPowerUpTimestamp === -1) {
        lastPowerUpTimestamp = Date.now();
      }
      playSound(powerUpSound);
      break;
  }
  collectible.tile.removeCollectible();
  collectible.tile = null;
};

const addCollectibleBack = (collectible, tile) => {
  tile.addCollectible(collectible);
  collectible.tile = tile;
  checkTile(tile);
};

const addPowerForDuration = (powerUp) => {
  player.addPower(powerUp.powerType);
  player.removePower(powerUp.powerType, powerUp.duration);
};

const addToScore = (value) => {
  currentScore += value;
  updateDisplayedScore(currentScore);
};

const updateDisplayedScore = (value) => {
  playerScoreZeroPrefixContainer.textContent = getScoreZerosPrefix(value);
  playerScoreCurrentContainer.textContent = value;
};

const updateTime = () => {
  elapsedTime = Date.now() - gameStartTime;
  timeLeft = timeLimit - elapsedTime;
  timeLeft = timeLeft < 0 ? 0 : timeLeft;
  elapsedGameTimeContainer.textContent = getTimeMMSS(timeLeft);
};

const checkToSpawnGem = () => {
  if (lastGemTimestamp !== -1 && removedGems.length > 0) {
    if ((Date.now() - lastGemTimestamp) / gemCoolDownDuration >= 1) {
      addCollectibleBack(...removedGems.shift());
      lastGemTimestamp = removedGems.length > 0 ? Date.now() : -1;
    }
  }
};

const checkToSpawnPowerUp = () => {
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
          addToScore(ghost.value * ghostHunterLevel);
          player.increasePowerLevel(0);
          killGhost(ghost);
        }
        playSound(eatGhostSound);
      } else {
        playerLives[--currentPlayerHealth].setDead();
        playSound(damageSound);
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

const checkForGameOver = () => {
  if (isPlaying && (currentPlayerHealth <= 0 || elapsedTime >= timeLimit)) {
    gameOver();
  }
};

const updateResults = () => {
  resultsScoreContainer.textContent = `Your score: ${getScoreZerosPrefix(currentScore)}${currentScore}`;
};

const playSound = (audioObj) => {
  audioObj.currentTime = 0;
  audioObj.play();
};

const onInterval = () => {
  if (isPlaying) {
    updateTime();

    const ghostIntervalCheck =
      ghostDecisionIntervalMax - (Math.min(elapsedTime, timeLimit) / timeLimit) * ghostDecisionFactor;
    if (ghostDecisionInterval - ghostIntervalCheck > ghostDecisionIntervalMax / 10) {
      ghostDecisionInterval = ghostIntervalCheck;
      for (const ghost of roamingGhosts) {
        ghost.setAlive(ghostDecisionInterval, ghostDecision, ghost);
      }
    }
  }
  checkToSpawnGem();
  checkToSpawnPowerUp();
  checkToSpawnGhost();
  checkForGameOver();
};

// ---------- Game Interactions ----------

const handleKeyDown = (e) => {
  if (!isPlaying) {
    return;
  }

  if (directionalKeys.includes(e.key)) {
    player.updateDirection(directionalKeys.indexOf(e.key));
    if (!e.repeat) {
      inGameKeys.directionalKeysDown++;
    }
  } else if (moveKeys.includes(e.key)) {
    if (!e.repeat) {
      if (inGameKeys.lastMoveKey !== e.key) {
        const destinationTile = checkPathInDirection(player.tile, player.direction);
        if (destinationTile) {
          moveAvatarTo(player, destinationTile);
        }
      }
      inGameKeys.lastMoveKey = e.key;
      playSound(moveKeysSounds[moveKeys.indexOf(e.key)]);
    }
  }
};

const handleKeyUp = (e) => {
  if (!isPlaying) {
    return;
  }
  if (directionalKeys.includes(e.key)) {
    if (inGameKeys.directionalKeysDown > 0) {
      if (--inGameKeys.directionalKeysDown === 0) {
        player.updateDirection();
      }
    }
  }
};

const handleGameStart = (e) => {
  if (!isPlaying) {
    document.removeEventListener("keydown", handleOnboardKeyDown);
    document.removeEventListener("keyup", handleOnboardKeyUp);
    gameSplashContainer.classList.remove(gameScreenShowStyle);
    init();
  }
};

const handleRestart = (e) => {
  document.removeEventListener("keydown", handleInitialsKeyDown);
  document.removeEventListener("keyup", handleInitialsKeyUp);
  gameOverContainer.classList.remove(gameScreenShowStyle);

  initOnboard();

  gameSplashLeaderboardContainer.append(leaderboardObj.container);
  gameSplashContainer.classList.add(gameScreenShowStyle);

  restartMaze();
  for (const playerLife of playerLives) {
    playerLife.element.remove();
  }

  updateDisplayedScore((currentScore = 0));
  elapsedGameTimeContainer.textContent = getTimeMMSS((elapsedTime = 0));
};

const addHandlers = () => {
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  gameStartButton.addEventListener("click", handleGameStart);
  document.querySelector("#game-home-button").addEventListener("click", handleRestart);
};

// ---------- Onboarding ----------

const buildOnboarding = () => {
  const tilesData = [
    [0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0],
  ];

  for (let i = 0; i < tilesData.length; i++) {
    const rowTiles = [];
    onboardingTiles.push(rowTiles);
    for (let j = 0; j < tilesData[i].length; j++) {
      const tile = new MazeTile(i, j, tilesData[i][j]);
      rowTiles.push(tile);
      onboardingMazeContainer.appendChild(tile.element);
    }
  }

  onboardingTargets.firstTile = onboardingTiles[0][0];
  onboardingTargets.lastTile = onboardingTiles[tilesData.length - 1][tilesData[tilesData.length - 1].length - 1];
};

const checkOnboardPath = (srcTile, direction, steps = 1) => {
  if (srcTile && direction > -1) {
    let [rowIdx, colIdx] = srcTile.getPosition();
    if (direction % 2 === 0) {
      rowIdx += (direction - 1) * steps;
    } else {
      colIdx += (direction - 2) * steps;
    }
    if (rowIdx >= 0 && rowIdx < onboardingTiles.length && colIdx >= 0 && colIdx < onboardingTiles[0].length) {
      const destinationTile = onboardingTiles[rowIdx][colIdx];
      return destinationTile.isPath ? destinationTile : null;
    }
  }
  return null;
};

const updateOnboardMessage = (messageID) => {
  const message = [
    "Try moving to the last tile on the right.",
    "Now try moving back to the first tile on the left.",
    "You are ready!",
  ];
  onboardingMessageContainer.textContent = message[messageID];
};

const initOnboard = () => {
  updateOnboardMessage(0);

  onboardingTargets.firstTile.addPlayer(onboardingPlayer);
  onboardingPlayer.tile = onboardingTargets.firstTile;

  targetTile = onboardingTargets.lastTile;
  outOfGameKeys.directionalKeysDown = 0;
  outOfGameKeys.lastMoveKey = "";

  document.addEventListener("keydown", handleOnboardKeyDown);
  document.addEventListener("keyup", handleOnboardKeyUp);

  gameStartButton.disabled = true;
};

const checkOnBoardTarget = (tile) => {
  if (tile === targetTile) {
    if (tile === onboardingTargets.lastTile) {
      targetTile = onboardingTargets.firstTile;
      updateOnboardMessage(1);
      playSound(gemSound);
    } else {
      targetTile = null;
      updateOnboardMessage(2);
      gameStartButton.disabled = false;
      playSound(powerUpSound);
    }
  }
};

const handleOnboardKeyDown = (e) => {
  if (directionalKeys.includes(e.key)) {
    onboardingPlayer.updateDirection(directionalKeys.indexOf(e.key));
    if (!e.repeat) {
      outOfGameKeys.directionalKeysDown++;
    }
  } else if (moveKeys.includes(e.key)) {
    if (!e.repeat) {
      if (outOfGameKeys.lastMoveKey !== e.key) {
        const destinationTile = checkOnboardPath(onboardingPlayer.tile, onboardingPlayer.direction);
        if (destinationTile) {
          moveAvatarTo(onboardingPlayer, destinationTile);
          checkOnBoardTarget(destinationTile);
        }
      }
      outOfGameKeys.lastMoveKey = e.key;
      playSound(moveKeysSounds[moveKeys.indexOf(e.key)]);
    }
  }
};

const handleOnboardKeyUp = (e) => {
  if (directionalKeys.includes(e.key)) {
    if (outOfGameKeys.directionalKeysDown > 0) {
      if (--outOfGameKeys.directionalKeysDown === 0) {
        onboardingPlayer.updateDirection();
      }
    }
  }
};

// ---------- Leaderboard ----------

const getLeaderboardData = (resetData = false) => {
  if (typeof Storage !== "undefined" && !resetData) {
    const retrievedData = localStorage.getItem("leaderboardData");
    if (retrievedData) {
      return [...JSON.parse(retrievedData)];
    }
  }
  return [
    ["AAA", "3000"],
    ["BBB", "2000"],
    ["CCC", "1000"],
  ];
};

const getRankString = (idx, initialsStr, scoreValue) => {
  return `${idx + 1}. ${initialsStr} | ${getScoreZerosPrefix(scoreValue) + scoreValue}`;
};

const createLeaderBoardListing = (data, listItems) => {
  const container = document.createElement("div");
  container.classList.add(leaderboardListStyle);

  data.forEach(([lbInitials, lbScore], i) => {
    const rankElement = document.createElement("div");
    rankElement.textContent = getRankString(i, lbInitials, lbScore);
    container.append(rankElement);
    listItems.push(rankElement);
  });
  return container;
};

const initLeaderboard = (clearData = false) => {
  leaderboardObj.data = getLeaderboardData(clearData);
  leaderboardObj.listItems = [];
  leaderboardObj.container = createLeaderBoardListing(leaderboardObj.data, leaderboardObj.listItems);
};

const checkEligibleForLeaderboard = () => {
  for (let i = 0; i < leaderboardObj.data.length; i++) {
    const lbScore = parseInt(leaderboardObj.data[i][1]);
    const lbTime = parseInt(leaderboardObj.data[i][2]);
    if (currentScore > lbScore || (currentScore == lbScore && elapsedTime > lbTime)) {
      return i;
    }
  }
  return -1;
};

const updateLeaderboard = () => {
  if (initialsPlayer.rank !== -1) {
    const initials = leaderboardObj.data.splice(initialsPlayer.rank, 0, [getInitials(), currentScore]);
    leaderboardObj.data.pop();

    leaderboardObj.data.forEach(([lbInitials, lbScore], i) => {
      leaderboardObj.listItems[i].textContent = getRankString(i, lbInitials, lbScore);
    });

    if (typeof Storage !== "undefined") {
      localStorage.setItem("leaderboardData", JSON.stringify(leaderboardObj.data));
    }
  }
};

const buildInitialsInput = () => {
  const charDivs = [];
  for (let i = 0; i < 3; i++) {
    const charDiv = document.createElement("div");
    charDiv.classList.add(initialsCharStyle);
    charDiv.textContent = charactersList[0];
    charDivs.push(charDiv);

    const tile = new MazeTile(0, i, 0);
    tile.divRef = charDiv;
    initialsTiles.push(tile);
    initialsMazeContainer.append(tile.element);
  }
  initialsMazeContainer.append(...charDivs);

  initialsTiles[0].addPlayer(initialsPlayer);
  initialsPlayer.tile = initialsTiles[0];
};

const getCharacter = (currentChar, isNext = true) => {
  const currentIdx = charactersList.indexOf(currentChar);
  if (currentIdx === -1) {
    return charactersList[isNext ? 0 : charactersList.length - 1];
  } else {
    return charactersList[(currentIdx + (isNext ? 1 : -1) + charactersList.length) % charactersList.length];
  }
};

const getInitials = () => {
  let initialsStr = "";
  for (const tile of initialsTiles) {
    initialsStr += tile.divRef.textContent;
  }
  return initialsStr;
};

const handleInitialsKeyDown = (e) => {
  if (directionalKeys.includes(e.key)) {
    initialsPlayer.updateDirection(directionalKeys.indexOf(e.key));
    if (!e.repeat) {
      outOfGameKeys.directionalKeysDown++;
    }
  } else if (moveKeys.includes(e.key)) {
    if (!e.repeat) {
      if (outOfGameKeys.lastMoveKey !== e.key) {
        let [, colIdx] = initialsPlayer.tile.getPosition();
        if (initialsPlayer.direction % 2 === 0) {
          const currentValue = initialsPlayer.tile.divRef.textContent;
          initialsPlayer.tile.divRef.textContent = getCharacter(currentValue, initialsPlayer.direction === 0);
          playSound(gemSound);
        } else {
          colIdx += initialsPlayer.direction - 2;
          if (colIdx >= 0 && colIdx < initialsTiles.length) {
            initialsPlayer.tile.removePlayer();
            initialsTiles[colIdx].addAvatar(initialsPlayer);
            initialsPlayer.tile = initialsTiles[colIdx];
          }
        }
      }
      outOfGameKeys.lastMoveKey = e.key;
      playSound(moveKeysSounds[moveKeys.indexOf(e.key)]);
    }
  } else if (e.key === "Enter") {
    updateLeaderboard();
    document.removeEventListener("keydown", handleInitialsKeyDown);
    document.removeEventListener("keyup", handleInitialsKeyUp);
    initialsPlayer.setDead();
  }
};

const handleInitialsKeyUp = (e) => {
  if (directionalKeys.includes(e.key)) {
    if (outOfGameKeys.directionalKeysDown > 0) {
      if (--outOfGameKeys.directionalKeysDown === 0) {
        initialsPlayer.updateDirection();
      }
    }
  }
};

// ---------- Utilities ----------

const getScoreZerosPrefix = (score) => {
  return gameScoreDefaultString.slice(0, gameScoreDefaultString.length - score.toString().length);
};

const getTimeMMSS = (timeMs) => {
  return new Date(timeMs).toISOString().slice(14, 19);
};

// ---------- Game Core ----------

const initPreGame = (clearData = false) => {
  initLeaderboard(clearData);
  buildOnboarding();
  buildInitialsInput();
  buildGame();

  gameSplashLeaderboardContainer.append(leaderboardObj.container);

  updateDisplayedScore((currentScore = 0));
  elapsedGameTimeContainer.textContent = getTimeMMSS((elapsedTime = 0));

  addHandlers();
  handleRestart(null);
};

const initGhosts = () => {
  ghosts.forEach((ghost, i) => {
    tombTiles[i].addGhost(ghost);
    ghost.tile = tombTiles[i];
    ghost.updateDirection();
  });
  roamingGhosts.length = 0;
  availableGhosts.length = 0;
  availableGhosts.push(...ghosts);
};

const restartMaze = () => {
  for (const ghost of ghosts) {
    ghost.kill();
  }

  for (const rowTiles of mazeTiles) {
    for (const tile of rowTiles) {
      tile.clear();
    }
  }

  createPowerUps();
  createGems();
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
    gameCountAnimationContainer.textContent = messages.shift();
    gameCountAnimationContainer.classList.add(countdownAnimationStyle);
    countdownTimerID = setTimeout(() => {
      countdownTimerID = null;
      gameCountAnimationContainer.classList.remove(countdownAnimationStyle);
      void gameCountAnimationContainer.offsetWidth;
      gameCountdown(messages);
    }, msPerCount);
  } else {
    gameStart();
  }
};

const gameStart = () => {
  isPlaying = true;
  gameCountdownContainer.classList.remove(gameCountdownShowStyle);
  gameIntervalID = setInterval(onInterval, gameUpdateInterval);
  spawnPlayer(player);
  gameStartTime = Date.now();
};

const gameOver = () => {
  clearInterval(gameIntervalID);
  isPlaying = false;
  gameOverContainer.classList.add(gameScreenShowStyle);
  gameOverLeaderboardContainer.append(leaderboardObj.container);
  playSound(gameOverSound);

  updateResults();

  initialsPlayer.rank = checkEligibleForLeaderboard();
  if (initialsPlayer.rank !== -1) {
    outOfGameKeys.directionalKeysDown = 0;
    outOfGameKeys.lastMoveKey = "";
    initialsContainer.classList.remove(hiddenStyle);
    document.addEventListener("keydown", handleInitialsKeyDown);
    document.addEventListener("keyup", handleInitialsKeyUp);
  } else {
    initialsContainer.classList.add(hiddenStyle);
  }
};

const init = () => {
  inGameKeys.directionalKeysDown = 0;
  currentScore = 0;
  elapsedTime = 0;
  elapsedGameTimeContainer.textContent = getTimeMMSS(timeLimit);
  ghostDecisionInterval = ghostDecisionIntervalMax;

  initGhosts();
  initPlayerLife();

  gameCountdownContainer.classList.add(gameCountdownShowStyle);
  gameCountdown(["READY", "OP"]);
};

initPreGame(true);
