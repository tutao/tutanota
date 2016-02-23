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

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Arrays;

import org.apache.cordova.CordovaResourceApi;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public abstract class Filesystem {

    protected final Uri rootUri;
    protected final CordovaResourceApi resourceApi;
    public final String name;
    private JSONObject rootEntry;

    public Filesystem(Uri rootUri, String name, CordovaResourceApi resourceApi) {
        this.rootUri = rootUri;
        this.name = name;
        this.resourceApi = resourceApi;
    }

    public interface ReadFileCallback {
		public void handleData(InputStream inputStream, String contentType) throws IOException;
	}

    public static JSONObject makeEntryForURL(LocalFilesystemURL inputURL, Uri nativeURL) {
        try {
            String path = inputURL.path;
            int end = path.endsWith("/") ? 1 : 0;
            String[] parts = path.substring(0, path.length() - end).split("/+");
            String fileName = parts[parts.length - 1];

            JSONObject entry = new JSONObject();
            entry.put("isFile", !inputURL.isDirectory);
            entry.put("isDirectory", inputURL.isDirectory);
            entry.put("name", fileName);
            entry.put("fullPath", path);
            // The file system can't be specified, as it would lead to an infinite loop,
            // but the filesystem name can be.
            entry.put("filesystemName", inputURL.fsName);
            // Backwards compatibility
            entry.put("filesystem", "temporary".equals(inputURL.fsName) ? 0 : 1);

            String nativeUrlStr = nativeURL.toString();
            if (inputURL.isDirectory && !nativeUrlStr.endsWith("/")) {
                nativeUrlStr += "/";
            }
            entry.put("nativeURL", nativeUrlStr);
            return entry;
        } catch (JSONException e) {
            e.printStackTrace();
            throw new RuntimeException(e);
        }
    }

    public JSONObject makeEntryForURL(LocalFilesystemURL inputURL) {
        Uri nativeUri = toNativeUri(inputURL);
        return nativeUri == null ? null : makeEntryForURL(inputURL, nativeUri);
    }

    public JSONObject makeEntryForNativeUri(Uri nativeUri) {
        LocalFilesystemURL inputUrl = toLocalUri(nativeUri);
        return inputUrl == null ? null : makeEntryForURL(inputUrl, nativeUri);
    }

    public JSONObject getEntryForLocalURL(LocalFilesystemURL inputURL) throws IOException {
        return makeEntryForURL(inputURL);
    }

    public JSONObject makeEntryForFile(File file) {
        return makeEntryForNativeUri(Uri.fromFile(file));
    }

    abstract JSONObject getFileForLocalURL(LocalFilesystemURL inputURL, String path,
			JSONObject options, boolean directory) throws FileExistsException, IOException, TypeMismatchException, EncodingException, JSONException;

	abstract boolean removeFileAtLocalURL(LocalFilesystemURL inputURL) throws InvalidModificationException, NoModificationAllowedException;

	abstract boolean recursiveRemoveFileAtLocalURL(LocalFilesystemURL inputURL) throws FileExistsException, NoModificationAllowedException;

	abstract LocalFilesystemURL[] listChildren(LocalFilesystemURL inputURL) throws FileNotFoundException;

    public final JSONArray readEntriesAtLocalURL(LocalFilesystemURL inputURL) throws FileNotFoundException {
        LocalFilesystemURL[] children = listChildren(inputURL);
        JSONArray entries = new JSONArray();
        if (children != null) {
            for (LocalFilesystemURL url : children) {
                entries.put(makeEntryForURL(url));
            }
        }
        return entries;
    }

	abstract JSONObject getFileMetadataForLocalURL(LocalFilesystemURL inputURL) throws FileNotFoundException;

    public Uri getRootUri() {
        return rootUri;
    }

    public boolean exists(LocalFilesystemURL inputURL) {
        try {
            getFileMetadataForLocalURL(inputURL);
        } catch (FileNotFoundException e) {
            return false;
        }
        return true;
    }

    public Uri nativeUriForFullPath(String fullPath) {
        Uri ret = null;
        if (fullPath != null) {
            String encodedPath = Uri.fromFile(new File(fullPath)).getEncodedPath();
            if (encodedPath.startsWith("/")) {
                encodedPath = encodedPath.substring(1);
            }
            ret = rootUri.buildUpon().appendEncodedPath(encodedPath).build();
        }
        return ret;
    }

    public LocalFilesystemURL localUrlforFullPath(String fullPath) {
        Uri nativeUri = nativeUriForFullPath(fullPath);
        if (nativeUri != null) {
            return toLocalUri(nativeUri);
        }
        return null;
    }

    /**
     * Removes multiple repeated //s, and collapses processes ../s.
     */
    protected static String normalizePath(String rawPath) {
        // If this is an absolute path, trim the leading "/" and replace it later
        boolean isAbsolutePath = rawPath.startsWith("/");
        if (isAbsolutePath) {
            rawPath = rawPath.replaceFirst("/+", "");
        }
        ArrayList<String> components = new ArrayList<String>(Arrays.asList(rawPath.split("/+")));
        for (int index = 0; index < components.size(); ++index) {
            if (components.get(index).equals("..")) {
                components.remove(index);
                if (index > 0) {
                    components.remove(index-1);
                    --index;
                }
            }
        }
        StringBuilder normalizedPath = new StringBuilder();
        for(String component: components) {
            normalizedPath.append("/");
            normalizedPath.append(component);
        }
        if (isAbsolutePath) {
            return normalizedPath.toString();
        } else {
            return normalizedPath.toString().substring(1);
        }
    }

    /**
     * Gets the free space in bytes available on this filesystem.
     * Subclasses may override this method to return nonzero free space.
     */
    public long getFreeSpaceInBytes() {
        return 0;
    }

    public abstract Uri toNativeUri(LocalFilesystemURL inputURL);
    public abstract LocalFilesystemURL toLocalUri(Uri inputURL);

    public JSONObject getRootEntry() {
        if (rootEntry == null) {
            rootEntry = makeEntryForNativeUri(rootUri);
        }
        return rootEntry;
    }

	public JSONObject getParentForLocalURL(LocalFilesystemURL inputURL) throws IOException {
        Uri parentUri = inputURL.uri;
        String parentPath = new File(inputURL.uri.getPath()).getParent();
        if (!"/".equals(parentPath)) {
            parentUri = inputURL.uri.buildUpon().path(parentPath + '/').build();
		}
		return getEntryForLocalURL(LocalFilesystemURL.parse(parentUri));
	}

    protected LocalFilesystemURL makeDestinationURL(String newName, LocalFilesystemURL srcURL, LocalFilesystemURL destURL, boolean isDirectory) {
        // I know this looks weird but it is to work around a JSON bug.
        if ("null".equals(newName) || "".equals(newName)) {
            newName = srcURL.uri.getLastPathSegment();;
        }

        String newDest = destURL.uri.toString();
        if (newDest.endsWith("/")) {
            newDest = newDest + newName;
        } else {
            newDest = newDest + "/" + newName;
        }
        if (isDirectory) {
            newDest += '/';
        }
        return LocalFilesystemURL.parse(newDest);
    }

	/* Read a source URL (possibly from a different filesystem, srcFs,) and copy it to
	 * the destination URL on this filesystem, optionally with a new filename.
	 * If move is true, then this method should either perform an atomic move operation
	 * or remove the source file when finished.
	 */
    public JSONObject copyFileToURL(LocalFilesystemURL destURL, String newName,
            Filesystem srcFs, LocalFilesystemURL srcURL, boolean move) throws IOException, InvalidModificationException, JSONException, NoModificationAllowedException, FileExistsException {
        // First, check to see that we can do it
        if (move && !srcFs.canRemoveFileAtLocalURL(srcURL)) {
            throw new NoModificationAllowedException("Cannot move file at source URL");
        }
        final LocalFilesystemURL destination = makeDestinationURL(newName, srcURL, destURL, srcURL.isDirectory);

        Uri srcNativeUri = srcFs.toNativeUri(srcURL);

        CordovaResourceApi.OpenForReadResult ofrr = resourceApi.openForRead(srcNativeUri);
        OutputStream os = null;
        try {
            os = getOutputStreamForURL(destination);
        } catch (IOException e) {
            ofrr.inputStream.close();
            throw e;
        }
        // Closes streams.
        resourceApi.copyResource(ofrr, os);

        if (move) {
            srcFs.removeFileAtLocalURL(srcURL);
        }
        return getEntryForLocalURL(destination);
    }

    public OutputStream getOutputStreamForURL(LocalFilesystemURL inputURL) throws IOException {
        return resourceApi.openOutputStream(toNativeUri(inputURL));
    }

    public void readFileAtURL(LocalFilesystemURL inputURL, long start, long end,
                              ReadFileCallback readFileCallback) throws IOException {
        CordovaResourceApi.OpenForReadResult ofrr = resourceApi.openForRead(toNativeUri(inputURL));
        if (end < 0) {
            end = ofrr.length;
        }
        long numBytesToRead = end - start;
        try {
            if (start > 0) {
                ofrr.inputStream.skip(start);
            }
            InputStream inputStream = ofrr.inputStream;
            if (end < ofrr.length) {
                inputStream = new LimitedInputStream(inputStream, numBytesToRead);
            }
            readFileCallback.handleData(inputStream, ofrr.mimeType);
        } finally {
            ofrr.inputStream.close();
        }
    }

	abstract long writeToFileAtURL(LocalFilesystemURL inputURL, String data, int offset,
			boolean isBinary) throws NoModificationAllowedException, IOException;

	abstract long truncateFileAtURL(LocalFilesystemURL inputURL, long size)
			throws IOException, NoModificationAllowedException;

	// This method should return null if filesystem urls cannot be mapped to paths
	abstract String filesystemPathForURL(LocalFilesystemURL url);

	abstract LocalFilesystemURL URLforFilesystemPath(String path);

	abstract boolean canRemoveFileAtLocalURL(LocalFilesystemURL inputURL);

    protected class LimitedInputStream extends FilterInputStream {
        long numBytesToRead;
        public LimitedInputStream(InputStream in, long numBytesToRead) {
            super(in);
            this.numBytesToRead = numBytesToRead;
        }
        @Override
        public int read() throws IOException {
            if (numBytesToRead <= 0) {
                return -1;
            }
            numBytesToRead--;
            return in.read();
        }
        @Override
        public int read(byte[] buffer, int byteOffset, int byteCount) throws IOException {
            if (numBytesToRead <= 0) {
                return -1;
            }
            int bytesToRead = byteCount;
            if (byteCount > numBytesToRead) {
                bytesToRead = (int)numBytesToRead; // Cast okay; long is less than int here.
            }
            int numBytesRead = in.read(buffer, byteOffset, bytesToRead);
            numBytesToRead -= numBytesRead;
            return numBytesRead;
        }
    }
}
