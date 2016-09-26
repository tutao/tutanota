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
package org.apache.cordova;

import android.content.ContentResolver;
import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Looper;
import android.util.Base64;
import android.webkit.MimeTypeMap;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.channels.FileChannel;
import java.util.Locale;

/**
 * What this class provides:
 * 1. Helpers for reading & writing to URLs.
 *   - E.g. handles assets, resources, content providers, files, data URIs, http[s]
 *   - E.g. Can be used to query for mime-type & content length.
 *
 * 2. To allow plugins to redirect URLs (via remapUrl).
 *   - All plugins should call remapUrl() on URLs they receive from JS *before*
 *     passing the URL onto other utility functions in this class.
 *   - For an example usage of this, refer to the org.apache.cordova.file plugin.
 *
 * Future Work:
 *   - Consider using a Cursor to query content URLs for their size (like the file plugin does).
 *   - Allow plugins to remapUri to "cdv-plugin://plugin-name/foo", which CordovaResourceApi
 *     would then delegate to pluginManager.getPlugin(plugin-name).openForRead(url)
 *     - Currently, plugins *can* do this by remapping to a data: URL, but it's inefficient
 *       for large payloads.
 */
public class CordovaResourceApi {
    @SuppressWarnings("unused")
    private static final String LOG_TAG = "CordovaResourceApi";

    public static final int URI_TYPE_FILE = 0;
    public static final int URI_TYPE_ASSET = 1;
    public static final int URI_TYPE_CONTENT = 2;
    public static final int URI_TYPE_RESOURCE = 3;
    public static final int URI_TYPE_DATA = 4;
    public static final int URI_TYPE_HTTP = 5;
    public static final int URI_TYPE_HTTPS = 6;
    public static final int URI_TYPE_PLUGIN = 7;
    public static final int URI_TYPE_UNKNOWN = -1;

    public static final String PLUGIN_URI_SCHEME = "cdvplugin";

    private static final String[] LOCAL_FILE_PROJECTION = { "_data" };
    
    public static Thread jsThread;

    private final AssetManager assetManager;
    private final ContentResolver contentResolver;
    private final PluginManager pluginManager;
    private boolean threadCheckingEnabled = true;


    public CordovaResourceApi(Context context, PluginManager pluginManager) {
        this.contentResolver = context.getContentResolver();
        this.assetManager = context.getAssets();
        this.pluginManager = pluginManager;
    }
    
    public void setThreadCheckingEnabled(boolean value) {
        threadCheckingEnabled = value;
    }

    public boolean isThreadCheckingEnabled() {
        return threadCheckingEnabled;
    }
    
    
    public static int getUriType(Uri uri) {
        assertNonRelative(uri);
        String scheme = uri.getScheme();
        if (ContentResolver.SCHEME_CONTENT.equalsIgnoreCase(scheme)) {
            return URI_TYPE_CONTENT;
        }
        if (ContentResolver.SCHEME_ANDROID_RESOURCE.equalsIgnoreCase(scheme)) {
            return URI_TYPE_RESOURCE;
        }
        if (ContentResolver.SCHEME_FILE.equalsIgnoreCase(scheme)) {
            if (uri.getPath().startsWith("/android_asset/")) {
                return URI_TYPE_ASSET;
            }
            return URI_TYPE_FILE;
        }
        if ("data".equalsIgnoreCase(scheme)) {
            return URI_TYPE_DATA;
        }
        if ("http".equalsIgnoreCase(scheme)) {
            return URI_TYPE_HTTP;
        }
        if ("https".equalsIgnoreCase(scheme)) {
            return URI_TYPE_HTTPS;
        }
        if (PLUGIN_URI_SCHEME.equalsIgnoreCase(scheme)) {
            return URI_TYPE_PLUGIN;
        }
        return URI_TYPE_UNKNOWN;
    }
    
    public Uri remapUri(Uri uri) {
        assertNonRelative(uri);
        Uri pluginUri = pluginManager.remapUri(uri);
        return pluginUri != null ? pluginUri : uri;
    }

