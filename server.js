const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require("socket.io")(server);


server.listen(8881, () => {
    console.log('Le serveur écoute sur le port 8881');
});

var games = {};
var capacités = [""]
app.get('/', (request, response) => {
    response.sendFile('menu/menu.html', { root: __dirname });
});

app.get('/game', (request, response) => {
    const gameId = request.query.gameId;
    if (!games.hasOwnProperty(gameId)) {
        response.send('Game does not exist');
        return;
    }
    response.sendFile('game/index.html', { root: __dirname });
});

app.get('/gameFile/:file', (request, response) => {
    const file = request.params.file;
    response.sendFile("/game/" + file, { root: __dirname });
});
app.get('/menuFile/:file', (request, response) => {
    const file = request.params.file;
    response.sendFile("/menu/" + file, { root: __dirname });
});

function init_game(size_x, size_y) {
    var listHex = [];

    let map = (CreateMapWFC(size_x, size_y));
    for (let i = 0; i < size_x; i++) {
        let temp = [];
        for (let j = 0; j < size_y; j++) {
            let type = Math.random();
            let tile = { "type": -1, "population": 0, "nourriture": false }
            if (i == 0 && j == 0) {
                tile.type = 10;

            } else if (i == size_x - 1 && j == size_y - 1) {
                tile.temp = 11
            }
            else {
                tile.type = map[i][j]
            }
            temp.push(tile)
        }
        listHex.push(temp);
    }
    return listHex;
}

function deplacerIndividu(joueur, anciennePos, nouvellePos, gameId) {
    games[gameId].tiles[anciennePos.x][anciennePos.y].population = 0;
    games[gameId].tiles[nouvellePos.x][nouvellePos.y].population = joueur;
}

function choixMeillleurDeplacement(indiividu,) { }


function createGame(size_x, size_y, maxPlayers) {
    const gameId = Math.floor(Math.random() * 10000);

    games[gameId] = {
        "players": [],
        "tiles": init_game(size_x, size_y),
        "maxPlayers": maxPlayers,
        "size_x": size_x,
        "size_y": size_y,

        "individus_joueur1": [
            {
                'pos': { 'x': 0, 'y': 0 },
                'nourriture': 10,
                'soif': 10,
                'envieDeSexe': false
            },
            {
                position_x: 0,
                'position_y': 0,
                'nourriture': 10,
                'soif': 10,
                'envieDeSexe': false
            }]
    };


    return gameId;
}
function isInBound(pos, size_x, size_y) {

    return (pos.x >= 0 && pos.x < size_x && pos.y >= 0 && pos.y < size_y)
}

function getNeighbors(pos, size_x, size_y) {
    var NB = [];
    isInBound(topLeft(pos), size_x, size_y) ? NB.push({ 'x': topLeft(pos).x, 'y': topLeft(pos).y, 'relative': 'topLeft' }) : null;
    isInBound(topRight(pos), size_x, size_y) ? NB.push({ 'x': topRight(pos).x, 'y': topRight(pos).y, 'relative': 'topRight' }) : null;
    isInBound(right(pos), size_x, size_y) ? NB.push({ 'x': right(pos).x, 'y': right(pos).y, 'relative': 'right' }) : null;
    isInBound(botRight(pos), size_x, size_y) ? NB.push({ 'x': botRight(pos).x, 'y': botRight(pos).y, 'relative': 'botRight' }) : null;
    isInBound(botLeft(pos), size_x, size_y) ? NB.push({ 'x': botLeft(pos).x, 'y': botLeft(pos).y, 'relative': 'botLeft' }) : null;
    isInBound(left(pos), size_x, size_y) ? NB.push({ 'x': botLeft(pos).x, 'y': botLeft(pos).y, 'relative': 'left' }) : null;
    return NB;
};



function isPosInArray(pos, array) {
    return array.some(item => item.x === pos.x && item.y === pos.y);
}

