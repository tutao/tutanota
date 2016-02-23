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
package org.apache.cordova.file;

import android.net.Uri;

public class LocalFilesystemURL {
	
	public static final String FILESYSTEM_PROTOCOL = "cdvfile";

    public final Uri uri;
    public final String fsName;
    public final String path;
    public final boolean isDirectory;

	private LocalFilesystemURL(Uri uri, String fsName, String fsPath, boolean isDirectory) {
		this.uri = uri;
        this.fsName = fsName;
        this.path = fsPath;
        this.isDirectory = isDirectory;
	}

    public static LocalFilesystemURL parse(Uri uri) {
        if (!FILESYSTEM_PROTOCOL.equals(uri.getScheme())) {
            return null;
        }
        String path = uri.getPath();
        if (path.length() < 1) {
            return null;
        }
        int firstSlashIdx = path.indexOf('/', 1);
        if (firstSlashIdx < 0) {
            return null;
        }
        String fsName = path.substring(1, firstSlashIdx);
        path = path.substring(firstSlashIdx);
        boolean isDirectory = path.charAt(path.length() - 1) == '/';
        return new LocalFilesystemURL(uri, fsName, path, isDirectory);
    }

    public static LocalFilesystemURL parse(String uri) {
        return parse(Uri.parse(uri));
    }

    public String toString() {
        return uri.toString();
    }
}
