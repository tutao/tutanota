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
var ContactError = function (code, msg) {
    this.code = code;
    this.message = msg;
};

Object.defineProperty(ContactError, "UNKNOWN_ERROR", { "value": 0 });
Object.defineProperty(ContactError, "INVALID_ARGUMENT_ERROR", { "value": 1 });
Object.defineProperty(ContactError, "TIMEOUT_ERROR", { "value": 2 });
Object.defineProperty(ContactError, "PENDING_OPERATION_ERROR", { "value": 3 });
Object.defineProperty(ContactError, "IO_ERROR", { "value": 4 });
Object.defineProperty(ContactError, "NOT_SUPPORTED_ERROR", { "value": 5 });
Object.defineProperty(ContactError, "PERMISSION_DENIED_ERROR", { "value": 20 });

module.exports = ContactError;

