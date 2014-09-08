package com.ququplay.websocket;

import java.lang.reflect.Constructor;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.java_websocket.drafts.Draft;
import org.java_websocket.drafts.Draft_17;
import org.java_websocket.WebSocketImpl;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import android.webkit.CookieManager;

/**
 * WebSocket Cordova Plugin
 */
public class WebSocket extends CordovaPlugin {

  // actions
  private static final String ACTION_CONNECT = "connect";
  private static final String ACTION_SEND = "send";
  private static final String ACTION_CLOSE = "close";
  private URI uri;
  private Draft draft;
  private Map<String, String> headers;
  
  private static final Map<String, String> draftMap = new HashMap<String, String>();
  static {
    draftMap.put("draft10", "org.java_websocket.drafts.Draft_10");
    draftMap.put("draft17", "org.java_websocket.drafts.Draft_17");
    draftMap.put("draft75", "org.java_websocket.drafts.Draft_75");
    draftMap.put("draft76", "org.java_websocket.drafts.Draft_76");
  }
  private static final Map<String, CordovaClient> clients = new HashMap<String, CordovaClient>();

  @Override
  public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {
    final WebSocket plugin = this;

    if (ACTION_CONNECT.equals(action)) {
      final String socketId = args.getString(0);
      final String url = args.getString(1);
      final JSONObject options = args.getJSONObject(2);
      
      cordova.getThreadPool().execute(new Runnable() {
        public void run() {
          plugin.connect(socketId, url, callbackContext, options);
        }
      });
      return true;
    }
    else if (ACTION_SEND.equals(action)) {
      final String socketId = args.getString(0);
      final Object data = args.get(1);
      cordova.getThreadPool().execute(new Runnable() {
        public void run() {
          plugin.send(socketId, data);
        }
      });
      return true;
    }
    else if (ACTION_CLOSE.equals(action)) {
      final String socketId = args.getString(0);
      cordova.getThreadPool().execute(new Runnable() {
        public void run() {
          final CordovaClient client = clients.remove(socketId);
          if (client != null) {
            client.close();
          }
        }
      });
      return true;
    }

    return false;
  }

  private void connect(String socketId, String url, CallbackContext callbackContext, JSONObject options) {

    if (url != null && url.length() > 0) {
      try {
        this.uri = new URI(url);
        this.draft = this.getDraft(options, callbackContext);
        this.headers = this.getHeaders(options);
        this.setRcvBufSize(options);
        this.setCookie();
        
        final CordovaClient client = new CordovaClient(this.uri, this.draft, this.headers,
          options, callbackContext);
        PluginResult pluginResult = new PluginResult(PluginResult.Status.NO_RESULT);
        pluginResult.setKeepCallback(true);
        callbackContext.sendPluginResult(pluginResult);
        client.connect();
        
        final CordovaClient prev = clients.put(socketId, client);
        if (prev != null) {
          prev.close();
        }
      } catch (URISyntaxException e) {
        callbackContext.error("Not a valid URL");
      }
    } else {
      callbackContext.error("Not a valid URL");
    }
  }
  
  private Draft getDraft(JSONObject options, CallbackContext callbackContext) {

    String draftName;
    Draft draft = new Draft_17();
        
    try {
      draftName = options.getString("draft");
    } 
    catch (JSONException e1) {
      return draft;
    }
   
    if (draftName != null) {
      String draftClassName = draftMap.get(draftName);
      
      if (draftClassName != null) {
        try {
          Class<?> clazz = Class.forName(draftClassName);
          Constructor<?> ctor = clazz.getConstructor();
          draft = (Draft) ctor.newInstance();
        }
        catch (Exception e) {
          callbackContext.error("Draft not found.");
        }
      }
    }
    
    return draft;
  }

  private Map<String, String> getHeaders(JSONObject options) {    
    try {
      return Utils.jsonToMap(options.getJSONObject("headers"));
    } 
    catch (JSONException e) {
      return null;
    }
  }
  
  private void setRcvBufSize(JSONObject options) {    
    try {
      if (options.has("rcvBufSize")) {
        WebSocketImpl.RCVBUF = options.getInt("rcvBufSize");
      }
    } 
    catch (JSONException e) {}
  }
  
  private void setCookie() {    
    CookieManager cookieManager = CookieManager.getInstance();
    String cookie = cookieManager.getCookie(this.uri.getHost());
    
    if (cookie != null) {
      this.headers.put("cookie", cookie);
    }
  }

  private void send(String socketId, Object data) {
    try {
      final CordovaClient client = clients.get(socketId);

      if (data != null && client != null && 
        client.getConnection() != null && 
        client.getConnection().isOpen()) {

        if (data instanceof JSONArray && 
          ((JSONArray) data).length() > 0) {

          byte decoded[] = Utils
              .jsonArrayToByteArray((JSONArray) data);
          client.send(decoded);

        } 
        else if (data instanceof String && 
          ((String) data).length() > 0) {

          client.send((String) data);
        }
      }
    } 
    catch (JSONException e) {
      e.printStackTrace();
    }
  }
}