    public String remapPath(String path) {
        return remapUri(Uri.fromFile(new File(path))).getPath();
    }
    
    /**
     * Returns a File that points to the resource, or null if the resource
     * is not on the local filesystem.
     */
    public File mapUriToFile(Uri uri) {
        assertBackgroundThread();
        switch (getUriType(uri)) {
            case URI_TYPE_FILE:
                return new File(uri.getPath());
            case URI_TYPE_CONTENT: {
                Cursor cursor = contentResolver.query(uri, LOCAL_FILE_PROJECTION, null, null, null);
                if (cursor != null) {
                    try {
                        int columnIndex = cursor.getColumnIndex(LOCAL_FILE_PROJECTION[0]);
                        if (columnIndex != -1 && cursor.getCount() > 0) {
                            cursor.moveToFirst();
                            String realPath = cursor.getString(columnIndex);
                            if (realPath != null) {
                                return new File(realPath);
                            }
                        }
                    } finally {
                        cursor.close();
                    }
                }
            }
        }
        return null;
    }
    
    public String getMimeType(Uri uri) {
        switch (getUriType(uri)) {
            case URI_TYPE_FILE:
            case URI_TYPE_ASSET:
                return getMimeTypeFromPath(uri.getPath());
            case URI_TYPE_CONTENT:
            case URI_TYPE_RESOURCE:
                return contentResolver.getType(uri);
            case URI_TYPE_DATA: {
                return getDataUriMimeType(uri);
            }
            case URI_TYPE_HTTP:
            case URI_TYPE_HTTPS: {
                try {
                    HttpURLConnection conn = (HttpURLConnection)new URL(uri.toString()).openConnection();
                    conn.setDoInput(false);
                    conn.setRequestMethod("HEAD");
                    String mimeType = conn.getHeaderField("Content-Type");
                    if (mimeType != null) {
                        mimeType = mimeType.split(";")[0];
                    }
                    return mimeType;
                } catch (IOException e) {
                }
            }
        }
        
        return null;
    }
    
    
    //This already exists
    private String getMimeTypeFromPath(String path) {
        String extension = path;
        int lastDot = extension.lastIndexOf('.');
        if (lastDot != -1) {
            extension = extension.substring(lastDot + 1);
        }
        // Convert the URI string to lower case to ensure compatibility with MimeTypeMap (see CB-2185).
        extension = extension.toLowerCase(Locale.getDefault());
        if (extension.equals("3ga")) {
            return "audio/3gpp";
        } else if (extension.equals("js")) {
            // Missing from the map :(.
            return "text/javascript";
        }
        return MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
    }
    
    /**
     * Opens a stream to the given URI, also providing the MIME type & length.
     * @return Never returns null.
     * @throws Throws an InvalidArgumentException for relative URIs. Relative URIs should be
     *     resolved before being passed into this function.
     * @throws Throws an IOException if the URI cannot be opened.
     * @throws Throws an IllegalStateException if called on a foreground thread.
     */
    public OpenForReadResult openForRead(Uri uri) throws IOException {
        return openForRead(uri, false);
    }

