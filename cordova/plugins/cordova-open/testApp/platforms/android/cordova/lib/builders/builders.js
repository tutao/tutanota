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

var CordovaError = require('cordova-common').CordovaError;

var knownBuilders = {
    ant: 'AntBuilder',
    gradle: 'GradleBuilder',
    none: 'GenericBuilder'
};

/**
 * Helper method that instantiates and returns a builder for specified build
 *   type.
 *
 * @param   {String}  builderType   Builder name to construct and return. Must
 *   be one of 'ant', 'gradle' or 'none'
 *
 * @return  {Builder}               A builder instance for specified build type.
 */
module.exports.getBuilder = function (builderType, projectRoot) {
    if (!knownBuilders[builderType])
        throw new CordovaError('Builder ' + builderType + ' is not supported.');

    try {
        var Builder = require('./' + knownBuilders[builderType]);
        return new Builder(projectRoot);
    } catch (err) {
        throw new CordovaError('Failed to instantiate ' + knownBuilders[builderType] + ' builder: ' + err);
    }
};
