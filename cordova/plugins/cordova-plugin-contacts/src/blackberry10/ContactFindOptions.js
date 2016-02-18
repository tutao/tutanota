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

/**
 * ContactFindOptions.
 * @constructor
 * @param filter search fields
 * @param sort sort fields and order
 * @param limit max number of contacts to return
 * @param favorite if set, only favorite contacts will be returned
 */

var ContactFindOptions = function (filter, sort, limit, favorite) {
    this.filter = filter || null;
    this.sort = sort || null;
    this.limit = limit || -1; // -1 for returning all results
    this.favorite = favorite || false;
    this.includeAccounts = [];
    this.excludeAccounts = [];
};

Object.defineProperty(ContactFindOptions, "SEARCH_FIELD_GIVEN_NAME", { "value": 0 });
Object.defineProperty(ContactFindOptions, "SEARCH_FIELD_FAMILY_NAME", { "value": 1 });
Object.defineProperty(ContactFindOptions, "SEARCH_FIELD_ORGANIZATION_NAME", { "value": 2 });
Object.defineProperty(ContactFindOptions, "SEARCH_FIELD_PHONE", { "value": 3 });
Object.defineProperty(ContactFindOptions, "SEARCH_FIELD_EMAIL", { "value": 4 });
Object.defineProperty(ContactFindOptions, "SEARCH_FIELD_BBMPIN", { "value": 5 });
Object.defineProperty(ContactFindOptions, "SEARCH_FIELD_LINKEDIN", { "value": 6 });
Object.defineProperty(ContactFindOptions, "SEARCH_FIELD_TWITTER", { "value": 7 });
Object.defineProperty(ContactFindOptions, "SEARCH_FIELD_VIDEO_CHAT", { "value": 8 });

Object.defineProperty(ContactFindOptions, "SORT_FIELD_GIVEN_NAME", { "value": 0 });
Object.defineProperty(ContactFindOptions, "SORT_FIELD_FAMILY_NAME", { "value": 1 });
Object.defineProperty(ContactFindOptions, "SORT_FIELD_ORGANIZATION_NAME", { "value": 2 });

module.exports = ContactFindOptions;

