const mazeContainer = document.querySelector("#maze");
const mazeSize = { columns: 21, rows: 13 };
const pathClassName = "maze-path";
const wallClassName = "maze-wall";
const tombSize = { columns: 7, rows: 3 };
const tombWallsPositions = [];
const mazePaths = [];
const mazeWalls = [];

const player = {};

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
    for (let j = 0; j < mazeSize.columns; j++) {
      const tile = document.createElement("div");
      if (
        tombWallsPositions.includes(`${i},${j}`) ||
        (i % 2 !== 0 && j % 2 !== 0)
      ) {
        tile.classList.add(wallClassName);
        mazeWalls.push(tile);
      } else {
        tile.classList.add(pathClassName);
        mazePaths.push(tile);
      }
      //   tile.textContent = `${i}, ${j}`;
      tile.id = `tile-${i}-${j}`;
      mazeContainer.appendChild(tile);
    }
  }
};

const spawnPlayer = (playerContainer) => {
  const startPositionTileId = `tile-${mazeSize.rows - 1}-${Math.floor((mazeSize.columns - 1) / 2)}`;
  const startPositionTile = document.querySelector(`#${startPositionTileId}`);
  startPositionTile.appendChild(playerContainer);
};

const createPlayer = () => {
  const playerContainer = document.createElement("div");
  playerContainer.id = "game-player";
  player.container = playerContainer;
};

const init = () => {
  deriveTombArea();
  buildMaze();
  createPlayer();
  spawnPlayer(player.container);
};

init();
