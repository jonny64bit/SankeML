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


export class Movement {
    Snake: Snake = null;
    Pasued = true;
    Restart = false;
    Force = false;
    constructor() {
        let pause = this.setupKey("p");
        let restart = this.setupKey("r");
        let force = this.setupKey("f");

        pause.press = () => {
            this.Pasued = !this.Pasued;
        }

        restart.press = () => {
            this.Restart = true;
        }

        force.press = () => {
            this.Force = true;
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