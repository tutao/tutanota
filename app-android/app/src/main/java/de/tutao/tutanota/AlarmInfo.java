package de.tutao.tutanota;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.Objects;

public final class AlarmInfo {
    public final String trigger;
    public final String identifier;

    public static AlarmInfo fromJson(JSONObject jsonObject) throws JSONException {
        String trigger = jsonObject.getString("trigger");
        String identifier = jsonObject.getString("identifier");
        return new AlarmInfo(trigger, identifier);
    }

    public AlarmInfo(String trigger, String identifier) {
        this.trigger = trigger;
        this.identifier = Objects.requireNonNull(identifier);
    }

    public String getTriggerEnc() {
        return trigger;
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


