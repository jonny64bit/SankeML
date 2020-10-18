import { Direction, Movement } from './movemet';

export class Snake {
    constructor(movement: Movement) {
        var header = new SnakeSegment();
        header.X = 5;
        header.Y = 5;
        this.Segments.push(header);
        this.Movement = movement;
        this.Movement.Snake = this;
    }
    Movement: Movement = null;
    ForegroundColor = 0xFFFFFF;
    X = () => { return this.Segments[0].X; }
    Y = () => { return this.Segments[0].Y; }
    Segments: SnakeSegment[] = []

    Draw(tiles: Tile[]) {
        this.Segments.forEach(s => {
            tiles.forEach(t => {
                if (s.X == t.X && s.Y == t.Y)
                    t.Tile.tint = this.ForegroundColor;
            })
        });
    }

    Move(apple: Apple) {
        const newPosition: Position = {
            X: this.X(),
            Y: this.Y()
        }

        if (this.Movement.CurrentDirection == Direction.Right)
            newPosition.X += 1;
        else if (this.Movement.CurrentDirection == Direction.Left)
            newPosition.X -= 1;
        else if (this.Movement.CurrentDirection == Direction.Down)
            newPosition.Y += 1;
        else if (this.Movement.CurrentDirection == Direction.Up)
            newPosition.Y -= 1;

        if (newPosition.Y == apple.Y && newPosition.X == apple.X) {
            var newSegment = new SnakeSegment();
            newSegment.X = this.Segments.reverse()[0].X;
            newSegment.Y = this.Segments.reverse()[0].Y;
            this.Segments.push(newSegment);
            apple.Move(this.Segments);
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
        while(true) {
            var randomX = this.RandomInteger(0, this.Width - 1);
            var randomY = this.RandomInteger(0, this.Height - 1);

            let conflict = false;
            snakeSegments.forEach(segement => {
                if(segement.X == randomX && segement.Y == randomY)
                    conflict = true;
            });

            if(!conflict)
            {
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