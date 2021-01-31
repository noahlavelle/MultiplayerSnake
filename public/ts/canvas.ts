const canvas = <HTMLCanvasElement> document.getElementById('gamecanvas');
const ctx = canvas.getContext('2d');
const w = window.innerWidth;
const h =window.innerHeight;
canvas.width  = w - (w *0.019);
canvas.height = h - (h *0.033);
let keyPressed = false;

function draw(x, y, gridSize, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, gridSize, gridSize);
}

function clear() {
    ctx.fillStyle = '#23272a';
    ctx.fillRect(0, 0, w, h);
}

function end(game, length) {
    game.started = false;
    game.snake.length = length;
    game.snake.x = 0;
    game.snake.y = 0;
    game.snake.moveDir = [0, 0]
    game.food = new Food(game.makeFoodCoords(canvas.width), game.makeFoodCoords(canvas.height));
}

function text(text, font, color, xOffset, yOffset) {
    ctx.fillStyle = color;
    ctx.font = "25px "+font;
    ctx.fillText(text, xOffset, yOffset); 
}