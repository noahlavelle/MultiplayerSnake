const canvas = <HTMLCanvasElement> document.getElementById('gamecanvas');
const ctx = canvas.getContext('2d');
let keyPressed = false;
function draw(x, y, gridSize, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, gridSize, gridSize);
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