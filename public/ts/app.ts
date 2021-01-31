const pages = ["#home", "#creategame", "#options, #game"];
const titles = ["Snake", "Snake | Create Gane", "Snake | Options, Snake | Game"]
const errorCodes = ["?a", "?b"]

function reset () {
    hideAll();
    if (pages.includes(location.hash)) document.title = titles[pages.indexOf(location.hash)];
    if (location.hash == "") {
        $('#home').show();
    } else {
        $(location.hash).show();
    };
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
          })
    }
    else if (error == '?b') {
        // @ts-ignore
        Swal.fire({
            icon: 'error',
            title: 'Game not found',
          })
    }
    else if (error == '?c') {
        // @ts-ignore
        Swal.fire({
            icon: 'error',
            title: 'The Game has timed out'
        });
    };
};

jQuery(() => {
    let playerColor : any = localStorage.getItem("player-color");
    let canvasColor : any = localStorage.getItem("canvas-color");

    reset();

    window.onpopstate = () => {
        reset();
    }

    $("#color-pickers").children().toArray().forEach((child : any) => {
        let currentColor : any = null;
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
        }

        const newElement = document.createElement("span");
        child.append(newElement);

        // @ts-ignore
        const pickr = Pickr.create({
            el: newElement,
            theme: 'classic', // or 'monolith', or 'nano'
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

        pickr.on('save', (color : any, instance : any) => {
            localStorage.setItem(child.getAttribute("value"), color.toHEXA().toString())
        });
    });
});

$("body").on("mousemove", (event) => {
    $(".background").css("background-position", `${event.clientX * 0.033}% ${event.clientY * 0.033}%`);
});

function hideAll () {
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
            let id : any = $(Swal.getInput()).val();
            return new Promise( (resolve, reject) => {
                socket.emit("gameslist")
                socket.on("gameslist", (gameslist) => {
                    if (!gameslist.includes(id)) {
                        reject();
                    } else {
                        resolve(id);
                    }
                })
            }).catch(() => {
                // @ts-ignore
                Swal.showValidationMessage(
                    `Request failed: Game not found`
                )
            })
        },
        allowOutsideClick: true
    }).then((result) => {
        if (result != undefined) {
            socket.emit("joingame", result);
            location.hash = "#game"
        }
    });
});

$("#play").on("click", () => {
    socket.emit("creategame");
    const game = new Game;
})


class Slider {
    slider : any;
    constructor (slider : any) {
        this.slider = slider;
        this.monitor();
    }

    monitor() {
        var rangePercent : any = $('input[type="range"]').val();
        let input : any = $(this.slider).find("input");
        let value : any = $(this.slider).find("#value");
        $(input).on('change input', function() {
            rangePercent = $(input).val();
            $(input).css('filter', 'hue-rotate(-' + rangePercent + 'deg)');
            $(value).html(`${Number.parseInt(rangePercent) + Number.parseInt($(value).attr("startingvalue")!)}${$(value).attr("symbol")}`);
            if ($(value).attr("maxspecial") != undefined && rangePercent == 100) {
                $(value).html($(value).attr("maxspecial")!);
            }
    
        });
    }
}

$("#creategame > div > .options").children().toArray().forEach((child) => {
    const slider : Slider = new Slider(child);
});