class MazeTile {
  #styles = ["maze-path", "maze-wall"];
  #currentStyleIndex = -1;
  #rowIndex = -1;
  #columnIndex = -1;
  #element;
  // type: path || wall
  #isWall = false;

  constructor(rowIndex, columnIndex, element, isWall = false) {
    this.#rowIndex = rowIndex;
    this.#columnIndex = columnIndex;
    this.#element = element;
    this.isWall = isWall;
  }

  #updateStyle() {
    if (this.#element) {
      if (this.#currentStyleIndex !== -1) {
        this.#element.classList.remove(this.#styles[this.#currentStyleIndex]);
      }
      this.#element.classList.add(this.#styles[this.#isWall ? 1 : 0]);
    }
  }

  set isWall(value) {
    this.#isWall = value;
    this.#updateStyle();
  }

  get isWall() {
    return this.#isWall;
  }

  get element() {
    return this.#element;
  }
}

// End of Classes -------------------------------------------------------

const mazeContainer = document.querySelector("#maze");
const mazeSize = { columns: 21, rows: 13 };
const pathClassName = "maze-path";
const wallClassName = "maze-wall";
const tombSize = { columns: 7, rows: 3 };
const tombWallsPositions = [];
const mazeTiles = [];
const mazePaths = [];
const mazeWalls = [];

const player = {};
const playerStateClasses = [
  "player-state-base",
  [
    "player-state-up",
    "player-state-right",
    "player-state-down",
    "player-state-left",
  ],
];
const playerEyeClassName = "player-eye";
const directionalKeys = ["w", "d", "s", "a"];
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
        !(i === 0 && j === Math.floor((tombSize.columns - 1) / 2)) &&
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
      const tile = new MazeTile(
        i,
        j,
        document.createElement("div"),
        tileIsWall,
      );
      tileIsWall ? mazeWalls.push(tile) : mazePaths.push(tile);

      //   tile.textContent = `${i}, ${j}`;
      tile.id = `tile-${i}-${j}`;
      rowTiles.push(tile);
      mazeContainer.appendChild(tile.element);
    }
  }
};

const createPlayer = () => {
  const playerContainer = document.createElement("div");
  playerContainer.id = "game-player";
  playerContainer.classList.add(playerStateClasses[0]);
  player.container = playerContainer;

  const leftEye = document.createElement("div");
  leftEye.classList.add(playerEyeClassName);
  leftEye.textContent = "\u25CF";

  const rightEye = document.createElement("div");
  rightEye.classList.add(playerEyeClassName);
  rightEye.textContent = "\u25CF";

  playerContainer.append(leftEye, rightEye);
  playerContainer.classList.add(playerStateClasses[0]);
};

const spawnPlayer = (playerContainer) => {
  const tile =
    mazeTiles[mazeSize.rows - 1][Math.floor((mazeSize.columns - 1) / 2)];
  tile.element.appendChild(playerContainer);
};

const changePlayerDirection = (direction = -1) => {
  const states = playerStateClasses[1];
  player.container.classList.remove(...states);
  if (direction >= 0 && direction < states.length) {
    player.container.classList.add(states[direction]);
  }
};

const handleKeydown = (e) => {
  if (directionalKeys.includes(e.key)) {
    changePlayerDirection(directionalKeys.indexOf(e.key));
    directionalKeysDown += 1;
  }
};

const handleKeyUp = (e) => {
  if (directionalKeys.includes(e.key)) {
    if (directionalKeysDown > 0) {
      if (--directionalKeysDown === 0) {
        changePlayerDirection();
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
  createPlayer();
  spawnPlayer(player.container);
  addHandlers();
};

init();
