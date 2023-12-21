const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const server = http.createServer(app);
const io = require("socket.io")(server);


server.listen(8881, () => {
    console.log('Le serveur écoute sur le port 8881');
});

var games = {};
var capacités = [""]
app.use('/files', express.static(path.join(__dirname, 'node_modules')));


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

app.get('/', (request, response) => {

    response.sendFile('menu/menu.html', { root: __dirname });
});


function init_game(size_x, size_y) {
    var listHex = [];

    let map = (CreateMapWFC(size_x, size_y));
    for (let i = 0; i < size_x; i++) {
        let temp = [];
        for (let j = 0; j < size_y; j++) {
            let type = Math.random();
            let tile = { "type": -1, "population": 0, "nourriture": false, pos: { x: i, y: j }, "count": 0 };
            if (type < 0.1 && map[i][j] == 1) {
                tile.nourriture = true;
                tile.type = 1;
            } else {
                if (i == 0 && j == 0) {
                    tile.type = 10;
                } else if (i == size_x - 1 && j == size_y - 1) {
                    tile.type = 11;
                } else {
                    tile.type = map[i][j];
                }
            }
            temp.push(tile)
        }
        listHex.push(temp);
    }
    return listHex;
}


function deplacerIndividu(individu, nouvellePos, gameId) {
    let anciennePos = individu.pos;
    individu.pos = nouvellePos;
    games[gameId].tiles[anciennePos.x][anciennePos.y].population = 0;
    games[gameId].tiles[nouvellePos.x][nouvellePos.y].population = games[gameId].players[individu.parent].number;
}

function createGame(size_x, size_y, maxPlayers,creator) {
    const gameId = Math.floor(Math.random() * 10000);
    games[gameId] = {
        "players": {},
        "tiles": init_game(size_x, size_y),
        "maxPlayers": maxPlayers,
        "size_x": size_x,
        "size_y": size_y,
        "createur": creator,
        "currentTour": 0,

    };

    return gameId;
}
function isInBound(pos, size_x, size_y) {

    return (pos.x >= 0 && pos.x < size_x  && pos.y >= 0 && pos.y < size_y)
}

function getNeighbors(pos, size_x, size_y) {
    var NB = [];
    isInBound(topLeft(pos), size_x, size_y) ? NB.push({ 'x': topLeft(pos).x, 'y': topLeft(pos).y, 'relative': 'topLeft' }) : null;
    isInBound(topRight(pos), size_x, size_y) ? NB.push({ 'x': topRight(pos).x, 'y': topRight(pos).y, 'relative': 'topRight' }) : null;
    isInBound(right(pos), size_x, size_y) ? NB.push({ 'x': right(pos).x, 'y': right(pos).y, 'relative': 'right' }) : null;
    isInBound(botRight(pos), size_x, size_y) ? NB.push({ 'x': botRight(pos).x, 'y': botRight(pos).y, 'relative': 'botRight' }) : null;
    isInBound(botLeft(pos), size_x, size_y) ? NB.push({ 'x': botLeft(pos).x, 'y': botLeft(pos).y, 'relative': 'botLeft' }) : null;
    isInBound(left(pos), size_x, size_y) ? NB.push({ 'x': left(pos).x, 'y': left(pos).y, 'relative': 'left' }) : null;
    return NB;
};



function isPosInArray(pos, array) {
    return array.some(item => item.x === pos.x && item.y === pos.y);
}

function creerIndividu(gameId, player, nombre) {
    let game = games[gameId];
    let pos = player.posBase;
    let joueurId = player.name;
    for (let i = 0; i < nombre; i++) {
        let temp = {
            'origine': pos,
            'satiété': 10,
            'soif': 10,
            'pos': pos,
            'vision': game.players[joueurId].attributs.vision,
            'reproduction': game.players[joueurId].attributs.reproduction,
            'vitesse': game.players[joueurId].attributs.vitesse,
            'mode': ['explore'],
            'need': [],
            'file': [],
            'canReproduce': false,
            'reproduceCooldown': 0,
            'moveTurns': 0,
            'hasMoved': 0,
            'parent': joueurId,
            'id': game.players[joueurId].individus.length + 1,
        };
        game.players[joueurId].individus.push(temp);
    }
}

