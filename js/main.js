"use strict";

var gameNode = document.getElementById('gameboard'),
    comment = document.getElementById('comment'),
    blackLoading = document.getElementById('blackLoading'),
    whiteLoading = document.getElementById('whiteLoading'),
    blackTurn = document.getElementById('blackTurn'),
    whiteTurn = document.getElementById('whiteTurn'),
    blackScore = document.getElementById('blackScore'),
    whiteScore = document.getElementById('whiteScore');


var game = {

    size : 8,
    nearCases : [
        {'x': -1, 'y': -1},
        {'x': -1, 'y': 0},
        {'x': -1, 'y': 1},
        {'x': 0, 'y': -1},
        {'x': 0, 'y': 0},
        {'x': 0, 'y': 1},
        {'x': 1, 'y': -1},
        {'x': 1, 'y': 0},
        {'x': 1, 'y': 1}
    ],

    oppositeTurn : function(turn) {
        return (turn == 'black' ? 'white' : 'black');
    },

    toggleTurn : function() {
        eval(game.turn + 'Turn').removeAttribute('class');
        game.turn = game.oppositeTurn(game.turn);
        eval(game.turn + 'Turn').setAttribute('class', 'active');
    },

    init : function(){
        game.reset();
        game.createBoard();
        game.allCases = document.querySelectorAll('[role="case"]');
        gameNode.addEventListener('click', game.play, false);
    },

    reset : function() {
        game.turn = 'black';
        game.computerColor = 'white';
        game.points = {'black' : 2, 'white' : 2};
        game.updateScores();
        gameNode.innerHTML = '';

        eval(game.oppositeTurn(game.turn) + 'Turn').removeAttribute('class');
        eval(game.turn + 'Turn').setAttribute('class', 'active');
        comment.setAttribute('class', 'hidden');
        blackLoading.setAttribute('class', 'hide');
        whiteLoading.setAttribute('class', 'hide');
    },

    createBoard : function() {
        var middle1 = game.size/2 - 1, middle2 = game.size/2;
        var row, i, j;

        for (i = 0 ; i < game.size ; i++){
            row = '<div role="row">';
            for (j = 0 ; j < game.size ; j++){
                row += '<div role="case" data-x="' + j + '" data-y="' + i + '">';

                if ((i == middle1 && j == middle1) || (i == middle2 && j == middle2)) {
                    row += '<span role="piece" data-color="white"></span>';
                } else if ((i == middle1 && j == middle2) || (i == middle2 && j == middle1)) {
                    row += '<span role="piece" data-color="black"></span>';
                }
                row += '</div>';
            }
            row += '</div>';
            gameNode.innerHTML += row;
        }
    },

    updateScores : function() {
        blackScore.innerHTML = game.points.black;
        whiteScore.innerHTML = game.points.white;
    },

    play : function(e) {
        var target = e.target, pieces;

        if (target.getAttribute('role') == 'case' && !target.firstChild) {
            var x = parseInt(target.getAttribute('data-x'), 10),
                y = parseInt(target.getAttribute('data-y'), 10),

            pieces = game.shot(x,y);
            if (pieces.length > 0) {
                game.playShot(target, pieces);
                game.computerTurn();
            }
        }
    },

    computerTurn : function() {
        if (game.hasPossibleShot(game.turn)) {
            eval(game.computerColor + 'Loading').removeAttribute('class');
            setTimeout(function(){
                var bestShot = game.bestShot(game.turn);
                game.playShot(bestShot.target, bestShot.pieces);
                eval(game.computerColor + 'Loading').setAttribute('class', 'hide');
            }, 500);
        }
    },

    findPiece : function(nearCase, x, y, dist) {
        var xc = x + nearCase.x * dist,
            yc = y + nearCase.y * dist,
            c = document.querySelector('[data-x="'+ xc +'"][data-y="'+ yc +'"]');
        return (c ? c.firstChild : null);
    },

    shot : function(x, y, color){
        color = typeof color !== 'undefined' ? color : game.turn;
        var countNearCases = game.nearCases.length;
        var i, nearCase, dist, piece, pieces = [], tmpPieces;

        for (i = 0 ; i < countNearCases ; i++) {
            dist = 1;
            nearCase = game.nearCases[i];
            piece = game.findPiece(nearCase, x, y, dist);
            if (piece && piece.getAttribute('data-color') != color) {
                tmpPieces = [piece];
                do {
                    dist++;
                    piece = game.findPiece(nearCase, x, y, dist);
                    if (piece && piece.getAttribute('data-color') != color) {
                        tmpPieces.push(piece);
                    }
                } while (piece && piece.getAttribute('data-color') != color);
                if (piece && piece.getAttribute('data-color') == color) {
                    pieces = pieces.concat(tmpPieces);
                }
            }
        }
        return pieces;
    },

    playShot : function(target, pieces) {
        var i, count = pieces.length;

        target.innerHTML = '<span role="piece" data-color="'+ game.turn +'"></span>';
        for (i = 0 ; i < count ; i++) {
            pieces[i].setAttribute('data-color', game.turn);
        }
        game.points[game.turn] += count + 1;
        game.points[game.oppositeTurn(game.turn)] -= count;
        game.endTurn();
    },

    endTurn : function() {
        game.updateScores();
        game.toggleTurn();
        if (!game.hasPossibleShot(game.turn)) {
            if (!game.hasPossibleShot(game.oppositeTurn(game.turn))) {
                game.endGame();
            } else {
                game.impossiblePlay();
            }
            comment.removeAttribute('class');
        }
    },

    hasPossibleShot : function(color) {
        var i, j;

        for (i = 0 ; i < game.size ; i++){
            for (j = 0 ; j < game.size ; j++){
                if (!game.allCases[i*game.size + j].firstChild) {
                    if (game.shot(j, i, color).length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    bestShot : function(color) {
        var i, j, count, max = 0;
        var pieces, tmpPieces, target, tmpTarget, foundCorner = false, isCorner;

        for (i = 0 ; i < game.size ; i++){
            for (j = 0 ; j < game.size ; j++){
                tmpTarget = game.allCases[i*game.size + j]
                if (!tmpTarget.firstChild) {
                    tmpPieces = game.shot(j, i, color);
                    count = tmpPieces.length;
                    isCorner = game.isCorner(j, i);
                    if (count > 0 && ((foundCorner && isCorner && count > max) ||
                    (!foundCorner && (isCorner || count > max)))) {
                        max = count;
                        target = tmpTarget;
                        pieces = tmpPieces;
                        foundCorner = isCorner;
                    }
                }
            }
        }
        return {'target': target, 'pieces': pieces};
    },

    isCorner : function(x, y) {
        if ((x == 0 && y == 0) || (x == 0 && y == game.size-1) ||
            (x == game.size-1 && y == 0) || (x == game.size-1 && y == game.size-1)) {
            return true;
        }
        return false;
    },

    impossiblePlay : function() {
        comment.innerHTML = game.turn[0].toUpperCase() + game.turn.substr(1)
            + ' can\'t play anything &nbsp; >>'
            + '<button type="button" id="continue">Continue</button>';
        gameNode.removeEventListener('click', game.play, false);
        var continueBtn = document.getElementById('continue');
        continueBtn.addEventListener('click', game.continueAction, false);
    },

    continueAction : function() {
        comment.setAttribute('class', 'hidden');
        game.toggleTurn();
        gameNode.addEventListener('click', game.play, false);
        if (game.turn == game.computerColor) {
            game.computerTurn();
        }
    },

    endGame : function() {
        var message = 'Draw !';

        if (game.points['black'] > game.points['white']) {
            message = 'Black wins !';
        } else if (game.points['black'] < game.points['white']) {
            message = 'White wins !';
        }
        comment.innerHTML = message;
        eval(game.turn + 'Turn').removeAttribute('class');
        gameNode.removeEventListener('click', game.play, false);
    }
};

(function(){
    var restartBtn = document.getElementById('restart');

    window.addEventListener('load', game.init, false);
    restartBtn.addEventListener('click', game.init, false);
})();