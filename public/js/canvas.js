const canvas = document.getElementById('gamecanvas');
const ctx = canvas.getContext('2d');
let keyPressed = false;
function draw(x, y, gridSize, color) {
    ctx.lineWidth = 2;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, gridSize, gridSize);
    ctx.strokeRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
}
function renderSnake(tail, color, gridSize, coords) {
    ctx.fillStyle = color;
    ctx.fillRect(coords[0], coords[1], gridSize, gridSize);
    tail.forEach(coord => {
        ctx.fillRect(coord[0], coord[1], gridSize, gridSize);
    });
}
function clear() {
    ctx.fillStyle = localStorage.getItem("canvas-color") || "#ffffff";
    ctx.fillRect(0, 0, 990, 990);
}
function text(text, font, color, xOffset, yOffset) {
    ctx.fillStyle = color;
    ctx.font = "25px " + font;
    ctx.fillText(text, xOffset, yOffset);
}
