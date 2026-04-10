class MazeTile {
  #styles = ["maze-path", "maze-wall"];
  #currentStyle = "";
  #rowIndex = -1;
  #columnIndex = -1;
  #element = null;
  // type: path || wall
  #isPath = false;

  constructor(rowIndex, columnIndex, isPath = true) {
    this.#rowIndex = rowIndex;
    this.#columnIndex = columnIndex;
    this.#element = document.createElement("div");
    this.#isPath = isPath;
    this.#updateStyle();

    this.#element.id = `tile-${rowIndex}-${columnIndex}`;
  }

  #removeStyle() {
    if (this.#element && this.#currentStyle !== "") {
      this.#element.classList.remove(this.#currentStyle);
      this.#currentStyle = "";
    }
  }

  #updateStyle() {
    this.#removeStyle();
    if (this.#element) {
      this.#currentStyle = this.#styles[this.#isPath ? 0 : 1];
      this.#element.classList.add(this.#currentStyle);
    }
  }

  setIsPath(value, updateStyle = true) {
    this.#isPath = value;
    if (updateStyle) {
      this.#updateStyle();
    }
  }

  get isPath() {
    return this.#isPath;
  }

  get element() {
    return this.#element;
  }

  getPosition() {
    return [this.#rowIndex, this.#columnIndex];
  }

  overrideStyle(newStyle) {
    this.#removeStyle();
    if (this.#element) {
      this.#currentStyle = newStyle;
      this.#element.classList.add(this.#currentStyle);
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
  #direction = -1;

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

  moveToTile(tile) {
    if (tile instanceof MazeTile) {
      if (tile.isPath) {
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
const tombExit = [0, Math.floor(tombSize.columns / 2)];
const tombExitStyle = "maze-tomb-exit";
const tombWallsPositions = [];
const mazeTiles = [];

const player = new Player();
const directionalKeys = ["w", "a", "s", "d"];
let directionalKeysDown = 0;
const moveKeys = ["o", "p"];
let lastMoveKey = "";

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
  for (let i = 0; i < mazeSize.rows; i++) {
    const rowTiles = [];
    mazeTiles.push(rowTiles);
    for (let j = 0; j < mazeSize.columns; j++) {
      const tileIsPath = !(
        tombWallsPositions.includes(`${i},${j}`) ||
        (i % 2 !== 0 && j % 2 !== 0)
      );
      const tile = new MazeTile(i, j, tileIsPath);
      rowTiles.push(tile);
      mazeContainer.appendChild(tile.element);
    }
  }

  mazeTiles[tombExit[0]][tombExit[1]].overrideStyle(tombExitStyle);
};

const spawnGems = () => {
  for (const tile of mazeTiles) {
    //
  }
};

const spawnPlayer = () => {
  const tile =
    mazeTiles[mazeSize.rows - 1][Math.floor((mazeSize.columns - 1) / 2)];
  player.moveToTile(tile);
};

const movePlayer = (direction, steps = 1) => {
  if (player.tile && direction > -1) {
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
    if (!e.repeat) {
      directionalKeysDown++;
    }
  }

  if (moveKeys.includes(e.key)) {
    // if (lastMoveKey === moveKeys[0] && e.key === moveKeys[1]) {
    if (lastMoveKey !== e.key) {
      movePlayer(player.direction);
    }
    lastMoveKey = e.key;
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
