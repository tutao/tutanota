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
package org.apache.cordova.filetransfer;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.Closeable;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URLConnection;
import java.net.URLDecoder;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.HashMap;
import java.util.Iterator;
import java.util.zip.GZIPInputStream;
import java.util.zip.Inflater;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import org.apache.cordova.Config;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaResourceApi;
import org.apache.cordova.CordovaResourceApi.OpenForReadResult;
import org.apache.cordova.PluginResult;
import org.apache.cordova.file.FileUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.net.Uri;
import android.os.Build;
import android.util.Log;
import com.amazon.android.webkit.AmazonCookieManager;

public class FileTransfer extends CordovaPlugin {

    private static final String LOG_TAG = "FileTransfer";
    private static final String LINE_START = "--";
    private static final String LINE_END = "\r\n";
    private static final String BOUNDARY =  "+++++";

    public static int FILE_NOT_FOUND_ERR = 1;
    public static int INVALID_URL_ERR = 2;
    public static int CONNECTION_ERR = 3;
    public static int ABORTED_ERR = 4;

    private static HashMap<String, RequestContext> activeRequests = new HashMap<String, RequestContext>();
    private static final int MAX_BUFFER_SIZE = 16 * 1024;

    private static final class RequestContext {
        String source;
        String target;
        File targetFile;
        CallbackContext callbackContext;
        InputStream currentInputStream;
        OutputStream currentOutputStream;
        boolean aborted;
        RequestContext(String source, String target, CallbackContext callbackContext) {
            this.source = source;
            this.target = target;
            this.callbackContext = callbackContext;
        }
        void sendPluginResult(PluginResult pluginResult) {
            synchronized (this) {
                if (!aborted) {
                    callbackContext.sendPluginResult(pluginResult);
                }
            }
        }
    }

    /**
     * Adds an interface method to an InputStream to return the number of bytes
     * read from the raw stream. This is used to track total progress against
     * the HTTP Content-Length header value from the server.
     */
    private static abstract class TrackingInputStream extends FilterInputStream {
      public TrackingInputStream(final InputStream in) {
        super(in);
      }
        public abstract long getTotalRawBytesRead();
  }

    private static class ExposedGZIPInputStream extends GZIPInputStream {
      public ExposedGZIPInputStream(final InputStream in) throws IOException {
        super(in);
      }
      public Inflater getInflater() {
        return inf;
      }
  }

    /**
     * Provides raw bytes-read tracking for a GZIP input stream. Reports the
     * total number of compressed bytes read from the input, rather than the
     * number of uncompressed bytes.
     */
    private static class TrackingGZIPInputStream extends TrackingInputStream {
      private ExposedGZIPInputStream gzin;
      public TrackingGZIPInputStream(final ExposedGZIPInputStream gzin) throws IOException {
        super(gzin);
        this.gzin = gzin;
      }
      public long getTotalRawBytesRead() {
        return gzin.getInflater().getBytesRead();
      }
  }

    /**
     * Provides simple total-bytes-read tracking for an existing InputStream
     */
    private static class SimpleTrackingInputStream extends TrackingInputStream {
        private long bytesRead = 0;
        public SimpleTrackingInputStream(InputStream stream) {
            super(stream);
        }

        private int updateBytesRead(int newBytesRead) {
          if (newBytesRead != -1) {
            bytesRead += newBytesRead;
          }
          return newBytesRead;
        }

        @Override
        public int read() throws IOException {
            return updateBytesRead(super.read());
        }

        // Note: FilterInputStream delegates read(byte[] bytes) to the below method,
        // so we don't override it or else double count (CB-5631).
        @Override
        public int read(byte[] bytes, int offset, int count) throws IOException {
            return updateBytesRead(super.read(bytes, offset, count));
        }

        public long getTotalRawBytesRead() {
          return bytesRead;
        }
    }

