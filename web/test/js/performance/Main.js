"use strict";

var results = {small : {}, big : {}};
var smallAmountNames = ko.observableArray([]);
var bigAmountNames = ko.observableArray([]);
var resultLinesSmallAmount = ko.observableArray([]);
var resultLinesBigAmount = ko.observableArray([]);
var progressInfo = ko.observable("");

if (typeof Uint8Array.prototype.fill !== 'function') {
    Uint8Array.prototype.fill = function(value, start, end) {
        start = start || 0;
        end = end || this.length;

        for (var i = start; i < end; i++) {
            this[i] = value;
        }
    };
}


var printResult = function(resultLines) {
    smallAmountNames(Object.keys(results.small));
    bigAmountNames(Object.keys(results.big));
    resultLinesSmallAmount(_getResultLines("small"));
    resultLinesBigAmount(_getResultLines("big"));
};

var _getResultLines = function(type) {
    var testNames = Object.keys(results[type]);
    var resultCount = 0;
    if (testNames.length > 0){
        resultCount = results[type][testNames[0]].encrypt.length;
    }
    var lines = [];
    for(var i=0; i<resultCount; i++) {
        var line = {resultValues: []};
        for(var n=0; n<testNames.length; n++) {
            var testName = testNames[n];
            line.resultValues.push(results[type][testName].encrypt[i]);
            line.resultValues.push(results[type][testName].decrypt[i]);
        }
        lines.push(line);
    }
    return lines;
};


$(document).ready(function() {
    ko.applyBindings();
    $("#start").click(function() {
        runTest(results).then(function() {
            progressInfo("done");
            printResult(results);
        });
    });
});
