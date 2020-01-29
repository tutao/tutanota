package de.tutao.tutanota.alarms;

import androidx.annotation.NonNull;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.Objects;

import de.tutao.tutanota.Crypto;
import de.tutao.tutanota.CryptoError;

public final class AlarmInfo {
    @NonNull
    private final String trigger;
    @NonNull
    private final String identifier;

    public static AlarmInfo fromJson(JSONObject jsonObject) throws JSONException {
        String trigger = jsonObject.getString("trigger");
        String alarmIdentifier = jsonObject.getString("alarmIdentifier");
        return new AlarmInfo(trigger, alarmIdentifier);
    }

    public AlarmInfo(String trigger, String identifier) {
        this.trigger = trigger;
        this.identifier = Objects.requireNonNull(identifier);
    }

    public String getTriggerDec(Crypto crypto, byte[] sessionKey) throws CryptoError {
        return new String(crypto.aesDecrypt(sessionKey, this.trigger), StandardCharsets.UTF_8);
    }

    public String getTrigger() {
        return trigger;
    }

    public String getIdentifier() {
        return identifier;
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


