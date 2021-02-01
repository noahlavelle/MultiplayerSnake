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
    readFile ? (fs.existsSync(file) ? res.sendFile(`${__dirname}${file.replace('.', '')}`) : res.redirect('/?a')) : false;
});
io.on("connection", (socket) => {
    socket.on("gameslist", () => {
        socket.emit("gameslist", Object.keys(games));
    });
    socket.on("creategame", (refreshTime, time, getLength) => {
        const game = new Game(socket, refreshTime, time, getLength);
        if (time == 180) {
            time = undefined;
        }
        socket.emit("game-data", [refreshTime, game.id, time]);
    });
    socket.on("joingame", (id) => {
        const game = games[id];
        socket.emit("game-data", [game.refreshTime, game.id, game.getLength]);
        game.players.push(socket);
        game.addPlayer(socket);
    });
});
http.listen(port, () => {
    console.log('listening on *' + port);
});
// @ts-ignore
class Game {
    constructor(socket, refreshTime, time, getLength) {
        this.players = [];
        this.playerData = {};
        this.min = 0;
        this.max = 950;
        this.gridSize = 30;
        this.foodCoords = [];
        this.refreshTime = 100;
        this.running = true;
        this.refreshTime = refreshTime;
        this.time = time;
        this.players.push(socket);
        this.getLength = getLength;

        this.generateID();
        this.createEvents();
        this.tick();
        this.createFood();
        setTimeout(() => {
            this.running = false;
        }, time * 1000);
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
        for (let socket of this.players) {
            socket.emit("new-food", [x, y]);
        }
    }
    createEvents() {
        for (let socket of this.players) {
            socket.on("send-data", (data) => {
                this.playerData[socket.id] = data;
            });
            socket.on("new-food", () => {
                this.createFood();
            });
            socket.on("add-length", (id, length) => {
                for (let s of this.players) {
                    if (s.id == id) {
                        s.emit("add-length", length);
                    }
                }
            })
        }
    }
    addPlayer(socket) {
        socket.on("send-data", (data) => {
            this.playerData[socket.id] = data;
        });
        socket.on("new-food", () => {
            this.createFood();
        });
        socket.on("add-length", (id, length) => {
            for (let s of this.players) {
                if (s.id == id) {
                    s.emit("add-length", length);
                }
            }
        })
        socket.emit("new-food", this.foodCoords);
    }
    tick() {
        if (this.running) {
            for (let socket of this.players) {
                socket.emit("player-data", this.playerData);
            }
            setTimeout(() => {
                this.tick();
            }, this.refreshTime);
        }
    }
}
