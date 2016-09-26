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

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.OutputStream;

import org.apache.cordova.CordovaResourceApi;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.MediaStore;
import android.provider.OpenableColumns;

public class ContentFilesystem extends Filesystem {

    private final Context context;

	public ContentFilesystem(Context context, CordovaResourceApi resourceApi) {
		super(Uri.parse("content://"), "content", resourceApi);
        this.context = context;
	}

    @Override
    public Uri toNativeUri(LocalFilesystemURL inputURL) {
        String authorityAndPath = inputURL.uri.getEncodedPath().substring(this.name.length() + 2);
        if (authorityAndPath.length() < 2) {
            return null;
        }
        String ret = "content://" + authorityAndPath;
        String query = inputURL.uri.getEncodedQuery();
        if (query != null) {
            ret += '?' + query;
        }
        String frag = inputURL.uri.getEncodedFragment();
        if (frag != null) {
            ret += '#' + frag;
        }
        return Uri.parse(ret);
    }

    @Override
    public LocalFilesystemURL toLocalUri(Uri inputURL) {
        if (!"content".equals(inputURL.getScheme())) {
            return null;
        }
        String subPath = inputURL.getEncodedPath();
        if (subPath.length() > 0) {
            subPath = subPath.substring(1);
        }
        Uri.Builder b = new Uri.Builder()
            .scheme(LocalFilesystemURL.FILESYSTEM_PROTOCOL)
            .authority("localhost")
            .path(name)
            .appendPath(inputURL.getAuthority());
        if (subPath.length() > 0) {
            b.appendEncodedPath(subPath);
        }
        Uri localUri = b.encodedQuery(inputURL.getEncodedQuery())
            .encodedFragment(inputURL.getEncodedFragment())
            .build();
        return LocalFilesystemURL.parse(localUri);
    }

    @Override
	public JSONObject getFileForLocalURL(LocalFilesystemURL inputURL,
			String fileName, JSONObject options, boolean directory) throws IOException, TypeMismatchException, JSONException {
        throw new UnsupportedOperationException("getFile() not supported for content:. Use resolveLocalFileSystemURL instead.");
	}

	@Override
	public boolean removeFileAtLocalURL(LocalFilesystemURL inputURL)
			throws NoModificationAllowedException {
        Uri contentUri = toNativeUri(inputURL);
		try {
            context.getContentResolver().delete(contentUri, null, null);
		} catch (UnsupportedOperationException t) {
			// Was seeing this on the File mobile-spec tests on 4.0.3 x86 emulator.
			// The ContentResolver applies only when the file was registered in the
			// first case, which is generally only the case with images.
            throw new NoModificationAllowedException("Deleting not supported for content uri: " + contentUri);
		}
        return true;
	}

	@Override
	public boolean recursiveRemoveFileAtLocalURL(LocalFilesystemURL inputURL)
			throws NoModificationAllowedException {
		throw new NoModificationAllowedException("Cannot remove content url");
	}

    @Override
    public LocalFilesystemURL[] listChildren(LocalFilesystemURL inputURL) throws FileNotFoundException {
        throw new UnsupportedOperationException("readEntriesAtLocalURL() not supported for content:. Use resolveLocalFileSystemURL instead.");
    }

	@Override
	public JSONObject getFileMetadataForLocalURL(LocalFilesystemURL inputURL) throws FileNotFoundException {
        long size = -1;
        long lastModified = 0;
        Uri nativeUri = toNativeUri(inputURL);
        String mimeType = resourceApi.getMimeType(nativeUri);
        Cursor cursor = openCursorForURL(nativeUri);
        try {
        	if (cursor != null && cursor.moveToFirst()) {
        		size = resourceSizeForCursor(cursor);
        		lastModified = lastModifiedDateForCursor(cursor);
        	} else {
                // Some content providers don't support cursors at all!
                CordovaResourceApi.OpenForReadResult offr = resourceApi.openForRead(nativeUri);
    			size = offr.length;
        	}
        } catch (IOException e) {
            throw new FileNotFoundException();
        } finally {
        	if (cursor != null)
        		cursor.close();
        }

        JSONObject metadata = new JSONObject();
        try {
        	metadata.put("size", size);
        	metadata.put("type", mimeType);
        	metadata.put("name", name);
        	metadata.put("fullPath", inputURL.path);
        	metadata.put("lastModifiedDate", lastModified);
        } catch (JSONException e) {
        	return null;
        }
        return metadata;
	}

	@Override
	public long writeToFileAtURL(LocalFilesystemURL inputURL, String data,
			int offset, boolean isBinary) throws NoModificationAllowedException {
        throw new NoModificationAllowedException("Couldn't write to file given its content URI");
    }
	@Override
	public long truncateFileAtURL(LocalFilesystemURL inputURL, long size)
			throws NoModificationAllowedException {
        throw new NoModificationAllowedException("Couldn't truncate file given its content URI");
	}

	protected Cursor openCursorForURL(Uri nativeUri) {
        ContentResolver contentResolver = context.getContentResolver();
        try {
            return contentResolver.query(nativeUri, null, null, null, null);
        } catch (UnsupportedOperationException e) {
            return null;
        }
	}

	private Long resourceSizeForCursor(Cursor cursor) {
        int columnIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
        if (columnIndex != -1) {
            String sizeStr = cursor.getString(columnIndex);
            if (sizeStr != null) {
            	return Long.parseLong(sizeStr);
            }
        }
        return null;
	}
	
	protected Long lastModifiedDateForCursor(Cursor cursor) {
        final String[] LOCAL_FILE_PROJECTION = { MediaStore.MediaColumns.DATE_MODIFIED };
        int columnIndex = cursor.getColumnIndex(LOCAL_FILE_PROJECTION[0]);
        if (columnIndex != -1) {
            String dateStr = cursor.getString(columnIndex);
            if (dateStr != null) {
            	return Long.parseLong(dateStr);
            }
        }
        return null;
	}

    @Override
    public String filesystemPathForURL(LocalFilesystemURL url) {
        File f = resourceApi.mapUriToFile(toNativeUri(url));
        return f == null ? null : f.getAbsolutePath();
    }

	@Override
	public LocalFilesystemURL URLforFilesystemPath(String path) {
		// Returns null as we don't support reverse mapping back to content:// URLs
		return null;
	}

	@Override
	public boolean canRemoveFileAtLocalURL(LocalFilesystemURL inputURL) {
		return true;
	}
}
