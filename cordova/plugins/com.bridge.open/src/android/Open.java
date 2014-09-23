/**
 * Open.java
 *
 * Copyright (C) 2014 Carlos Antonio
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 */

package com.bridge;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;

import android.net.Uri;
import android.webkit.MimeTypeMap;
import android.webkit.CookieManager;
import android.content.Context;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.os.AsyncTask;

/**
 * This class starts an activity for an intent to view files
 */
public class Open extends CordovaPlugin {

  public static final String OPEN_ACTION = "open";

  @Override
  public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
    if (action.equals(OPEN_ACTION)) {
      String path = args.getString(0);
      if (path != null && path.length() > 0) {
        new FileDownloadAsyncTask(path, callbackContext).execute();
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Returns the MIME type of the file.
   *
   * @param path
   * @return
   */
  private static String getMimeType(String path) {

    // infer mime type from uri
    String mimeType = HttpURLConnection.guessContentTypeFromName(path);

    // if mime guess fails, do legwork
    if (mimeType == null) {
      String extension = MimeTypeMap.getFileExtensionFromUrl(path);
      if (extension != null) {
        MimeTypeMap mime = MimeTypeMap.getSingleton();
        mimeType = mime.getMimeTypeFromExtension(extension);
      }
    }

    return mimeType;
  }

  /**
   * Creates an intent for the data of mime type
   *
   * @param path
   * @param callbackContext
   */
  private void previewFile(String path, CallbackContext callbackContext) {
    try {
      File file = new File(path);
      Uri uri = Uri.fromFile(file);
      String mime = getMimeType(path);
      Intent intent = new Intent(Intent.ACTION_VIEW);
      Context activity = cordova.getActivity();

      intent.setDataAndTypeAndNormalize(uri, mime);
      activity.startActivity(intent);

      callbackContext.success();
    } catch (ActivityNotFoundException e) {
      e.printStackTrace();
      callbackContext.error(e.getMessage());
    }
  }

  private File downloadFile(String url, CallbackContext callbackContext) {
    try {
      Uri uri  = Uri.parse(url);
      uri = uri.normalizeScheme();
      String Filename = uri.getLastPathSegment();

      CookieManager cookieManager = CookieManager.getInstance();
      String cookie = null;
      if (cookieManager.getCookie(url) != null) {
        cookie = cookieManager.getCookie(url).toString();
      }

      URL tempUrl = new URL(url);
      HttpURLConnection connection = (HttpURLConnection) tempUrl.openConnection();
      if (cookie != null) {
        connection.setRequestProperty("Cookie", cookie);
      }

      Context context = cordova.getActivity().getApplicationContext();
      InputStream inputStream = connection.getInputStream();
      String ext = MimeTypeMap.getFileExtensionFromUrl(url);
      File file = File.createTempFile(Filename, "." + ext, context.getExternalCacheDir());

      file.setReadable(true, false);
      OutputStream outputStream = new FileOutputStream(file);

      byte[] data = new byte[1024];
      int buffer = 0;

      while ((buffer = inputStream.read(data)) > 0) {
        outputStream.write(data, 0, buffer);
        outputStream.flush();
      }

      outputStream.close();
      inputStream.close();

      return file;
    } catch(IOException e) {
      e.printStackTrace();
      callbackContext.error(e.getMessage());
    }
    return null;
  }

  private class FileDownloadAsyncTask extends AsyncTask<Void, Void, File> {
    private final CallbackContext callbackContext;
    private final String url;

    public FileDownloadAsyncTask(String url, CallbackContext callbackContext) {
      super();
      this.callbackContext = callbackContext;
      this.url = url;
    }

    @Override
    protected File doInBackground(Void... arg0) {
      File file = downloadFile(url, callbackContext);
      return file;
    }

    @Override
    protected void onPostExecute(File result) {
      String path = result.toString();
      previewFile(path, callbackContext);
    }
  }
}