function getInRange(pos, range, gameId) {
    let positions = [pos];

    for (let i = 0; i < range; i++) {
        let newPositions = [];
        positions.forEach((position) => {
            let neighbors = getNeighbors(position, games[gameId].size_x, games[gameId].size_y);
            neighbors.forEach((neighbor) => {
                if (!isPosInArray(neighbor, positions) && !isPosInArray(neighbor, newPositions)) {
                    newPositions.push(neighbor);
                }
            });
        });
        positions = positions.concat(newPositions);
    }

    return positions;
}

function getValidInRange(pos, range, gameId, player) {
    let positions = [pos];

    for (let i = 1; i <= range; i++) {
        let neighbors = getNeighbors(pos, games[gameId].size_x, games[gameId].size_y);
        neighbors.forEach((neighbor) => {
            if (!isPosInArray(neighbor, positions)) {
                positions.push(neighbor);
            }
        });
    }
}


function convertPosToTiles(positions, gameId) {
    let game = games[gameId];
    let tiles = [];

    positions.forEach(pos => {
        let tile = game.map[pos.y][pos.x];
        tiles.push(tile);
    });

    return tiles;
}

function convertPosToValidTiles(positions, gameId, player) {
    let game = games[gameId];
    let validTiles = [];

    positions.forEach(pos => {
        let tile = game.map[pos.y][pos.x];
        (player.social || tile.population == 0) && (player.montagnard || tile.type != 2) && validPositions.push(tile);
    });

    return validTiles;
}



function getValidNeighbors(pos, gameId) {

    let game = games[gameId];

    let neighbors = getNeighbors(pos, game.size_x, game.size_y);

    neighbors = neighbors.filter(neighbor => {

        return game.tiles[neighbor.x][neighbor.y].type !== 2});

    return neighbors;
}


function getBestPath(pos1, pos2, gameId) {
    if (pos1.x == pos2.x && pos1.y == pos2.y) {
        return [pos1];
    }
    // Define the heuristic function h(n)
    const h = (pos) => Math.abs(pos.x - pos2.x) + Math.abs(pos.y - pos2.y);

    // Define the distance function d(n, m)
    const d = (pos1, pos2) => Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);

    // Initialize both gScore and fScore with default values of Infinity
    let gScore = {};
    let fScore = {};
    let pos1Key = JSON.stringify(pos1);
    gScore[pos1Key] = 0;
    fScore[pos1Key] = h(pos1);

    // Initialize the openSet with the start node
    let openSet = [pos1Key];

    // Initialize an empty map for cameFrom
    let cameFrom = {};

    while (openSet.length > 0) {
        // Sort the openSet array based on the fScore, then pop the last element (with the smallest fScore)
        openSet.sort((a, b) => fScore[b] - fScore[a]);
        let currentKey = openSet.pop();
        let current = JSON.parse(currentKey);

        // If the current node is the goal, reconstruct and return the path
        if (current.x === pos2.x && current.y === pos2.y) {
            let total_path = [current];
            while (currentKey in cameFrom) {
                currentKey = cameFrom[currentKey];
                current = JSON.parse(currentKey);
                total_path.unshift(current);
            }
            return total_path;
        }

        // Get the valid neighbors of the current node
        let neighbors = getValidNeighbors(current, gameId).map(JSON.stringify);

        for (let neighborKey of neighbors) {
            let neighbor = JSON.parse(neighborKey);
            let tentative_gScore = gScore[currentKey] + d(current, neighbor);
            if (!gScore.hasOwnProperty(neighborKey) || tentative_gScore < gScore[neighborKey]) {
                cameFrom[neighborKey] = currentKey;
                gScore[neighborKey] = tentative_gScore;
                fScore[neighborKey] = tentative_gScore + h(neighbor);
                if (!openSet.includes(neighborKey)) {
                    openSet.push(neighborKey);
                }
            }
        }
    }

    // If the function reaches this point, that means there's no valid path from pos1 to pos2
    console.log("No valid path found from " + JSON.stringify(pos1) + " to " + JSON.stringify(pos2) + ".");
    return null;
}

