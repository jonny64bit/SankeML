import { Movement } from './movemet';

export enum Direction { Left, Up, Down, Right }
export enum MoveResult { Nothing, Dead, Apple }

export class Snake {
    constructor(width: number, height: number) {
        var header = new SnakeSegment();
        header.X = 5;
        header.Y = 5;
        this.Segments.push(header);
        this.Width = width;
        this.Height = height;
    }

    ForegroundColor = 0xFFFFFF;
    X = () => { return this.Segments[0].X; }
    Y = () => { return this.Segments[0].Y; }
    Width: number;
    Height: number;
    Segments: SnakeSegment[] = []
    CurrentDirection: Direction = Direction.Right;

    Draw(tiles: Tile[]) {
        this.Segments.forEach(s => {
            tiles.forEach(t => {
                if (s.X == t.X && s.Y == t.Y)
                    t.Tile.tint = this.ForegroundColor;
            })
        });
    }

    Move(apple: Apple): MoveResult {
        const newPosition: Position = {
            X: this.X(),
            Y: this.Y()
        }

        if (this.CurrentDirection == Direction.Right)
            newPosition.X += 1;
        else if (this.CurrentDirection == Direction.Left)
            newPosition.X -= 1;
        else if (this.CurrentDirection == Direction.Down)
            newPosition.Y += 1;
        else if (this.CurrentDirection == Direction.Up)
            newPosition.Y -= 1;

        //Check if we hit boundary
        if (newPosition.X < 0 || newPosition.Y < 0 || newPosition.X >= this.Width || newPosition.Y >= this.Height)
            return MoveResult.Dead;

        //Check if we hit ourself
        let hitSelf = false;
        this.Segments.forEach(segment => {
            if (segment.X == newPosition.X && segment.Y == newPosition.Y)
                hitSelf = true;
        });
        if (hitSelf)
            return MoveResult.Dead;

        //Check if we hit apple
        let result = MoveResult.Nothing;
        if (newPosition.Y == apple.Y && newPosition.X == apple.X) {
            apple.Move(this.Segments);

            var newSegment = new SnakeSegment();
            newSegment.X = this.Segments.reverse()[0].X;
            newSegment.Y = this.Segments.reverse()[0].Y;
            this.Segments.push(newSegment);
            result = MoveResult.Apple;
        }

        let lastPosition: Position = null
        this.Segments.forEach(segment => {
            if (lastPosition == null) {
                lastPosition = {
                    X: segment.X,
                    Y: segment.Y
                };
                segment.X = newPosition.X;
                segment.Y = newPosition.Y;
            }
            else {
                let thisSegmentsPosition = {
                    X: segment.X,
                    Y: segment.Y
                }
                segment.X = lastPosition.X;
                segment.Y = lastPosition.Y;
                lastPosition = thisSegmentsPosition;
            }
        });

        return result;
    }
}

export class SnakeSegment implements Position {
    X: number;
    Y: number;
}

export interface Tile extends Position {
    Tile: PIXI.Sprite;
}

export interface Position {
    X: number;
    Y: number;
}

export class Apple implements Position {
    constructor(width: number, height: number) {
        this.Width = width;
        this.Height = height;
    }

    X: number;
    Y: number;
    Width: number;
    Height: number;

    Move(snakeSegments: SnakeSegment[]) {
        while (true) {
            var randomX = this.RandomInteger(0, this.Width - 1);
            var randomY = this.RandomInteger(0, this.Height - 1);

            let conflict = false;
            snakeSegments.forEach(segement => {
                if (segement.X == randomX && segement.Y == randomY)
                    conflict = true;
            });

            if (!conflict) {
                this.X = randomX;
                this.Y = randomY;
                return;
            }
        }
    }
    RandomInteger(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}