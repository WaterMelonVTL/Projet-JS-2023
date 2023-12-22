var socket = io();

// jQuery document ready function
$(document).ready(function () {
    // Event listener for the size-y input
    $('#value-largeur').text($('#size-y').val());
    $('#value-longueur').text($('#size-x').val());
    $('#size-y').on('input', function () {
        // Update the corresponding h1 with the current value
        $('#value-largeur').text($(this).val());
    });

    // Event listener for the size-x input
    $('#size-x').on('input', function () {
        // Update the corresponding h1 with the current value
        $('#value-longueur').text($(this).val());
    });
    socket.emit("getGames")
});


// Function to get the player name from the cookie
function getPlayerName() {
    var name = document.cookie.replace(/(?:(?:^|.*;\s*)playerName\s*=\s*([^;]*).*$)|^.*$/, "$1");
    return name || null;
}

// Function to set the player name in the cookie
function setPlayerName(name) {
    document.cookie = `playerName=${name}`;
}

// Function to display the appropriate UI based on whether the player has a name or not
function displayPlayerUI() {
    var playerName = getPlayerName();

    if (!playerName) {
        // If the player doesn't have a name yet
        $("#nameInput").show();
        $("#changeNameButton").show();
        $("#greeting").hide();
    } else {
        // If the player has a name
        $("#nameInput").hide();
        $("#changeNameButton").hide();
        $("#greeting").text(`Hello ${playerName}!`).show();
    }
}

// Function to create a game
// Function to create a game
function createGame() {
    var playerName = getPlayerName();

    // Check if the player name field is filled
    if (!playerName) {
        alert("Please enter your name before joining.");
        return;
    }
    const selectedNbPlayer = document.querySelector('input[name="nbPlayer"]:checked');
    var maxPlayers = selectedNbPlayer ? selectedNbPlayer.value : null;
    var size_x = $("#size-x").val();
    var size_y = $("#size-y").val();

    // Emit the "newGame" event with the obtained values
    console.log("futur createur : " + playerName);
    if (playerName) {
        var gameData = { creator: playerName, maxPlayers: maxPlayers, size_x: size_x, size_y: size_y };
        socket.emit("newGame", gameData);
    } else {
        alert("Please enter your name before creating a game.");
    }
}

// Function to join a game
function joinGame() {

    var playerName = getPlayerName();

    // Check if the player name field is filled
    if (!playerName) {
        alert("Please enter your name before joining.");
        return;
    }

    // Set the player name in the cookie
    setPlayerName(playerName);
    // Get the game ID and player name from the input fields
    var enteredGameId = $("#gameId").val();
    if (!enteredGameId) {
        if (selectedButton) {
            enteredGameId = selectedButton;
        }
    }
    // Emit the "joinGame" event with the entered game ID and player name
    socket.emit("joinGame", { gameId: enteredGameId, playerName: playerName });
}

// Function to change the player name
function changeName() {
    // Get the new player name from the input field
    var newName = $("#playerNameInput").val();

    // Check if the new player name field is filled
    if (!newName) {
        alert("Please enter a new name.");
        return;
    }

    // Set the new player name in the cookie
    setPlayerName(newName);

    // Display the updated UI
    displayPlayerUI();
}

socket.on("joinGameResponse", data => {
    if (data.allowed) {
        window.location.href = `http://localhost:8881/game?gameId=${data.gameId}`;
    } else {
        $("#messageServeur").text(data.message);
    }
});


$(document).ready(function () {
    displayPlayerUI();
});

let selectedButton = '';

function selectButton(gameId) {
    const oldButton = $(`#gameButton_${selectedButton}`)
    const button = $(`#gameButton_${gameId}`);
    if (button.length) {
        button.attr("class", "text-xl  h-[3rem] border-2 border-black rounded-md text-black my-1 w-[22rem] scale-105 bg-blue-200 ")
        oldButton.attr("class", "text-xl  h-[3rem] border-y-2 border-gray-600 text-gray-600 my-1 w-[22rem]")
        selectedButton = gameId;
    }
}

function createGameButton(gameId, gameInfo) {
    const button = $("<button></button>");
    button.text(`id : ${gameId}    -         joueurs : ${Object.keys(gameInfo.players).length}/${gameInfo.maxPlayers}     -    taille : ${gameInfo.size_x}x${gameInfo.size_y}`);
    button.attr("id", `gameButton_${gameId}`);
    button.attr("class", "text-xl  h-[3rem] border-y-2 border-gray-600 text-gray-600 my-1 w-[22rem]")
    button.on("click", function () {
        const selectedGameId = $(this).attr("id").split("_")[1];
        selectButton(selectedGameId);
    });
    return button;
}

function addGameButton(gameId, gameInfo) {
    const button = createGameButton(gameId, gameInfo);
    $("#running-games").append(button);
}

function updateGameButtonPlayers(gameId, numberOfPlayers, maxPlayers, size_x, size_y) {
    const button = $(`#gameButton_${gameId}`);
    if (button.length) {
        button.text(`id : ${gameId} -  joueurs : ${numberOfPlayers}/${maxPlayers} - taille : ${size_x}x${size_y}`);
    }
}

// Socket event handling
socket.on("getGamesResponse", data => {
    console.log("getGamesResponse", data)
    $("#running-games").empty();
    Object.keys(data).forEach(gameId => {
        const gameInfo = data[gameId];
        addGameButton(gameId, gameInfo);
    });
});

socket.on("playerJoined", data => {

    updateGameButtonPlayers(data.gameId, data.numberOfPlayers, data.maxPlayers, data.size_x, data.size_y);
});

socket.on("newGame", data => {
    addGameButton(data.gameId, data.game)
})