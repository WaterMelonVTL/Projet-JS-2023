
var r = 0;
var hexagon = [];

function createHexagon(rayon) {
    var points = new Array();
    for (var i = 0; i < 6; ++i) {
        var angle = i * Math.PI / 3;
        var x = Math.sin(angle) * rayon;
        var y = -Math.cos(angle) * rayon;
        points.push([Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
    }
    console.log(points);
    return points;
}
function drawHexagon(d, color, x, y) {
    d3.select("svg")
        .append("path")
        .attr("d", d)
        .attr("stroke", "black")
        .attr("stroke-width", "1px")  // Set the stroke width to 1px
        .attr("fill", color)
        .attr("id", "h" + x + y)
        .attr('class',"hexagon")
        .on("click", function () {
            play(x, y);
        });
}

function generateTiles() {
    if (gameId) {
        socket.emit('tiles', gameId);
    }
    else {
        console.log("vous devez etre dans une partie pour generer les tuiles");
    }
};

function drawHexagons(tiles) {

    var col = 0;
    console.log(r);
    var border_offset = r;
    d3.selectAll(".hexagon").remove();
    for (let y in tiles) {
        var ofset_y = r;
        var rowIndex = 0;

        for (let x in tiles[y]) {
            var d = "";
            var rowOffset = rowIndex % 2 === 1 ? 0 : hexagon[2][0];
            var ofset_x = col * 2 * hexagon[2][0] + rowOffset + border_offset;

            for (let i = 0; i < hexagon.length; i++) {
                let new_x = hexagon[i][0] + ofset_x;
                let new_y = hexagon[i][1] + ofset_y;
                if (i === 0) {
                    d += "M" + new_x + "," + new_y + " L";
                } else {
                    d += new_x + "," + new_y + " ";
                }
            }

            d += "Z";

            var color;
            switch (tiles[y][x].type) {
                case -1:
                    color = "white";
                    break;
                case 0:
                    color = "#03adfc";
                    break;
                case 1:
                    color = "#2e7d22";
                    break;
                    case 2:
                    color = "gray";
                    break;
                    case 3:
                    color = "orange";
                    break;
                    case 4:
                    color = "red";
                    break;
                    case 5:
                    color = "brown";
                    break;
                    case 6:
                    color = "purple";
                    break;
                default:
                    color = "gray";
            }

            drawHexagon(d, color, col, rowIndex);

            ofset_y += hexagon[2][1] - hexagon[0][1];
            rowIndex += 1;
        }

        col += 1;
    }
}

function createArea(w, h) {
    
    console.log("nb x : " + w, "nb y : " + h);
    function updateDimensions() {
        r = Math.min((window.innerWidth / w) * 70 / 150, ((window.innerHeight / h) * 85 / 160));
        svg.attr("width", w * r * 2 )
            .attr("height", h * r*0.8 * 2 + r);
        
        hexagon = createHexagon(r);
        generateTiles();
    }

    r = Math.min((window.innerWidth / w) * 70 / 150, (window.innerHeight / h) * 85 / 160);

    var svg = d3.select("#playarea")
        .append("svg")
        .attr("width", w * r * 2 )
        .attr("height", h * r * 2 + r);

    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    generateTiles();
}

function play(x,y){
    socket.emit("play", {
        "player":PlayerName,
        "gameId":gameId,
        "tile":{"x":x,"y":y},
        "action":-1,
        //en dessous c'est pour la démo des tuiles voisines/à portée
        "range":$('#range').val()
    })
}
//pareil pour reset le plateau en full blanc
function reset(){
    socket.emit("reset", gameId)
}


