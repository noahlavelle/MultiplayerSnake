const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 80;
const fs = require("fs");
const games = {};

app.get('*', (req, res) => {
    let file;
    let readFile = true;
    let url = req.url.split("?")[0];

    /\./.test(url) ? file = `./public${url}` : file = `./public${url}/index.html`;

    if (url.includes("/play")) {
        let urlEnd = url.split("/")[url.split("/").length - 1].replace("/", "");
        
        if (urlEnd in games) {
            file  = "./public/play.html"
        } else {
            res.redirect('/?b');
            readFile = false;
        }
    }

    if (url === "/home" || url === "/creategame" || url === "/options") {
        file  = "./public/index.html"
    }

    readFile ? (fs.existsSync(file) ? res.sendFile(`${__dirname}${file.replace('.', '')}`) : res.redirect('/?a')) : false;
});

io.on("connection", (socket) => {
    socket.on("idExists", (id) => {
        socket.emit("idExists", id in games);
    });

    socket.on("createGame", (refreshTime = 80, time = 180, getLength = true, canBlink = true, id = 0000) => {
            const game = new Game(refreshTime, time, getLength, canBlink);
            games[id] = game;
            game.id = id;
            game.tick();
    });

    socket.on("joinGame", (id, color, name) => {
        try {
            const game = games[id];
            game.players.push(socket);
            game.snakeData[socket.id] = {
                moveDir: [0, 0],
                boosting: false,
                coords: [0, 0],
                length: 100,
                alive: true,
                tail: [],
                color: color,
                name: name
            }

            socket.emit("gameData", game.id);
            game.addPlayer(socket);
        } catch {}
    });
});

http.listen(port, () => {
    console.log('listening on *' + port);
});
// @ts-ignore
class Game {
    constructor(refreshTime, time, getLength, canBlink) {
        this.players = [];
        this.min = 0;
        this.max = 950;
        this.gridSize = 30;
        this.refreshTime = 100;
        this.running = true;
        this.refreshTime = refreshTime;
        this.time = time;
        this.getLength = getLength;
        this.canBlink = canBlink;

        this.snakeData = {}
        this.snakeData.food = [];

        this.createEvents();
        this.createFood(1, true);
        this.timer();
    }

    createFood(size, natural, x = Math.round(Math.round((Math.random() * (this.max - this.min)) + this.min) / this.gridSize) * this.gridSize, y = Math.round(Math.round((Math.random() * (this.max - this.min)) + this.min) / this.gridSize) * this.gridSize, color = null) {
        let foodData = [x, y, size, natural];
        if (color != null) {
            foodData.push(color);
        }
        this.snakeData.food.push(foodData);
    }

    events(socket) {
        let timeout;

        socket.on("snakeMove", (dir) => {
            try {
                this.snakeData[socket.id].moveDir = dir;
                clearTimeout(timeout);

                timeout = setTimeout(() => {
                    socket.emit("gameEnd");
                    delete games[this.id];
                }, 300000)
            } catch {}
        });

        socket.on("leave", () => {
            this.players.splice(this.players.indexOf(socket.id), 1);
            delete this.snakeData[socket.id];
        })

        socket.on("respawn", () => {
            this.snakeData[socket.id] =  {
                moveDir: [0, 0],
                coords: [0, 0],
                length: 5,
                tail: [],
                alive: true,
                color: this.snakeData[socket.id].color,
                name: this.snakeData[socket.id].name,
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
                        delete games[this.id];
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
            let objectEntries = Object.entries(this.snakeData);

            objectEntries.forEach(playerO => {
                let player = playerO[1];

                if (player.alive) {

                    if (!this.canBlink) {
                        player.moveDir[0] = Math.max(-1, Math.min(player.moveDir[0], 1));
                        player.moveDir[1] = Math.max(-1, Math.min(player.moveDir[1], 1));
                    }

                    if (player.length > 5 && (player.moveDir[0] > 1 || player.moveDir[0] < -1 || player.moveDir[1] > 1 || player.moveDir[1] < -1)) {
                        player.tail.pop();
                        let coords = [player.coords[0], player.coords[1]];
                        let size = Math.floor(this.snakeData[playerO[0]].length / 3);
                        player.length = Math.floor(player.length / 3);
                        this.emit("blink", playerO[0]);

                        setInterval (() => {
                            if(player.tail.length > player.length) {
                                player.tail.pop();
                            } else {
                                clearInterval(this)
                            }
                        }, this.refreshTime)

                        setTimeout (() => {
                            this.createFood(size, false, coords[0], coords[1], player.color)
                        }, this.refreshTime)
                    } else {
                        player.tail.unshift([player.coords[0], player.coords[1]]);
                        if (player.tail.length > player.length) {
                            player.tail.pop();
                        }
                    }
                    
                    if (player.length == 0 && player.alive) {
                        this.emit("die", playerO[0]);

                        this.snakeData[playerO[0]] =  {
                            moveDir: [0, 0],
                            coords: [0, 0],
                            length: 0,
                            alive: false,
                            tail: [],
                            color: player.color,
                            name: player.name
                        }
                    }
                    

                    this.snakeData.food.forEach((data) => {
                        if (this.arrayEquals(player.coords, [data[0], data[1]])) {
                            this.snakeData.food = this.snakeData.food.filter((e) => { return e !== data })
                            this.emit("eatFood", playerO[0]);
                            player.length += data[2];
                            if (data[3]) this.createFood(1, true);
                        }
                    })
        
                    player.coords[0] += player.moveDir[0] * this.gridSize;
                    player.coords[1] += player.moveDir[1] * this.gridSize;
    
                    if ((player.coords[0] < 0 || player.coords[0] >= 990) || (player.coords[1] < 0 || player.coords[1] >= 990)) {
                        this.snakeData[playerO[0]] =  {
                            moveDir: [0, 0],
                            coords: [0, 0],
                            length: 0,
                            alive: false,
                            tail: [],
                            color: player.color,
                            name: player.name
                        }

                        this.emit("die", playerO[0])
                    }
                }
            });

            objectEntries.forEach(player => {
                let playerID = player[0];
                player = player[1];

                if (player.alive && !this.arrayEquals(player.moveDir, [0, 0])) {
                    objectEntries.forEach(playerCollisionCheck => {
                        if (playerCollisionCheck[1].alive && JSON.stringify(playerCollisionCheck[1].tail).includes(JSON.stringify(player.coords))) {
                            if (this.getLength) {
                                this.snakeData[playerCollisionCheck[0]].length += this.snakeData[playerID].length;
                            }

                            this.snakeData[playerID] =  {
                                moveDir: [0, 0],
                                coords: [0, 0],
                                length: 0,
                                alive: false,
                                tail: [],
                                color: player.color,
                                name: player.name
                            }

                            this.emit("die", playerID);
                        }
                    })
                }
            });

            this.players.forEach(socket => {
                socket.emit("drawGame", this.snakeData);
            })
        }, this.refreshTime)
    }

    emit (emits, socketID) {
        this.players.some(socket => {
            if (socket.id == socketID) {
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
