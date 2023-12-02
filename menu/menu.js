var socket = io();

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
// Get the values from the input fields
var maxPlayers = $("#nbPlayer").val();
var size_x = $("#size").val();
var size_y = size_x; // Assuming size_y should be the same as size_x, you can modify this if needed.

// Emit the "newGame" event with the obtained values
socket.emit("newGame", { "size_x": size_x, "size_y": size_y, "maxPlayers": maxPlayers });
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

// Display the appropriate UI when the page loads
$(document).ready(function () {
    displayPlayerUI();
});