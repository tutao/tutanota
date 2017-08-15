package de.tutao.tutanota;

import android.Manifest;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.support.annotation.Nullable;
import android.support.v4.content.FileProvider;
import android.util.Log;
import android.webkit.MimeTypeMap;

import com.ipaulpro.afilechooser.utils.FileUtils;

import org.apache.commons.io.IOUtils;
import org.jdeferred.DoneFilter;
import org.jdeferred.DonePipe;
import org.jdeferred.Promise;
import org.jdeferred.impl.DeferredObject;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.Iterator;

import static android.app.Activity.RESULT_OK;
import static de.tutao.tutanota.MainActivity.activity;


public class FileUtil {
    private final static String TAG = "FileUtil";
    private static final int HTTP_TIMEOUT = 15 * 1000;


    private Promise<Void, Exception, Void> requestStoragePermission() {
        // Requesting android runtime permissions. (Android 5+)
        // We only need to request the read permission even if we want to get write access. There is only one permission of a permission group necessary to get
        // access to all permission of that permission group. We still have to declare write access in the manifest.
        // https://developer.android.com/guide/topics/security/permissions.html#perm-groups
        return activity.getPermission(Manifest.permission.READ_EXTERNAL_STORAGE);
    }

    private Promise<Void, Exception, Void> requestStoragePermission(String requestedFileName) {
        String appDir = "file://" + Utils.getDir(activity.getWebView().getContext()).getAbsolutePath();
        if (requestedFileName.startsWith(appDir)) {
            return new DeferredObject().resolve(null).promise();
        } else {
            return activity.getPermission(Manifest.permission.READ_EXTERNAL_STORAGE);
        }
    }

    void delete(final String absolutePath) throws Exception {
        Context context = activity.getWebView().getContext();
        File file = Utils.uriToFile(context, absolutePath);
        if (absolutePath.startsWith(Uri.fromFile(Utils.getDir(context)).toString())) {
            // we do not delete files that are not stored in our cache dir
            if (!file.delete()) {
                throw new Exception("could not delete file " + absolutePath);
            }
        }
    }

    Promise<JSONArray, Exception, Void> openFileChooser() {
        final Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("*/*");
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        intent.putExtra(Intent.EXTRA_LOCAL_ONLY, true);

        final Intent chooser = Intent.createChooser(intent, "Select File");
        return this.requestStoragePermission().then(new DonePipe<Void, JSONArray, Exception, Void>() {
            @Override
            public Promise<JSONArray, Exception, Void> pipeDone(Void result) {
                return activity.startActivityForResult(chooser).then(new DonePipe<ActivityResult, JSONArray, Exception, Void>() {
                    @Override
                    public Promise<JSONArray, Exception, Void> pipeDone(ActivityResult result) {
                        JSONArray selectedFiles = new JSONArray();
                        if (result.resultCode == RESULT_OK) {
                            ClipData clipData = result.data.getClipData();
                            try {
                                if (clipData != null) {
                                    for (int i = 0; i < clipData.getItemCount(); i++) {
                                        ClipData.Item item = clipData.getItemAt(i);
                                        selectedFiles.put(uriToFile(item.getUri()));
                                    }
                                } else {
                                    Uri uri = result.data.getData();
                                    selectedFiles.put(uriToFile(uri));
                                }
                            } catch (Exception e) {
                                return new DeferredObject<JSONArray, Exception, Void>().reject(e);
                            }
                        }
                        return new DeferredObject<JSONArray, Exception, Void>().resolve(selectedFiles);
                    }
                });
            }
        });
    }

    /**
     *
     * @param uri that starts with content:/ and is not directly accessible as a file
     * @return a resolved file path
     * @throws Exception if the file does not exist
     */
    private String uriToFile(Uri uri) throws Exception {
        Log.v(TAG, "uri of selected file: " + uri.toString());
        File file = Utils.uriToFile(activity.getWebView().getContext(), uri.toString());
        if (!file.exists()) {
            throw new FileNotFoundException("Selected file does not exist: " + file.getAbsolutePath());
        } else {
            String fileUri = file.toURI().toString();
            Log.i(TAG, "selected file: " + fileUri);
            return fileUri;
        }
    }