    @Override
    public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {
        if (action.equals("upload") || action.equals("download")) {
            String source = args.getString(0);
            String target = args.getString(1);

            if (action.equals("upload")) {
                try {
                    source = URLDecoder.decode(source, "UTF-8");
                    upload(source, target, args, callbackContext);
                } catch (UnsupportedEncodingException e) {
                    callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.MALFORMED_URL_EXCEPTION, "UTF-8 error."));
                }
            } else {
                download(source, target, args, callbackContext);
            }
            return true;
        } else if (action.equals("abort")) {
            String objectId = args.getString(0);
            abort(objectId);
            callbackContext.success();
            return true;
        }
        return false;
    }

    private static void addHeadersToRequest(URLConnection connection, JSONObject headers) {
        try {
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
        } catch (JSONException e1) {
          // No headers to be manipulated!
        }
    }

    /**
     * Uploads the specified file to the server URL provided using an HTTP multipart request.
     * @param source        Full path of the file on the file system
     * @param target        URL of the server to receive the file
     * @param args          JSON Array of args
     * @param callbackContext    callback id for optional progress reports
     *
     * args[2] fileKey       Name of file request parameter
     * args[3] fileName      File name to be used on server
     * args[4] mimeType      Describes file content type
     * args[5] params        key:value pairs of user-defined parameters
     * @return FileUploadResult containing result of upload request
     */
    private void upload(final String source, final String target, JSONArray args, CallbackContext callbackContext) throws JSONException {
        Log.d(LOG_TAG, "upload " + source + " to " +  target);

        // Setup the options
        final String fileKey = getArgument(args, 2, "file");
        final String fileName = getArgument(args, 3, "image.jpg");
        final String mimeType = getArgument(args, 4, "image/jpeg");
        final JSONObject params = args.optJSONObject(5) == null ? new JSONObject() : args.optJSONObject(5);
        final boolean trustEveryone = args.optBoolean(6);
        // Always use chunked mode unless set to false as per API
        final boolean chunkedMode = args.optBoolean(7) || args.isNull(7);
        // Look for headers on the params map for backwards compatibility with older Cordova versions.
        final JSONObject headers = args.optJSONObject(8) == null ? params.optJSONObject("headers") : args.optJSONObject(8);
        final String objectId = args.getString(9);
        final String httpMethod = getArgument(args, 10, "POST");
        
        final CordovaResourceApi resourceApi = webView.getResourceApi();

        Log.d(LOG_TAG, "fileKey: " + fileKey);
        Log.d(LOG_TAG, "fileName: " + fileName);
        Log.d(LOG_TAG, "mimeType: " + mimeType);
        Log.d(LOG_TAG, "params: " + params);
        Log.d(LOG_TAG, "trustEveryone: " + trustEveryone);
        Log.d(LOG_TAG, "chunkedMode: " + chunkedMode);
        Log.d(LOG_TAG, "headers: " + headers);
        Log.d(LOG_TAG, "objectId: " + objectId);
        Log.d(LOG_TAG, "httpMethod: " + httpMethod);
        
        final Uri targetUri = resourceApi.remapUri(Uri.parse(target));
        // Accept a path or a URI for the source.
        Uri tmpSrc = Uri.parse(source);
        final Uri sourceUri = resourceApi.remapUri(
            tmpSrc.getScheme() != null ? tmpSrc : Uri.fromFile(new File(source)));

        int uriType = CordovaResourceApi.getUriType(targetUri);
        final boolean useHttps = uriType == CordovaResourceApi.URI_TYPE_HTTPS;
        if (uriType != CordovaResourceApi.URI_TYPE_HTTP && !useHttps) {
            JSONObject error = createFileTransferError(INVALID_URL_ERR, source, target, null, 0);
            Log.e(LOG_TAG, "Unsupported URI: " + targetUri);
            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, error));
            return;
        }

        final RequestContext context = new RequestContext(source, target, callbackContext);
        synchronized (activeRequests) {
            activeRequests.put(objectId, context);
        }
        
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                if (context.aborted) {
                    return;
                }
                HttpURLConnection conn = null;
                HostnameVerifier oldHostnameVerifier = null;
                SSLSocketFactory oldSocketFactory = null;
                int totalBytes = 0;
                int fixedLength = -1;
                try {
                    // Create return object
                    FileUploadResult result = new FileUploadResult();
                    FileProgressResult progress = new FileProgressResult();

                    //------------------ CLIENT REQUEST
                    // Open a HTTP connection to the URL based on protocol
                    conn = resourceApi.createHttpConnection(targetUri);
                    if (useHttps && trustEveryone) {
                        // Setup the HTTPS connection class to trust everyone
                        HttpsURLConnection https = (HttpsURLConnection)conn;
                        oldSocketFactory  = trustAllHosts(https);
                        // Save the current hostnameVerifier
                        oldHostnameVerifier = https.getHostnameVerifier();
                        // Setup the connection not to verify hostnames
                        https.setHostnameVerifier(DO_NOT_VERIFY);
                    }

                    // Allow Inputs
                    conn.setDoInput(true);

                    // Allow Outputs
                    conn.setDoOutput(true);

                    // Don't use a cached copy.
                    conn.setUseCaches(false);

                    // Use a post method.
                    conn.setRequestMethod(httpMethod);
                    conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + BOUNDARY);

                    // Set the cookies on the response
                    String cookie = AmazonCookieManager.getInstance().getCookie(target);
                    if (cookie != null) {
                        conn.setRequestProperty("Cookie", cookie);
                    }

                    // Handle the other headers
                    if (headers != null) {
                        addHeadersToRequest(conn, headers);
                    }

                    /*
                        * Store the non-file portions of the multipart data as a string, so that we can add it
                        * to the contentSize, since it is part of the body of the HTTP request.
                        */
                    StringBuilder beforeData = new StringBuilder();
                    try {
                        for (Iterator<?> iter = params.keys(); iter.hasNext();) {
                            Object key = iter.next();
                            if(!String.valueOf(key).equals("headers"))
                            {
                              beforeData.append(LINE_START).append(BOUNDARY).append(LINE_END);
                              beforeData.append("Content-Disposition: form-data; name=\"").append(key.toString()).append('"');
                              beforeData.append(LINE_END).append(LINE_END);
                              beforeData.append(params.getString(key.toString()));
                              beforeData.append(LINE_END);
                            }
                        }
                    } catch (JSONException e) {
                        Log.e(LOG_TAG, e.getMessage(), e);
                    }

                    beforeData.append(LINE_START).append(BOUNDARY).append(LINE_END);
                    beforeData.append("Content-Disposition: form-data; name=\"").append(fileKey).append("\";");
                    beforeData.append(" filename=\"").append(fileName).append('"').append(LINE_END);
                    beforeData.append("Content-Type: ").append(mimeType).append(LINE_END).append(LINE_END);
                    byte[] beforeDataBytes = beforeData.toString().getBytes("UTF-8");
                    byte[] tailParamsBytes = (LINE_END + LINE_START + BOUNDARY + LINE_START + LINE_END).getBytes("UTF-8");

                    
                    // Get a input stream of the file on the phone
                    OpenForReadResult readResult = resourceApi.openForRead(sourceUri);
                    
                    int stringLength = beforeDataBytes.length + tailParamsBytes.length;
                    if (readResult.length >= 0) {
                        fixedLength = (int)readResult.length + stringLength;
                        progress.setLengthComputable(true);
                        progress.setTotal(fixedLength);
                    }
                    Log.d(LOG_TAG, "Content Length: " + fixedLength);
                    // setFixedLengthStreamingMode causes and OutOfMemoryException on pre-Froyo devices.
                    // http://code.google.com/p/android/issues/detail?id=3164
                    // It also causes OOM if HTTPS is used, even on newer devices.
                    boolean useChunkedMode = chunkedMode && (Build.VERSION.SDK_INT < Build.VERSION_CODES.FROYO || useHttps);
                    useChunkedMode = useChunkedMode || (fixedLength == -1);

                    if (useChunkedMode) {
                        conn.setChunkedStreamingMode(MAX_BUFFER_SIZE);
                        // Although setChunkedStreamingMode sets this header, setting it explicitly here works
                        // around an OutOfMemoryException when using https.
                        conn.setRequestProperty("Transfer-Encoding", "chunked");
                    } else {
                        conn.setFixedLengthStreamingMode(fixedLength);
                    }

                    conn.connect();
                    
                    OutputStream sendStream = null;
                    try {
                        sendStream = conn.getOutputStream();
                        synchronized (context) {
                            if (context.aborted) {
                                return;
                            }
                            context.currentOutputStream = sendStream;
                        }
                        //We don't want to change encoding, we just want this to write for all Unicode.
                        sendStream.write(beforeDataBytes);
                        totalBytes += beforeDataBytes.length;
    
                        // create a buffer of maximum size
                        int bytesAvailable = readResult.inputStream.available();
                        int bufferSize = Math.min(bytesAvailable, MAX_BUFFER_SIZE);
                        byte[] buffer = new byte[bufferSize];
    
                        // read file and write it into form...
                        int bytesRead = readResult.inputStream.read(buffer, 0, bufferSize);
    
                        long prevBytesRead = 0;
                        while (bytesRead > 0) {
                            result.setBytesSent(totalBytes);
                            sendStream.write(buffer, 0, bytesRead);
                            totalBytes += bytesRead;
                            if (totalBytes > prevBytesRead + 102400) {
                                prevBytesRead = totalBytes;
                                Log.d(LOG_TAG, "Uploaded " + totalBytes + " of " + fixedLength + " bytes");
                            }
                            bytesAvailable = readResult.inputStream.available();
                            bufferSize = Math.min(bytesAvailable, MAX_BUFFER_SIZE);
                            bytesRead = readResult.inputStream.read(buffer, 0, bufferSize);

                            // Send a progress event.
                            progress.setLoaded(totalBytes);
                            PluginResult progressResult = new PluginResult(PluginResult.Status.OK, progress.toJSONObject());
                            progressResult.setKeepCallback(true);
                            context.sendPluginResult(progressResult);
                        }
    
                        // send multipart form data necessary after file data...
                        sendStream.write(tailParamsBytes);
                        totalBytes += tailParamsBytes.length;
                        sendStream.flush();
                    } finally {
                        safeClose(readResult.inputStream);
                        safeClose(sendStream);
                    }
                    context.currentOutputStream = null;
                    Log.d(LOG_TAG, "Sent " + totalBytes + " of " + fixedLength);

                    //------------------ read the SERVER RESPONSE
                    String responseString;
                    int responseCode = conn.getResponseCode();
                    Log.d(LOG_TAG, "response code: " + responseCode);
                    Log.d(LOG_TAG, "response headers: " + conn.getHeaderFields());
                    TrackingInputStream inStream = null;
                    try {
                        inStream = getInputStream(conn);
                        synchronized (context) {
                            if (context.aborted) {
                                return;
                            }
                            context.currentInputStream = inStream;
                        }
                        
                        ByteArrayOutputStream out = new ByteArrayOutputStream(Math.max(1024, conn.getContentLength()));
                        byte[] buffer = new byte[1024];
                        int bytesRead = 0;
                        // write bytes to file
                        while ((bytesRead = inStream.read(buffer)) > 0) {
                            out.write(buffer, 0, bytesRead);
                        }
                        responseString = out.toString("UTF-8");
                    } finally {
                        context.currentInputStream = null;
                        safeClose(inStream);
                    }
                    
                    Log.d(LOG_TAG, "got response from server");
                    Log.d(LOG_TAG, responseString.substring(0, Math.min(256, responseString.length())));
                    
                    // send request and retrieve response
                    result.setResponseCode(responseCode);
                    result.setResponse(responseString);

                    context.sendPluginResult(new PluginResult(PluginResult.Status.OK, result.toJSONObject()));
                } catch (FileNotFoundException e) {
                    JSONObject error = createFileTransferError(FILE_NOT_FOUND_ERR, source, target, conn);
                    Log.e(LOG_TAG, error.toString(), e);
                    context.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, error));
                } catch (IOException e) {
                    JSONObject error = createFileTransferError(CONNECTION_ERR, source, target, conn);
                    Log.e(LOG_TAG, error.toString(), e);
                    Log.e(LOG_TAG, "Failed after uploading " + totalBytes + " of " + fixedLength + " bytes.");
                    context.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, error));
                } catch (JSONException e) {
                    Log.e(LOG_TAG, e.getMessage(), e);
                    context.sendPluginResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                } catch (Throwable t) {
                    // Shouldn't happen, but will
                    JSONObject error = createFileTransferError(CONNECTION_ERR, source, target, conn);
                    Log.e(LOG_TAG, error.toString(), t);
                    context.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, error));
                } finally {
                    synchronized (activeRequests) {
                        activeRequests.remove(objectId);
                    }

                    if (conn != null) {
                        // Revert back to the proper verifier and socket factories
                        // Revert back to the proper verifier and socket factories
                        if (trustEveryone && useHttps) {
                            HttpsURLConnection https = (HttpsURLConnection) conn;
                            https.setHostnameVerifier(oldHostnameVerifier);
                            https.setSSLSocketFactory(oldSocketFactory);
                        }
                    }
                }                
            }
        });
    }

    private static void safeClose(Closeable stream) {
        if (stream != null) {
            try {
                stream.close();
            } catch (IOException e) {
            }
        }
    }

    private static TrackingInputStream getInputStream(URLConnection conn) throws IOException {
        String encoding = conn.getContentEncoding();
        if (encoding != null && encoding.equalsIgnoreCase("gzip")) {
          return new TrackingGZIPInputStream(new ExposedGZIPInputStream(conn.getInputStream()));
        }
        return new SimpleTrackingInputStream(conn.getInputStream());
    }

    // always verify the host - don't check for certificate
    private static final HostnameVerifier DO_NOT_VERIFY = new HostnameVerifier() {
        public boolean verify(String hostname, SSLSession session) {
            return true;
        }
    };
    // Create a trust manager that does not validate certificate chains
    private static final TrustManager[] trustAllCerts = new TrustManager[] { new X509TrustManager() {
        public java.security.cert.X509Certificate[] getAcceptedIssuers() {
            return new java.security.cert.X509Certificate[] {};
        }
        
        public void checkClientTrusted(X509Certificate[] chain,
                String authType) throws CertificateException {
        }
        
        public void checkServerTrusted(X509Certificate[] chain,
                String authType) throws CertificateException {
        }
    } };

    /**
     * This function will install a trust manager that will blindly trust all SSL
     * certificates.  The reason this code is being added is to enable developers
     * to do development using self signed SSL certificates on their web server.
     *
     * The standard HttpsURLConnection class will throw an exception on self
     * signed certificates if this code is not run.
     */
    private static SSLSocketFactory trustAllHosts(HttpsURLConnection connection) {
        // Install the all-trusting trust manager
        SSLSocketFactory oldFactory = connection.getSSLSocketFactory();
        try {
            // Install our all trusting manager
            SSLContext sc = SSLContext.getInstance("TLS");
            sc.init(null, trustAllCerts, new java.security.SecureRandom());
            SSLSocketFactory newFactory = sc.getSocketFactory();
            connection.setSSLSocketFactory(newFactory);
        } catch (Exception e) {
            Log.e(LOG_TAG, e.getMessage(), e);
        }
        return oldFactory;
    }

    private static JSONObject createFileTransferError(int errorCode, String source, String target, URLConnection connection) {

        int httpStatus = 0;
        StringBuilder bodyBuilder = new StringBuilder();
        String body = null;
        if (connection != null) {
            try {
                if (connection instanceof HttpURLConnection) {
                    httpStatus = ((HttpURLConnection)connection).getResponseCode();
                    InputStream err = ((HttpURLConnection) connection).getErrorStream();
                    if(err != null)
                    {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(err, "UTF-8"));
                        try {
                            String line = reader.readLine();
                            while(line != null) {
                                bodyBuilder.append(line);
                                line = reader.readLine();
                                if(line != null) {
                                    bodyBuilder.append('\n');
                                }
                            }
                            body = bodyBuilder.toString();
                        } finally {
                            reader.close();
                        }
                    }
                }
            // IOException can leave connection object in a bad state, so catch all exceptions.
            } catch (Throwable e) {
                Log.w(LOG_TAG, "Error getting HTTP status code from connection.", e);
            }
        }

        return createFileTransferError(errorCode, source, target, body, httpStatus);
    }

        /**
        * Create an error object based on the passed in errorCode
        * @param errorCode      the error
        * @return JSONObject containing the error
        */
    private static JSONObject createFileTransferError(int errorCode, String source, String target, String body, Integer httpStatus) {
        JSONObject error = null;
        try {
            error = new JSONObject();
            error.put("code", errorCode);
            error.put("source", source);
            error.put("target", target);
            if(body != null)
            {
                error.put("body", body);
            }   
            if (httpStatus != null) {
                error.put("http_status", httpStatus);
            }
        } catch (JSONException e) {
            Log.e(LOG_TAG, e.getMessage(), e);
        }
        return error;
    }

    /**
     * Convenience method to read a parameter from the list of JSON args.
     * @param args                      the args passed to the Plugin
     * @param position          the position to retrieve the arg from
     * @param defaultString the default to be used if the arg does not exist
     * @return String with the retrieved value
     */
    private static String getArgument(JSONArray args, int position, String defaultString) {
        String arg = defaultString;
        if (args.length() > position) {
            arg = args.optString(position);
            if (arg == null || "null".equals(arg)) {
                arg = defaultString;
            }
        }
        return arg;
    }

    /**
     * Downloads a file form a given URL and saves it to the specified directory.
     *
     * @param source        URL of the server to receive the file
     * @param target            Full path of the file on the file system
     */
    private void download(final String source, final String target, JSONArray args, CallbackContext callbackContext) throws JSONException {
        Log.d(LOG_TAG, "download " + source + " to " +  target);

        final CordovaResourceApi resourceApi = webView.getResourceApi();

        final boolean trustEveryone = args.optBoolean(2);
        final String objectId = args.getString(3);
        final JSONObject headers = args.optJSONObject(4);
        
        final Uri sourceUri = resourceApi.remapUri(Uri.parse(source));
        // Accept a path or a URI for the source.
        Uri tmpTarget = Uri.parse(target);
        final Uri targetUri = resourceApi.remapUri(
            tmpTarget.getScheme() != null ? tmpTarget : Uri.fromFile(new File(target)));

        int uriType = CordovaResourceApi.getUriType(sourceUri);
        final boolean useHttps = uriType == CordovaResourceApi.URI_TYPE_HTTPS;
        final boolean isLocalTransfer = !useHttps && uriType != CordovaResourceApi.URI_TYPE_HTTP;
        if (uriType == CordovaResourceApi.URI_TYPE_UNKNOWN) {
            JSONObject error = createFileTransferError(INVALID_URL_ERR, source, target, null, 0);
            Log.e(LOG_TAG, "Unsupported URI: " + targetUri);
            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, error));
            return;
        }
        
        // TODO: refactor to also allow resources & content:
        if (!isLocalTransfer && !Config.isUrlWhiteListed(source)) {
            Log.w(LOG_TAG, "Source URL is not in white list: '" + source + "'");
            JSONObject error = createFileTransferError(CONNECTION_ERR, source, target, null, 401);
            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, error));
            return;
        }

        
        final RequestContext context = new RequestContext(source, target, callbackContext);
        synchronized (activeRequests) {
            activeRequests.put(objectId, context);
        }
        
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                if (context.aborted) {
                    return;
                }
                HttpURLConnection connection = null;
                HostnameVerifier oldHostnameVerifier = null;
                SSLSocketFactory oldSocketFactory = null;
                File file = null;
                PluginResult result = null;
                TrackingInputStream inputStream = null;

                OutputStream outputStream = null;
                try {
                    OpenForReadResult readResult = null;
                    outputStream = resourceApi.openOutputStream(targetUri);

                    file = resourceApi.mapUriToFile(targetUri);
                    context.targetFile = file;
                    
                    Log.d(LOG_TAG, "Download file:" + sourceUri);

                    FileProgressResult progress = new FileProgressResult();

                    if (isLocalTransfer) {
                        readResult = resourceApi.openForRead(sourceUri);
                        if (readResult.length != -1) {
                            progress.setLengthComputable(true);
                            progress.setTotal(readResult.length);
                        }
                        inputStream = new SimpleTrackingInputStream(readResult.inputStream);
                    } else {
                        // connect to server
                        // Open a HTTP connection to the URL based on protocol
                        connection = resourceApi.createHttpConnection(sourceUri);
                        if (useHttps && trustEveryone) {
                            // Setup the HTTPS connection class to trust everyone
                            HttpsURLConnection https = (HttpsURLConnection)connection;
                            oldSocketFactory = trustAllHosts(https);
                            // Save the current hostnameVerifier
                            oldHostnameVerifier = https.getHostnameVerifier();
                            // Setup the connection not to verify hostnames
                            https.setHostnameVerifier(DO_NOT_VERIFY);
                        }
        
                        connection.setRequestMethod("GET");
        
                        // TODO: Make OkHttp use this AmazonCookieManager by default.
                        String cookie = AmazonCookieManager.getInstance().getCookie(sourceUri.toString());
                        if(cookie != null)
                        {
                            connection.setRequestProperty("cookie", cookie);
                        }
                        
                        // This must be explicitly set for gzip progress tracking to work.
                        connection.setRequestProperty("Accept-Encoding", "gzip");
    
                        // Handle the other headers
                        if (headers != null) {
                            addHeadersToRequest(connection, headers);
                        }
        
                        connection.connect();
    
                        if (connection.getContentEncoding() == null || connection.getContentEncoding().equalsIgnoreCase("gzip")) {
                            // Only trust content-length header if we understand
                            // the encoding -- identity or gzip
                            if (connection.getContentLength() != -1) {
                                progress.setLengthComputable(true);
                                progress.setTotal(connection.getContentLength());
                            }
                        }
                        inputStream = getInputStream(connection);
                    }
                    
                    try {
                        synchronized (context) {
                            if (context.aborted) {
                                return;
                            }
                            context.currentInputStream = inputStream;
                        }
                        
                        // write bytes to file
                        byte[] buffer = new byte[MAX_BUFFER_SIZE];
                        int bytesRead = 0;
                        while ((bytesRead = inputStream.read(buffer)) > 0) {
                            outputStream.write(buffer, 0, bytesRead);
                            // Send a progress event.
                            progress.setLoaded(inputStream.getTotalRawBytesRead());
                            PluginResult progressResult = new PluginResult(PluginResult.Status.OK, progress.toJSONObject());
                            progressResult.setKeepCallback(true);
                            context.sendPluginResult(progressResult);
                        }
                    } finally {
                        context.currentInputStream = null;
                        safeClose(inputStream);
                        safeClose(outputStream);
                    }
    
                    Log.d(LOG_TAG, "Saved file: " + target);
    
                    // create FileEntry object
                    FileUtils filePlugin = (FileUtils)webView.pluginManager.getPlugin("File");
                    if (filePlugin != null) {
                        JSONObject fileEntry = filePlugin.getEntryForFile(file);
                        if (fileEntry != null) {
                            result = new PluginResult(PluginResult.Status.OK, fileEntry);
                        } else {
                            JSONObject error = createFileTransferError(CONNECTION_ERR, source, target, connection);
                            Log.e(LOG_TAG, "File plugin cannot represent download path");
                            result = new PluginResult(PluginResult.Status.IO_EXCEPTION, error);
                        }
                    } else {
                        Log.e(LOG_TAG, "File plugin not found; cannot save downloaded file");
                        result = new PluginResult(PluginResult.Status.ERROR, "File plugin not found; cannot save downloaded file");
                    }

                } catch (FileNotFoundException e) {
                    JSONObject error = createFileTransferError(FILE_NOT_FOUND_ERR, source, target, connection);
                    Log.e(LOG_TAG, error.toString(), e);
                    result = new PluginResult(PluginResult.Status.IO_EXCEPTION, error);
                } catch (IOException e) {
                    JSONObject error = createFileTransferError(CONNECTION_ERR, source, target, connection);
                    Log.e(LOG_TAG, error.toString(), e);
                    result = new PluginResult(PluginResult.Status.IO_EXCEPTION, error);
                } catch (JSONException e) {
                    Log.e(LOG_TAG, e.getMessage(), e);
                    result = new PluginResult(PluginResult.Status.JSON_EXCEPTION);
                } catch (Throwable e) {
                    JSONObject error = createFileTransferError(CONNECTION_ERR, source, target, connection);
                    Log.e(LOG_TAG, error.toString(), e);
                    result = new PluginResult(PluginResult.Status.IO_EXCEPTION, error);
                } finally {
                    safeClose(outputStream);
                    synchronized (activeRequests) {
                        activeRequests.remove(objectId);
                    }

                    if (connection != null) {
                        // Revert back to the proper verifier and socket factories
                        if (trustEveryone && useHttps) {
                            HttpsURLConnection https = (HttpsURLConnection) connection;
                            https.setHostnameVerifier(oldHostnameVerifier);
                            https.setSSLSocketFactory(oldSocketFactory);
                        }
                    }

                    if (result == null) {
                        result = new PluginResult(PluginResult.Status.ERROR, createFileTransferError(CONNECTION_ERR, source, target, connection));
                    }
                    // Remove incomplete download.
                    if (result.getStatus() != PluginResult.Status.OK.ordinal() && file != null) {
                        file.delete();
                    }
                    context.sendPluginResult(result);
                }
            }
        });
    }

    /**
     * Abort an ongoing upload or download.
     */
    private void abort(String objectId) {
        final RequestContext context;
        synchronized (activeRequests) {
            context = activeRequests.remove(objectId);
        }
        if (context != null) {
            File file = context.targetFile;
            if (file != null) {
                file.delete();
            }
            // Trigger the abort callback immediately to minimize latency between it and abort() being called.
            JSONObject error = createFileTransferError(ABORTED_ERR, context.source, context.target, null, -1);
            synchronized (context) {
                context.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, error));
                context.aborted = true;
            }
            // Closing the streams can block, so execute on a background thread.
            cordova.getThreadPool().execute(new Runnable() {
                public void run() {
                    synchronized (context) {
                        safeClose(context.currentInputStream);
                        safeClose(context.currentOutputStream);
                    }
                }
            });
        }
    }
}
