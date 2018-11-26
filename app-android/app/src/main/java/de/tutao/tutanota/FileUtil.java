package de.tutao.tutanota;

import android.Manifest;
import android.app.DownloadManager;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.support.annotation.NonNull;
import android.support.v4.content.FileProvider;
import android.webkit.MimeTypeMap;

import org.apache.commons.io.IOUtils;
import org.jdeferred.DoneFilter;
import org.jdeferred.DonePipe;
import org.jdeferred.Promise;
import org.jdeferred.impl.DeferredObject;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.util.Iterator;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import static android.app.Activity.RESULT_OK;


public class FileUtil {
    private final static String TAG = "FileUtil";
    private static final int HTTP_TIMEOUT = 15 * 1000;

    private final MainActivity activity;

    private final ThreadPoolExecutor backgroundTasksExecutor = new ThreadPoolExecutor(
            1, // core pool size
            4, // max pool size
            10, // keepalive time
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<>()
    );

    public FileUtil(MainActivity activity) {
        this.activity = activity;
    }


    private Promise<Void, Exception, Void> requestStoragePermission() {
        // Requesting android runtime permissions. (Android 5+)
        // We only need to request the read permission even if we want to get write access. There is only one permission of a permission group necessary to get
        // access to all permission of that permission group. We still have to declare write access in the manifest.
        // https://developer.android.com/guide/topics/security/permissions.html#perm-groups
        return activity.getPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE);
    }

    void delete(final String fileUri) throws Exception {
        if (fileUri.startsWith(Uri.fromFile(Utils.getDir(activity)).toString())) {
            // we do not delete files that are not stored in our cache dir
            if (!new File(Uri.parse(fileUri).getPath()).delete()) {
                throw new Exception("could not delete file " + fileUri);
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
        return this.requestStoragePermission()
                .then((DonePipe<Void, JSONArray, Exception, Void>) result ->
                        activity.startActivityForResult(chooser)
                                .then(new DonePipe<ActivityResult, JSONArray, Exception, Void>() {
                                    @Override
                                    public Promise<JSONArray, Exception, Void> pipeDone(ActivityResult result) {
                                        JSONArray selectedFiles = new JSONArray();
                                        if (result.resultCode == RESULT_OK) {
                                            ClipData clipData = result.data.getClipData();
                                            try {
                                                if (clipData != null) {
                                                    for (int i = 0; i < clipData.getItemCount(); i++) {
                                                        ClipData.Item item = clipData.getItemAt(i);
                                                        selectedFiles.put(item.getUri().toString());
                                                    }
                                                } else {
                                                    Uri uri = result.data.getData();
                                                    selectedFiles.put(uri.toString());
                                                }
                                            } catch (Exception e) {
                                                return new DeferredObject<JSONArray, Exception, Void>().reject(e);
                                            }
                                        }
                                        return new DeferredObject<JSONArray, Exception, Void>().resolve(selectedFiles);
                                    }
                                }));
    }

    // @see: https://developer.android.com/reference/android/support/v4/content/FileProvider.html
    Promise<Boolean, Exception, Void> openFile(String fileUri, String mimeType) {
        Uri file = Uri.parse(fileUri);
        String scheme = file.getScheme();
        if (scheme.equals("file")) {
            file = FileProvider.getUriForFile(activity, BuildConfig.FILE_PROVIDER_AUTHORITY, new File(file.getPath()));
        }
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(file, getCorrectedMimeType(file, mimeType));
        intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        return activity.startActivityForResult(intent)
                .then((DoneFilter<ActivityResult, Boolean>) result -> result.resultCode == RESULT_OK);
    }

    private String getCorrectedMimeType(Uri fileUri, String storedMimeType) {
        if (storedMimeType == null || storedMimeType.isEmpty() || storedMimeType.equals("application/octet-stream")) {
            return getMimeType(fileUri);
        } else {
            return storedMimeType;
        }
    }

    @NonNull
    String getMimeType(Uri fileUri) {
        String scheme = fileUri.getScheme();
        if (scheme.equals("file")) {
            String extension = MimeTypeMap.getFileExtensionFromUrl(fileUri.toString());
            String type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
            if (type != null) {
                return type;
            }
        } else if (scheme.equals("content")) {
            String type = activity.getContentResolver().getType(fileUri);
            if (type != null) {
                return type;
            }
        }
        return "application/octet-stream";
    }

    public Promise<String, Exception, Void> putToDownloadFolder(String path) {
        return requestStoragePermission().then((DonePipe<Void, String, Exception, Void>) nothing -> {
            DeferredObject<String, Exception, Void> promise = new DeferredObject<>();
            backgroundTasksExecutor.execute(() -> {
                try {
                    promise.resolve(addFileToDownloads(path));
                } catch (IOException e) {
                    promise.reject(e);
                }
            });
            return promise;
        });
    }

    private String addFileToDownloads(String fileUri) throws IOException {
        File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);

        Uri file = Uri.parse(fileUri);
        FileInfo fileInfo = Utils.getFileInfo(activity, file);
        File newFile = new File(downloadsDir, fileInfo.name);
        IOUtils.copyLarge(activity.getContentResolver().openInputStream(file), new FileOutputStream(newFile),
                new byte[4096]);

        DownloadManager downloadManager =
                (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
        //noinspection ConstantConditions
        downloadManager.addCompletedDownload(newFile.getName(), "Tutanota download",
                false, this.getMimeType(Uri.fromFile(newFile)), newFile.getAbsolutePath(), fileInfo.size, true);
        return Uri.fromFile(newFile).toString();
    }

    long getSize(String fileUri) throws FileNotFoundException {
        return Utils.getFileInfo(activity, Uri.parse(fileUri)).size;
    }


    public String getName(String fileUri) throws FileNotFoundException {
        return Utils.getFileInfo(activity, Uri.parse(fileUri)).name;
    }

    JSONObject upload(final String absolutePath, final String targetUrl, final JSONObject headers) throws IOException, JSONException {
        File file = Utils.uriToFile(activity, absolutePath);
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
            JSONObject response = new JSONObject();
            response.put("statusCode", con.getResponseCode());
            response.put("statusMessage", con.getResponseMessage());
            return response;
        } finally {
            con.disconnect();
        }
    }

    JSONObject download(final String sourceUrl, final String filename, final JSONObject headers) throws IOException, JSONException {
        HttpURLConnection con = null;
        try {
            con = (HttpURLConnection) (new URL(sourceUrl)).openConnection();
            con.setConnectTimeout(HTTP_TIMEOUT);
            con.setReadTimeout(HTTP_TIMEOUT);
            con.setRequestMethod("GET");
            con.setDoInput(true);
            con.setUseCaches(false);
            addHeadersToRequest(con, headers);
            con.connect();

            File encryptedFile = null;
            if (con.getResponseCode() == 200) {

                File encryptedDir = new File(Utils.getDir(activity), Crypto.TEMP_DIR_ENCRYPTED);
                encryptedDir.mkdirs();
                encryptedFile = new File(encryptedDir, filename);

                IOUtils.copyLarge(con.getInputStream(), new FileOutputStream(encryptedFile),
                        new byte[1024 * 1000]);
            }

            JSONObject result = new JSONObject();
            result.put("statusCode", con.getResponseCode());
            result.put("statusMessage", con.getResponseMessage());
            result.put("encryptedFileUri", encryptedFile != null ? Utils.fileToUri(encryptedFile) : JSONObject.NULL);
            return result;
        } finally {
            if (con != null) {
                con.disconnect();
            }
        }
    }

    Promise<String, Exception, Void> saveBlob(final String name, final String base64blob) {
        return requestStoragePermission().then((DonePipe<Void, String, Exception, Void>) __ -> {
            DeferredObject<String, Exception, Void> result = new DeferredObject<>();
            backgroundTasksExecutor.execute(() -> {
                final File file = new File(Environment.getExternalStoragePublicDirectory(
                        Environment.DIRECTORY_DOWNLOADS), name);


                try (FileOutputStream fout = new FileOutputStream(file)) {
                    byte[] fileBytes = Utils.base64ToBytes(base64blob);
                    fout.write(fileBytes);
                    result.resolve(Uri.fromFile(file).toString());
                    DownloadManager downloadManager =
                            (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
                    //noinspection ConstantConditions
                    downloadManager.addCompletedDownload(name, "Tutanota invoice", false,
                            getMimeType(Uri.fromFile(file)), file.getAbsolutePath(),
                            fileBytes.length, true);
                } catch (IOException e) {
                    result.reject(e);
                }
            });
            return result;
        });
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
        cleanupDir(Crypto.TEMP_DIR_DECRYPTED);
        cleanupDir(Crypto.TEMP_DIR_ENCRYPTED);
    }

    private void cleanupDir(String dirname) {
        File[] files = new File(Utils.getDir(activity), dirname).listFiles();
        if (files != null) {
            for (File file : files) {
                file.delete();
            }
        }
    }

}
