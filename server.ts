import { Socket } from "socket.io";

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 80;
const fs = require("fs");
const games : any = {
}

app.get('*', (req, res) => {
    let file
    let readFile : boolean = true;
    let url : any = req.url.split("?")[0];
  
    /\./.test(url) ? file = `./public${url}` : file = `./public${url}/index.html`;
    readFile ? (fs.existsSync(file) ? res.sendFile(`${__dirname}${file.replace('.', '')}`) : res.redirect('/?a')) : false;
});

io.on("connection", (socket) => {
    socket.on("gameslist", () => {
        
        socket.emit("gameslist", Object.keys(games));
    });

    socket.on("creategame", () => {
        const game = new Game(socket);
        console.log(game.id)
    });

    socket.on("joingame", (id) => {
        console.log(id)
        const game = games[id];
        console.log(game)
        game.players.push(socket);
    })
})

http.listen(port, () => {
    console.log('listening on *' + port);
});

class Game {
    players : Socket[] = [];
    playerData = {}
    id : string;
    min : number = 0;
    max : number = 1000;
    gridSize : number = 30;

    constructor (socket) {
        this.players.push(socket);
        this.generateID();
        this.createEvents();
        this.tick();
        this.createFood();
    }

    generateID() {
        this.id = (Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000).toString(); 
        if (games.hasOwnProperty(this.id)) {
            this.generateID;
        } else {
            games[this.id] = this;
        }
    }

    createFood() {
        let x : number = Math.round(Math.round((Math.random() * (this.max - this.min)) + this.min) / this.gridSize) * this.gridSize
        let y : number = Math.round(Math.round((Math.random() * (this.max - this.min)) + this.min) / this.gridSize) * this.gridSize
        for (let socket of this.players) {
            socket.emit("new-food", [x, y]);
        }
    }

    createEvents() {
        for (let socket of this.players) {
            socket.on("send-data", (data) => {
                this.playerData[socket.id] = data;
            });
        }
    }

    tick() {
        for (let socket of this.players) {
            socket.emit("player-data", this.playerData);
        }
        setTimeout(() => {
            this.tick();
        }, 100)
    }
}
  