function meilleurChoixDeplacement(individu, espece, map) {

    return pos;
}

function avancerDunTour(gameId) {
    games[gameId].tour += 1;

    for (joueur of joueurs){
        for (individu of individus_joueur1) {
            let newPos = meilleurChoixDeplacement(individu, games[gameId].espece_joueur1, games[gameId].tiles)
            deplacerIndividu(joueur, individu.pos, newPos, gameId);
        }
    }

    io.to(gameId).emit("tiles", games[gameId].tiles)
}



function getInReach(pos, size_x, size_y, range) {
    var f = [];
    var res = new Set();
    var distances = new Map();
    var inReach = [];
    f.push({ position: pos, distance: 0 });
    res.add(`${pos.x}-${pos.y}`);
    distances.set(`${pos.x}-${pos.y}`, 0);
    inReach.push(pos);

    while (f.length > 0) {
        let { position, distance } = f.shift();


        if (distance >= range) {
            continue;
        }

        for (let neighbor of getNeighbors(position, size_x, size_y)) {
            const neighborKey = `${neighbor.x}-${neighbor.y}`;

            if (!res.has(neighborKey)) {
                f.push({ position: neighbor, distance: distance + 1 });
                res.add(neighborKey);
                distances.set(neighborKey, distance + 1);
                inReach.push(neighbor)
            }
        }
    }

    return inReach;
}






function resetTiles(gameId) {
    if (games[gameId] && games[gameId].tiles) {
        games[gameId].tiles = init_game(games[gameId].size_x, games[gameId].size_y)



        io.to(gameId).emit("tiles", games[gameId].tiles); // Emit the updated tiles to clients
    } else {
        console.error(`Game with ID ${gameId} not found or does not have tiles.`);
    }
};

io.on('connection', (socket) => {

    socket.on("newGame", data => {
        let gameId = createGame(data.size_x, data.size_y, data.maxPlayers);

        socket.emit("joinGameResponse",
            {
                "gameId": gameId,
                "allowed": true
            });
    });


    socket.on("enterGame", data => {
        const gameId = data.gameId;
        const playerName = data.playerName;

        if (games.hasOwnProperty(gameId) && games[gameId].players.includes(playerName)) {
            socket.emit('enterGameResponse',
                {
                    "allowed": true,
                    "playerNumber": games[gameId].players.indexOf(playerName)
                });

            socket.join(gameId);

            return;
        }

        // Check if the game is full
        if (games.hasOwnProperty(gameId) && games[gameId].players.length >= games[gameId].maxPlayers) {
            socket.emit('enterGameResponse',
                {
                    "allowed": false,
                    "message": 'Game is full'
                });
            return;
        }

        // Join the game room
        socket.join(gameId);

        // Add the player to the game

        games[gameId].players.push(playerName);

        // Emit 'playerJoined' to all clients in the game
        io.to(gameId)
            .emit('playerEntered',
                {
                    "playerList": games[gameId].players,
                    "playerName": playerName,
                    "playerNumber": games[gameId].players.indexOf(playerName)
                });

        // Emit 'enterGameResponse' to the current client
        socket.emit('enterGameResponse',
            {
                "allowed": true,
                "playerNumber": games[gameId].players.indexOf(playerName)
            });

        console.log("player " + playerName + " Entered the game : " + gameId);
    });


    socket.on("requestGameInfo", gameId => {
        if (games.hasOwnProperty(gameId)) {
            socket.emit("gameInfo",
                games[gameId]
            )
        }
    })

    socket.on("joinGame", data => {
        if (!(games.hasOwnProperty(data.gameId))) {
            socket.emit("joinGameResponse", {
                "allowed": false,
                "message": "game does not exist"
            })
            return;
        } else if (games[data.gameId].players.length == games[data.gameId].maxPlayers) {
            socket.emit("joinGameResponse", {
                "allowed": false,
                "message": "game is full"
            })
            return;
        } else {
            socket.emit("joinGameResponse", {
                "allowed": true,
                "message": "enjoy",
                "gameId": data.gameId
            })
            return;
        }
    })

    socket.on("tiles", gameId => {
        socket.emit("tiles", games[gameId].tiles);
    })

    socket.on("play", data => {
        games[data.gameId].tiles[data.tile.x][data.tile.y].population=1;
        io.to(data.gameId).emit("tiles", games[data.gameId].tiles);
    });

    socket.on("reset", gameId => {
        resetTiles(gameId);
    })

});

