var gameId = null;
var playerName = getPlayerName();
var playerNumber = -1;
var toutlemondeachoisi = false

var reproductionPoints = 1;
var vitessePoints = 1;
var visionPoints = 1;
var pret = false;

$(document).ready(function () {
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    gameId = url.searchParams.get("gameId");
    requestGameInfo(gameId);
    $("#skillModal").css("display", "none");
});

function openModal(allowed, message, hasToSetName = false) {
    $("#welcomeMessage").text(message);
    $("#myModal").css("display", "flex");
    if (hasToSetName) {
        $("#nameContent").css("display", "block")
        $("#enterButton").css("display", "none")
    }
    if (!allowed) {
        $("#enterButton").css("display", "none")
    }
};

function closeModal() {
    console.log("modal closed");
    $("#myModal").css("display", "none");
};

function closeSkillModal() {
    $("#skillModal").css("display", "none");
};

function enterGame() {
    socket.emit("enterGame", { "gameId": gameId, "playerName": playerName });
};

function getPlayerName() {
    var PlayerName = document.cookie.replace(/(?:(?:^|.*;\s*)playerName\s*=\s*([^;]*).*$)|^.*$/, "$1");

    return PlayerName || null;
};

function requestGameInfo(gameId) {
    socket.emit('requestGameInfo', gameId);
};

document.onload = function () {
    $("#CreationEspece").css("display", "block");
    $("#playarea").css("display", "none");
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

let attributes = {
    'reproduction': 0,
    'vitesse': 0,
    'vision': 0
};
let totPts = 10;

function increaseAttribute(attribute) {
    if (totPts > 0) {
        attributes[attribute]++;
        totPts--;
        document.getElementById(attribute + '-pts').innerText = attributes[attribute];
        document.getElementById('totPts').innerText = totPts;
    }
}

function decreaseAttribute(attribute) {
    if (attributes[attribute] > 0) {
        attributes[attribute]--;
        totPts++;
        document.getElementById(attribute + '-pts').innerText = attributes[attribute];
        document.getElementById('totPts').innerText = totPts;
    }
}



function submitAttributes() {
    let reproductionPoints = attributes.reproduction;
    let visionPoints = attributes.vision;
    let vitessePoints = attributes.vitesse;
    if ((reproductionPoints + vitessePoints + visionPoints) == 10) {
        console.log(gameId);
        socket.emit("submitAttributes", {
            "gameId": gameId,
            "reproduction": reproductionPoints,
            "vitesse": vitessePoints,
            "vision": visionPoints,
            "joueur": playerName
        }, (response) => {
            if (response) {
                pret = true;
                $("#CreationEspece").css("display", "none");
                $("#playarea").css("display", "flex");
            } else {
                alert("Les attributs sont déjà utilisés par un autre joueur.");
            }
        });

    } else {
        alert("La somme totale des points doit être égale à 10.");
    }
}

function startGame() {

    socket.emit("startGame", gameId, (response)=>{
        if (response){
            $("#startGameButton").css("display", "none");
        } else {
            alert("Tous les joueurs ne sont pas pret.");
        }
    });
}
