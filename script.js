class MazeTile {
  #styles = ["maze-path", "maze-wall"];
  #currentStyleIndex = -1;
  #rowIndex = -1;
  #columnIndex = -1;
  #element = null;
  // type: path || wall
  #isPath = false;
  #player = null;

  constructor(rowIndex, columnIndex, isPath = true) {
    this.#rowIndex = rowIndex;
    this.#columnIndex = columnIndex;
    this.#element = document.createElement("div");
    this.isWall = isPath;

    this.#element.id = `tile-${rowIndex}-${columnIndex}`;
  }

  #updateStyle() {
    if (this.#element) {
      if (this.#currentStyleIndex !== -1) {
        this.#element.classList.remove(this.#styles[this.#currentStyleIndex]);
      }
      this.#element.classList.add(this.#styles[this.#isPath ? 1 : 0]);
    }
  }

  set isWall(value) {
    this.#isPath = value;
    this.#updateStyle();
  }

  get isWall() {
    return this.#isPath;
  }

  get element() {
    return this.#element;
  }

  getPosition() {
    return [this.#rowIndex, this.#columnIndex];
  }

  addPlayer(playerObject) {
    if (!this.#player) {
      this.#player = playerObject;
      this.#element.append(playerObject.element);
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
  #tile = null;

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

  get tile() {
    return this.#tile;
  }

  updateDirection(direction = -1) {
    this.#element.classList.remove(...this.#stateStyles);
    if (direction >= 0 && direction < this.#stateStyles.length) {
      this.#element.classList.add(this.#stateStyles[direction]);
    }
  }

  moveToTile(tile) {
    if (tile instanceof MazeTile) {
      if (!tile.isWall) {
        this.#tile = tile;
        this.#tile.element.append(this.#element);
      }
    }
  }
}

// End of Classes -------------------------------------------------------

const mazeContainer = document.querySelector("#maze");
const mazeSize = { rows: 13, columns: 21 };
const tombSize = { rows: 3, columns: 7 };
const tombWallsPositions = [];
const mazeTiles = [];
const mazePaths = [];
const mazeWalls = [];

const player = new Player();
const directionalKeys = ["w", "a", "s", "d"];
let directionalKeysDown = 0;

const deriveTombArea = () => {
  const startRowIndex = Math.floor((mazeSize.rows - tombSize.rows) / 2);
  const startColumnIndex = Math.floor(
    (mazeSize.columns - tombSize.columns) / 2,
  );

  const emptySpaceSize = {
    columns: tombSize.columns - 2,
    rows: tombSize.rows - 2,
  };

  for (let i = 0; i < tombSize.rows; i++) {
    for (let j = 0; j < tombSize.columns; j++) {
      if (
        // !(i === 0 && j === Math.floor((tombSize.columns - 1) / 2)) &&
        !(i > 0 && i < tombSize.rows - 1 && j > 0 && j < tombSize.columns - 1)
      ) {
        tombWallsPositions.push(`${startRowIndex + i},${startColumnIndex + j}`);
      }
    }
  }
};

const buildMaze = () => {
  for (let i = 0; i < mazeSize.rows; i++) {
    const rowTiles = [];
    mazeTiles.push(rowTiles);
    for (let j = 0; j < mazeSize.columns; j++) {
      //   const tile = document.createElement("div");
      const tileIsWall =
        tombWallsPositions.includes(`${i},${j}`) ||
        (i % 2 !== 0 && j % 2 !== 0);
      const tile = new MazeTile(i, j, tileIsWall);
      tileIsWall ? mazeWalls.push(tile) : mazePaths.push(tile);
      rowTiles.push(tile);
      mazeContainer.appendChild(tile.element);
    }
  }
};

const spawnPlayer = () => {
  const tile =
    mazeTiles[mazeSize.rows - 1][Math.floor((mazeSize.columns - 1) / 2)];
  player.moveToTile(tile);
};

const movePlayer = (direction, steps = 1) => {
  if (player.tile) {
    let [destRowIndex, destColumnIndex] = player.tile.getPosition();

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
      player.moveToTile(mazeTiles[destRowIndex][destColumnIndex]);
    }
  }
};

const handleKeydown = (e) => {
  if (directionalKeys.includes(e.key)) {
    player.updateDirection(directionalKeys.indexOf(e.key));
    directionalKeysDown += 1;
    movePlayer(directionalKeys.indexOf(e.key));
  }
};

const handleKeyUp = (e) => {
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

const init = () => {
  directionalKeysDown = 0;

  deriveTombArea();
  buildMaze();

  spawnPlayer(player);
  addHandlers();
};

init();
