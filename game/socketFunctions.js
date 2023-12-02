


var socket = io();

socket.on('play', numJoueur=>
{
    generate_tiles()
});

socket.on('gameInfo',data=>
{
    console.log(data);
    const players = data.players;
    const maxPlayers = data.maxPlayers;
    var isGameFull=(players.length==maxPlayers);
    console.log(players);
    console.log(maxPlayers);
    console.log(isGameFull);
    console.log(data.size_x, data.size_y);
    createArea(data.size_x, data.size_y);
    if (isGameFull) {
        openModal(false,"Welcome to game " + gameId + ". The game is full!");
    } else {
        openModal(true,"Welcome to game " + gameId);
    }
    if (players.includes(PlayerName)) {
        closeModal();
        enterGame();
    }
    
});

socket.on('tiles', tiles => {
    console.log(tiles);
    drawHexagons(tiles);
});

// Function to close the modal

socket.on("playerEntered", data=>{
    console.log('player '+data.playerName+' joined the game');
    $("#listeJoueurs").text(data.playerList);
})

socket.on("enterGameResponse", data =>{
    if (data.allowed){
        playerNumber=data.playerNumber;
        closeModal();
        generateTiles(gameId);
    } else {
        $("#ModalMessage").text(data.message);
    }
});
