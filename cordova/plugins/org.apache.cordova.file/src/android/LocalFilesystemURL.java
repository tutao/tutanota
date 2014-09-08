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

import java.util.List;

import android.net.Uri;

public class LocalFilesystemURL {
	
	public static final String FILESYSTEM_PROTOCOL = "cdvfile";
	
	Uri URL;
	String filesystemName;
	String fullPath;

	public LocalFilesystemURL(Uri URL) {
		this.URL = URL;
		this.filesystemName = this.filesystemNameForLocalURL(URL);
		this.fullPath = this.fullPathForLocalURL(URL);
	}
	
	private String fullPathForLocalURL(Uri URL) {
		if (FILESYSTEM_PROTOCOL.equals(URL.getScheme()) && "localhost".equals(URL.getHost())) {
			String path = URL.getPath();
            if (URL.getQuery() != null) {
                path = path + "?" + URL.getQuery();
            }
			return path.substring(path.indexOf('/', 1));
		} else if ("content".equals(URL.getScheme())) {
			String path = '/' + URL.getHost() + URL.getPath();
			// Re-encode path component to handle Android 4.4+ Content URLs
			return Uri.encode(path,"/");
		}
		return null;
	}

	private String filesystemNameForLocalURL(Uri URL) {
		if (FILESYSTEM_PROTOCOL.equals(URL.getScheme()) && "localhost".equals(URL.getHost())) {
			List<String> pathComponents = URL.getPathSegments();
			if (pathComponents != null && pathComponents.size() > 0) {
				return pathComponents.get(0);
			}
			return null;
		} else if ("content".equals(URL.getScheme())) {
			return "content";
		}
		return null;
	}

	public LocalFilesystemURL(String strURL) {
		this(Uri.parse(strURL));
	}
	
    public String toString() {
        return "cdvfile://localhost/" + this.filesystemName + this.fullPath;
    }
}
