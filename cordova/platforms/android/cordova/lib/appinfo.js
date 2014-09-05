#!/usr/bin/env node

/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/

var path = require('path');
var fs = require('fs');
var cachedAppInfo = null;

function readAppInfoFromManifest() {
    var manifestPath = path.join(__dirname, '..', '..', 'AndroidManifest.xml');
    var manifestData = fs.readFileSync(manifestPath, {encoding:'utf8'});
    var packageName = /\bpackage\s*=\s*"(.+?)"/.exec(manifestData);
    if (!packageName) throw new Error('Could not find package name within ' + manifestPath);
    var activityTag = /<activity\b[\s\S]*<\/activity>/.exec(manifestData);
    if (!activityTag) throw new Error('Could not find <activity> within ' + manifestPath);
    var activityName = /\bandroid:name\s*=\s*"(.+?)"/.exec(activityTag);
    if (!activityName) throw new Error('Could not find android:name within ' + manifestPath);

    return packageName[1] + '/.' + activityName[1];
}

exports.getActivityName = function() {
    return cachedAppInfo = cachedAppInfo || readAppInfoFromManifest();
};
