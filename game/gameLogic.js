
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

function drawHexagon( color, x, y, stroke = "#555566") {
    let hexagon = createHexagon(r);
    let offsetX = x * 2 * hexagon[2][0] + (y % 2 === 1 ? 0 : hexagon[2][0]) + r;
    let offsetY = y * (hexagon[2][1] - hexagon[0][1]) + r;

    let d = "";
    for (let i = 0; i < hexagon.length; i++) {
        let newX = hexagon[i][0] + offsetX;
        let newY = hexagon[i][1] + offsetY;
        if (i === 0) {
            d += "M" + newX + "," + newY + " L";
        } else {
            d += newX + "," + newY + " ";
        }
    }
    d += "Z";
    let stroke_width = (stroke == "#555566") ? "1px" : "4px";

    d3.select("svg")
        .append("path")
        .attr("d", d)
        .attr("stroke", "black")
        .attr("stroke-width", "1px")  // Set the stroke width to 1px
        .attr("fill", color)
        .attr("id", "h" + x + y)
        .attr('class', "hexagon")
        .attr("stroke", stroke) 
        .attr("stroke-width", stroke_width);

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
    d3.selectAll(".hexagon").remove();
    for (let y in tiles) {
        var ofset_y = r;
        var rowIndex = 0;

        for (let x in tiles[y]) {

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
            }


            drawHexagon(color, col, rowIndex);

            rowIndex += 1;
        }

        col += 1;
    }
}

function createArea(w, h) {
    console.log("nb x : " + w, "nb y : " + h);

    function updateDimensions() {
        r = Math.min((window.innerWidth / w) * 70 / 150, ((window.innerHeight / h) * 85 / 160));
        svg.attr("width", w * r * 2)
            .attr("height", h * r * 0.8 * 2 + r);

        hexagon = createHexagon(r);
        generateTiles();
    }

    r = Math.min((window.innerWidth / w) * 70 / 150, (window.innerHeight / h) * 85 / 160);

    var playarea = d3.select("#playarea");
    var svg = playarea.select("svg");

    if (svg.empty()) {
        svg = playarea.append("svg");
        window.addEventListener('resize', updateDimensions);
    }

    svg.attr("width", w * r * 2)
        .attr("height", h * r * 2 + r);

    updateDimensions();
    generateTiles();
}


//pareil pour reset le plateau en full blanc
function reset() {
    socket.emit("reset", gameId)
}

function drawOverlay(tiles) {
    console.log('test');
    d3.selectAll('circle').remove(); // Remove all "circle" elements from the SVG
    for (let col in tiles) {
        for (let row in tiles[col]) {
            let tile = tiles[col][row];
            if (tile.population) {
                drawIndividu(col, row, tile.population);
            }
            if (tile.nourriture) {
                drawNouriturre(col, row);
            }
            if (tile.isTaverne) {
                drawTaverne(col, row, tile.isTaverne);
            }
        }
    }
}


function drawIndividu(posx, posy, population) {
    //console.log('test',posx, posy)
    let color;
    switch (population) {
        case 0:
            return;
        case 1:
            color = 'red';
            break;
        case 2:
            color = 'purple';
            break;
        case 3:
            color = 'black';
            break;
        case 4:
            color = 'orange';
            break;
    }

    let ofset_y = hexagon[2][1] - hexagon[0][1];
    let center_x = posx * 2 * hexagon[2][0] + (posy % 2 === 0 ? 2 : 1) * hexagon[2][0] + (-hexagon[2][0] + r);
    let center_y = (posy * ofset_y) + r;
    d3.select('svg')
        .append('circle')
        .attr('cx', center_x)
        .attr('cy', center_y)
        .attr('r', r / 4)
        .attr('fill', color)
}

function drawNouriturre(posx, posy) {
    let ofset_y = hexagon[2][1] - hexagon[0][1];
    let center_x = posx * 2 * hexagon[2][0] + (posy % 2 === 0 ? 2 : 1) * hexagon[2][0] + (-hexagon[2][0] + r);
    let center_y = (posy * ofset_y) + r;
    d3.select('svg')
        .append('circle')
        .attr('cx', center_x)
        .attr('cy', center_y)
        .attr('r', r / 2)
        .attr('stroke', "maroon")
        .attr('stroke-width', r / 10)
        .attr('fill', "none")
}

function drawTaverne(posx, posy, isTaverne) {
    let color;
    switch (isTaverne-1){
        case 0:
            return;
        case 1:
            color = 'red';
            break;
        case 2:
            color = 'purple';
            break;
        case 3:
            color = 'black';
            break;
        case 4:
            color = 'orange';
            break;
    }
    drawHexagon("none", posx, posy, color);
}   

function drawIndividus(tiles) {
    console.log('test');
    for (let col in tiles) {
        for (let row in tiles[col]) {
            let tile = tiles[col][row];
            if (tile.population) {
                drawIndividu(col, row, tile.population);
            }
        }
    }
}