    /**
     * Opens a stream to the given URI, also providing the MIME type & length.
     * @return Never returns null.
     * @throws Throws an InvalidArgumentException for relative URIs. Relative URIs should be
     *     resolved before being passed into this function.
     * @throws Throws an IOException if the URI cannot be opened.
     * @throws Throws an IllegalStateException if called on a foreground thread and skipThreadCheck is false.
     */
    public OpenForReadResult openForRead(Uri uri, boolean skipThreadCheck) throws IOException {
        if (!skipThreadCheck) {
            assertBackgroundThread();
        }
        switch (getUriType(uri)) {
            case URI_TYPE_FILE: {
                FileInputStream inputStream = new FileInputStream(uri.getPath());
                String mimeType = getMimeTypeFromPath(uri.getPath());
                long length = inputStream.getChannel().size();
                return new OpenForReadResult(uri, inputStream, mimeType, length, null);
            }
            case URI_TYPE_ASSET: {
                String assetPath = uri.getPath().substring(15);
                AssetFileDescriptor assetFd = null;
                InputStream inputStream;
                long length = -1;
                try {
                    assetFd = assetManager.openFd(assetPath);
                    inputStream = assetFd.createInputStream();
                    length = assetFd.getLength();
                } catch (FileNotFoundException e) {
                    // Will occur if the file is compressed.
                    inputStream = assetManager.open(assetPath);
                }
                String mimeType = getMimeTypeFromPath(assetPath);
                return new OpenForReadResult(uri, inputStream, mimeType, length, assetFd);
            }
            case URI_TYPE_CONTENT:
            case URI_TYPE_RESOURCE: {
                String mimeType = contentResolver.getType(uri);
                AssetFileDescriptor assetFd = contentResolver.openAssetFileDescriptor(uri, "r");
                InputStream inputStream = assetFd.createInputStream();
                long length = assetFd.getLength();
                return new OpenForReadResult(uri, inputStream, mimeType, length, assetFd);
            }
            case URI_TYPE_DATA: {
                OpenForReadResult ret = readDataUri(uri);
                if (ret == null) {
                    break;
                }
                return ret;
            }
            case URI_TYPE_HTTP:
            case URI_TYPE_HTTPS: {
                HttpURLConnection conn = (HttpURLConnection)new URL(uri.toString()).openConnection();
                conn.setDoInput(true);
                String mimeType = conn.getHeaderField("Content-Type");
                if (mimeType != null) {
                    mimeType = mimeType.split(";")[0];
                }
                int length = conn.getContentLength();
                InputStream inputStream = conn.getInputStream();
                return new OpenForReadResult(uri, inputStream, mimeType, length, null);
            }
            case URI_TYPE_PLUGIN: {
                String pluginId = uri.getHost();
                CordovaPlugin plugin = pluginManager.getPlugin(pluginId);
                if (plugin == null) {
                    throw new FileNotFoundException("Invalid plugin ID in URI: " + uri);
                }
                return plugin.handleOpenForRead(uri);
            }
        }
        throw new FileNotFoundException("URI not supported by CordovaResourceApi: " + uri);
    }

    public OutputStream openOutputStream(Uri uri) throws IOException {
        return openOutputStream(uri, false);
    }

    /**
     * Opens a stream to the given URI.
     * @return Never returns null.
     * @throws Throws an InvalidArgumentException for relative URIs. Relative URIs should be
     *     resolved before being passed into this function.
     * @throws Throws an IOException if the URI cannot be opened.
     */
    public OutputStream openOutputStream(Uri uri, boolean append) throws IOException {
        assertBackgroundThread();
        switch (getUriType(uri)) {
            case URI_TYPE_FILE: {
                File localFile = new File(uri.getPath());
                File parent = localFile.getParentFile();
                if (parent != null) {
                    parent.mkdirs();
                }
                return new FileOutputStream(localFile, append);
            }
            case URI_TYPE_CONTENT:
            case URI_TYPE_RESOURCE: {
                AssetFileDescriptor assetFd = contentResolver.openAssetFileDescriptor(uri, append ? "wa" : "w");
                return assetFd.createOutputStream();
            }
        }
        throw new FileNotFoundException("URI not supported by CordovaResourceApi: " + uri);
    }

    public HttpURLConnection createHttpConnection(Uri uri) throws IOException {
        assertBackgroundThread();
        return (HttpURLConnection)new URL(uri.toString()).openConnection();
    }
    