function topLeft(pos) {
    var y = pos.y;
    var x = pos.x;

    if (y % 2 == 0) {
        return { 'x': x, 'y': y - 1 };
    } else {
        return { 'x': x - 1, 'y': y - 1 };
    }
};
function topRight(pos) {
    var y = pos.y;
    var x = pos.x;

    if (y % 2 == 0) {
        return { 'x': x + 1, 'y': y - 1 };
    } else {
        return { 'x': x, 'y': y - 1 };
    }
};
function left(pos) {
    var y = pos.y;
    var x = pos.x;

    return { 'x': x - 1, 'y': y }
};
function right(pos) {
    var y = pos.y;
    var x = pos.x;

    return { 'x': x + 1, 'y': y }
};
function botLeft(pos) {
    var y = pos.y;
    var x = pos.x;

    if (y % 2 == 0) {
        return { 'x': x, 'y': y + 1 };
    } else {
        return { 'x': x - 1, 'y': y + 1 };
    }
}
function botRight(pos) {
    var y = pos.y;
    var x = pos.x;

    if (y % 2 == 0) {
        return { 'x': x + 1, 'y': y + 1 };
    } else {
        return { 'x': x, 'y': y + 1 };
    }
}














/*-------------------------GENERATION DE LA MAP----------------------------*/
function calculateEntropy(probabilities) {

    let entropy = 0;

    for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] > 0) {  // Avoid log(0)
            entropy -= probabilities[i] * Math.log2(probabilities[i]);
        }
    }

    return entropy;
};


function findLowestEntropy(tileSet) {
    let lowestEntropy = Infinity;
    let pos = [];
    for (let x = 0; x < tileSet.length; x++) {
        for (let y = 0; y < tileSet[x].length; y++) {
            if (!(tileSet[x][y].collapsed == true)) {
                let entropy = calculateEntropy(tileSet[x][y].probabilities)
                if (entropy < lowestEntropy) {
                    lowestEntropy = entropy;
                    pos = [{ "x": x, "y": y }]
                } else {
                    if (entropy === lowestEntropy) {
                        pos.push({ "x": x, "y": y })
                    }
                }
            }
        }
    }

    return pos;
}

function getRandomChoice(choices) {
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
}
function getRandomChoiceWeighted(choices, weights) {
    const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
    const randomValue = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    for (let i = 0; i < choices.length; i++) {
        cumulativeWeight += weights[i];
        if (randomValue <= cumulativeWeight) {
            return choices[i];
        }
    }
}

function updateWeight(pos, initialWeight, tileset, final) {

    let neighbors = getNeighbors(pos, final.length - 1, final[0].length - 1);
    neighbors = shuffleArray(neighbors);
    let updatedWeights = [0, 0, 0];
    let nbN = 0;

    for (let neighbor of neighbors) {

        if (final[neighbor.x][neighbor.y] != -1) {
            nbN++;

            switch (final[neighbor.x][neighbor.y]) {
                case 0:
                    if (numberOfSameTiles(0, neighbor, tileset, final) < 2) { updatedWeights[0] = 0.7; }

                    updatedWeights[1] += 0.2;
                    updatedWeights[2] += 0.00;
                    break;
                case 1:
                    updatedWeights[0] += 0.05;
                    updatedWeights[1] += 0.71;
                    updatedWeights[2] += 0.06;
                    break;
                case 2:
                    updatedWeights[0] += 0.00;
                    updatedWeights[1] += 0.20;
                    updatedWeights[2] += 0.80;
                    break;
                default:
                    updatedWeights[0] += 0.33;
                    updatedWeights[1] += 0.33;
                    updatedWeights[2] += 0.33;
            }
        }
    }

    // Avoid division by zero
    if (nbN !== 0) {
        // Normalize the updated weights by dividing by the number of neighbors
        updatedWeights = updatedWeights.map(weight => weight / nbN);

        // Calculate the average with the initial weights

        let averageWeights = updatedWeights.map((weight, index) => (weight + (initialWeight[index] == -1 ? weight : initialWeight[index] * 2)) / 2);

        tileset[pos.x][pos.y].probabilities = averageWeights;
    }
}

