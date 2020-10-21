import * as PIXI from 'pixi.js';
import * as tf from '@tensorflow/tfjs';
import { Movement } from './movemet';
import { Snake, Tile, Apple, Direction, MoveResult } from "./snake";
import { Network, Turn } from "./network";
import { Tensor } from '@tensorflow/tfjs';

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
let score = 0;
let saves: Save[] = [];
let currentLeaders: Save[] = [];
let currentParent: Save = null;
let childrenCount = 0;
let firstRun = true;
let timeSinceLastApple = 0;
let generation = 0;

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

  snake = new Snake(widthSquares, heightSquares);
  apple = new Apple(widthSquares, heightSquares);

  saves.push({
    Network: network,
    Score: score
  });

  if (firstRun && saves.length < 25) {
    network = new Network();
    network.Mutate(0.3);
  }
  else if(currentLeaders.length > 0 && childrenCount < 10)
  {
    network = currentParent.Network.Copy();
    network.Mutate(0.05);
    childrenCount++;
  }
  else if(currentLeaders.length > 0 && childrenCount >= 10)
  {
    currentParent = currentLeaders.pop();
    network = currentParent.Network;
    childrenCount = 0;
  }
  else {
    firstRun = false;
    saves = saves.filter(save => save.Score > 20);
    saves = saves.sort((a, b) => (a.Score <= b.Score) ? 1 : 0);
    currentLeaders = saves.slice(0, 10 < saves.length ? 10 : saves.length - 1);
    currentParent = currentLeaders.pop();
    saves = [];
    childrenCount = 0;

    generation++;

    console.log("Current Score Range = " + currentLeaders[0].Score + " - "  + currentParent.Score);
    console.log("Generations " + generation);
  } 

  score = 0;

  //Set apple intial position
  apple.Move(snake.Segments);

  app.ticker.start();
}

function SnakeMath(): number[] {
  let values: number[] = [];
  let index = 0;
  const snakeX = snake.X();
  const snakeY = snake.Y();

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      if (x == 0 && y == 0)
        continue;

      let trueX = snakeX + x;
      let trueY = snakeY + y;

      if (apple.X == trueX && apple.Y == trueY)
        values[index] = 1;
      else if (trueX < 0 || trueY < 0 || trueX == widthSquares || trueY == heightSquares)
        values[index] = -1;
      else
        values[index] = 0;
      index++;
    }
  }

  values.push(snakeX);
  values.push(widthSquares - snakeX);
  values.push(snakeY);
  values.push(heightSquares - snakeY);

  return values;
}

ResetGame();

app.ticker.add((delta) => {
  if (movement.Restart || dead) {
    ResetGame();
    return;
  }

  if (movement.Pasued)
    return;

  seconds += (1 / 60) * delta;
  if (seconds >= 0.05) {
    timeSinceLastApple += seconds;

    let predictredTurn = network.Predict(SnakeMath())

    if (predictredTurn == Turn.Left) {
      if (snake.CurrentDirection == Direction.Left)
        snake.CurrentDirection = Direction.Down;
      else if (snake.CurrentDirection == Direction.Right)
        snake.CurrentDirection = Direction.Up;
      else if (snake.CurrentDirection == Direction.Up)
        snake.CurrentDirection = Direction.Left;
      else if (snake.CurrentDirection == Direction.Down)
        snake.CurrentDirection = Direction.Right;
    }
    else if (predictredTurn == Turn.Right) {
      if (snake.CurrentDirection == Direction.Left)
        snake.CurrentDirection = Direction.Up;
      else if (snake.CurrentDirection == Direction.Right)
        snake.CurrentDirection = Direction.Down;
      else if (snake.CurrentDirection == Direction.Up)
        snake.CurrentDirection = Direction.Right;
      else if (snake.CurrentDirection == Direction.Down)
        snake.CurrentDirection = Direction.Left;
    }

    var result = snake.Move(apple);

    seconds = 0;
    if(result == MoveResult.Dead || movement.Force || timeSinceLastApple > 20)
    {
      timeSinceLastApple = 0;
      movement.Force = false;
      dead = true;
    }
    else if(result == MoveResult.Apple)
    {
      timeSinceLastApple = 0;
      score = score + 450;
    } 
    else
      score++;
  }

  tiles.forEach(t => {
    t.Tile.tint = backgroundColor;
    if (apple.X == t.X && apple.Y == t.Y)
      t.Tile.tint = appleColor;
  });


  snake.Draw(tiles);
});

class Save {
  Score: number;
  Network: Network;
}