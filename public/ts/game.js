// @ts-ignore
let socket = io();
class Food {
    constructor(x, y) {
        this.coords = [x, y];
    }
}
class Snake {
    constructor(x, y, length) {
        this.moveDir = [0, 0];
        this.acceptingInput = true;
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
            if (this.acceptingInput && inputMaps.hasOwnProperty(event.key)) {
                if (arrayEquals(inputMaps[event.key].map(Math.abs), this.moveDir.map(Math.abs)))
                    return;
                this.moveDir = inputMaps[event.key] != undefined ? inputMaps[event.key] : this.moveDir;
                this.acceptingInput = false;
            }
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
        this.running = true;
        this.refreshTime = 100;
        this.playerColor = localStorage.getItem("player-color") || "#A686C7";
        this.foodColor = localStorage.getItem("food-color") || "#FE6F61";
        this.snake = new Snake(0, 0, 5);
        this.initEvents();
        this.tick();
    }
    initEvents() {
        socket.on("player-data", (pd) => {
            if (this.running) {
                this.allPlayersData = pd;
            }
        });
        socket.on("new-food", (coords) => {
            if (this.running) {
                this.food = new Food(coords[0], coords[1]);
            }
        });
        socket.on("game-data", (data) => {
            this.refreshTime = data[0];
            this.gameCode = data[1];
            this.timeLeft = data[2];
            this.updateInfo();
        });
        $("#respawn").on("click", () => {
            this.snake = new Snake(0, 0, 5);
        });
        let interval = setInterval(() => {
            if (!this.running)
                clearInterval(interval);
            if (this.timeLeft != undefined) {
                this.timeLeft--;
                this.updateInfo();
                if (this.timeLeft == 0) {
                    clearInterval(interval);
                    this.running = false;
                    // @ts-ignore
                    Swal.fire({
                        icon: 'error',
                        title: 'Times Up',
                        confirmButtonText: 'Home'
                    }).then((result) => {
                        location.hash = "#home";
                    });
                }
            }
        }, 1000);
    }
    tick() {
        if (this.snake != null) {
            // New Coords
            this.snake.coords[0] += this.snake.moveDir[0] * this.gridSize;
            this.snake.coords[1] += this.snake.moveDir[1] * this.gridSize;
            // Tail Handling
            this.snake.tail.push([this.snake.coords[0], this.snake.coords[1]]);
            if (this.snake.tail.length > this.snake.length) {
                this.snake.tail.shift();
            }
            // Collision Handling
            if (this.food !== undefined && arrayEquals(this.food.coords, this.snake.coords)) {
                this.snake.length++;
                socket.emit("new-food");
                this.updateInfo();
            }
            // Send data to server
            socket.emit("send-data", ["name", this.playerColor, this.snake.tail]);
        }
        // Draw
        clear();
        if (this.food != null) {
            draw(this.food.coords[0], this.food.coords[1], this.gridSize, this.foodColor);
        }
        if (this.snake != null) {
            for (let coord of this.snake.tail) {
                draw(coord[0], coord[1], this.gridSize, this.playerColor);
            }
        }
        for (let key in this.allPlayersData) {
            for (let coord of this.allPlayersData[key][2]) {
                if (key != socket.id) {
                    draw(coord[0], coord[1], this.gridSize, this.allPlayersData[key][1]);
                }
            }
            if (this.snake != null && !arrayEquals(this.snake.moveDir, [0, 0]) && JSON.stringify(this.allPlayersData[key][2]).indexOf(JSON.stringify(this.snake.coords)) !== -1)
                this.die();
            if (this.snake != null && !this.snake.isInvulnerable && ((this.snake.coords[0] > 990 || this.snake.coords[0] < 0) || (this.snake.coords[1] > 990 || this.snake.coords[1] < 0)))
                this.die();
        }
        if (this.running) {
            setTimeout(() => {
                if (this.snake != null) {
                    this.snake.acceptingInput = true;
                }
                this.tick();
            }, this.refreshTime);
        }
    }
    die() {
        // @ts-ignore
        Swal.fire({
            title: 'Game Over',
            text: 'Do you want to respawn?',
            footer: `<div>You had a length of ${this.snake.length}</div>`,
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        }).then((result) => {
            if (result.isConfirmed) {
                this.snake = new Snake(0, 0, 5);
                this.snake.isInvulnerable = true;
                this.updateInfo();
                setTimeout(() => {
                    this.snake.isInvulnerable = false;
                }, 1000);
            }
        });
        socket.emit("send-data", ["name", this.playerColor, []]);
        this.snake = null;
        this.updateInfo();
    }
    updateInfo() {
        let time;
        let length;
        if (this.snake)
            length = `${this.snake.length}`;
        else
            length = 'Dead';
        if (this.timeLeft)
            time = `${this.timeLeft}s`;
        else
            time = 'Unlimited';
        $("#gameinfo").html(`Length: ${length}<br>Game Code: ${this.gameCode}<br>Time Left: ${time}`);
    }
}
function arrayEquals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}
