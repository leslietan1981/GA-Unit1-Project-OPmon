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
    }
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
  #eyeStateStyles = [
    "eye-state-up",
    "eye-state-left",
    "eye-state-down",
    "eye-state-right",
  ];

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

    this.#element.append(createEye(), createEye());
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
}

class Player extends AvatarBase {
  constructor() {
    super("player-base", "player-eye", "●");
  }
}

class Ghost extends AvatarBase {
  #decisionPool = [-1, 0, 1, 2, 3];
  #maxMoveTicks = 5;
  #maxIdleTicks = 2;
  #ticksLeft = 0;

  constructor() {
    super("ghost-base", "player-eye", "▿");
  }

  randomDirection() {
    this.#decisionPool.push(
      ...this.#decisionPool.splice(
        Math.floor(Math.random() * this.#decisionPool.length),
      ),
    );
    this.updateDirection(
      this.#decisionPool[Math.floor(Math.random() * this.#decisionPool.length)],
    );
    this.#ticksLeft = Math.ceil(Math.random() * this.#maxMoveTicks);
  }

  tick() {
    return --this.#ticksLeft;
  }

  setMoveTick() {
    this.#ticksLeft = Math.ceil(Math.random() * this.#maxMoveTicks);
  }

  setIdleTick() {
    this.#ticksLeft = Math.ceil(Math.random() * this.#maxIdleTicks);
  }

  setAlive(thoughtInterval, callbackAction, ...args) {
    this.randomDirection();
    const intervalID = setInterval(callbackAction, thoughtInterval, ...args);
  }
}

class Gem {
  #style = "collectible-gem";
  #value = 10;
  #element = null;

  tile = null;

  constructor() {
    this.#element = document.createElement("div");
    this.#element.classList.add(this.#style);
    this.#element.textContent = "♦︎";
  }

  get value() {
    return this.#value;
  }

  get element() {
    return this.#element;
  }
}

// End of Classes -------------------------------------------------------

const mazeContainer = document.querySelector("#maze");
const mazeSize = { rows: 13, columns: 21 };
const mazeTiles = [];

const player = new Player();
const directionalKeys = ["w", "a", "s", "d"];
let directionalKeysDown = 0;
const moveKeys = ["o", "p"];
let lastMoveKey = "";

let ghostSpawningTile = null;
const ghosts = [new Ghost(), new Ghost(), new Ghost(), new Ghost()];
const availableGhosts = [];
const ghostSpawnInterval = 5 * 1000;
const ghostDecisionInterval = 200;
let lastGhostTimestamp = -1;

const gems = [];
const gemCoolDownDuration = 5 * 1000;
const removedGems = [];
let lastGemTimestamp = -1;

const gameSessionTimerIDs = {};

let isPlaying = false;
let score = 0;
let elapsed = 0;

const buildMaze = () => {
  for (let i = 0; i < mazeLevelData.length; i++) {
    const rowTiles = [];
    mazeTiles.push(rowTiles);
    for (let j = 0; j < mazeLevelData[i].length; j++) {
      const tile = new MazeTile(i, j, mazeLevelData[i][j].type);
      rowTiles.push(tile);
      mazeContainer.appendChild(tile.element);

      if (tile.isTombExit) {
        ghostSpawningTile = mazeTiles[i - 1][j];
      }
    }
  }
};

const initGems = () => {
  for (const rowTiles of mazeTiles) {
    for (const tile of rowTiles) {
      if (tile.isPath) {
        const gem = new Gem();
        tile.addCollectible(gem);
        gem.tile = tile;
        gems.push(gem);
      }
    }
  }
};

const initGhosts = () => {
  availableGhosts.length = 0;
  availableGhosts.push(...ghosts);
};

const spawnGhost = () => {
  const ghost = availableGhosts.shift();
  ghostSpawningTile.addGhost(ghost);
  ghost.tile = ghostSpawningTile;
  ghost.setAlive(ghostDecisionInterval, ghostDecision, ghost);
  getAvailablePathsFromTile(ghost.tile);
  lastGhostTimestamp = Date.now();
};

const checkGhosts = () => {
  if (availableGhosts.length > 0) {
    if (
      lastGhostTimestamp === -1 ||
      (Date.now() - lastGhostTimestamp) / ghostSpawnInterval >= 1
    ) {
      spawnGhost();
    }
  }
};

const ghostDecision = (ghost) => {
  if (!ghost.tick()) {
    let newDirection = -1;
    if (Math.floor(Math.random() * 10) > 2) {
      const availableTiles = getAvailablePathsFromTile(ghost.tile);
      const [direction, tile] =
        availableTiles[Math.floor(Math.random() * availableTiles.length)];
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

const checkPathInDirection = (srcTile, direction, steps = 1) => {
  if (srcTile && direction > -1) {
    let [rowIdx, colIdx] = srcTile.getPosition();
    if (direction % 2 === 0) {
      rowIdx += (direction - 1) * steps;
    } else {
      colIdx += (direction - 2) * steps;
    }
    if (
      rowIdx >= 0 &&
      rowIdx < mazeSize.rows &&
      colIdx >= 0 &&
      colIdx < mazeSize.columns
    ) {
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

const moveAvatarTo = (avatar, tile) => {
  if (avatar.tile) {
    avatar.tile.removeAvatar(avatar);
  }
  tile.addAvatar(avatar);
  avatar.tile = tile;
  checkTile(tile);
};

const checkTile = (tile) => {
  if (tile.player) {
    if (tile.collectible instanceof Gem) {
      collectGem(tile.collectible);
    }
  }
};

const collectGem = (gem) => {
  addScore(gem.value);
  removedGems.push([gem, gem.tile]);
  if (lastGemTimestamp === -1) {
    lastGemTimestamp = Date.now();
  }
  gem.tile.removeCollectible();
  gem.tile = null;
};

const addGemBack = (gem, tile) => {
  tile.addCollectible(gem);
  gem.tile = tile;
};

const addScore = (value) => {
  score += value;
};

const checkGems = () => {
  if (lastGemTimestamp !== -1 && removedGems.length > 0) {
    if ((Date.now() - lastGemTimestamp) / gemCoolDownDuration >= 1) {
      addGemBack(...removedGems.shift());
      lastGemTimestamp = Date.now();
    }
  }
};

const onInterval = () => {
  checkGems();
  checkGhosts();
};

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
      const destinationTile = checkPathInDirection(
        player.tile,
        player.direction,
      );
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

const addHandlers = () => {
  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("keyup", handleKeyUp);
};

const clearSessionTimer = () => {
  for (const timerID in gameSessionTimerIDs) {
    clearInterval(timerID);
    delete gameSessionTimerIDs[timerID];
  }
};

const gameStart = () => {
  const intervalID = setInterval(onInterval, 500);
  gameSessionTimerIDs[intervalID] = true;
  spawnPlayer(player);
  isPlaying = true;
};

const init = () => {
  directionalKeysDown = 0;
  score = 0;

  buildMaze();
  initGems();
  initGhosts();
  addHandlers();

  gameStart();
};

init();