function numberOfSameTiles(type, pos, tileset, final) {
    let neighbors = getNeighbors(pos, tileset.length - 1, tileset[0].length - 1);
    let res = 0;
    for (let neighbor of neighbors) {
        if (final[neighbor.x][neighbor.y] == type) {
            res++
        }
    }
    return res;
}

function calulateInitialWeight(relative, type, final, pos, tileset) { //augmente les chances de créer des flots
    let river_chance = [30, 0, 0.00];
    let montains_chain = [30, 0.0, 0.00];

    if (numberOfSameTiles(type, pos, tileset, final) < 2) {

        switch (relative) {
            case "topLeft": //on touche au voisin de en haut à gauche
                switch (type) {
                    case 0: //cas ou on vient de placer une tuile d'eau
                        if (isInBound(botRight(pos), final.length - 1, final[0].length - 1) && final[botRight(pos).x][botRight(pos).y] === 0 ||
                            isInBound(botLeft(pos), final.length - 1, final[0].length - 1) && final[botLeft(pos).x][botLeft(pos).y] === 0 ||
                            isInBound(right(pos), final.length - 1, final[0].length - 1) && final[right(pos).x][right(pos).y] === 0
                        ) {//on test le voisin en bas à droite
                            if (Math.random() < 0.33) {
                                console.log(relative)
                                return river_chance
                            }
                        }


                        break;
                    case 1: //cas ou on vient de placer une tuile d'herbe

                        break;

                    case 2: //cas ou on vient de placer une montagne
                        if (isInBound(botRight(pos), final.length - 1, final[0].length - 1) && final[botRight(pos).x][botRight(pos).y] === 2 ||
                            isInBound(botLeft(pos), final.length - 1, final[0].length - 1) && final[botLeft(pos).x][botLeft(pos).y] === 2 ||
                            isInBound(right(pos), final.length - 1, final[0].length - 1) && final[right(pos).x][right(pos).y] === 2) {//on test les voisins opposés
                            if (Math.random() < 0.33)
                                return montains_chain
                        }
                        break;
                }
                break;
            case "topRight": //on touche au voisin de en haut à droite
                switch (type) {
                    case 0: //cas ou on vient de placer une tuile d'eau
                        if (isInBound(botRight(pos), final.length - 1, final[0].length - 1) && final[botRight(pos).x][botRight(pos).y] === 0 ||
                            isInBound(botLeft(pos), final.length - 1, final[0].length - 1) && final[botLeft(pos).x][botLeft(pos).y] === 0 ||
                            isInBound(left(pos), final.length - 1, final[0].length - 1) && final[left(pos).x][left(pos).y] === 0
                        ) {
                            if (Math.random() < 0.33) {
                                console.log(relative)
                                return river_chance
                            }
                        }


                        break;
                    case 1: //cas ou on vient de placer une tuile d'herbe

                        break;

                    case 2: //cas ou on vient de placer une montagne
                        if (isInBound(botRight(pos), final.length - 1, final[0].length - 1) && final[botRight(pos).x][botRight(pos).y] === 2 ||
                            isInBound(botLeft(pos), final.length - 1, final[0].length - 1) && final[botLeft(pos).x][botLeft(pos).y] === 2 ||
                            isInBound(left(pos), final.length - 1, final[0].length - 1) && final[left(pos).x][left(pos).y] === 2) {//on test le voisin en bas à droite
                            if (Math.random() < 0.33)
                                return montains_chain
                        }
                        break;
                }
                break;
            case "right": //on touche au voisin de droite
                switch (type) {
                    case 0: //cas ou on vient de placer une tuile d'eau
                        if (isInBound(topLeft(pos), final.length - 1, final[0].length - 1) && final[topLeft(pos).x][topLeft(pos).y] === 0 ||
                            isInBound(botLeft(pos), final.length - 1, final[0].length - 1) && final[botLeft(pos).x][botLeft(pos).y] === 0 ||
                            isInBound(left(pos), final.length - 1, final[0].length - 1) && final[left(pos).x][left(pos).y] === 0
                        ) {
                            if (Math.random() < 0.3) {
                                console.log(relative)
                                return river_chance
                            }
                        }


                        break;
                    case 1: //cas ou on vient de placer une tuile d'herbe

                        break;

                    case 2: //cas ou on vient de placer une montagne
                        if (isInBound(topLeft(pos), final.length - 1, final[0].length - 1) && final[topLeft(pos).x][topLeft(pos).y] === 2 ||
                            isInBound(botLeft(pos), final.length - 1, final[0].length - 1) && final[botLeft(pos).x][botLeft(pos).y] === 2 ||
                            isInBound(left(pos), final.length - 1, final[0].length - 1) && final[left(pos).x][left(pos).y] === 2) {//on test le voisin en bas à droite
                            if (Math.random() < 0.33)
                                return montains_chain
                        }
                        break;
                }
                break;
            case "botRight": //on touche au voisin de en bas à droite
                switch (type) {
                    case 0: //cas ou on vient de placer une tuile d'eau
                        if (isInBound(topLeft(pos), final.length - 1, final[0].length - 1) && final[topLeft(pos).x][topLeft(pos).y] === 0 ||
                            isInBound(topRight(pos), final.length - 1, final[0].length - 1) && final[topRight(pos).x][topRight(pos).y] === 0 ||
                            isInBound(left(pos), final.length - 1, final[0].length - 1) && final[left(pos).x][left(pos).y] === 0
                        ) {
                            if (Math.random() < 0.33) {
                                console.log(relative)
                                return river_chance
                            }
                        }


                        break;
                    case 1: //cas ou on vient de placer une tuile d'herbe

                        break;

                    case 2: //cas ou on vient de placer une montagne
                        if (isInBound(topLeft(pos), final.length - 1, final[0].length - 1) && final[topLeft(pos).x][topLeft(pos).y] === 2 ||
                            isInBound(topRight(pos), final.length - 1, final[0].length - 1) && final[topRight(pos).x][topRight(pos).y] === 2 ||
                            isInBound(left(pos), final.length - 1, final[0].length - 1) && final[left(pos).x][left(pos).y] === 2) {//on test le voisin en bas à droite
                            if (Math.random() < 0.33)
                                return montains_chain
                        }
                        break;
                }
                break;
            case "botLeft": //on touche au voisin de en bas à droite
                switch (type) {
                    case 0: //cas ou on vient de placer une tuile d'eau
                        if (isInBound(topLeft(pos), final.length - 1, final[0].length - 1) && final[topLeft(pos).x][topLeft(pos).y] === 0 ||
                            isInBound(topRight(pos), final.length - 1, final[0].length - 1) && final[topRight(pos).x][topRight(pos).y] === 0 ||
                            isInBound(right(pos), final.length - 1, final[0].length - 1) && final[right(pos).x][right(pos).y] === 0
                        ) {
                            if (Math.random() < 0.33) {
                                console.log(relative)
                                return river_chance
                            }
                        }


                        break;
                    case 1: //cas ou on vient de placer une tuile d'herbe

                        break;

                    case 2: //cas ou on vient de placer une montagne
                        if (isInBound(topLeft(pos), final.length - 1, final[0].length - 1) && final[topLeft(pos).x][topLeft(pos).y] === 2 ||
                            isInBound(topRight(pos), final.length - 1, final[0].length - 1) && final[topRight(pos).x][topRight(pos).y] === 2 ||
                            isInBound(right(pos), final.length - 1, final[0].length - 1) && final[right(pos).x][right(pos).y] === 2) {//on test le voisin en bas à droite
                            if (Math.random() < 0.33)
                                return montains_chain
                        }
                        break;
                }
                break;
            case "left": //on touche au voisin de en bas à droite
                switch (type) {
                    case 0: //cas ou on vient de placer une tuile d'eau
                        if (isInBound(botRight(pos), final.length - 1, final[0].length - 1) && final[botRight(pos).x][botRight(pos).y] === 0 ||
                            isInBound(topRight(pos), final.length - 1, final[0].length - 1) && final[topRight(pos).x][topRight(pos).y] === 0 ||
                            isInBound(right(pos), final.length - 1, final[0].length - 1) && final[right(pos).x][right(pos).y] === 0
                        ) {
                            if (Math.random() < 0.33) {
                                console.log(relative)
                                return river_chance
                            }
                        }


                        break;
                    case 1: //cas ou on vient de placer une tuile d'herbe

                        break;

                    case 2: //cas ou on vient de placer une montagne
                        if (isInBound(botRight(pos), final.length - 1, final[0].length - 1) && final[botRight(pos).x][botRight(pos).y] === 2 ||
                            isInBound(topRight(pos), final.length - 1, final[0].length - 1) && final[topRight(pos).x][topRight(pos).y] === 2 ||
                            isInBound(right(pos), final.length - 1, final[0].length - 1) && final[right(pos).x][right(pos).y] === 2) {//on test le voisin en bas à droite
                            if (Math.random() < 0.33)
                                return montains_chain
                        }
                        break;
                }
                break;

        }
    }
    return [-1, -1, -1];
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function updateNeighbors(pos, tileset, final, type) {

    let neighbors = getNeighbors(pos, final.length - 1, final[0].length - 1);
    neighbors = shuffleArray(neighbors);
    for (let neighbor of neighbors) {
        let initialWeight = [];


        initialWeight = calulateInitialWeight(neighbor.relative, type, final, neighbor, tileset);


        if (!(tileset[neighbor.x][neighbor.y].collapsed === true)) {

            updateWeight(neighbor, initialWeight, tileset, final);
        }
    }
}

function collapse(tileset, final) {
    let pos = getRandomChoice(findLowestEntropy(tileset));
    let type = getRandomChoiceWeighted(tileset[pos.x][pos.y].types, tileset[pos.x][pos.y].probabilities);
    final[pos.x][pos.y] = type;
    tileset[pos.x][pos.y].collapsed = true;


    updateNeighbors(pos, tileset, final, type);



}

function isFullyCollapsed(final) {
    for (let row of final) {
        for (let elem of row) {
            if (elem === -1) {
                return false
            }
        }
    }
    return true;
}

function CreateMapWFC(size_x, size_y) {

    let tileSet = [];
    let final = [];
    for (let i = 0; i < size_x; i++) {
        let temp = [];
        for (let j = 0; j < size_y; j++) {
            temp.push({ types: [0, 1, 2], probabilities: [0.33, 0.33, 0.33], collapsed: false })
        }
        tileSet.push(temp)
    }
    for (let i = 0; i < size_x; i++) {
        let temp = [];
        for (let j = 0; j < size_y; j++) {
            temp.push(-1)
        }
        final.push(temp)
    }
    while (!isFullyCollapsed(final)) {
        collapse(tileSet, final)
    }
    return final;
}
