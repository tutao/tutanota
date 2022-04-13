package de.tutao.tutanota;

import static android.app.Activity.RESULT_OK;

import android.Manifest;
import android.annotation.TargetApi;
import android.app.DownloadManager;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;
import android.webkit.MimeTypeMap;

import androidx.annotation.NonNull;
import androidx.core.content.FileProvider;

import org.apache.commons.io.IOUtils;
import org.apache.commons.io.input.BoundedInputStream;
import org.jdeferred.DoneFilter;
import org.jdeferred.DonePipe;
import org.jdeferred.Promise;
import org.jdeferred.impl.DeferredObject;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.SequenceInputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import de.tutao.tutanota.push.LocalNotificationsFacade;

import static de.tutao.tutanota.Utils.bytesToBase64;


public class FileUtil {
	private final static String TAG = "FileUtil";
	private static final int HTTP_TIMEOUT = 15 * 1000;
	public static final int COPY_BUFFER_SIZE = 1024 * 1000;

	private final MainActivity activity;
	private final LocalNotificationsFacade localNotificationsFacade;

	private final ThreadPoolExecutor backgroundTasksExecutor = new ThreadPoolExecutor(
			1, // core pool size
			4, // max pool size
			10, // keepalive time
			TimeUnit.SECONDS,
			new LinkedBlockingQueue<>()
	);

	public FileUtil(MainActivity activity, LocalNotificationsFacade localNotificationsFacade) {
		this.activity = activity;
		this.localNotificationsFacade = localNotificationsFacade;
	}

