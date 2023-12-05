var gameId = null;
const playerName = getPlayerName();
var playerNumber = -1;
var toutlemondeachoisi = false
$(document).ready(function () 
{
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    gameId = url.searchParams.get("gameId");
    if (!playerName){
        playerName='invité-'+Math.random()*10000;
    }
    let infos =requestGameInfo(gameId);
    $("#listeJoueurs").text(infos.players);
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
    socket.emit("enterGame",{"gameId":gameId,"playerName":playerName});
};

function getPlayerName() 
{
    var PlayerName = document.cookie.replace(/(?:(?:^|.*;\s*)playerName\s*=\s*([^;]*).*$)|^.*$/, "$1");

    return PlayerName || null;
};

function requestGameInfo(gameId) {
    socket.emit('requestGameInfo',gameId);
};

if (!toutlemondeachoisi ){
    $("#playarea").style('hidden');
    $("#CreationEspece").style('block');

}