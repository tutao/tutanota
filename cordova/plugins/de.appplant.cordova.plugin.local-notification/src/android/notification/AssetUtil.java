/*
 * Copyright (c) 2013-2015 by appPlant UG. All rights reserved.
 *
 * @APPPLANT_LICENSE_HEADER_START@
 *
 * This file contains Original Code and/or Modifications of Original Code
 * as defined in and that are subject to the Apache License
 * Version 2.0 (the 'License'). You may not use this file except in
 * compliance with the License. Please obtain a copy of the License at
 * http://opensource.org/licenses/Apache-2.0/ and read it before using this
 * file.
 *
 * The Original Code and all software distributed under the License are
 * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
 * Please see the License for the specific language governing rights and
 * limitations under the License.
 *
 * @APPPLANT_LICENSE_HEADER_END@
 */

package de.appplant.cordova.plugin.notification;

import android.content.Context;
import android.content.res.AssetManager;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.StrictMode;
import android.util.Log;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.UUID;

/**
 * Util class to map unified asset URIs to native URIs. URIs like file:///
 * map to absolute paths while file:// point relatively to the www folder
 * within the asset resources. And res:// means a resource from the native
 * res folder. Remote assets are accessible via http:// for example.
 */
class AssetUtil {

    // Name of the storage folder
    private static final String STORAGE_FOLDER = "/localnotification";

    // Placeholder URI for default sound
    private static final String DEFAULT_SOUND = "res://platform_default";

    // Ref to the context passed through the constructor to access the
    // resources and app directory.
    private final Context context;

    /**
     * Constructor
     *
     * @param context
     *      Application context
     */
    private AssetUtil(Context context) {
        this.context = context;
    }

    /**
     * Static method to retrieve class instance.
     *
     * @param context
     *      Application context
     */
    static AssetUtil getInstance(Context context) {
        return new AssetUtil(context);
    }

    /**
     * Parse path path to native URI.
     *
     * @param path
     *      Path to path file
     */
    Uri parseSound (String path) {

        if (path == null || path.isEmpty())
            return Uri.EMPTY;

        if (path.equalsIgnoreCase(DEFAULT_SOUND)) {
            return RingtoneManager.getDefaultUri(RingtoneManager
                    .TYPE_NOTIFICATION);
        }

        return parse(path);
    }

    /**
     * The URI for a path.
     *
     * @param path
     *      The given path
     */
    Uri parse (String path) {

        if (path.startsWith("res:")) {
            return getUriForResourcePath(path);
        } else if (path.startsWith("file:///")) {
            return getUriFromPath(path);
        } else if (path.startsWith("file://")) {
            return getUriFromAsset(path);
        } else if (path.startsWith("http")){
            return getUriFromRemote(path);
        }

        return Uri.EMPTY;
    }

    /**
     * URI for a file.
     *
     * @param path
     *      Absolute path like file:///...
     *
     * @return
     *      URI pointing to the given path
     */
    private Uri getUriFromPath(String path) {
        String absPath = path.replaceFirst("file://", "");
        File file = new File(absPath);

        if (!file.exists()) {
            Log.e("Asset", "File not found: " + file.getAbsolutePath());
            return Uri.EMPTY;
        }

        return Uri.fromFile(file);
    }

    /**
     * URI for an asset.
     *
     * @param path
     *      Asset path like file://...
     *
     * @return
     *      URI pointing to the given path
     */
    private Uri getUriFromAsset(String path) {
        String resPath  = path.replaceFirst("file:/", "www");
        String fileName = resPath.substring(resPath.lastIndexOf('/') + 1);
        File file       = getTmpFile(fileName);

        if (file == null) {
            Log.e("Asset", "Missing external cache dir");
            return Uri.EMPTY;
        }

        try {
            AssetManager assets = context.getAssets();
            FileOutputStream outStream = new FileOutputStream(file);
            InputStream inputStream = assets.open(resPath);

            copyFile(inputStream, outStream);

            outStream.flush();
            outStream.close();

            return Uri.fromFile(file);

        } catch (Exception e) {
            Log.e("Asset", "File not found: assets/" + resPath);
            e.printStackTrace();
        }

        return Uri.EMPTY;
    }

    /**
     * The URI for a resource.
     *
     * @param path
     *            The given relative path
     *
     * @return
     *      URI pointing to the given path
     */
    private Uri getUriForResourcePath(String path) {
        String resPath = path.replaceFirst("res://", "");
        int resId      = getResIdForDrawable(resPath);
        File file      = getTmpFile();

        if (resId == 0) {
            Log.e("Asset", "File not found: " + resPath);
            return Uri.EMPTY;
        }

        if (file == null) {
            Log.e("Asset", "Missing external cache dir");
            return Uri.EMPTY;
        }

        try {
            Resources res = context.getResources();
            FileOutputStream outStream = new FileOutputStream(file);
            InputStream inputStream = res.openRawResource(resId);
            copyFile(inputStream, outStream);

            outStream.flush();
            outStream.close();

            return Uri.fromFile(file);

        } catch (Exception e) {
            e.printStackTrace();
        }

        return Uri.EMPTY;
    }

