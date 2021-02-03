// @ts-ignore
let socket = io();
let game;
jQuery(() => {
    game = new Game();
    draw(0, 0, 990, localStorage.getItem("canavs-color") || "#ffffff");
    // @ts-ignore
    Swal.fire({
        title: 'Enter Username',
        input: 'text',
        inputAttributes: {
            autocapitalize: 'off'
        },
        allowOutsideClick: false,
        confirmButtonText: 'Play',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            // @ts-ignore
            let name = $(Swal.getInput()).val();
            return new Promise((resolve, reject) => {
                if (name.length > 16 || !name.trim())
                    reject();
                else
                    resolve(name.trim());
            }).catch(() => {
                // @ts-ignore
                Swal.showValidationMessage(`Name invalid (Max 16 Characters)`);
            });
        },
    }).then((name) => {
        socket.emit("joinGame", location.pathname.split("/")[location.pathname.split("/").length - 1], localStorage.getItem("player-color") || "#0096C7", name.value);
    });
});
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
    arrayEquals(a, b) {
        return Array.isArray(a) &&
            Array.isArray(b) &&
            a.length === b.length &&
            a.every((val, index) => val === b[index]);
    }
    inputHandling() {
        const keyBinds = JSON.parse(localStorage.getItem("keybinds"));
        const inputMaps = {
            [keyBinds["up"]]: [0, -1],
            [keyBinds["left"]]: [-1, 0],
            [keyBinds["down"]]: [0, 1],
            [keyBinds["right"]]: [1, 0]
        };
        let touchStart;
        document.addEventListener("touchstart", (event) => {
            touchStart = [event.touches[0].clientX, event.touches[0].clientY];
        });
        document.addEventListener("touchend", event => {
            let touchEnd = [event.changedTouches[0].clientX, event.changedTouches[0].clientY];
            let angleDeg = Math.round((Math.atan2(touchStart[0] - touchEnd[0], touchStart[1] - touchEnd[1]) * 180 / Math.PI) / 90) * 90;
            switch (angleDeg) {
                case 0:
                case -0:
                    if (this.arrayEquals([0, 1], this.moveDir.map(Math.abs)))
                        return;
                    this.moveDir = [0, -1];
                    break;
                case -90:
                    if (this.arrayEquals([1, 0], this.moveDir.map(Math.abs)))
                        return;
                    this.moveDir = [1, 0];
                    break;
                case 180:
                case -180:
                    if (this.arrayEquals([0, 1], this.moveDir.map(Math.abs)))
                        return;
                    this.moveDir = [0, 1];
                    break;
                case 90:
                    if (this.arrayEquals([1, 0], this.moveDir.map(Math.abs)))
                        return;
                    this.moveDir = [-1, 0];
                    break;
            }
            if ((this.arrayEquals(this.moveDir, [-1, 0]) || this.arrayEquals(this.moveDir, [0, -1])) && this.arrayEquals(this.coords, [0, 0]))
                this.moveDir = [0, 0];
            socket.emit("snakeMove", this.moveDir);
        });
        $(document).on("keydown", (event) => {
            if (this.acceptingInput && event.key in inputMaps) {
                this.acceptingInput = false;
                if (this.arrayEquals(inputMaps[event.key].map(Math.abs), this.moveDir.map(Math.abs)))
                    return;
                this.moveDir = inputMaps[event.key] != undefined ? inputMaps[event.key] : this.moveDir;
                if ((this.arrayEquals(this.moveDir, [-1, 0]) || this.arrayEquals(this.moveDir, [0, -1])) && this.arrayEquals(this.coords, [0, 0]))
                    this.moveDir = [0, 0];
                socket.emit("snakeMove", this.moveDir);
            }
        });
    }
}
class Game {
    constructor() {
        this.allPlayersData = {};
        this.gridSize = 30;
        this.running = true;
        this.playerColor = localStorage.getItem("player-color") || "#A686C7";
        this.foodColor = localStorage.getItem("food-color") || "#FE6F61";
        this.snake = new Snake(0, 0, 5);
        this.initEvents();
    }
    initEvents() {
        $("#fullscreen").on("click", () => {
            // @ts-ignore
            if (document.webkitIsFullScreen || document.mozFullScreen || document.fullscreen || false) {
                document.exitFullscreen();
            }
            else {
                document.documentElement.requestFullscreen();
            }
            ;
        });
        $("#gameInfo").on("click", () => {
            const el = document.createElement('textarea');
            el.value = `${location.href}`;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            // @ts-ignore
            Swal.fire({
                title: 'Link Copied',
                icon: 'success',
                timer: 800,
                timerProgressBar: true,
                position: 'bottom-end',
                showConfirmButton: false,
                backdrop: false
            });
        });
        $("#respawn").on("click", () => {
            socket.emit("respawn");
        });
        socket.on("gameData", id => {
            this.gameCode = id;
        });
        socket.on("gameEnd", this.gameEnd);
        socket.on("drawGame", snakeData => {
            if (!this.running)
                return;
            this.snake.acceptingInput = true;
            let player;
            clear();
            for (player of Object.entries(snakeData)) {
                if (player[0] === "food") {
                    draw(player[1].coords[0], player[1].coords[1], this.gridSize, this.foodColor);
                    continue;
                }
                else if (player[0] == "time") {
                    this.timeLeft = player[1].display;
                }
                if (player[0] == socket.id) {
                    this.snake.coords = [player[1].coords[0], player[1].coords[1]];
                    this.snake.length = player[1].length;
                }
                player = player[1];
                if (player.alive) {
                    renderSnake(player.tail, player.color, this.gridSize, player.coords, player.name);
                }
            }
            this.updateInfo();
        });
        socket.on("die", () => {
            if (this.running) {
                this.die();
            }
        });
    }
    gameEnd() {
        location.href = `${location.href.split("/")[0]}/?c`;
        this.running = false;
    }
    die() {
        this.snake.moveDir = [0, 0];
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
                socket.emit("respawn");
                this.snake.isInvulnerable = true;
                this.updateInfo();
                setTimeout(() => {
                    this.snake.isInvulnerable = false;
                }, 1000);
            }
        });
        this.updateInfo();
    }
    updateInfo() {
        let time;
        let length;
        if (this.snake)
            length = `${this.snake.length}`;
        else
            length = 'Dead';
        $("#gameInfo").html(`Length: ${length}<br>Game Code: ${this.gameCode}<br>Ends: ${this.timeLeft || "..."}`);
    }
}
