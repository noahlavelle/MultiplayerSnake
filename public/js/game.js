// @ts-ignore
let socket = io();
class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Snake {
    constructor(x, y, length) {
        this.coords = [x, y];
        this.length = length;
        this.moveDir = [0, 0];
        this.tail = [];
        this.inputHandling();
    }
    inputHandling() {
        const inputMaps = {
            "w": [0, -1],
            "a": [-1, 0],
            "s": [0, 1],
            "d": [1, 0]
        };
        $(document).on("keydown", (event) => {
            this.moveDir = inputMaps[event.key] != undefined ? inputMaps[event.key] : this.moveDir;
        });
    }
}
class Game {
    /* Player data Sructure:
    [[name], [color], [corod], [tailcoords]]
    */
    constructor() {
        this.allPlayersData = {};
        this.gridSize = 30;
        this.snake = new Snake(0, 0, 5);
        this.initEvents();
        this.tick();
    }
    initEvents() {
        socket.on("request-data", () => {
        });
        socket.on("player-data", (pd) => {
            this.allPlayersData = pd;
        });
        socket.on("new-food", (coords) => {
            this.food = new Food(coords[0], coords[1]);
        });
    }
    tick() {
        this.snake.coords[0] += this.snake.moveDir[0] * this.gridSize;
        this.snake.coords[1] += this.snake.moveDir[1] * this.gridSize;
        this.snake.tail.push([this.snake.coords[0], this.snake.coords[1]]);
        if (this.snake.tail.length > this.snake.length) {
            this.snake.tail.shift();
        }
        socket.emit("send-data", ["name", "#00ff00", this.snake.tail]);
        clear();
        try {
            draw(this.food.x, this.food.y, this.gridSize, "#ff0000");
            for (let key in this.allPlayersData) {
                for (let coord of this.allPlayersData[key][2]) {
                    draw(coord[0], coord[1], this.gridSize, this.allPlayersData[key][1]);
                }
            }
        }
        catch (_a) { }
        ;
        setTimeout(() => {
            this.tick();
        }, 100);
    }
}
