"use strict";

var printResult = function(resultLines) {
    var resultDiv = $("#result");
    for (var i=0; i<resultLines.length; i++) {
        resultDiv.append(resultLines[i] + "<br>");
    }
    resultDiv.append("<br>");
};

$(document).ready(function() {
    $("#start").click(function() {
        var resultLines = [];
        runTest(resultLines).then(function() {
            printResult(resultLines);
        });
    });
});