function getBestPos(individu, gameId) {
    let map = games[gameId].tiles;
    const canSee = getInRange(individu.pos, individu.vision, gameId);

    let empty = canSee.filter(pos => {
        return map[pos.x][pos.y].population == 0 && map[pos.x][pos.y].type != 2});

    if (individu.need.length > 0) {
        switch (individu.need[0]) {
            case 'drink':
                if (individu.soif > 9) {
                    individu.need.shift();
                    return getBestPos(individu, gameId);
                } else {
                    if (canSee.some(pos => map[pos.x][pos.y].type == 0)) {
                        let water = canSee.filter(pos => map[pos.x][pos.y].type == 0);
                        let bestPos = getRandomChoice(water);
                        console.log("bestPos to drink : " + JSON.stringify(bestPos));
                        return bestPos;
                    } else {
                        return getRandomChoice(empty) || individu.pos;
                    }
                }
            case 'eat':
                if (individu.satiété > 9) {
                    individu.need.shift();
                    return getBestPos(individu, gameId);
                } else {
                    if (canSee.some(pos => map[pos.x][pos.y].nourriture)) {
                        let nourriture = canSee.filter(pos => map[pos.x][pos.y].nourriture);
                        let bestPos = getRandomChoice(nourriture);
                        console.log("bestPos to eat : " + JSON.stringify(bestPos));
                        return bestPos;
                    } else {
                        return getRandomChoice(empty) || individu.pos;
                    }
                }
            default:
                console.log("need not found : ", individu.need[0])
                need.shift();
                return getBestPos(individu, gameId);

        }
    } else
        switch (individu.mode[0]) {

            case 'explore':
                if (individu.reproduceCooldown < 0) {
                    if (canSee.some(pos => map[pos.x][pos.y].nourriture)) {
                        let nourriture = canSee.filter(pos => map[pos.x][pos.y].nourriture);
                        let bestPos = getRandomChoice(nourriture);
                        return bestPos;
                    }
                } else if (canSee.some(pos => map[pos.x][pos.y].population == 0)) {

                    let bestPos = getRandomChoice(empty) || individu.pos;
                    return bestPos;
                } else {
                    return individu.pos;
                }
                break;

            case 'reproduce':
                return individu.origine;
                break;
            case 'drinking':
                return individu.pos;

            case 'waitingReproduction':
                return individu.origine;
                break;
            default:
                individu.mode=["explore"]
                return getBestPos(individu, gameId);

        }
}

function createFile(individu, gameID) {
    let map = games[gameID].tiles;
    individu.file = getBestPath(individu.pos, getBestPos(individu, gameID), gameID);
}


function DeplacerIndividus(gameId) {
    const game = games[gameId];

    const interval = setInterval(() => {
        if (!Object.values(game.players).some(player => player.individus.some(individu => individu.moveTurns > 0))) {
            clearInterval(interval);
            return;
        }

        for (let joueur of Object.keys(game.players)) {
            for (let individu of game.players[joueur].individus) {
                if (individu.moveTurns > 0) {
                    if (individu.file.length == 0) {
                        createFile(individu, gameId);
                    }
                    let nouvellePos = individu.file.shift();
                    if (games[gameId].tiles[nouvellePos.x][nouvellePos.y].population != 0) {
                        if (nouvellePos.x == individu.origine.x && nouvellePos.y == individu.origine.y) {
                            deplacerIndividu(individu, nouvellePos, gameId);
                            individu.moveTurns--;
                        } else if (!getNeighbors(nouvellePos, games[gameId].size_x, games[gameId].size_y).some(pos => games[gameId].tiles[pos.x][pos.y].population == 0)) {
                            individu.moveTurns--;
                        } else {
                            createFile(individu, gameId);
                            nouvellePos = individu.file.shift();
                            deplacerIndividu(individu, nouvellePos, gameId);
                            individu.moveTurns--;
                        }
                    } else
                        if (nouvellePos.x !== individu.pos.x || nouvellePos.y !== individu.pos.y) {
                            deplacerIndividu(individu, nouvellePos, gameId);
                            individu.moveTurns--;
                            individu.hasMoved++;
                        } else {
                            individu.moveTurns--;
                        }
                }
            }
        }
        io.to(gameId).emit("tiles", games[gameId].tiles); // Emit the updated tiles to clients
    }, 500);
}

function preTurnIndividus(gameId) {
    let game = games[gameId];

    for (let playerId in game.players) {
        const player = game.players[playerId];

        // Iterate over each individu of the player

        for (let individu of player.individus) {

            if (individu.satiété < 5) {
                individu.need.unshift('eat');
                createFile(individu, gameId);
            }
            if (individu.soif < 5) {
                individu.need.unshift('drink');
                createFile(individu, gameId);
            }

            individu.moveTurns = player.attributs.vitesse;
        }

    }
}

