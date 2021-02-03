const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 80;
const fs = require("fs");
const { emit } = require('process');
const games = {};
app.get('*', (req, res) => {
    let file;
    let readFile = true;
    let url = req.url.split("?")[0];
    let urlEnd = url.split("/")[url.split("/").length - 1].replace("/", "");

    /\./.test(url) ? file = `./public${url}` : file = `./public${url}/index.html`;

    if (url === "/home" || url === "/creategame" || url === "/options" || url === "/game") {
        file  = "./public/index.html"
    }

    readFile ? (fs.existsSync(file) ? res.sendFile(`${__dirname}${file.replace('.', '')}`) : res.redirect('/?a')) : false;
});

io.on("connection", (socket) => {
    socket.on("gameslist", () => {
        socket.emit("gameslist", Object.keys(games));
    });

    socket.on("createGame", (refreshTime, time, getLength, color) => {
        const game = new Game(refreshTime, time, getLength);
        game.players.push(socket);
        game.snakeData[socket.id] = {
            moveDir: [0, 0],
            coords: [0, 0],
            length: 5,
            alive: true,
            tail: [],
            color: color
        }

        socket.emit("gameData", game.id);
        game.addPlayer(socket);
        game.tick();
    });

    socket.on("joinGame", (id, color) => {
        try {
            const game = games[id];
            game.players.push(socket);
            game.snakeData[socket.id] = {
                moveDir: [0, 0],
                coords: [0, 0],
                length: 5,
                alive: true,
                tail: [],
                color: color
            }

            socket.emit("gameData", game.id);
            game.addPlayer(socket);
        } catch {};
    });
});

http.listen(port, () => {
    console.log('listening on *' + port);
});
// @ts-ignore
class Game {
    constructor(refreshTime, time, getLength) {
        this.players = [];
        this.min = 0;
        this.max = 950;
        this.gridSize = 30;
        this.foodCoords = [];
        this.refreshTime = 100;
        this.running = true;
        this.refreshTime = refreshTime;
        this.time = time;
        this.getLength = getLength;

        this.snakeData = {
            /*
            movedir:
            coords:
            length:
            tail:
            */
        }

        this.generateID();
        this.createEvents();
        this.createFood();
        this.timer();
    }
    generateID() {
        this.id = (Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000).toString();
        if (games.hasOwnProperty(this.id)) {
            this.generateID;
        }
        else {
            games[this.id] = this;
        }
    }
    createFood() {
        let x = Math.round(Math.round((Math.random() * (this.max - this.min)) + this.min) / this.gridSize) * this.gridSize;
        let y = Math.round(Math.round((Math.random() * (this.max - this.min)) + this.min) / this.gridSize) * this.gridSize;
        this.foodCoords = [x, y];
        this.snakeData.food = {
            coords: this.foodCoords
        }
    }

    events(socket) {
        socket.on("snakeMove", dir => {
            this.snakeData[socket.id].moveDir = dir;
        });

        socket.on("respawn", () => {
            this.snakeData[socket.id] =  {
                moveDir: [0, 0],
                coords: [0, 0],
                length: 5,
                tail: [],
                alive: true,
                color: this.snakeData[socket.id].color
            }
        })
    }

    createEvents() {
        this.players.forEach(socket => {
            this.events(socket);
        })
    }
    addPlayer(socket) {
        this.events(socket);
    }

    timer () {
        let displayTime;

        setInterval(() => {
            if (this.time == 180) {
                displayTime = "NEVER"
            } else {
                this.time--;
                displayTime = this.time + "s";
                if (this.time == 0) {
                    this.players.forEach((socket) => {
                        socket.emit("gameEnd");
                    })
                }
            }

            this.snakeData.time = {
                display: displayTime
            };
        }, 1000)
    }

    tick() {
        setInterval(() => {
            // if (!this.running) return;
            let objectEntries = Object.entries(this.snakeData);

            objectEntries.forEach(playerO => {
                let player = playerO[1];

                if (player.alive) {
                    player.tail.unshift([player.coords[0], player.coords[1]]);
                    if (player.tail.length > player.length) {
                        player.tail.pop();
                    }

                    if (this.arrayEquals(player.coords, this.foodCoords)) {
                        player.length++;
                        this.createFood();
                    }
        
                    player.coords[0] += player.moveDir[0] * this.gridSize;
                    player.coords[1] += player.moveDir[1] * this.gridSize;
    
                    if ((player.coords[0] < 0 || player.coords[0] >= 990) || (player.coords[1] < 0 || player.coords[1] >= 990)) {
                        this.snakeData[playerO[0]] =  {
                            moveDir: [0, 0],
                            coords: [0, 0],
                            length: 0,
                            alive: false,
                            tail: [],
                            color: player.color
                        }

                        this.emit("die", playerO[0])
                    }
        
                    if (this.arrayEquals(this.foodCoords, player.coords)) {
                        player.length++;
                    }
                }
            });

            objectEntries.forEach(player => {
                player = player[1];

                if (player.alive) {
                    Object.keys(this.snakeData).some(key => {
                        if (key !== "food" && key !== "time")  {
                            this.snakeData[key].tail.forEach(coord => {
                                if (!this.arrayEquals(player.moveDir, [0, 0]) && this.arrayEquals(coord, player.coords)) {
                                        this.snakeData[key] =  {
                                            moveDir: [0, 0],
                                            coords: [0, 0],
                                            length: 0,
                                            alive: false,
                                            tail: [],
                                            color: player.color
                                        }
            
                                        this.emit("die", key);
                                    }
                                });
                            }
                    }); 
                }
            })

            this.players.forEach(socket => {
                socket.emit("drawGame", this.snakeData);
            })
        }, this.refreshTime)
    }

    emit (emits, key) {
        this.players.some(socket => {
            if (socket.id == key) {
                socket.emit(emits);
            }
        })
    }

    arrayEquals(a, b) {
        return Array.isArray(a) &&
          Array.isArray(b) &&
          a.length === b.length &&
          a.every((val, index) => val === b[index]);
    }
}