	private Promise<ActivityResult, Exception, Void> requestStoragePermission() {
		// Requesting android runtime permissions. (Android 5+)
		// We only need to request the read permission even if we want to get write access. There is only one permission of a permission group necessary to get
		// access to all permission of that permission group. We still have to declare write access in the manifest.
		// https://developer.android.com/guide/topics/security/permissions.html#perm-groups
		return activity.getPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE);
	}

	void delete(final String fileUri) throws Exception {
		if (fileUri.startsWith(Uri.fromFile(Utils.getDir(activity)).toString())) {
			// we do not deleteAlarmNotification files that are not stored in our cache dir
			if (!new File(Uri.parse(fileUri).getPath()).delete()) {
				throw new Exception("could not deleteAlarmNotification file " + fileUri);
			}
		}
	}

	String joinFiles(final String fileName, List<String> filesToJoin) throws IOException {
		List<InputStream> inStreams = new ArrayList<>(filesToJoin.size());
		for (String infile : filesToJoin) {
			inStreams.add(new FileInputStream(Uri.parse(infile).getPath()));
		}
		File output = getTempDecryptedFile(fileName);
		writeFile(output, new SequenceInputStream(Collections.enumeration(inStreams)));
		return Utils.fileToUri(output);
	}

	Promise<Object, Exception, Void> openFileChooser() {
		final Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
		intent.setType("*/*");
		intent.addCategory(Intent.CATEGORY_OPENABLE);
		intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
		intent.putExtra(Intent.EXTRA_LOCAL_ONLY, true);

		final Intent chooser = Intent.createChooser(intent, "Select File");
		return
				activity.startActivityForResult(chooser)
						.then((DonePipe<ActivityResult, Object, Exception, Void>) result -> {
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
									return new DeferredObject<Object, Exception, Void>().reject(e);
								}
							}
							return Utils.resolvedDeferred(selectedFiles);
						});
	}

	// @see: https://developer.android.com/reference/android/support/v4/content/FileProvider.html
	Promise<Object, Exception, Void> openFile(String fileUri, String mimeType) {
		Uri file = Uri.parse(fileUri);
		String scheme = file.getScheme();
		if ("file".equals(scheme)) {
			file = FileProvider.getUriForFile(activity, BuildConfig.FILE_PROVIDER_AUTHORITY, new File(file.getPath()));
		}
		Intent intent = new Intent(Intent.ACTION_VIEW);
		intent.setDataAndType(file, getCorrectedMimeType(file, mimeType));
		intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
		return activity.startActivityForResult(intent)
				.then((DoneFilter<ActivityResult, Object>) result -> result.resultCode == RESULT_OK);
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
		if ("file".equals(scheme)) {
			String extension = MimeTypeMap.getFileExtensionFromUrl(fileUri.toString());
			String type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
			if (type != null) {
				return type;
			}
		} else if ("content".equals(scheme)) {
			String type = activity.getContentResolver().getType(fileUri);
			if (type != null) {
				return type;
			}
		}
		return "application/octet-stream";
	}

	public Promise<Object, Exception, Void> putToDownloadFolder(String fileUriString) {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
			DeferredObject<Object, Exception, Void> promise = new DeferredObject<>();
			backgroundTasksExecutor.execute(() -> {
				try {
					promise.resolve(addFileToDownloadsMediaStore(fileUriString));
				} catch (Exception e) {
					promise.reject(e);
				} catch (Throwable e) {
					// For everything else
					promise.reject(new RuntimeException(e));
				}
			});
			return promise;
		} else {
			return requestStoragePermission().then((DonePipe<ActivityResult, Object, Exception, Void>) nothing -> {
				DeferredObject<Object, Exception, Void> promise = new DeferredObject<>();
				backgroundTasksExecutor.execute(() -> {
					try {
						promise.resolve(addFileToDownloadsOld(fileUriString));
					} catch (Exception e) {
						promise.reject(e);
					} catch (Throwable e) {
						// For everything else
						promise.reject(new RuntimeException(e));
					}
				});
				return promise;
			});
		}
	}

	@TargetApi(Build.VERSION_CODES.Q)
	private String addFileToDownloadsMediaStore(String fileUriString) throws IOException, FileOpenException {
		ContentResolver contentResolver = activity.getContentResolver();
		Uri fileUri = Uri.parse(fileUriString);
		FileInfo fileInfo = Utils.getFileInfo(activity, fileUri);

		ContentValues values = new ContentValues();
		values.put(MediaStore.MediaColumns.IS_PENDING, 1);
		String mimeType = getMimeType(fileUri);
		values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
		values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileInfo.name);
		values.put(MediaStore.MediaColumns.SIZE, fileInfo.size);
		Uri outputUri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);

		if (outputUri == null) {
			throw new FileOpenException("Could not insert into downloads, no output URI");
		}
		InputStream is = Objects.requireNonNull(contentResolver.openInputStream(fileUri));
		OutputStream os = contentResolver.openOutputStream(outputUri);
		long copiedBytes = IOUtils.copyLarge(is, os);
		Log.d(TAG, "Copied " + copiedBytes);

		ContentValues updateValues = new ContentValues();
		updateValues.put(MediaStore.MediaColumns.IS_PENDING, 0);
		int updated = contentResolver.update(outputUri, updateValues, null, null);
		Log.d(TAG, "Updated with not pending: " + updated);
		this.localNotificationsFacade.sendDownloadFinishedNotification(fileInfo.name);
		return outputUri.toString();
	}


	private String addFileToDownloadsOld(String fileUri) throws IOException {
		File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
		if (!downloadsDir.exists()) {
			boolean created = downloadsDir.mkdirs();
			if (!created) {
				throw new IOException("Could not create downloads folder");
			}
		}

		Uri file = Uri.parse(fileUri);
		FileInfo fileInfo = Utils.getFileInfo(activity, file);
		File newFile = new File(downloadsDir, fileInfo.name);
		IOUtils.copyLarge(activity.getContentResolver().openInputStream(file), new FileOutputStream(newFile),
				new byte[4096]);

		DownloadManager downloadManager =
				(DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
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

	JSONObject upload(final String fileUri, final String targetUrl, final String httpMethod, final JSONObject headers) throws IOException, JSONException {
		InputStream inputStream = activity.getContentResolver().openInputStream(Uri.parse(fileUri));
		HttpURLConnection con = (HttpURLConnection) (new URL(targetUrl)).openConnection();
		try {
			con.setConnectTimeout(HTTP_TIMEOUT);
			con.setReadTimeout(HTTP_TIMEOUT);
			con.setRequestMethod(httpMethod);
			con.setDoInput(true);
			con.setDoOutput(true);
			con.setUseCaches(false);
			con.setRequestProperty("Content-Type", "application/octet-stream");
			con.setChunkedStreamingMode(4096); // mitigates OOM for large files (start uploading before the complete file is buffered)
			addHeadersToRequest(con, headers);
			con.connect();
			IOUtils.copy(inputStream, con.getOutputStream());

			int responseCode = con.getResponseCode();

			JSONObject response = new JSONObject()
					.put("statusCode", responseCode)
					.put("errorId", con.getHeaderField("Error-Id")) // see ResourceConstants.ERROR_ID_HEADER
					.put("precondition", con.getHeaderField("Precondition")) // see ResourceConstants.PRECONDITION_HEADER
					.put("suspensionTime", con.getHeaderField("Retry-After"));


			if (responseCode >= 200 && responseCode < 300) {
				ByteArrayOutputStream responseBodyStream = new ByteArrayOutputStream();
				IOUtils.copy(con.getInputStream(), responseBodyStream);
				response.put("responseBody", bytesToBase64(responseBodyStream.toByteArray()));
			}


			if (!response.has("suspensionTime")) { // enters this block if "Retry-After" header is not set
				response.put("suspensionTime", con.getHeaderField("Suspension-Time"));
			}
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
				InputStream inputStream = con.getInputStream();
				encryptedFile = getTempEncryptedFile(filename);
				writeFile(encryptedFile, inputStream);
			}

			JSONObject result = new JSONObject()
					.put("statusCode", con.getResponseCode())
					.put("encryptedFileUri", encryptedFile != null ? Utils.fileToUri(encryptedFile) : JSONObject.NULL)
					.put("errorId", con.getHeaderField("Error-Id")) // see ResourceConstants.ERROR_ID_HEADER
					.put("precondition", con.getHeaderField("Precondition")) // see ResourceConstants.PRECONDITION_HEADER
					.put("suspensionTime", con.getHeaderField("Retry-After"));
			if (!result.has("suspensionTime")) {
				result.put("suspensionTime", con.getHeaderField("Suspension-Time"));
			}
			return result;
		} finally {
			if (con != null) {
				con.disconnect();
			}
		}
	}

	@NonNull
	public void writeFile(File filePath, InputStream inputStream) throws IOException {
		filePath.getParentFile().mkdirs();
		IOUtils.copyLarge(inputStream, new FileOutputStream(filePath),
				new byte[COPY_BUFFER_SIZE]);
	}

	String saveDataFile(final String name, final String base64blob) throws IOException {
		File localPath = getTempDecryptedFile(name);
		writeFile(localPath, new ByteArrayInputStream(Utils.base64ToBytes(base64blob)));
		Uri targetUri = Uri.fromFile(localPath);
		return targetUri.toString();
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

	public JSONArray splitFile(String fileUri, int maxChunkSize) throws IOException, NoSuchAlgorithmException, JSONException {
		Uri file = Uri.parse(fileUri);
		long fileSize = Utils.getFileInfo(activity, file).size;
		InputStream inputStream = activity.getContentResolver().openInputStream(file);
		List<String> chunkUris = new ArrayList<>();
		for (int chunk = 0; chunk * maxChunkSize <= fileSize; chunk++) {
			String tmpFilename = Integer.toHexString(file.hashCode()) + "." + chunk + ".blob";
			BoundedInputStream chunkedInputStream = new BoundedInputStream(inputStream, maxChunkSize);
			File tmpFile = getTempDecryptedFile(tmpFilename);
			writeFile(tmpFile, chunkedInputStream);

			chunkUris.add(Utils.fileToUri(tmpFile));
		}
		return new JSONArray(chunkUris);
	}

	public String hashFile(String fileUri) throws IOException, NoSuchAlgorithmException {
		InputStream inputStream = activity.getContentResolver().openInputStream(Uri.parse(fileUri));
		HashingInputStream hashingInputStream = new HashingInputStream(MessageDigest.getInstance("SHA-256"), inputStream);
		OutputStream devNull = new OutputStream() {
			public void write(int b) {
			}
		};

		IOUtils.copyLarge(hashingInputStream, devNull);
		byte[] hash = hashingInputStream.hash();
		return bytesToBase64(Arrays.copyOf(hash, 6));
	}

	public File getTempDecryptedFile(String filename) throws IOException {
		return getTempFile(filename, Crypto.TEMP_DIR_DECRYPTED);
	}

	private File getTempEncryptedFile(String filename) throws IOException {
		return getTempFile(filename, Crypto.TEMP_DIR_ENCRYPTED);
	}

	private File getTempFile(String filename, String directory) throws IOException {
		File dir = new File(Utils.getDir(activity), directory);
		File file = new File(dir, filename);
		return file;
	}
}
