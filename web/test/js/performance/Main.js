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
        test128bitSmallAmount().then(function(resultLines) {
            printResult(resultLines);
        });
    });
});