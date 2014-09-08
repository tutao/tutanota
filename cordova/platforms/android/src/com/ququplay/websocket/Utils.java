package com.ququplay.websocket;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class Utils {
  public static Map<String, String> jsonToMap(JSONObject data) throws JSONException {

    @SuppressWarnings("unchecked")
    Iterator<String> keys = data.keys();
    Map<String, String> result = new HashMap<String, String>();

    while (keys.hasNext()) {
      String key = keys.next();
      result.put(key, data.getString(key));
    }

    return result;
  }
   
  public static byte[] jsonArrayToByteArray(JSONArray data)
      throws JSONException {

    byte result[] = new byte[data.length()];
    
    for (int i = 0; i < data.length(); i++) {
      result[i] = (byte) data.getInt(i);
    }

    return result;
  }

  public static JSONArray byteArrayToJSONArray(byte data[]) {
    JSONArray result = new JSONArray();

    for (int i = 0; i < data.length; i++) {
      result.put((int) data[i]);
    }

    return result;
  }
}