    // Copies the input to the output in the most efficient manner possible.
    // Closes both streams.
    public void copyResource(OpenForReadResult input, OutputStream outputStream) throws IOException {
        assertBackgroundThread();
        try {
            InputStream inputStream = input.inputStream;
            if (inputStream instanceof FileInputStream && outputStream instanceof FileOutputStream) {
                FileChannel inChannel = ((FileInputStream)input.inputStream).getChannel();
                FileChannel outChannel = ((FileOutputStream)outputStream).getChannel();
                long offset = 0;
                long length = input.length;
                if (input.assetFd != null) {
                    offset = input.assetFd.getStartOffset();
                }
                // transferFrom()'s 2nd arg is a relative position. Need to set the absolute
                // position first.
                inChannel.position(offset);
                outChannel.transferFrom(inChannel, 0, length);
            } else {
                final int BUFFER_SIZE = 8192;
                byte[] buffer = new byte[BUFFER_SIZE];
                
                for (;;) {
                    int bytesRead = inputStream.read(buffer, 0, BUFFER_SIZE);
                    
                    if (bytesRead <= 0) {
                        break;
                    }
                    outputStream.write(buffer, 0, bytesRead);
                }
            }            
        } finally {
            input.inputStream.close();
            if (outputStream != null) {
                outputStream.close();
            }
        }
    }

    public void copyResource(Uri sourceUri, OutputStream outputStream) throws IOException {
        copyResource(openForRead(sourceUri), outputStream);
    }

    // Added in 3.5.0.
    public void copyResource(Uri sourceUri, Uri dstUri) throws IOException {
        copyResource(openForRead(sourceUri), openOutputStream(dstUri));
    }
    
    private void assertBackgroundThread() {
        if (threadCheckingEnabled) {
            Thread curThread = Thread.currentThread();
            if (curThread == Looper.getMainLooper().getThread()) {
                throw new IllegalStateException("Do not perform IO operations on the UI thread. Use CordovaInterface.getThreadPool() instead.");
            }
            if (curThread == jsThread) {
                throw new IllegalStateException("Tried to perform an IO operation on the WebCore thread. Use CordovaInterface.getThreadPool() instead.");
            }
        }
    }
    
    private String getDataUriMimeType(Uri uri) {
        String uriAsString = uri.getSchemeSpecificPart();
        int commaPos = uriAsString.indexOf(',');
        if (commaPos == -1) {
            return null;
        }
        String[] mimeParts = uriAsString.substring(0, commaPos).split(";");
        if (mimeParts.length > 0) {
            return mimeParts[0];
        }
        return null;
    }

    private OpenForReadResult readDataUri(Uri uri) {
        String uriAsString = uri.getSchemeSpecificPart();
        int commaPos = uriAsString.indexOf(',');
        if (commaPos == -1) {
            return null;
        }
        String[] mimeParts = uriAsString.substring(0, commaPos).split(";");
        String contentType = null;
        boolean base64 = false;
        if (mimeParts.length > 0) {
            contentType = mimeParts[0];
        }
        for (int i = 1; i < mimeParts.length; ++i) {
            if ("base64".equalsIgnoreCase(mimeParts[i])) {
                base64 = true;
            }
        }
        String dataPartAsString = uriAsString.substring(commaPos + 1);
        byte[] data;
        if (base64) {
            data = Base64.decode(dataPartAsString, Base64.DEFAULT);
        } else {
            try {
                data = dataPartAsString.getBytes("UTF-8");
            } catch (UnsupportedEncodingException e) {
                data = dataPartAsString.getBytes();
            }
        }
        InputStream inputStream = new ByteArrayInputStream(data);
        return new OpenForReadResult(uri, inputStream, contentType, data.length, null);
    }
    
    private static void assertNonRelative(Uri uri) {
        if (!uri.isAbsolute()) {
            throw new IllegalArgumentException("Relative URIs are not supported.");
        }
    }
    
    public static final class OpenForReadResult {
        public final Uri uri;
        public final InputStream inputStream;
        public final String mimeType;
        public final long length;
        public final AssetFileDescriptor assetFd;
        
        public OpenForReadResult(Uri uri, InputStream inputStream, String mimeType, long length, AssetFileDescriptor assetFd) {
            this.uri = uri;
            this.inputStream = inputStream;
            this.mimeType = mimeType;
            this.length = length;
            this.assetFd = assetFd;
        }
    }
}
