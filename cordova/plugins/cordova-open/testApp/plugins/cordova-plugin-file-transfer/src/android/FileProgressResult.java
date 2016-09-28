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
package org.apache.cordova.filetransfer;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Encapsulates in-progress status of uploading or downloading a file to a remote server.
 */
public class FileProgressResult {

    private boolean lengthComputable = false; // declares whether total is known
    private long loaded = 0;                  // bytes sent so far
    private long total = 0;                   // bytes total, if known

    public boolean getLengthComputable() {
        return lengthComputable;
    }

    public void setLengthComputable(boolean computable) {
        this.lengthComputable = computable;
    }

    public long getLoaded() {
        return loaded;
    }

    public void setLoaded(long bytes) {
        this.loaded = bytes;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long bytes) {
        this.total = bytes;
    }

    public JSONObject toJSONObject() throws JSONException {
        return new JSONObject(
                "{loaded:" + loaded +
                ",total:" + total +
                ",lengthComputable:" + (lengthComputable ? "true" : "false") + "}");
    }
}