function postTurnIndividus(gameId) {
    let game = games[gameId]
    for (let playerId in game.players) {
        const player = game.players[playerId];
        // Iterate over each individu of the player
        for (let individu of player.individus) {
            if (individu.reproduceCooldown > 0) {
                individu.reproduceCooldown--;
            }
            if (game.tiles[individu.pos.x][individu.pos.y].nourriture) {
                individu.satiété += 3;
                if (individu.reproduceCooldown == 0) {
                    individu.canReproduce = true;
                    individu.mode.unshift("reproduce");
                    individu.reproduceCooldown = player.reproductionCooldown;
                }
                if (individu.satiété > player.maxSatiété) {
                    individu.satiété = player.maxSatiété;
                }
                if (individu.need.includes("eat")) {
                    individu.need = individu.need.filter(need => need != "eat");
                }

            } else if (game.tiles[individu.pos.x][individu.pos.y].type == 0) {
                if (individu.need.includes("drink")) {
                    individu.need = individu.need.filter(need => need != "drink");
                    if (individu.mode[0] != "drinking" && !individu.mode.includes("drinking")) {
                        individu.mode.unshift("drinking");
                    }
                }

                individu.soif += 1;
                if (individu.soif > player.maxSoif) {
                    individu.soif = player.maxSoif;
                }

                if (individu.mode[0] == "drinking") {
                    individu.satiété -= player.afkSatiété;
                    if (individu.soif > Math.floor(player.maxSoif * 0.8)) {
                        individu.mode.shift();
                    }
                }
            }

            if (individu.mode[0] == "reproduce") {
                if (individu.pos.x == individu.origine.x && individu.pos.y == individu.origine.y) {
                    if (individu.canReproduce) {
                        player.waitingReproduction.push(individu);
                        individu.mode.shift();
                        individu.mode.unshift("waitingReproduction")
                        let reproductible = player.waitingReproduction.filter(individu => individu.canReproduce);
                        individu.satiété -= player.afkSatiété;
                        individu.soif -= player.afkSoif;
                        if (reproductible.length >= 2) {

                            let individu1 = reproductible.shift();
                            let individu2 = reproductible.shift();

                            individu1.canReproduce = false;
                            individu2.canReproduce = false;

                            individu1.reproduceCooldown = player.reproductionCooldown;
                            individu2.reproduceCooldown = player.reproductionCooldown;

                            creerIndividu(gameId, player, player.attributs.reproduction);

                            individu1.mode.shift();
                            individu2.mode.shift();
                        }
                    }
                }
            }


            individu.satiété -= individu.hasMoved * player.moveSatiété;
            individu.soif -= individu.hasMoved * player.moveSoif;

            if (individu.satiété < 0) {
                game.tiles[individu.pos.x][individu.pos.y].population = 0;
                let idToRemove = individu.id;
                player.individus = player.individus.filter(individu => individu.id != idToRemove);

            }
            if (individu.soif < 0) {
                game.tiles[individu.pos.x][individu.pos.y].population = 0;
                let idToRemove = individu.id;
                player.individus = player.individus.filter(individu => individu.id != idToRemove);
            }
            individu.hasMoved = 0;
        }
    }
}

function getPosBase(number, gameId) {
    switch (number) {
        case 1:
            return { x: 0, y: Math.floor(games[gameId].size_y / 2) };
        case 2:
            return { x: games[gameId].size_x-1, y: Math.floor(games[gameId].size_y / 2) };
        case 3:
            return { x: Math.floor(games[gameId].size_x / 2), y: 0 };
        case 4:
            return { x: Math.floor(games[gameId].size_x / 2), y: games[gameId].size_y -1};
    }
}

function turn(gameId) {
    const game = games[gameId];

    // Check if the game exists and has players
    if (game && game.players) {

        preTurnIndividus(gameId);
        DeplacerIndividus(gameId);
        postTurnIndividus(gameId);
        io.to(gameId).emit("tiles", games[gameId].tiles); // Emit the updated tiles to clients
        io.to(gameId).emit("gameInfo", games[gameId]); // Emit the infos of the game to clients
        let player = game.players[Object.keys(game.players)[0]];
        console.log("turn " + game.currentTour + " of game " + gameId + " ended");
        game.currentTour++;

        // Call the turn function again after 1 second
        setTimeout(() => {
            turn(gameId);
        }, 1000);

    } else {
        // Handle the case where game or players are not defined
        console.error(`Invalid game or players for gameId: ${gameId}`);
    }
}



