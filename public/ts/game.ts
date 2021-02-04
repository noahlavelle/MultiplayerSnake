// @ts-ignore
let socket : any = io();

let game;

jQuery(() => {
    game = new Game();
    draw(0, 0, 990, localStorage.getItem("canavs-color") || "#ffffff")

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
            let name : any = $(Swal.getInput()).val();
            return new Promise( (resolve, reject) => {
                if (name.length > 16 || !name.trim()) reject();
                else resolve (name.trim())
            }).catch(() => {
                // @ts-ignore
                Swal.showValidationMessage(
                    `Name invalid (Max 16 Characters)`
                )
            })
        },
    }).then((name) => {
        socket.emit("joinGame", location.pathname.split("/")[location.pathname.split("/").length - 1], localStorage.getItem("player-color") || "#0096C7", name.value)
    })
})

class Food {
    coords: number[];

    constructor (x, y) {
        this.coords = [x, y];
    }
}

class Snake {
    coords: number[];
    length: number;
    moveDir: number[] = [0, 0];
    tail: number[][];
    isInvulnerable : boolean;
    acceptingInput : boolean = true;

    constructor (x, y, length) {
        this.coords = [x, y]
        this.length = length

        this.moveDir = [0, 0];
        this.tail = [];

        this.inputHandling();
    }

    arrayEquals(a : any[], b: any[]) {
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
            [keyBinds["right"]]: [1, 0],
        }

        let touchStart : number[];

        document.addEventListener("touchstart", (event) => {
            touchStart = [event.touches[0].clientX, event.touches[0].clientY];
        });

        document.addEventListener("touchend", event => {
            let touchEnd : number[] = [event.changedTouches[0].clientX, event.changedTouches[0].clientY]
            let angleDeg : number = Math.round((Math.atan2(touchStart[0] - touchEnd[0], touchStart[1] - touchEnd[1]) * 180 / Math.PI) / 90) * 90;
            switch (angleDeg) {
                case 0:
                case -0:
                    if (this.arrayEquals([0, 1], this.moveDir.map(Math.abs))) return;
                    this.moveDir = [0, -1]
                break;
                case -90:
                    if (this.arrayEquals([1, 0], this.moveDir.map(Math.abs))) return;
                    this.moveDir = [1, 0]
                break;
                case 180:
                case -180:
                    if (this.arrayEquals([0, 1], this.moveDir.map(Math.abs))) return;
                    this.moveDir = [0, 1]
                break;
                case 90:
                    if (this.arrayEquals([1, 0], this.moveDir.map(Math.abs))) return;
                    this.moveDir = [-1, 0]
                break;
            }

            if ((this.arrayEquals(this.moveDir, [-1, 0]) || this.arrayEquals(this.moveDir, [0, -1])) && this.arrayEquals(this.coords, [0, 0])) this.moveDir = [0, 0]

            socket.emit("snakeMove", this.moveDir);
        })
        
        document.addEventListener("keydown", (event) => {
            if (event.repeat) return;

            let inputMaps = {
                [keyBinds["up"]]: [0, -1],
                [keyBinds["left"]]: [-1, 0],
                [keyBinds["down"]]: [0, 1],
                [keyBinds["right"]]: [1, 0],
            }

            if (this.acceptingInput && (event.key in inputMaps) || event.key == keyBinds["boost"]) {
                this.acceptingInput = false;
                try {
                    if (this.arrayEquals(inputMaps[event.key].map(Math.abs), this.moveDir.map(Math.abs))) return;
                } catch {}
                this.moveDir = inputMaps[event.key] != undefined ? inputMaps[event.key] : this.moveDir;
                
                if ((this.arrayEquals(this.moveDir, [-1, 0]) || this.arrayEquals(this.moveDir, [0, -1])) && this.arrayEquals(this.coords, [0, 0])) this.moveDir = [0, 0]

                if (event.key == keyBinds["boost"] && this.length > 5) {
                    this.moveDir[0] = Math.max(-4, Math.min(this.moveDir[0] * 4, 4));
                    this.moveDir[1] = Math.max(-4, Math.min(this.moveDir[1] * 4, 4));

                    setTimeout(() => {
                        this.moveDir[0] /= 4;
                        this.moveDir[1] /= 4;

                        socket.emit("snakeMove", this.moveDir);
                    }, 100)
                }

                socket.emit("snakeMove", this.moveDir);
            }
        });
    }
}

class Game {
    
    snake: Snake;
    food : Food;
    allPlayersData = {};
    gridSize : number =  30;
    running : boolean = true;
    gameCode : number;
    timeLeft : number;
    eatFoodSFX : any;
    dieSFX : any
    blinkSFX : any;

    playerColor : string = localStorage.getItem("player-color") || "#A686C7";
    foodColor : string = localStorage.getItem("food-color") || "#FE6F61";

    constructor () {
        this.snake = new Snake(0, 0, 5);
        this.eatFoodSFX = new Audio("/sounds/food.wav");
        this.dieSFX = new Audio("/sounds/die.wav");
        this.blinkSFX = new Audio("/sounds/blink.wav");
        this.dieSFX.volume = 0.6;

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
            };
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
              })
        })


        $("#respawn").on("click", () => {
            socket.emit("respawn");
        })

        socket.on("gameData", id => {
            this.gameCode = id;
        })

        socket.on("gameEnd", this.gameEnd);

        socket.on("drawGame", snakeData => {
            if (!this.running) return;

            this.snake.acceptingInput = true;
            let player : any;

            clear();
            for (player of Object.entries(snakeData)) {
                if (player[0] === "food") {
                    for (let coord of player[1]) {
                        let color
                        if (coord[4] != null) color = coord[4];
                        else color = this.foodColor;
                        draw(coord[0], coord[1], this.gridSize, color);
                    }
                    
                    continue;
                } else if (player[0] == "time") {
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

        socket.on("eatFood", () => {
            this.eatFoodSFX.play();
        })

        socket.on("blink", () => {
            this.blinkSFX.play();
        })

        socket.on("die", () => {
            if (this.running) {
                this.die();
            }
        })
    }

    gameEnd() {
        location.href = `${location.href.split("/")[0]}/?c`
        this.running = false;
    }

    die() {
        this.dieSFX.play();
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
                setTimeout (() => {
                    this.snake.isInvulnerable = false;
                }, 1000)
            }
        })

        this.updateInfo();
    }

    updateInfo() {
        let time : string;
        let length : string;

        if (this.snake) length = `${this.snake.length}`;
        else length = 'Dead';

        $("#gameInfo").html(`Length: ${length}<br>Game Code: ${this.gameCode}<br>Ends: ${this.timeLeft || "..."}`)
    }
}