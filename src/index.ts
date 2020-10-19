import * as PIXI from 'pixi.js';
import { Direction, Movement } from './movemet';
import { Snake, Tile, Apple } from "./snake";
import { Network } from "./network";

//Get canvas going
const app = new PIXI.Application({ backgroundColor: 0x111111 });
document.body.appendChild(app.view);

//Game values
const size = 18;
const space = 2;
const sizePlusSpace = size + space;
const widthSquares = app.screen.width / sizePlusSpace;
const heightSquares = app.screen.height / sizePlusSpace;
const backgroundColor = 0x004400;
const appleColor = 0xFF0000;
let dead = false;
let seconds = 0;

//Lets setup our tiles
let tiles: Tile[] = [];
for (let y = 0; y < heightSquares; y++) {
  for (let x = 0; x < widthSquares; x++) {
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

let movement: Movement = new Movement();
let snake: Snake = null;
let apple: Apple = null;
let network: Network = new Network();

function ResetGame() {
  app.ticker.stop();
  
  dead = false;
  apple = null;
  snake = null;
  seconds = 0;

  tiles.forEach(t => {
    t.Tile.tint = backgroundColor;
  });

  movement.CurrentDirection = Direction.Right;
  snake = new Snake(movement, widthSquares, heightSquares);
  apple = new Apple(widthSquares, heightSquares);

  network = network.Copy();
  network.Mutate(0.3);

  //Set apple intial position
  apple.Move(snake.Segments);

  app.ticker.start();
}

function SnakeMath(): number[] {
  let values: number[] = [];

  //0) Distance from left
  values[0] = snake.X();

  //1) Distance from Right
  values[1] = widthSquares - values[0];

  //2) Distance from top
  values[2] = snake.Y();

  //1) Distance from Right
  values[3] = heightSquares - values[2];

  return values;
}

function ProcessNetwork() {

}

ResetGame();

app.ticker.add((delta) => {
  if (movement.Restart || dead)
    ResetGame();

  if (movement.Pasued)
    return;

  seconds += (1 / 60) * delta;
  if (seconds >= 0.2) {
    movement.CurrentDirection = network.Predict(SnakeMath())

    dead = snake.Move(apple);
    seconds = 0;
  }

  tiles.forEach(t => {
    t.Tile.tint = backgroundColor;
    if (apple.X == t.X && apple.Y == t.Y)
      t.Tile.tint = appleColor;
  });


  snake.Draw(tiles);
});