    /**
     * Uri from remote located content.
     *
     * @param path
     *      Remote address
     *
     * @return
     *      Uri of the downloaded file
     */
    private Uri getUriFromRemote(String path) {
        File file = getTmpFile();

        if (file == null) {
            Log.e("Asset", "Missing external cache dir");
            return Uri.EMPTY;
        }

        try {
            URL url = new URL(path);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();

            StrictMode.ThreadPolicy policy =
                    new StrictMode.ThreadPolicy.Builder().permitAll().build();

            StrictMode.setThreadPolicy(policy);

            connection.setRequestProperty("Connection", "close");
            connection.setConnectTimeout(5000);
            connection.connect();

            InputStream input = connection.getInputStream();
            FileOutputStream outStream = new FileOutputStream(file);

            copyFile(input, outStream);

            outStream.flush();
            outStream.close();

            return Uri.fromFile(file);

        } catch (MalformedURLException e) {
            Log.e("Asset", "Incorrect URL");
            e.printStackTrace();
        } catch (FileNotFoundException e) {
            Log.e("Asset", "Failed to create new File from HTTP Content");
            e.printStackTrace();
        } catch (IOException e) {
            Log.e("Asset", "No Input can be created from http Stream");
            e.printStackTrace();
        }

        return Uri.EMPTY;
    }

    /**
     * Copy content from input stream into output stream.
     *
     * @param in
     *      The input stream
     * @param out
     *      The output stream
     */
    private void copyFile(InputStream in, OutputStream out) throws IOException {
        byte[] buffer = new byte[1024];
        int read;

        while ((read = in.read(buffer)) != -1) {
            out.write(buffer, 0, read);
        }
    }

    /**
     * Resource ID for drawable.
     *
     * @param resPath
     *      Resource path as string
     */
    int getResIdForDrawable(String resPath) {
        int resId = getResIdForDrawable(getPkgName(), resPath);

        if (resId == 0) {
            resId = getResIdForDrawable("android", resPath);
        }

        return resId;
    }

    /**
     * Resource ID for drawable.
     *
     * @param clsName
     *      Relative package or global android name space
     * @param resPath
     *      Resource path as string
     */
    int getResIdForDrawable(String clsName, String resPath) {
        String drawable = getBaseName(resPath);
        int resId = 0;

        try {
            Class<?> cls  = Class.forName(clsName + ".R$drawable");

            resId = (Integer) cls.getDeclaredField(drawable).get(Integer.class);
        } catch (Exception ignore) {}

        return resId;
    }

    /**
     * Convert drawable resource to bitmap.
     *
     * @param drawable
     *      Drawable resource name
     */
    Bitmap getIconFromDrawable (String drawable) {
        Resources res = context.getResources();
        int iconId;

        iconId = getResIdForDrawable(getPkgName(), drawable);

        if (iconId == 0) {
            iconId = getResIdForDrawable("android", drawable);
        }

        if (iconId == 0) {
            iconId = android.R.drawable.screen_background_dark_transparent;
        }

        return BitmapFactory.decodeResource(res, iconId);
    }

    /**
     * Convert URI to Bitmap.
     *
     * @param uri
     *      Internal image URI
     */
    Bitmap getIconFromUri (Uri uri) throws IOException {
        InputStream input = context.getContentResolver().openInputStream(uri);

        return BitmapFactory.decodeStream(input);
    }

    /**
     * Extract name of drawable resource from path.
     *
     * @param resPath
     *      Resource path as string
     */
    private String getBaseName (String resPath) {
        String drawable = resPath;

        if (drawable.contains("/")) {
            drawable = drawable.substring(drawable.lastIndexOf('/') + 1);
        }

        if (resPath.contains(".")) {
            drawable = drawable.substring(0, drawable.lastIndexOf('.'));
        }

        return drawable;
    }

    /**
     * Returns a file located under the external cache dir of that app.
     *
     * @return
     *      File with a random UUID name
     */
    private File getTmpFile () {
        // If random UUID is not be enough see
        // https://github.com/LukePulverenti/cordova-plugin-local-notifications/blob/267170db14044cbeff6f4c3c62d9b766b7a1dd62/src/android/notification/AssetUtil.java#L255
        return getTmpFile(UUID.randomUUID().toString());
    }

    /**
     * Returns a file located under the external cache dir of that app.
     *
     * @param name
     *      The name of the file
     * @return
     *      File with the provided name
     */
    private File getTmpFile (String name) {
        File dir = context.getExternalCacheDir();

        if (dir == null) {
            Log.e("Asset", "Missing external cache dir");
            return null;
        }

        String storage  = dir.toString() + STORAGE_FOLDER;

        //noinspection ResultOfMethodCallIgnored
        new File(storage).mkdir();

        return new File(storage, name);
    }

    /**
     * Package name specified by context.
     */
    private String getPkgName () {
        return context.getPackageName();
    }

}
