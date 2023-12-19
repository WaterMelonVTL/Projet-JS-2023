var gameId = null;
var playerName = getPlayerName();
var playerNumber = -1;
var toutlemondeachoisi = false

var reproductionPoints = 1;
var vitessePoints = 1;
var visionPoints = 1;
var pret = false ;

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

function updateAttributeDisplay(attribute) {
    document.getElementById(attribute + 'Points').innerText = eval(attribute + 'Points');
}

function increaseAttribute(attribute) {
    if (attribute === 'reproduction' && reproductionPoints < 5 && (vitessePoints + visionPoints) < (10-reproductionPoints)) {
        reproductionPoints++;
    } else if (attribute === 'vitesse' && vitessePoints < 5 && (reproductionPoints + visionPoints) < (10-vitessePoints)) {
        vitessePoints++;
    } else if (attribute === 'vision' && visionPoints < 5 && (reproductionPoints + vitessePoints) < (10-visionPoints)) {
        visionPoints++;
    }
    updateAttributeDisplay(attribute);
}

function decreaseAttribute(attribute) {
    if (attribute === 'reproduction' && reproductionPoints > 1) {
        reproductionPoints--;
    } else if (attribute === 'vitesse' && vitessePoints > 1) {
        vitessePoints--;
    } else if (attribute === 'vision' && visionPoints > 1) {
        visionPoints--;
    }
    updateAttributeDisplay(attribute);
}



function submitAttributes() {
    let reproductionPoints = $("#reproductionPoints").val() ;
    let visionPoints = $("#visionPoints").val() ;
    let vitessePoints = $("#vitessePoints").val() ;
    if ((reproductionPoints + vitessePoints + visionPoints) === 10) {
        socket.emit("submitAttributes", {
            "gameId": gameId,
            "reproduction": reproductionPoints,
            "vitesse": vitessePoints,
            "vision": visionPoints,
            "joueur" : playerName
        });

    } else {
        alert("La somme totale des points doit être égale à 10.");
    }
}

function verificationJoueurPret() {
    if (pret) {
        $("#test").show();
    }
    else {
        alert("Les joueurs ne sont pas prêts.");
    }
}
