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

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.InvocationTargetException;

import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaResourceApi;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginManager;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.provider.MediaStore;
import android.provider.OpenableColumns;

public class ContentFilesystem extends Filesystem {

	private CordovaInterface cordova;
	private CordovaResourceApi resourceApi;
	
	public ContentFilesystem(String name, CordovaInterface cordova, CordovaWebView webView) {
		this.name = name;
		this.cordova = cordova;

		Class webViewClass = webView.getClass();
		PluginManager pm = null;
		try {
			Method gpm = webViewClass.getMethod("getPluginManager");
			pm = (PluginManager) gpm.invoke(webView);
		} catch (NoSuchMethodException e) {
		} catch (IllegalAccessException e) {
		} catch (InvocationTargetException e) {
		}
		if (pm == null) {
			try {
				Field pmf = webViewClass.getField("pluginManager");
				pm = (PluginManager)pmf.get(webView);
			} catch (NoSuchFieldException e) {
			} catch (IllegalAccessException e) {
			}
		}
		this.resourceApi = new CordovaResourceApi(webView.getContext(), pm);
	}
	
	@Override
	public JSONObject getEntryForLocalURL(LocalFilesystemURL inputURL) throws IOException {
	    if ("/".equals(inputURL.fullPath)) {
            try {
                return LocalFilesystem.makeEntryForURL(inputURL, true, inputURL.URL.toString());
            } catch (JSONException e) {
                throw new IOException();
            }
	    }

		// Get the cursor to validate that the file exists
		Cursor cursor = openCursorForURL(inputURL);
		String filePath = null;
		try {
			if (cursor == null || !cursor.moveToFirst()) {
				throw new FileNotFoundException();
			}
			filePath = filesystemPathForCursor(cursor);
		} finally {
			if (cursor != null)
				cursor.close();
		}
		if (filePath == null) {
			filePath = inputURL.URL.toString();
		} else {
			filePath = "file://" + filePath;
		}
		try {
			return makeEntryForPath(inputURL.fullPath, inputURL.filesystemName, false /*fp.isDirectory()*/, filePath);
		} catch (JSONException e) {
			throw new IOException();
		}
	}
	
    @Override
	public JSONObject getFileForLocalURL(LocalFilesystemURL inputURL,
			String fileName, JSONObject options, boolean directory) throws IOException, TypeMismatchException, JSONException {
        if (options != null) {
            if (options.optBoolean("create")) {
        		throw new IOException("Cannot create content url");
            }
        }
        LocalFilesystemURL requestedURL = new LocalFilesystemURL(Uri.withAppendedPath(inputURL.URL, fileName));
        File fp = new File(this.filesystemPathForURL(requestedURL));
        if (!fp.exists()) {
            throw new FileNotFoundException("path does not exist");
        }
        if (directory) {
            if (fp.isFile()) {
                throw new TypeMismatchException("path doesn't exist or is file");
            }
        } else {
            if (fp.isDirectory()) {
                throw new TypeMismatchException("path doesn't exist or is directory");
            }
        }
        // Return the directory
        return makeEntryForPath(requestedURL.fullPath, requestedURL.filesystemName, directory, Uri.fromFile(fp).toString());

	}

	@Override
	public boolean removeFileAtLocalURL(LocalFilesystemURL inputURL)
			throws NoModificationAllowedException {

		String filePath = filesystemPathForURL(inputURL);
		File file = new File(filePath);
		try {
			this.cordova.getActivity().getContentResolver().delete(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
					MediaStore.Images.Media.DATA + " = ?",
					new String[] { filePath });
		} catch (UnsupportedOperationException t) {
			// Was seeing this on the File mobile-spec tests on 4.0.3 x86 emulator.
			// The ContentResolver applies only when the file was registered in the
			// first case, which is generally only the case with images.
		}
		return file.delete();
	}

	@Override
	public boolean recursiveRemoveFileAtLocalURL(LocalFilesystemURL inputURL)
			throws NoModificationAllowedException {
		throw new NoModificationAllowedException("Cannot remove content url");
	}

	@Override
	public JSONArray readEntriesAtLocalURL(LocalFilesystemURL inputURL)
			throws FileNotFoundException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public JSONObject getFileMetadataForLocalURL(LocalFilesystemURL inputURL) throws FileNotFoundException {
		Integer size = null;
		Integer lastModified = null;
        Cursor cursor = openCursorForURL(inputURL);
        try {
        	if (cursor != null && cursor.moveToFirst()) {
        		size = resourceSizeForCursor(cursor);
        		lastModified = lastModifiedDateForCursor(cursor);
        	} else {
    			throw new FileNotFoundException();
        	}
        } finally {
        	if (cursor != null)
        		cursor.close();
        }

        JSONObject metadata = new JSONObject();
        try {
        	metadata.put("size", size);
        	metadata.put("type", resourceApi.getMimeType(inputURL.URL));
        	metadata.put("name", inputURL.filesystemName);
        	metadata.put("fullPath", inputURL.fullPath);
        	metadata.put("lastModifiedDate", lastModified);
        } catch (JSONException e) {
        	return null;
        }
        return metadata;
	}

