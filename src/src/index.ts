import * as PIXI from 'pixi.js';
import { Movement } from './movemet';
import { Snake, Tile, Apple } from "./snake";

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application({ backgroundColor: 0x111111 });

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);

const size = 18;
const space = 2;
const sizePlusSpace = size + space;
const widthSquares = app.screen.width / sizePlusSpace;
const heightSquares = app.screen.height / sizePlusSpace;
const backgroundColor = 0x004400;
const appleColor = 0xFF0000;

//console.log("Width Squares: " + app.screen.width + " (" + widthSquares + ")");
//console.log("Height Squares: " + app.screen.height + " (" + heightSquares + ")");

let tiles: Tile[] = [];
for (let y = 0; y < heightSquares; y++) {
  for (let x = 0; x < widthSquares; x++) {
    //console.log("Drawing at: " + (x * sizePlusSpace) + " - " + x + " - " + size);
    const tile = new PIXI.Sprite(PIXI.Texture.WHITE);
    tile.position.set(x * sizePlusSpace, y * sizePlusSpace);
    tile.width = size;
    tile.height = size;
    tile.tint = backgroundColor;
    app.stage.addChild(tile);
    tiles.push({
      X: x,
      Y: y,
      Tile: tile
    });
  }
}

var movement = new Movement();
var snake = new Snake(movement);
var apple = new Apple();
apple.X = 20;
apple.Y = 20;

let seconds = 0;

app.ticker.add((delta) => {
  if(movement.Pasued)
    return;

  seconds += (1 / 60) * delta;
  if (seconds >= 0.2) {
    snake.Move(apple);
    seconds = 0;
  }

  tiles.forEach(t => {
    t.Tile.tint = backgroundColor;
    if (apple.X == t.X && apple.Y == t.Y)
      t.Tile.tint = appleColor;
  });

  
  snake.Draw(tiles);
});