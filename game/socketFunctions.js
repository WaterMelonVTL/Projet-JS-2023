var socket = io();

socket.on('play', numJoueur => {
    generate_tiles()
});

socket.on('gameInfo', data => {
    console.log(data);
    const players = data.players;
    const maxPlayers = data.maxPlayers;
    var isGameFull = (players.length == maxPlayers);
    console.log(players);
    console.log(maxPlayers);
    console.log(isGameFull);
    console.log(data.size_x, data.size_y);
    createArea(data.size_x, data.size_y);
    if (playerName) {
        if (isGameFull) {
            openModal(false, "Welcome to game " + gameId + ". The game is full!");
        } else {
            openModal(true, "Welcome to game " + gameId);
        }
    }
    else {
        if (isGameFull) {
            openModal(false, "Welcome to game " + gameId + ". The game is full!", true);
        } else {
            openModal(false, "Welcome to game " + gameId, true);
        }
    }

    if (Object.keys(players).includes(playerName)) {
        closeModal();
        enterGame();
    }
    $("#listeJoueurs").text(players);
    if (data.creator == playerName && data.currentTurn == 0) {
        $("#startGameButton").css("display", "block");
    }
    else {
        $("#startGameButton").css("display", "none");
    }
    $("#tourActuel").text(data.currentTurn);

});

socket.on('tiles', tiles => {
    console.log(tiles);
    drawHexagons(tiles);
    drawOverlay(tiles);
});

// Function to close the modal

socket.on("playerEntered", data => {
    console.log('player ' + data.playerName + ' joined the game');
    $("#listeJoueurs").text(data.playerList);
})

socket.on("enterGameResponse", data => {
    if (data.allowed) {
        playerNumber = data.playerNumber;
        closeModal();
        generateTiles(gameId);
        $("#listeJoueurs").text(data.playerList);
    } else {
        $("#ModalMessage").text(data.message);
    }
});

socket.on("toutlemondeestpret", () => {
    toutlemondeachoisi = true;
})

socket.on("currentTurn", currentTurn => {
    document.getElementById("tourActuel").innerText = currentTurn;
});

socket.on("pret", ()=>{
    $("#readyMessage").text("vous etes pret");
    $("#readyMessage").show();
})

socket.on("erreurAttribut", message =>{
    $("#readyMessage").text(message);
    $("#readyMessage").show();
})