    // @see: https://developer.android.com/reference/android/support/v4/content/FileProvider.html
    Promise<Boolean, Exception, Void> openFile(String fileName, String mimeType) {
        File file = Utils.uriToFile(activity.getWebView().getContext(), fileName);

        if (file.exists()) {
            Uri path = Uri.parse(fileName);
            if (path.getAuthority().equals("")) {
                path = FileProvider.getUriForFile(activity.getWebView().getContext(), "de.tutao.fileprovider", file);
            }
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(path, getCorrectedMimeType(fileName, mimeType));
            intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            return activity.startActivityForResult(intent).then(new DoneFilter<ActivityResult, Boolean>() {
                @Override
                public Boolean filterDone(ActivityResult result) {
                    return result.resultCode == RESULT_OK;
                }
            });
        } else {
            throw new Error("file does not exist");
        }
    }

    private String getCorrectedMimeType(String fileName, String storedMimeType) {
        if (storedMimeType == null || storedMimeType.isEmpty() || storedMimeType.equals("application/octet-stream")) {
            String extension = FileUtils.getExtension(fileName);
            if (extension.length() > 0) {
                String newMimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension.substring(1));
                if (newMimeType != null && !newMimeType.isEmpty()) {
                    return newMimeType;
                } else {
                    return "application/octet-stream";
                }
            } else {
                return "application/octet-stream";
            }
        } else {
            return storedMimeType;
        }
    }


    String getSize(String absolutePath) {
        return Utils.uriToFile(activity.getWebView().getContext(), absolutePath).length() + "";
    }

    String getMimeType(String absolutePath) {
        String mimeType = FileUtils.getMimeType(Utils.uriToFile(activity.getWebView().getContext(), absolutePath));
        if (mimeType == null) {
            mimeType = "application/octet-stream";
        }
        return mimeType;
    }

    String getName(String absolutePath) {
        return Utils.uriToFile(activity.getWebView().getContext(), absolutePath).getName();
    }

    String upload(final String absolutePath, final String targetUrl, final JSONObject headers) throws IOException, JSONException {
        File file = Utils.uriToFile(activity.getWebView().getContext(), absolutePath);
        HttpURLConnection con = (HttpURLConnection) (new URL(targetUrl)).openConnection();
        try {
            con.setConnectTimeout(HTTP_TIMEOUT);
            con.setReadTimeout(HTTP_TIMEOUT);
            con.setRequestMethod("PUT");
            con.setDoInput(true);
            con.setUseCaches(false);
            con.setRequestProperty("Content-Type", "application/octet-stream");
            con.setChunkedStreamingMode(4096); // mitigates OOM for large files (start uploading before the complete file is buffered)
            addHeadersToRequest(con, headers);
            con.connect();

            IOUtils.copy(new FileInputStream(file), con.getOutputStream());

            return con.getResponseCode() + "";
        } finally {
            con.disconnect();
        }
    }

    String download(final String sourceUrl, final String filename, final JSONObject headers) throws IOException, JSONException {
        HttpURLConnection con = (HttpURLConnection) (new URL(sourceUrl)).openConnection();
        try {
            con.setConnectTimeout(HTTP_TIMEOUT);
            con.setReadTimeout(HTTP_TIMEOUT);
            con.setRequestMethod("GET");
            con.setDoInput(true);
            con.setUseCaches(false);
            addHeadersToRequest(con, headers);
            con.connect();

            Context context = activity.getWebView().getContext();
            File encryptedDir = new File(Utils.getDir(context), Crypto.TEMP_DIR_ENCRYPTED);
            encryptedDir.mkdirs();
            File encryptedFile = new File(encryptedDir, filename);

            IOUtils.copy(con.getInputStream(), new FileOutputStream(encryptedFile));

            return Utils.fileToUri(encryptedFile);
        } finally {
            con.disconnect();
        }
    }

    private static void addHeadersToRequest(URLConnection connection, JSONObject headers) throws JSONException {
        for (Iterator<?> iter = headers.keys(); iter.hasNext(); ) {
            String headerKey = iter.next().toString();
            JSONArray headerValues = headers.optJSONArray(headerKey);
            if (headerValues == null) {
                headerValues = new JSONArray();
                headerValues.put(headers.getString(headerKey));
            }
            connection.setRequestProperty(headerKey, headerValues.getString(0));
            for (int i = 1; i < headerValues.length(); ++i) {
                connection.addRequestProperty(headerKey, headerValues.getString(i));
            }
        }
    }

    void clearFileData() {
        // FIXME delete cached files (currently only implemented for ios)
    }
}
