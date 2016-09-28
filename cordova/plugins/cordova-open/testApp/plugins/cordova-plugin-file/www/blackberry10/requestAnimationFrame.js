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

/*
 * requestAnimationFrame
 * 
 * This is used throughout the BB10 File implementation to wrap
 * native webkit calls. There is a bug in the webkit implementation
 * which causes callbacks to never return when multiple file system
 * APIs are called in sequence. This should also make the UI more
 * responsive during file operations.
 * 
 * Supported on BB10 OS > 10.1
 */

var requestAnimationFrame = window.requestAnimationFrame;
if (typeof(requestAnimationFrame) !== 'function') {
    requestAnimationFrame = function (cb) { cb(); };
}
module.exports = requestAnimationFrame;
