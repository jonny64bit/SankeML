import * as PIXI from 'pixi.js';
import * as tf from '@tensorflow/tfjs';
import { Movement } from './movemet';
import { Snake, Tile, Apple, Direction, MoveResult, Position } from "./snake";
import { Network, Turn } from "./network";
import { Tensor } from '@tensorflow/tfjs';

//Get canvas going
const app = new PIXI.Application({ backgroundColor: 0x111111 });
document.body.appendChild(app.view);

//Game values
const size = 38;
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
let currentLeaders: Network[] = [];
let currentParent: Network = null;
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

  if (firstRun && saves.length < 500) {
    network = new Network();
    network.Mutate(1);
  }
  else if (currentLeaders.length > 0 && childrenCount < 30) {
    network = currentParent.Copy();
    network.Mutate(0.01);
    childrenCount++;
  }
  else if (currentLeaders.length > 0 && childrenCount >= 30) {
    currentParent = currentLeaders.pop();
    network = currentParent;
    childrenCount = 0;
  }
  else {
    firstRun = false;
    saves = saves.sort((a, b) => (a.Score <= b.Score) ? 1 : 0);
    const topSaves = saves.slice(0, 10 < saves.length ? 10 : saves.length - 1);
    currentLeaders = topSaves.map(a => a.Network);
    currentParent = currentLeaders.pop();
    saves = [];
    childrenCount = 0;
    generation++;

    console.log("Current Score Range = " + topSaves[0].Score + " - " + topSaves[topSaves.length - 1].Score);
    console.log("Generations " + generation);

    let crossOvers: Network[] = [];
    for (let currentLeader of currentLeaders) {
      for (let currentLeader2 of currentLeaders) {
        if (currentLeader == currentLeader2)
          continue;

        const crazyThing = currentLeader2.Copy()
        crazyThing.Crossover(currentLeader);
        crossOvers.push(crazyThing);
      }
    }
    currentLeaders = currentLeaders.concat(crossOvers);
  }

  score = 0;

  //Set apple intial position
  apple.Move(snake.Segments);

  app.ticker.start();
}

function SnakeMath(): number[] {
  let values: number[] = [];

  const snakeX = snake.X();
  const snakeY = snake.Y();
  var currentDirection = snake.CurrentDirection;

  let leftOfSnake: Position;
  let frontOfSnake: Position;
  let rightOfSnake: Position;

  let distanceFromApple: Position;

  if (currentDirection == Direction.Up) {
    leftOfSnake = { X: snakeX - 1, Y: snakeY };
    rightOfSnake = { X: snakeX + 1, Y: snakeY };
    frontOfSnake = { X: snakeX, Y: snakeY - 1 };

    //distanceFromApple = { X: snakeX, Y: snakeY - 1 };
  }
  else if (currentDirection == Direction.Down) {
    leftOfSnake = { X: snakeX + 1, Y: snakeY };
    rightOfSnake = { X: snakeX - 1, Y: snakeY };
    frontOfSnake = { X: snakeX, Y: snakeY + 1 };

    //distanceFromApple = { X: snakeX, Y: snakeY + 1 };
  }
  else if (currentDirection == Direction.Left) {
    leftOfSnake = { X: snakeX, Y: snakeY + 1 };
    rightOfSnake = { X: snakeX, Y: snakeY - 1 };
    frontOfSnake = { X: snakeX - 1, Y: snakeY };

    //distanceFromApple = { X: snakeX - 1, Y: snakeY };
  }
  else if (currentDirection == Direction.Right) {
    leftOfSnake = { X: snakeX, Y: snakeY - 1 };
    rightOfSnake = { X: snakeX, Y: snakeY + 1 };
    frontOfSnake = { X: snakeX + 1, Y: snakeY };

    //distanceFromApple = { X: snakeX + 1, Y: snakeY };
  }

  values[0] = workoutValue(leftOfSnake);
  values[1] = workoutValue(frontOfSnake);
  values[2] = workoutValue(rightOfSnake);

  /*
  const travelVector: Position = { X: snakeX - travelPosition.X, Y: snakeY - travelPosition.Y};
  const appleVector: Position = { X: snakeX - apple.X, Y: snakeY - apple.Y}; 

  const combinedVector: Position = {X: travelPosition.X + appleVector.X, Y: travelPosition.Y + appleVector.Y};
  const dived = combinedVector.Y / combinedVector.X;
  const angle = Math.tan(dived * -1);*/
  
  values[3] = Math.atan2(apple.Y - snakeY, apple.X - snakeX);


  /*
  let index = 0;
  const around = 2;
  for (let x = -around; x <= around; x++) {
    for (let y = -around; y <= around; y++) {
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
  }*/

  //values.push(apple.X - snakeX);
  //values.push(apple.Y - snakeY);

  //values.push(snakeX);
  //values.push(widthSquares - snakeX);
  //values.push(snakeY);
  //values.push(heightSquares - snakeY);

  return values;
}

function workoutValue(position: Position): number {
  if (apple.X == position.X && apple.Y == position.Y)
    return 1;
  if (position.X < 0 || position.Y < 0 || position.X == widthSquares || position.Y == heightSquares)
    return -1;
  return 0;
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
  if (seconds >= 0.005) {
    timeSinceLastApple += seconds;

    var predictredTurn = network.Predict(SnakeMath())
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
    if (timeSinceLastApple > 5) {
      timeSinceLastApple = 0;
      movement.Force = false;
      dead = true;
    }
    else if (result == MoveResult.Dead || movement.Force) {
      timeSinceLastApple = 0;
      movement.Force = false;
      dead = true;
      //score = score - 100;
    }
    else if (result == MoveResult.Apple) {
      timeSinceLastApple = 0;
      score = score + 1000;
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