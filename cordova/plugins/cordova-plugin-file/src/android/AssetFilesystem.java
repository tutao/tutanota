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

import android.content.res.AssetManager;
import android.net.Uri;
import android.util.Log;

import org.apache.cordova.CordovaResourceApi;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.util.HashMap;
import java.util.Map;

public class AssetFilesystem extends Filesystem {

    private final AssetManager assetManager;

    // A custom gradle hook creates the cdvasset.manifest file, which speeds up asset listing a tonne.
    // See: http://stackoverflow.com/questions/16911558/android-assetmanager-list-incredibly-slow
    private static Object listCacheLock = new Object();
    private static boolean listCacheFromFile;
    private static Map<String, String[]> listCache;
    private static Map<String, Long> lengthCache;

    private void lazyInitCaches() {
        synchronized (listCacheLock) {
            if (listCache == null) {
                ObjectInputStream ois = null;
                try {
                    ois = new ObjectInputStream(assetManager.open("cdvasset.manifest"));
                    listCache = (Map<String, String[]>) ois.readObject();
                    lengthCache = (Map<String, Long>) ois.readObject();
                    listCacheFromFile = true;
                } catch (ClassNotFoundException e) {
                    e.printStackTrace();
                } catch (IOException e) {
                    // Asset manifest won't exist if the gradle hook isn't set up correctly.
                } finally {
                    if (ois != null) {
                        try {
                            ois.close();
                        } catch (IOException e) {
                        }
                    }
                }
                if (listCache == null) {
                    Log.w("AssetFilesystem", "Asset manifest not found. Recursive copies and directory listing will be slow.");
                    listCache = new HashMap<String, String[]>();
                }
            }
        }
    }

    private String[] listAssets(String assetPath) throws IOException {
        if (assetPath.startsWith("/")) {
            assetPath = assetPath.substring(1);
        }
        if (assetPath.endsWith("/")) {
            assetPath = assetPath.substring(0, assetPath.length() - 1);
        }
        lazyInitCaches();
        String[] ret = listCache.get(assetPath);
        if (ret == null) {
            if (listCacheFromFile) {
                ret = new String[0];
            } else {
                ret = assetManager.list(assetPath);
                listCache.put(assetPath, ret);
            }
        }
        return ret;
    }

    private long getAssetSize(String assetPath) throws FileNotFoundException {
        if (assetPath.startsWith("/")) {
            assetPath = assetPath.substring(1);
        }
        lazyInitCaches();
        if (lengthCache != null) {
            Long ret = lengthCache.get(assetPath);
            if (ret == null) {
                throw new FileNotFoundException("Asset not found: " + assetPath);
            }
            return ret;
        }
        CordovaResourceApi.OpenForReadResult offr = null;
        try {
            offr = resourceApi.openForRead(nativeUriForFullPath(assetPath));
            long length = offr.length;
            if (length < 0) {
                // available() doesn't always yield the file size, but for assets it does.
                length = offr.inputStream.available();
            }
            return length;
        } catch (IOException e) {
            throw new FileNotFoundException("File not found: " + assetPath);
        } finally {
            if (offr != null) {
                try {
                    offr.inputStream.close();
                } catch (IOException e) {
                }
            }
        }
    }

    public AssetFilesystem(AssetManager assetManager, CordovaResourceApi resourceApi) {
        super(Uri.parse("file:///android_asset/"), "assets", resourceApi);
        this.assetManager = assetManager;
	}

    @Override
    public Uri toNativeUri(LocalFilesystemURL inputURL) {
        return nativeUriForFullPath(inputURL.path);
    }

    @Override
    public LocalFilesystemURL toLocalUri(Uri inputURL) {
        if (!"file".equals(inputURL.getScheme())) {
            return null;
        }
        File f = new File(inputURL.getPath());
        // Removes and duplicate /s (e.g. file:///a//b/c)
        Uri resolvedUri = Uri.fromFile(f);
        String rootUriNoTrailingSlash = rootUri.getEncodedPath();
        rootUriNoTrailingSlash = rootUriNoTrailingSlash.substring(0, rootUriNoTrailingSlash.length() - 1);
        if (!resolvedUri.getEncodedPath().startsWith(rootUriNoTrailingSlash)) {
            return null;
        }
        String subPath = resolvedUri.getEncodedPath().substring(rootUriNoTrailingSlash.length());
        // Strip leading slash
        if (!subPath.isEmpty()) {
            subPath = subPath.substring(1);
        }
        Uri.Builder b = new Uri.Builder()
            .scheme(LocalFilesystemURL.FILESYSTEM_PROTOCOL)
            .authority("localhost")
            .path(name);
        if (!subPath.isEmpty()) {
            b.appendEncodedPath(subPath);
        }
        if (isDirectory(subPath) || inputURL.getPath().endsWith("/")) {
            // Add trailing / for directories.
            b.appendEncodedPath("");
        }
        return LocalFilesystemURL.parse(b.build());
    }