function testAttribut(attribute, gameId) {

    const game = games[gameId];

    // Check if the game exists and has players
    if (game && game.players) {
        // Check if any player has the same attribute values
        for (let playerId of Object.keys(game.players)) {
            console.log(playerId)
            console.log("given attribute: ",attribute, "compared to: ", game.players[playerId].attributs)
            const player = game.players[playerId];
            if (player.attributs &&
                player.attributs.vitesse === parseInt(attribute.vitesse) &&
                player.attributs.reproduction === parseInt(attribute.reproduction) &&
                player.attributs.vision === parseInt(attribute.vision)) {
                return false;
            }
        }
        return true;
    } else {
        // Handle the case where game or players are not defined
        console.error(`Invalid game or players for gameId: ${gameId}`);
        return false;
    }
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
        let gameId = createGame(data.size_x, data.size_y, data.maxPlayers, data.creator);

        socket.emit("joinGameResponse",
            {
                "gameId": gameId,
                "allowed": true
            });
        io.emit("newGame", { gameId: gameId, game: games[gameId] });
    });

    socket.on("startGame", (gameId,callback) => {
        if (!some(games[gameId].players, player => !player.pret)) {

            let game = games[gameId];
            for (let playerId in game.players) {
                creerIndividu(gameId, game.players[playerId], 2);
            }
            socket.emit("gameStarted");
            callback(true);
        } else {
            callback(false);
        }
    });


    socket.on("enterGame", data => {
        const gameId = data.gameId;
        const playerName = data.playerName;

        if (games.hasOwnProperty(gameId) && games[gameId].players.hasOwnProperty(playerName)) {
            socket.emit('enterGameResponse',
                {
                    "allowed": true,
                    "playerNumber": games[gameId].players[playerName].number
                });

            socket.join(gameId);

            return;
        }

        // Check if the game is full
        if (games.hasOwnProperty(gameId) && Object.keys(games[gameId].players).length >= games[gameId].maxPlayers) {
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

        games[gameId].players[playerName] = {
            "name": playerName,
            "attributs": {},
            "individus": [],
            "waitingReproduction": [],
            "number": Object.keys(games[gameId].players).length + 1,
            "maxSatiété": 10,
            "maxSoif": 10,
            "afkSatiété": 0.1,
            "afkSoif": 0.1,
            "moveSatiété": 0.4,
            "moveSoif": 0.3,
            "reproductionCooldown": 5,
            "social": false,
            "montagnard": false,
            "posBase": getPosBase(Object.keys(games[gameId].players).length + 1, gameId),
            pret: false
        };

        // Emit 'playerJoined' to all clients in the game
        io.to(gameId)
            .emit('playerEntered',
                {
                    "playerList": Object.keys(games[gameId].players),
                    "playerName": playerName,
                    "playerNumber": games[gameId].players[playerName].number
                });

        // Emit 'enterGameResponse' to the current client
        socket.emit('enterGameResponse',
            {
                "allowed": true,
                "playerNumber": games[gameId].players[playerName].number

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
        turn(data.gameId);
    });

    socket.on("reset", gameId => {
        resetTiles(gameId);
    });

    socket.on("getGames", ()=>{
        console.log("getGames");
        socket.emit("getGamesResponse", games)
    })

    socket.on("submitAttributes", (data, callback) => {
        console.log(data);
        if (testAttribut(data, data.gameId)) {
            console.log("passed")
            games[data.gameId].players[data.joueur].attributs = creerAttributs(parseInt(data.vitesse), parseInt(data.vision), parseInt(data.reproduction));
            console.log(games[data.gameId].players[data.joueur].attributs);
            callback(true);
            socket.emit("pret");
            games[data.gameId].players[data.joueur].pret = true;

        } else {
            callback(false);
        }
    })

    function updateTiles(gameId) {
        io.to(gameId).emit("tiles", games[gameId].tiles);
    }

});

function creerAttributs(vitesse, vision, reproduction) {
    return {
        "vitesse": vitesse,
        "vision": vision,
        "reproduction": reproduction
    }
}


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