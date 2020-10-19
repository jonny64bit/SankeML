import { Snake } from "./snake";

export interface MovementKey {
    value: string,
    down: boolean,
    up: boolean,
    press?(),
    release?(),
    unsubscribe?(),
    downHandler(event: KeyboardEvent),
    upHandler(event: KeyboardEvent)
}
export enum Direction { Up, Down, Left, Right }

export class Movement {
    CurrentDirection: Direction = Direction.Right;
    Snake: Snake = null;
    Pasued = true;
    Restart = false;
    constructor() {
        let left = this.setupKey("ArrowLeft");
        let up = this.setupKey("ArrowUp");
        let right = this.setupKey("ArrowRight");
        let down = this.setupKey("ArrowDown");
        let pause = this.setupKey("p");
        let restart = this.setupKey("r");

        left.press = () => {
            if (this.Snake.Segments.length > 1 && this.CurrentDirection != Direction.Right)
                this.CurrentDirection = Direction.Left;
            else if (this.Snake.Segments.length == 1)
                this.CurrentDirection = Direction.Left;
        };

        up.press = () => {
            if (this.Snake.Segments.length > 0 && this.CurrentDirection != Direction.Down)
                this.CurrentDirection = Direction.Up;
            else if (this.Snake.Segments.length == 1)
                this.CurrentDirection = Direction.Up;
        };

        right.press = () => {
            if (this.Snake.Segments.length > 0 && this.CurrentDirection != Direction.Left)
                this.CurrentDirection = Direction.Right;
            else if (this.Snake.Segments.length == 1)
                this.CurrentDirection = Direction.Right;
        };

        down.press = () => {
            if (this.Snake.Segments.length > 0 && this.CurrentDirection != Direction.Up)
                this.CurrentDirection = Direction.Down;
            else if (this.Snake.Segments.length == 1)
                this.CurrentDirection = Direction.Down;
        };

        pause.press = () => {
            this.Pasued = !this.Pasued;
        }

        restart.press = () => {
            this.Restart = true;
        }
    }
    setupKey(value: string) {
        let key: MovementKey = {
            value: value,
            down: false,
            up: true,
            press: undefined,
            release: undefined,
            downHandler: (event: KeyboardEvent) => {
                if (event.key === key.value) {
                    if (key.up && key.press) key.press();
                    key.down = true;
                    key.up = false;
                    event.preventDefault();
                }
            },
            upHandler: (event: KeyboardEvent) => {
                if (event.key === key.value) {
                    if (key.down && key.release) key.release();
                    key.down = false;
                    key.up = true;
                    event.preventDefault();
                }
            }
        };

        //Attach event listeners
        const downListener = key.downHandler.bind(key);
        const upListener = key.upHandler.bind(key);

        window.addEventListener(
            "keydown", downListener, false
        );
        window.addEventListener(
            "keyup", upListener, false
        );

        // Detach event listeners
        key.unsubscribe = () => {
            window.removeEventListener("keydown", downListener);
            window.removeEventListener("keyup", upListener);
        };

        return key;
    }
}