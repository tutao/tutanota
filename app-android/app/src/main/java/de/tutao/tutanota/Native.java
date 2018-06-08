package de.tutao.tutanota;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.support.annotation.Nullable;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;

import org.jdeferred.Deferred;
import org.jdeferred.DoneCallback;
import org.jdeferred.FailCallback;
import org.jdeferred.Promise;
import org.jdeferred.impl.DeferredObject;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by mpfau on 4/8/17.
 */
public final class Native {
    private static final String JS_NAME = "nativeApp";
    private final static String TAG = "Native";

    static int requestId = 0;
    Crypto crypto;
    FileUtil files;
    Contact contact;
    Map<String, DeferredObject<JSONObject, Exception, ?>> queue = new HashMap<>();
    private final MainActivity activity;
    private DeferredObject<Void, Void, Void> webAppInitialized = new DeferredObject<>();


    Native(MainActivity activity) {
        this.activity = activity;
        crypto = new Crypto(activity);
        contact = new Contact(activity);
        files = new FileUtil(activity);
    }

    public void setup() {
        activity.getWebView().addJavascriptInterface(this, JS_NAME);
    }

    /**
     * Invokes method with args. The returned response is a JSON of the following format:
     *
     * @param msg A request (see WorkerProtocol)
     * @return A promise that resolves to a response or requestError (see WorkerProtocol)
     * @throws JSONException
     */
    @JavascriptInterface
    public void invoke(final String msg) throws JSONException {
        new Thread(new Runnable() {
            public void run() {
                try {
                    final JSONObject request = new JSONObject(msg);
                    if (request.get("type").equals("response")) {
                        DeferredObject promise = queue.remove(request.get("id"));
                        promise.resolve(request);
                    } else {
                        invokeMethod(request.getString("type"), request.getJSONArray("args"))
                                .then(new DoneCallback() {
                                    @Override
                                    public void onDone(Object result) {
                                        sendResponse(request, result);
                                    }
                                })
                                .fail(new FailCallback<Exception>() {
                                    @Override
                                    public void onFail(Exception e) {
                                        sendErrorResponse(request, e);
                                    }
                                });
                    }
                } catch (JSONException e) {
                    Log.e("Native", "could not parse msg:" + msg, e);
                }
            }
        }).start();
    }

    public Promise<JSONObject, Exception, ?> sendRequest(JsRequest type, Object[] args) {
        JSONObject request = new JSONObject();
        String requestId = _createRequestId();
        try {
            JSONArray arguments = new JSONArray();
            for (Object arg : args) {
                arguments.put(arg);
            }
            request.put("id", requestId);
            request.put("type", type.toString());
            request.put("args", arguments);
            this.postMessage(request.toString());
            DeferredObject d = new DeferredObject();
            this.queue.put(requestId, d);
            return d.promise();
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    static String _createRequestId() {
        return "app" + requestId++;
    }

    private void sendResponse(JSONObject request, Object value) {
        JSONObject response = new JSONObject();
        try {
            response.put("id", request.getString("id"));
            response.put("type", "response");
            response.put("value", value);
            postMessage(response.toString());
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    private void sendErrorResponse(JSONObject request, Exception ex) {
        JSONObject response = new JSONObject();
        try {
            response.put("id", request.getString("id"));
            response.put("type", "requestError");
            response.put("error", errorToObject(ex));
            postMessage(response.toString());
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    private void postMessage(final String msg) {
        evaluateJs("tutao.nativeApp.handleMessageFromNative('" + escape(msg) + "')");
    }

    private void evaluateJs(final String js) {
        activity.getWebView().post(new Runnable() {
            @Override
            public void run() {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    activity.getWebView().evaluateJavascript(js, new ValueCallback<String>() {
                        @Override
                        public void onReceiveValue(String value) {
                            // no response expected
                        }
                    });
                } else {
                    activity.getWebView().loadUrl("javascript:" + js);
                }
            }
        });
    }

    private Promise invokeMethod(String method, JSONArray args) {
        Deferred promise = new DeferredObject<>();
        try {
            switch (method) {
                case "init":
                    if (!webAppInitialized.isResolved()) {
                        webAppInitialized.resolve(null);
                    }
                    promise.resolve("android");
                    break;
                case "prepareLogout":
                    webAppInitialized = new DeferredObject<>();
                    break;
                case "initPushNotifications":
                    return initPushNotifications();
                case "generateRsaKey":
                    promise.resolve(crypto.generateRsaKey(Utils.base64ToBytes(args.getString(0))));
                    break;
                case "rsaEncrypt":
                    promise.resolve(crypto.rsaEncrypt(args.getJSONObject(0), Utils.base64ToBytes(args.getString(1)), Utils.base64ToBytes(args.getString(2))));
                    break;
                case "rsaDecrypt":
                    promise.resolve(crypto.rsaDecrypt(args.getJSONObject(0), Utils.base64ToBytes(args.getString(1))));
                    break;
                case "aesEncryptFile":
                    promise.resolve(crypto.aesEncryptFile(Utils.base64ToBytes(args.getString(0)), args.getString(1), Utils.base64ToBytes(args.getString(2))));
                    break;
                case "aesDecryptFile":
                    promise.resolve(crypto.aesDecryptFile(Utils.base64ToBytes(args.getString(0)), args.getString(1)));
                    break;
                case "open":
                    return files.openFile(args.getString(0), args.getString(1));
                case "openFileChooser":
                    return files.openFileChooser();
                case "deleteFile":
                    files.delete(args.getString(0));
                    promise.resolve(null);
                    break;
                case "getName":
                    promise.resolve(files.getName(args.getString(0)));
                    break;
                case "getMimeType":
                    promise.resolve(files.getMimeType(args.getString(0)));
                    break;
                case "getSize":
                    promise.resolve(files.getSize(args.getString(0)));
                    break;
                case "upload":
                    promise.resolve(files.upload(args.getString(0), args.getString(1), args.getJSONObject(2)));
                    break;
                case "download":
                    promise.resolve(files.download(args.getString(0), args.getString(1), args.getJSONObject(2)));
                    break;
                case "clearFileData":
                    files.clearFileData();
                    promise.resolve(null);
                    break;
                case "findSuggestions":
                    return contact.findSuggestions(args.getString(0));
                case "openLink":
                    promise.resolve(openLink(args.getString(0)));
                    break;
                default:
                    throw new Exception("unsupported method: " + method);
            }
        } catch (Exception e) {
            Log.e(TAG, "failed invocation", e);
            promise.reject(e);
        }
        return promise.promise();
    }

    private boolean openLink(@Nullable String uri) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(uri));
        PackageManager pm = activity.getPackageManager();
        boolean resolved = intent.resolveActivity(pm) != null;
        if (resolved) {
            activity.startActivity(intent);
        }
        return resolved;
    }

    private Promise<JSONObject, Exception, ?> initPushNotifications() {
        activity.setupPushNotifications();
        return new DeferredObject().resolve(null);
    }

    private static JSONObject errorToObject(Exception e) throws JSONException {
        JSONObject error = new JSONObject();
        String errorType = e.getClass().getName();
        error.put("name", errorType);
        error.put("message", e.getMessage());
        error.put("stack", getStack(e));
        return error;
    }

    private static String getStack(Exception e) {
        StringWriter errors = new StringWriter();
        e.printStackTrace(new PrintWriter(errors));
        String stack = errors.toString();
        return stack;
    }

    private static String escape(String s) {
        return s.replace("\"", "\\\"");
    }

    public DeferredObject getWebAppInitialized() {
        return webAppInitialized;
    }

}


