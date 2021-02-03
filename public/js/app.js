// @ts-ignore
let socket = io();
const pages = ["/home", "/creategame", "/options", "/game"];
const titles = ["Snake", "Snake | Create Gane", "Snake | Options", "Snake | Game"];
const errorCodes = ["?a", "?b"];
let linkHandling;
let colorHandling;
let specialButtons;
class LinkHandling {
    constructor() {
        this.eventListner();
        this.errorHandling = new ErrorHandling();
        this.handle();
    }
    eventListner() {
        this.handle();
        window.onpopstate = () => {
            this.handle();
            this.errorHandling.handle();
        };
        $('a').on("click", (event) => {
            event.preventDefault();
            // @ts-ignore
            history.pushState(null, null, event.currentTarget.href);
            this.handle();
        });
        $(window).on("beforeunload", () => {
            socket.emit("leave");
        });
    }
    handle() {
        this.hideAll();
        if (pages.includes(location.pathname))
            document.title = titles[pages.indexOf(location.pathname)];
        if (location.hash.replace("#", "").length == 4 && !isNaN(Number.parseInt(location.hash.replace("#", "")))) {
            let id = location.pathname.split("/")[location.pathname.split("/").length - 1];
            socket.emit("idExists", id);
            socket.on("idExists", (exists) => {
                if (exists) {
                    location.pathname = `/play/${id}`;
                }
                else {
                    location.href = `${location.href.split("/")[0]}/?b`;
                }
            });
        }
        if (location.pathname == "/") {
            $('#home').show();
        }
        else {
            $(location.pathname.replace("/", "#")).show();
        }
    }
    hideAll() {
        pages.forEach((page) => {
            $(page.replace("/", "#")).hide();
        });
    }
}
class ErrorHandling {
    constructor() {
        this.handle();
    }
    handle() {
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
                    title: 'Time Up',
                    footer: `<div>You have been returned to the home screen</div>`,
                    confirmButtonText: 'Home',
                });
            }
            ;
        }
        ;
    }
}
class ColorHandling {
    constructor() {
        this.playerColor = localStorage.getItem("player-color");
        this.canvasColor = localStorage.getItem("canvas-color");
        this.foodColor = localStorage.getItem("food-color");
        this.createPickers();
    }
    createPickers() {
        $("#color-pickers").children().toArray().forEach((child) => {
            let currentColor = null;
            switch (child.getAttribute("value")) {
                case "player-color":
                    if (this.playerColor == null) {
                        this.playerColor = child.getAttribute("default");
                    }
                    currentColor = this.playerColor;
                    break;
                case "canvas-color":
                    if (this.canvasColor == null) {
                        this.canvasColor = child.getAttribute("default");
                    }
                    currentColor = this.canvasColor;
                    break;
                case "food-color":
                    if (this.foodColor == null) {
                        this.foodColor = child.getAttribute("default");
                    }
                    currentColor = this.foodColor;
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
                try {
                    localStorage.setItem(child.getAttribute("value"), color.toHEXA().toString());
                }
                catch (_a) {
                    localStorage.setItem(child.getAttribute("value"), $(child).attr("default"));
                }
                ;
            });
        });
    }
}
class SpecialButtons {
    constructor() {
        this.eventHandlers();
    }
    eventHandlers() {
        $("#joinGame").on("click", () => {
            this.joinGame();
        });
        $("#play").on("click", () => {
            this.play();
        });
        $("#controls").children().toArray().forEach(element => {
            $(element).on("focus", () => {
                this.focusElement = element;
            });
            $(element).on("focusout", () => {
                this.focusElement = null;
            });
        });
        $(document).on("keypress", (event) => {
            if (this.focusElement != null) {
                $(this.focusElement).html(event.key.toUpperCase());
                let keyBinds = JSON.parse(localStorage.getItem("keybinds"));
                keyBinds[$(this.focusElement).attr("control")] = event.key;
                localStorage.setItem("keybinds", JSON.stringify(keyBinds));
            }
        });
    }
    joinGame() {
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
                    socket.emit("idExists", id);
                    socket.on("idExists", (exists) => {
                        if (exists) {
                            resolve(id);
                        }
                        else {
                            reject();
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
                    location.pathname = `/play/${result.value}`;
                }
            }
        });
    }
    generateID() {
        return (Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000).toString();
    }
    play() {
        let id = this.generateID();
        // @ts-ignore
        socket.emit("createGame", 100 / ((Number.parseInt($("#gamespeed").val())) / 100), Number.parseInt($("#gametime").val()), Boolean($("#getlength").val()), id);
        location.pathname = `/play/${id}`;
    }
}
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
        $(this.input).css('filter', 'hue-rotate(-' + (rangePercent - Math.max(-50, Math.min(Number.parseInt($(this.input).attr("min")) * 2), 100)) + 'deg)');
        $(this.value).html(`${rangePercent}${$(this.value).attr("symbol")}`);
        if ($(this.value).attr("maxspecial") != undefined && rangePercent == $(this.input).attr("max")) {
            $(this.value).html($(this.value).attr("maxspecial"));
        }
    }
    monitor() {
        $(this.input).on('change input', () => {
            this.updateSlider();
        });
    }
}
jQuery(() => {
    colorHandling = new ColorHandling();
    specialButtons = new SpecialButtons();
    linkHandling = new LinkHandling();
    if (localStorage.getItem("keybinds") == null) {
        let keyBindsObject = {
            "up": "w",
            "down": "s",
            "left": "a",
            "right": "d"
        };
        localStorage.setItem("keybinds", JSON.stringify(keyBindsObject));
    }
    else {
        let keyBinds = JSON.parse(localStorage.getItem("keybinds"));
        Object.keys(keyBinds).forEach((key) => {
            $("#controls").children().toArray().forEach((element) => {
                if ($(element).attr("control") === key) {
                    $(element).html(keyBinds[key].toUpperCase());
                }
            });
        });
    }
});
$("#creategame > div > .options").children().toArray().forEach((child) => {
    if ($(child).find("input[type=range]") != null && !$(child).hasClass("buttons")) {
        const slider = new Slider(child);
    }
});
$("body").on("mousemove", (event) => {
    $(".background").css("background-position", `${event.clientX * 0.033}% ${event.clientY * 0.033}%`);
});
