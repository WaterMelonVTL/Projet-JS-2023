var gameId = null;
var playerName = getPlayerName();
var playerNumber = -1;
var toutlemondeachoisi = false
$(document).ready(function () 
{
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    gameId = url.searchParams.get("gameId");
    
    

    requestGameInfo(gameId);
    
});

function openModal(allowed,message,hasToSetName=false) 
{
    $("#welcomeMessage").text(message);
    $("#myModal").css("display", "flex");
    if (hasToSetName){
        $("#nameContent").css("display", "block")
        $("#enterButton").css("display", "none")
    }
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

function defPname() {
    let pname = $('#nameInput').val(); // Add parentheses after val
    if (pname) {
        document.cookie = `playerName=${pname}`;
        location.reload();
    }
}
