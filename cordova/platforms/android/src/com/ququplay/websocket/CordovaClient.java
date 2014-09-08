package com.ququplay.websocket;

import java.net.URI;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.Map;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.drafts.Draft;
import org.java_websocket.exceptions.InvalidFrameException;
import org.java_websocket.framing.FrameBuilder;
import org.java_websocket.framing.Framedata;
import org.java_websocket.framing.FramedataImpl1;
import org.java_websocket.handshake.ServerHandshake;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class CordovaClient extends WebSocketClient {

  private CallbackContext callbackContext;
  
  private FrameBuilder frameBuilder;
  
  private static final Map<READYSTATE, Integer> stateMap = new HashMap<READYSTATE, Integer>();
  static {
    stateMap.put(READYSTATE.CONNECTING, 0);
    stateMap.put(READYSTATE.OPEN, 1);
    stateMap.put(READYSTATE.CLOSING, 2);
    stateMap.put(READYSTATE.CLOSED, 3);
    stateMap.put(READYSTATE.NOT_YET_CONNECTED, 3);
  }

  public CordovaClient(URI serverURI, Draft draft, Map<String, String> headers, JSONObject options, CallbackContext callbackContext) {
    super(serverURI, draft, headers, 0);
    this.callbackContext = callbackContext;
    this.frameBuilder = new FramedataImpl1();
    
    if (serverURI.getScheme().equals("wss")) {
      final boolean allowSelfSignedCertificates = options.optBoolean("allowSelfSignedCertificates", false);
      final boolean allowExpiredCertificates = options.optBoolean("allowExpiredCertificates", false);
      try {
        SSLContext sslContext = SSLContext.getInstance("TLS");
        final TrustManager[] tm;
        if (allowSelfSignedCertificates || allowExpiredCertificates) {
          tm = new TrustManager[]{new InsecureX509TrustManager(null, allowSelfSignedCertificates, allowExpiredCertificates)};
        } else {
          tm = null;
        }
        sslContext.init(null, tm, null);
        SSLSocketFactory factory = sslContext.getSocketFactory();
        this.setSocket(factory.createSocket());
      } catch (Exception e) {
        throw new RuntimeException(e);
      }
    }  
  }

  @Override
  public void onOpen(ServerHandshake handshakedata) {
    sendResult("", "open", PluginResult.Status.OK);
  }

  @Override
  public void onMessage(String message) {
    sendResult(message, "message", PluginResult.Status.OK);
  }
  
  @Override
  public void onMessage(ByteBuffer bytes) {
  
	  JSONArray jsonArr = Utils.byteArrayToJSONArray(bytes.array());
      sendResult(jsonArr, "messageBinary", PluginResult.Status.OK);
  }

  @Override
  public void onFragment(Framedata frame) {
    try {
      this.frameBuilder.append(frame);
      
      if (frame.isFin()) {
        ByteBuffer bytes = this.frameBuilder.getPayloadData();

        if (this.frameBuilder.getOpcode() == Framedata.Opcode.BINARY) {
          this.onMessage(bytes);
        } 
        else {
          this.onMessage(new String(bytes.array(), "UTF-8"));
        }

        this.frameBuilder.getPayloadData().clear();
      }
    } 
    catch (Exception e) {} 
  }

  @Override
  public void onClose(int code, String reason, boolean remote) {
    sendResult("", "close", PluginResult.Status.OK);
  }

  @Override
  public void onError(Exception ex) {
    sendResult(ex.getMessage(), "error", PluginResult.Status.ERROR);
  }

  private void sendResult(Object message, String type, Status status) {
    JSONObject event = createEvent(message, type);
    PluginResult pluginResult = new PluginResult(status, event);
    pluginResult.setKeepCallback(true);
    this.callbackContext.sendPluginResult(pluginResult);
  }

  private JSONObject createEvent(Object data, String type) {
    JSONObject event;

    try {
      event = new JSONObject();
      event.put("type", type);
      event.put("data", data);
      event.put("readyState", stateMap.get(this.getReadyState()));
      return event;
    }
    catch (JSONException e) {
      e.printStackTrace();
    }

    return null;
  }

  @Override
  public String getResourceDescriptor() {
    return "*";
  }
}
