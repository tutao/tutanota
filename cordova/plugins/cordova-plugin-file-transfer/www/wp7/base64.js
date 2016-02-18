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

var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    INVALID_CHARACTER_ERR = (function () {
        // fabricate a suitable error object
        try { document.createElement('$'); }
        catch (error) { return error; }
    }());

    // encoder
    // [https://gist.github.com/999166] by [https://github.com/nignag]
    window.btoa || (
    window.btoa = function (input) {
        for (
            // initialize result and counter
          var block, charCode, idx = 0, map = chars, output = '';
            // if the next input index does not exist:
            //   change the mapping table to "="
            //   check if d has no fractional digits
          input.charAt(idx | 0) || (map = '=', idx % 1) ;
            // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
          output += map.charAt(63 & block >> 8 - idx % 1 * 8)
        ) {
            charCode = input.charCodeAt(idx += 3 / 4);
            if (charCode > 0xFF) throw INVALID_CHARACTER_ERR;
            block = block << 8 | charCode;
        }
        return output;
    });

    // decoder
    // [https://gist.github.com/1020396] by [https://github.com/atk]
    window.atob || (
    window.atob = function (input) {
        input = input.replace(/=+$/, '')
        if (input.length % 4 == 1) throw INVALID_CHARACTER_ERR;
        for (
            // initialize result and counters
          var bc = 0, bs, buffer, idx = 0, output = '';
            // get next character
          buffer = input.charAt(idx++) ;
            // character found in table? initialize bit storage and add its ascii value;
          ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
            // and if not first of each 4 characters,
            // convert the first 8 bits to one ascii character
            bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
        ) {
            // try to find character in table (0-63, not found => -1)
            buffer = chars.indexOf(buffer);
        }
        return output;
    });