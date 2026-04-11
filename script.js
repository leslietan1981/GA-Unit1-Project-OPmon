class MazeTile {
  //   #styles = ["maze-path", "maze-wall"];
  #styles = ["maze-path", "maze-wall", "maze-tomb-space", "maze-tomb-exit"];
  #rowIndex = -1;
  #columnIndex = -1;
  #element = null;
  #typeID = 0;
  #player = null;
  #collectible = null;

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
}

class Player {
  #baseStateStyle = "player-state-base";
  #stateStyles = [
    "player-state-up",
    "player-state-left",
    "player-state-down",
    "player-state-right",
  ];
  #eyeStyle = "player-eye";
  #eyeChar = "\u25CF";

  #element = null;
  #direction = -1;
  #score = 0;

  tile = null;

  constructor() {
    this.#element = document.createElement("div");
    this.#element.id = "game-player";
    this.#element.classList.add(this.#baseStateStyle);

    const createEye = () => {
      const eye = document.createElement("div");
      eye.classList.add(this.#eyeStyle);
      eye.textContent = this.#eyeChar;
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
    this.#element.classList.remove(...this.#stateStyles);
    this.#direction = direction;
    if (direction >= 0 && direction < this.#stateStyles.length) {
      this.#element.classList.add(this.#stateStyles[direction]);
    } else {
      this.#direction = -1;
    }
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
const tombSize = { rows: 3, columns: 7 };
const tombExit = [0, Math.floor(tombSize.columns / 2)];
const tombExitStyle = "maze-tomb-exit";
const tombWallsPositions = [];
const mazeTiles = [];

const player = new Player();
const directionalKeys = ["w", "a", "s", "d"];
let directionalKeysDown = 0;
const moveKeys = ["o", "p"];
let lastMoveKey = "";

const gems = [];
const gemCoolDownDuration = 5 * 1000;
const removedGems = [];
let lastGemTimestamp = -1;
const gameSessionTimerIDs = {};

let isPlaying = false;
let score = 0;
let elapsed = 0;

const deriveTombArea = () => {
  const startRowIndex = Math.floor((mazeSize.rows - tombSize.rows) / 2);
  const startColumnIndex = Math.floor(
    (mazeSize.columns - tombSize.columns) / 2,
  );

  tombExit[0] += startRowIndex;
  tombExit[1] += startColumnIndex;

  const emptySpaceSize = {
    columns: tombSize.columns - 2,
    rows: tombSize.rows - 2,
  };

  for (let i = 0; i < tombSize.rows; i++) {
    for (let j = 0; j < tombSize.columns; j++) {
      if (
        !(i > 0 && i < tombSize.rows - 1 && j > 0 && j < tombSize.columns - 1)
      ) {
        tombWallsPositions.push(`${startRowIndex + i},${startColumnIndex + j}`);
      }
    }
  }
};

const buildMaze = () => {
  for (let i = 0; i < mazeLevelData.length; i++) {
    const rowTiles = [];
    mazeTiles.push(rowTiles);
    for (let j = 0; j < mazeLevelData[i].length; j++) {
      const tile = new MazeTile(i, j, mazeLevelData[i][j].type);
      rowTiles.push(tile);
      mazeContainer.appendChild(tile.element);
    }
  }
};

// const buildMaze = () => {
//   for (let i = 0; i < mazeSize.rows; i++) {
//     const rowTiles = [];
//     mazeTiles.push(rowTiles);
//     for (let j = 0; j < mazeSize.columns; j++) {
//       const tileIsPath = !(
//         tombWallsPositions.includes(`${i},${j}`) ||
//         (i % 2 !== 0 && j % 2 !== 0)
//       );
//       const tile = new MazeTile(i, j, tileIsPath);
//       rowTiles.push(tile);
//       mazeContainer.appendChild(tile.element);
//     }
//   }

//   mazeTiles[tombExit[0]][tombExit[1]].overrideStyle(tombExitStyle);
// };

const spawnGems = () => {
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

const spawnPlayer = () => {
  const tile = mazeTiles[mazeSize.rows - 1][Math.floor(mazeSize.columns / 2)];
  tile.addPlayer(player);
  player.tile = tile;
  checkTile(tile);
};

const getTileInDirection = (tile, direction, steps = 1) => {
  if (tile && direction > -1) {
    let [destRowIndex, destColumnIndex] = tile.getPosition();
    if (direction % 2 === 0) {
      destRowIndex += (direction - 1) * steps;
    } else {
      destColumnIndex += (direction - 2) * steps;
    }
    if (
      destRowIndex >= 0 &&
      destRowIndex < mazeSize.rows &&
      destColumnIndex >= 0 &&
      destColumnIndex < mazeSize.columns
    ) {
      const destinationTile = mazeTiles[destRowIndex][destColumnIndex];
      return destinationTile.isPath ? destinationTile : null;
    }
  }
  return null;
};

const movePlayerTo = (tile) => {
  if (player.tile) {
    player.tile.removePlayer();
  }
  tile.addPlayer(player);
  player.tile = tile;
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

  // set interval to return a gem every cooldown

  //   const tile = gem.tile;
  //   const timeoutID = setTimeout(() => {
  //     delete timeouts[timeoutID];
  //     addGemBack(gem, tile);
  //   }, gemCooldown);
};

const addGemBack = (gem, tile) => {
  tile.addCollectible(gem);
  gem.tile = tile;
};

const addScore = (value) => {
  score += value;
};

const onInterval = () => {
  if (lastGemTimestamp !== -1 && removedGems.length > 0) {
    if ((Date.now() - lastGemTimestamp) / gemCoolDownDuration >= 1) {
      addGemBack(...removedGems.shift());
      lastGemTimestamp = Date.now();
    }
  }
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
      const destinationTile = getTileInDirection(player.tile, player.direction);
      if (destinationTile) {
        movePlayerTo(destinationTile);
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

  deriveTombArea();
  buildMaze();
  spawnGems();
  addHandlers();

  gameStart();
};

init();
