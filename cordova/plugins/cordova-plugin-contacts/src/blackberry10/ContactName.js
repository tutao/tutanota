/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

function toFormattedName(properties) {
    var formatted = "";
    if (properties && properties.givenName) {
        formatted = properties.givenName;
        if (properties && properties.familyName) {
            formatted += " " + properties.familyName;
        }
    }
    return formatted;
}

var ContactName = function (properties) {
    this.familyName = properties && properties.familyName ? properties.familyName : "";
    this.givenName = properties && properties.givenName ? properties.givenName : "";
    this.formatted = toFormattedName(properties);
    this.middleName = properties && properties.middleName ? properties.middleName : "";
    this.honorificPrefix = properties && properties.honorificPrefix ? properties.honorificPrefix : "";
    this.honorificSuffix = properties && properties.honorificSuffix ? properties.honorificSuffix : "";
    this.phoneticFamilyName = properties && properties.phoneticFamilyName ? properties.phoneticFamilyName : "";
    this.phoneticGivenName = properties && properties.phoneticGivenName ? properties.phoneticGivenName : "";
};

module.exports = ContactName;
