const styles = ["maze-path", "maze-wall", "maze-tomb-space", "maze-tomb-exit"];
const mazeSize = { rows: 13, columns: 21 };
const mazeTiles = [];
let currentTool = "";

const mazeContainer = document.querySelector("#maze");
const toolsDropdown = document.querySelector("#gameElement");
const exportButton = document.querySelector("#exportMazeData");

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
      const helperTile = document.createElement("div");
      helperTile.value = mazeLevelData[i][j].type;
      helperTile.isTile = true;
      helperTile.className = styles[helperTile.value];
      rowTiles.push(helperTile);
      mazeContainer.appendChild(helperTile);
    }
  }
};

const handleClick = (e) => {
  if (e.target.isTile) {
    switch (currentTool) {
      case "tileType":
        const tile = e.target;
        tile.value = (tile.value + 1) % styles.length;
        tile.className = styles[tile.value];
        break;
      case "power-up":
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
      tileData.type = tile.value;
      dataRow.push(tileData);
    }
  }
  copyToClipboard(`const mazeLevelData = ${JSON.stringify(dataArr)};`);
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    console.log("Text copied to clipboard");
  } catch (error) {
    console.error("Failed to copy: ", error);
  }
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
