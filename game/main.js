var gameId = null;
const PlayerName = getPlayerName();
var playerNumber = -1;

$(document).ready(function () 
{
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    gameId = url.searchParams.get("gameId");
    
    requestGameInfo(gameId);
});

function openModal(allowed,message) 
{
    $("#welcomeMessage").text(message);
    $("#myModal").css("display", "block");
    if (!allowed)
    {
        $("#enterButton").css("display", "none")
    }
};

function closeModal() 
{
    console.log("modal closed");
    $("#myModal").css("display", "none");
};

function enterGame() 
{
    socket.emit("enterGame",{"gameId":gameId,"playerName":PlayerName});
};

function getPlayerName() 
{
    var PlayerName = document.cookie.replace(/(?:(?:^|.*;\s*)playerName\s*=\s*([^;]*).*$)|^.*$/, "$1");
    return PlayerName || null;
};

function requestGameInfo(gameId) {
    socket.emit('requestGameInfo',gameId);
};