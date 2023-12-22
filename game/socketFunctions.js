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
        if (Object.keys(data.players[playerName].attributs).length != 0) {
            $("#CreationEspece").css("display", "none");
        }
    }
    $("#listeJoueurs").text(Object.keys(players));
    console.log(data);
    console.log(data.createur);
    console.log(playerName);
    $("capacité").text(data.players[playerName].skill);
    if (data.createur == playerName && data.currentTour == 0) {
        $("#startGameButton").css("display", "block");
    }
    else {
        $("#startGameButton").css("display", "none");
    }
    $("#tourActuel").text(data.currentTour);

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

socket.on("pret", () => {
    $("#readyMessage").text("vous etes pret");
    $("#readyMessage").show();
})

socket.on("erreurAttribut", message => {
    $("#readyMessage").text(message);
    $("#readyMessage").show();
})

socket.on("skill", data => {
    console.log(data);
    $("#skillMessage").text(data);
    switch (data) {
        case "social":
            $("#skillDescription").text("vous etes social, vous pouvez marcher sur les cases déja populées");
            break;
        case "montagnard": //done
            $("#skillDescription").text("vous etes montagnard, vous pouvez marcher sur les cases montagnes");
            break;
        case "aquatique": //done
            $("#skillDescription").text("vous etes aquatique, vous pouvez gagnez un peu de nourriture sur les cases d'eau");
            break;
        case "traveler": //done
            $("#skillDescription").text("vous etes voyager, vous perdez moins de nourriture et d'eau en marchant");
            break;
        case "big Stomach": //done
            $("#skillDescription").text("vous avez un gros estomac, vous avez une plus grande reserve de nourritur");
            break;
        case "desert Tribe": //done
            $("#skillDescription").text("vous etes du désert, vous avez une plus grande reserve d'eau");
            break;
        case "farmers":   //done
            $("#skillDescription").text("s'arreter sur une case la laboure, une fois une case labourée 3 fois, elle devient une case nourriture");
            break;
        case "fast sprinters": //done
            $("#skillDescription").text("vous etes rapide, votre vitesse n'a plus d'importance, vous pouvez vous deplacer sue n'importe quelle case visible en un tour");
            break;
        case "fast breeders": //done
            $("#skillDescription").text("vous vous reproduisez vite, vous pouvez vous reproduire tous les 3 tours (au lieu de 5)");
            break;
        case "economes": //done
            $("#skillDescription").text("vous etes économes, vous consommez moins de nourriture et d'eau");
            break;
        default:
            $("#skillDescription").text("vous n'avez pas de compétence");
            break;
    }
    $("capacité").text(data);
    $("#skillModal").css("display", "flex");
})