	@Override
	public JSONObject copyFileToURL(LocalFilesystemURL destURL, String newName,
			Filesystem srcFs, LocalFilesystemURL srcURL, boolean move)
                    throws IOException, InvalidModificationException, JSONException,
                    NoModificationAllowedException, FileExistsException {
        if (LocalFilesystem.class.isInstance(srcFs)) {
            /* Same FS, we can shortcut with CordovaResourceApi operations */
            // Figure out where we should be copying to
            final LocalFilesystemURL destinationURL = makeDestinationURL(newName, srcURL, destURL);

            OutputStream os = resourceApi.openOutputStream(destURL.URL);
            CordovaResourceApi.OpenForReadResult ofrr = resourceApi.openForRead(srcURL.URL);
            if (move && !srcFs.canRemoveFileAtLocalURL(srcURL)) {
                throw new NoModificationAllowedException("Cannot move file at source URL");
            }
            try {
                resourceApi.copyResource(ofrr, os);
            } catch (IOException e) {
                throw new IOException("Cannot read file at source URL");
            }
            if (move) {
                srcFs.removeFileAtLocalURL(srcURL);
            }
            return makeEntryForURL(destinationURL, false, destinationURL.URL.toString());
        } else {
            // Need to copy the hard way
            return super.copyFileToURL(destURL, newName, srcFs, srcURL, move);
		}
	}

    
	@Override
    public void readFileAtURL(LocalFilesystemURL inputURL, long start, long end,
			ReadFileCallback readFileCallback) throws IOException {
		CordovaResourceApi.OpenForReadResult ofrr = resourceApi.openForRead(inputURL.URL);
        if (end < 0) {
            end = ofrr.length;
        }
        long numBytesToRead = end - start;
		try {
			if (start > 0) {
                ofrr.inputStream.skip(start);
			}
            LimitedInputStream inputStream = new LimitedInputStream(ofrr.inputStream, numBytesToRead);
            readFileCallback.handleData(inputStream, ofrr.mimeType);
		} finally {
            ofrr.inputStream.close();
		}
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

	protected Cursor openCursorForURL(LocalFilesystemURL url) {
        ContentResolver contentResolver = this.cordova.getActivity().getContentResolver();
        Cursor cursor = contentResolver.query(url.URL, null, null, null, null);
        return cursor;
	}

	protected String filesystemPathForCursor(Cursor cursor) {
        final String[] LOCAL_FILE_PROJECTION = { MediaStore.Images.Media.DATA };
        int columnIndex = cursor.getColumnIndex(LOCAL_FILE_PROJECTION[0]);
        if (columnIndex != -1) {
            return cursor.getString(columnIndex);
        }
        return null;
	}

	protected Integer resourceSizeForCursor(Cursor cursor) {
        int columnIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
        if (columnIndex != -1) {
            String sizeStr = cursor.getString(columnIndex);
            if (sizeStr != null) {
            	return Integer.parseInt(sizeStr,10);
            }
        }
        return null;
	}
	
	protected Integer lastModifiedDateForCursor(Cursor cursor) {
        final String[] LOCAL_FILE_PROJECTION = { MediaStore.MediaColumns.DATE_MODIFIED };
        int columnIndex = cursor.getColumnIndex(LOCAL_FILE_PROJECTION[0]);
        if (columnIndex != -1) {
            String dateStr = cursor.getString(columnIndex);
            if (dateStr != null) {
            	return Integer.parseInt(dateStr,10);
            }
        }
        return null;
	}

    @Override
    public String filesystemPathForURL(LocalFilesystemURL url) {
        Cursor cursor = openCursorForURL(url);
        try {
        	if (cursor != null && cursor.moveToFirst()) {
        		return filesystemPathForCursor(cursor);
        	}
        } finally {
            if (cursor != null)
            	cursor.close();
        }
        return null;
    }

	@Override
	public LocalFilesystemURL URLforFilesystemPath(String path) {
		// Returns null as we don't support reverse mapping back to content:// URLs
		return null;
	}

	@Override
	public boolean canRemoveFileAtLocalURL(LocalFilesystemURL inputURL) {
		String path = filesystemPathForURL(inputURL);
		File file = new File(path);
		return file.exists();
	}

	@Override
	OutputStream getOutputStreamForURL(LocalFilesystemURL inputURL)
			throws IOException {
		OutputStream os = resourceApi.openOutputStream(inputURL.URL);
		return os;
    }
}