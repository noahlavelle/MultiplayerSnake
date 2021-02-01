const pages = ["#home", "#creategame", "#options, #game"];
const titles = ["Snake", "Snake | Create Gane", "Snake | Options, Snake | Game"];
const errorCodes = ["?a", "?b"];
let game;
function reset() {
    hideAll();
    if (pages.includes(location.hash))
        document.title = titles[pages.indexOf(location.hash)];
    if (location.hash == "") {
        $('#home').show();
    }
    else {
        $(location.hash).show();
    }
    if (game != undefined && location.hash != "#game") {
        socket.emit("send-data", []);
        game.running = false;
    }
}
if (location.search) {
    let error = location.search;
    history.replaceState(null, null, '/');
    if (error == '?a') {
        // @ts-ignore
        Swal.fire({
            icon: 'error',
            title: '404 Error',
            text: 'The requested file cannot be found',
        });
    }
    else if (error == '?b') {
        // @ts-ignore
        Swal.fire({
            icon: 'error',
            title: 'Game not found',
        });
    }
    else if (error == '?c') {
        // @ts-ignore
        Swal.fire({
            icon: 'error',
            title: 'The Game has timed out'
        });
    }
    ;
}
;
jQuery(() => {
    let playerColor = localStorage.getItem("player-color");
    let canvasColor = localStorage.getItem("canvas-color");
    let foodColor = localStorage.getItem("food-color");
    onresize = () => {
        if (innerHeight > innerWidth) {
            document.getElementById('gamecanvas').style.width = '80vw';
            document.getElementById('gamecanvas').style.height = '80vw';
        }
        else {
            document.getElementById('gamecanvas').style.width = '80vh';
            document.getElementById('gamecanvas').style.height = '80vh';
        }
    };
    // @ts-ignore
    onresize();
    reset();
    window.onpopstate = () => {
        reset();
    };
    $("#color-pickers").children().toArray().forEach((child) => {
        let currentColor = null;
        switch (child.getAttribute("value")) {
            case "player-color":
                if (playerColor == null) {
                    playerColor = child.getAttribute("default");
                }
                currentColor = playerColor;
                break;
            case "canvas-color":
                if (canvasColor == null) {
                    canvasColor = child.getAttribute("default");
                }
                currentColor = canvasColor;
                break;
            case "food-color":
                if (foodColor == null) {
                    foodColor = child.getAttribute("default");
                }
                currentColor = foodColor;
                break;
        }
        const newElement = document.createElement("span");
        child.append(newElement);
        // @ts-ignore
        const pickr = Pickr.create({
            el: newElement,
            theme: 'classic',
            default: currentColor,
            swatches: [
                'rgba(244, 67, 54, 1)',
                'rgba(233, 30, 99, 1)',
                'rgba(156, 39, 176, 1)',
                'rgba(103, 58, 183, 1)',
                'rgba(63, 81, 181, 1)',
                'rgba(33, 150, 243, 1)',
                'rgba(3, 169, 244, 1)',
                'rgba(0, 188, 212, 1)',
                'rgba(0, 150, 136, 1)',
                'rgba(76, 175, 80, 1)',
                'rgba(139, 195, 74, 1)',
                'rgba(205, 220, 57, 1)',
                'rgba(255, 235, 59, 1)',
                'rgba(255, 193, 7, 1)'
            ],
            components: {
                // Main components
                preview: true,
                opacity: false,
                hue: true,
                // Input / output Options
                interaction: {
                    hex: true,
                    rgba: true,
                    hsla: true,
                    hsva: true,
                    cmyk: true,
                    input: true,
                    clear: true,
                    save: true
                }
            }
        });
        pickr.on('save', (color) => {
            localStorage.setItem(child.getAttribute("value"), color.toHEXA().toString());
        });
    });
});
$("body").on("mousemove", (event) => {
    $(".background").css("background-position", `${event.clientX * 0.033}% ${event.clientY * 0.033}%`);
});
function hideAll() {
    pages.forEach((page) => {
        $(page).hide();
    });
}
$("#joingame").on("click", () => {
    // @ts-ignore
    Swal.fire({
        title: 'Enter Game ID',
        input: 'text',
        inputAttributes: {
            autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Look up',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            // @ts-ignore
            let id = $(Swal.getInput()).val();
            return new Promise((resolve, reject) => {
                socket.emit("gameslist");
                socket.on("gameslist", (gameslist) => {
                    if (!gameslist.includes(id)) {
                        reject();
                    }
                    else {
                        resolve(id);
                    }
                });
            }).catch(() => {
                // @ts-ignore
                Swal.showValidationMessage(`Request failed: Game not found`);
            });
        },
        allowOutsideClick: true
    }).then((result) => {
        if (result.isConfirmed) {
            if (result != undefined) {
                socket.emit("joingame", result.value);
                location.hash = "#game";
                game = new Game;
            }
        }
    });
});
$("#play").on("click", () => {
    // @ts-ignore
    socket.emit("creategame", 100 / ((Number.parseInt($("#gamespeed").val()) + 50) / 100), Number.parseInt($("#gametime").val()) + 50);
    game = new Game;
});
class Slider {
    constructor(slider) {
        this.slider = slider;
        this.input = $(this.slider).find("input");
        this.value = $(this.slider).find("#value");
        this.monitor();
        this.updateSlider();
    }
    updateSlider() {
        var rangePercent = $(this.input).val();
        $(this.input).css('filter', 'hue-rotate(-' + rangePercent + 'deg)');
        $(this.value).html(`${Number.parseInt(rangePercent) + Number.parseInt($(this.value).attr("startingvalue"))}${$(this.value).attr("symbol")}`);
        if ($(this.value).attr("maxspecial") != undefined && rangePercent == 100) {
            $(this.value).html($(this.value).attr("maxspecial"));
        }
    }
    monitor() {
        $(this.input).on('change input', () => {
            this.updateSlider();
        });
    }
}
$("#creategame > div > .options").children().toArray().forEach((child) => {
    const slider = new Slider(child);
});
