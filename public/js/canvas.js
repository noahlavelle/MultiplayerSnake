const canvas = document.getElementById('gamecanvas');
const ctx = canvas.getContext('2d');
let keyPressed = false;
function draw(x, y, gridSize, color) {
    ctx.lineWidth = 2;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, gridSize, gridSize);
    ctx.strokeRect(x, y, gridSize, gridSize);
}
function renderSnake(tail, color, gridSize) {
    ctx.lineWidth = 4;
    ctx.fillStyle = color;
    ctx.save();
    ctx.beginPath();
    tail.forEach(coord => {
        ctx.rect(coord[0], coord[1], gridSize, gridSize);
    });
    ctx.stroke();
    ctx.clip();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
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
