/*
Copyright 2012 Adobe Systems Inc.;
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

"use strict";

var parseCSV = function(file, cb) {

	var fs     = require('fs')
	, filename = file
	, csv      = require('csv')
	; 

	var header = [];
	var values = [];
	var json   = {};

	csv()
	.from.stream(fs.createReadStream(file))
    .transform(function(row, index){
        //in case there are blank lines in between key & value on Win7
        if (row[0] == ""){
            return null;
        }else{
            return row;
        }
    })
	.on('record', function(row,index){
		if (index === 0)
			header.push(row);
		else
			values.push(row);
	})
	.on('end', function(count){
		header[0].forEach(function (h, idx) {
			json[h] = values[0][idx];
		});
		cb(json);
	})
	.on('error', function(error){
		console.log(error.message);
	});
};

module.exports = parseCSV;