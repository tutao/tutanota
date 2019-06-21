package de.tutao.tutanota.alarms;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.Objects;

import de.tutao.tutanota.Crypto;
import de.tutao.tutanota.CryptoError;

public final class AlarmInfo {
    private final String trigger;
    private final String identifier;

    private final JSONObject originalJson;

    public static AlarmInfo fromJson(JSONObject jsonObject) throws JSONException {
        String trigger = jsonObject.getString("trigger");
        String alarmIdentifier = jsonObject.getString("alarmIdentifier");
        return new AlarmInfo(trigger, alarmIdentifier, jsonObject);
    }

    public AlarmInfo(String trigger, String identifier, JSONObject originalJson) {
        this.trigger = trigger;
        this.identifier = Objects.requireNonNull(identifier);
        this.originalJson = originalJson;
    }

    public String getTrigger(Crypto crypto, byte[] sessionKey) throws CryptoError {
        return new String(crypto.aesDecrypt(sessionKey, this.trigger), StandardCharsets.UTF_8);
    }

    public String getIdentifier() {
        return identifier;
    }

    public JSONObject toJSON() {
        try {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("trigger", trigger);
            jsonObject.put("identifier", identifier);
            return jsonObject;
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AlarmInfo alarmInfo = (AlarmInfo) o;
        return identifier.equals(alarmInfo.identifier);
    }

    @Override
    public int hashCode() {
        return Objects.hash(identifier);
    }
}