    private boolean isDirectory(String assetPath) {
        try {
            return listAssets(assetPath).length != 0;
        } catch (IOException e) {
            return false;
        }
    }

    @Override
    public LocalFilesystemURL[] listChildren(LocalFilesystemURL inputURL) throws FileNotFoundException {
        String pathNoSlashes = inputURL.path.substring(1);
        if (pathNoSlashes.endsWith("/")) {
            pathNoSlashes = pathNoSlashes.substring(0, pathNoSlashes.length() - 1);
        }

        String[] files;
        try {
            files = listAssets(pathNoSlashes);
        } catch (IOException e) {
            throw new FileNotFoundException();
        }

        LocalFilesystemURL[] entries = new LocalFilesystemURL[files.length];
        for (int i = 0; i < files.length; ++i) {
            entries[i] = localUrlforFullPath(new File(inputURL.path, files[i]).getPath());
        }
        return entries;
	}

    @Override
    public JSONObject getFileForLocalURL(LocalFilesystemURL inputURL,
                                         String path, JSONObject options, boolean directory)
            throws FileExistsException, IOException, TypeMismatchException, EncodingException, JSONException {
        if (options != null && options.optBoolean("create")) {
            throw new UnsupportedOperationException("Assets are read-only");
        }

        // Check whether the supplied path is absolute or relative
        if (directory && !path.endsWith("/")) {
            path += "/";
        }

        LocalFilesystemURL requestedURL;
        if (path.startsWith("/")) {
            requestedURL = localUrlforFullPath(normalizePath(path));
        } else {
            requestedURL = localUrlforFullPath(normalizePath(inputURL.path + "/" + path));
        }

        // Throws a FileNotFoundException if it doesn't exist.
        getFileMetadataForLocalURL(requestedURL);

        boolean isDir = isDirectory(requestedURL.path);
        if (directory && !isDir) {
            throw new TypeMismatchException("path doesn't exist or is file");
        } else if (!directory && isDir) {
            throw new TypeMismatchException("path doesn't exist or is directory");
        }

        // Return the directory
        return makeEntryForURL(requestedURL);
    }

    @Override
	public JSONObject getFileMetadataForLocalURL(LocalFilesystemURL inputURL) throws FileNotFoundException {
        JSONObject metadata = new JSONObject();
        long size = inputURL.isDirectory ? 0 : getAssetSize(inputURL.path);
        try {
        	metadata.put("size", size);
        	metadata.put("type", inputURL.isDirectory ? "text/directory" : resourceApi.getMimeType(toNativeUri(inputURL)));
        	metadata.put("name", new File(inputURL.path).getName());
        	metadata.put("fullPath", inputURL.path);
        	metadata.put("lastModifiedDate", 0);
        } catch (JSONException e) {
            return null;
        }
        return metadata;
	}

	@Override
	public boolean canRemoveFileAtLocalURL(LocalFilesystemURL inputURL) {
		return false;
	}

    @Override
    long writeToFileAtURL(LocalFilesystemURL inputURL, String data, int offset, boolean isBinary) throws NoModificationAllowedException, IOException {
        throw new NoModificationAllowedException("Assets are read-only");
    }

    @Override
    long truncateFileAtURL(LocalFilesystemURL inputURL, long size) throws IOException, NoModificationAllowedException {
        throw new NoModificationAllowedException("Assets are read-only");
    }

    @Override
    String filesystemPathForURL(LocalFilesystemURL url) {
        return null;
    }

    @Override
    LocalFilesystemURL URLforFilesystemPath(String path) {
        return null;
    }

    @Override
    boolean removeFileAtLocalURL(LocalFilesystemURL inputURL) throws InvalidModificationException, NoModificationAllowedException {
        throw new NoModificationAllowedException("Assets are read-only");
    }

    @Override
    boolean recursiveRemoveFileAtLocalURL(LocalFilesystemURL inputURL) throws NoModificationAllowedException {
        throw new NoModificationAllowedException("Assets are read-only");
    }

}
