const styles = ["maze-path", "maze-wall", "maze-tomb-space", "maze-tomb-exit"];
const tileTypeKey = "type";
const mazeSize = { rows: 13, columns: 21 };
const mazeTiles = [];
let currentTool = "";

const mazeContainer = document.querySelector("#maze");
const toolsDropdown = document.querySelector("#gameElement");
const exportButton = document.querySelector("#exportMazeData");

const powerUpStyle = "collectible-powerup";
const powerUpKey = "powerup";
const powerUps = [];

const buildMaze = () => {
  for (let i = 0; i < mazeSize.rows; i++) {
    const rowTiles = [];
    mazeTiles.push(rowTiles);
    for (let j = 0; j < mazeSize.columns; j++) {
      const helperTile = document.createElement("div");
      helperTile.value = 0;
      helperTile.isTile = true;
      helperTile.className = styles[helperTile.value];
      rowTiles.push(helperTile);
      mazeContainer.appendChild(helperTile);
    }
  }
};

const buildMazeUsingData = () => {
  for (let i = 0; i < mazeLevelData.length; i++) {
    const rowTiles = [];
    mazeTiles.push(rowTiles);
    for (let j = 0; j < mazeLevelData[i].length; j++) {
      const tileData = mazeLevelData[i][j];
      const tile = document.createElement("div");
      tile.value = tileData[tileTypeKey];
      tile.isTile = true;
      tile.className = styles[tile.value];
      rowTiles.push(tile);
      mazeContainer.appendChild(tile);

      if (powerUpKey in tileData) {
        tile.append(getPowerUp());
      }
    }
  }
};

const getPowerUp = () => {
  if (powerUps.length > 0) {
    return powerUps.pop();
  } else {
    const powerUp = document.createElement("div");
    powerUp.value = 0;
    powerUp.classList.add(powerUpStyle);
    powerUp.textContent = "⚡︎";
    return powerUp;
  }
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    console.log("Text copied to clipboard");
  } catch (error) {
    console.error("Failed to copy: ", error);
  }
};

const handleClick = (e) => {
  if (e.target.isTile) {
    const tile = e.target;
    switch (currentTool) {
      case "tileType":
        tile.value = (tile.value + 1) % styles.length;
        tile.className = styles[tile.value];
        break;
      case "power-up":
        const powerUpNode = tile.querySelector(`.${powerUpStyle}`);
        if (powerUpNode) {
          powerUpNode.remove();
          powerUps.push(powerUpNode);
        } else {
          tile.appendChild(getPowerUp());
        }
        break;
    }
  }
};

const changeTool = (e) => {
  currentTool = toolsDropdown.value;
};

const exportData = (e) => {
  const dataArr = [];
  for (const rowTiles of mazeTiles) {
    const dataRow = [];
    dataArr.push(dataRow);
    for (const tile of rowTiles) {
      const tileData = {};
      tileData[tileTypeKey] = tile.value;

      const powerUpNode = tile.querySelector(`.${powerUpStyle}`);
      if (powerUpNode) {
        tileData[powerUpKey] = powerUpNode.value;
      }
      dataRow.push(tileData);
    }
  }
  copyToClipboard(`const mazeLevelData = ${JSON.stringify(dataArr)};`);
};

const addHandlers = () => {
  mazeContainer.addEventListener("click", handleClick);
  toolsDropdown.addEventListener("change", changeTool);
  exportButton.addEventListener("click", exportData);
};

const init = () => {
  currentTool = toolsDropdown.value;

  try {
    buildMazeUsingData();
  } catch (error) {
    buildMaze();
  }
  addHandlers();
};

init();
