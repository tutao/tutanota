package de.tutao.tutanota;

import android.support.annotation.Nullable;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.TimeZone;

final class RepeatRule {
    final RepeatPeriod frequency;
    final int interval;
    final TimeZone timeZone;

    // TODO: serialize them
    @Nullable
    EndType endType;
    long endValue;

    static RepeatRule fromJson(JSONObject jsonObject) throws JSONException {
        RepeatPeriod repeatPeriod = RepeatPeriod.values()[jsonObject.getInt("frequency")];
        int interval = jsonObject.getInt("interval");
        TimeZone timeZone = TimeZone.getTimeZone(jsonObject.getString("timeZone"));
        return new RepeatRule(repeatPeriod, interval, timeZone);
    }

    RepeatRule(RepeatPeriod frequency, int interval, TimeZone timeZone) {
        this.frequency = frequency;
        this.interval = interval;
        this.timeZone = timeZone;
    }

    JSONObject toJson() {
        try {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("frequency", this.frequency.ordinal());
            jsonObject.put("interval", this.interval);
            jsonObject.put("timeZone", this.timeZone.getID());
            return jsonObject;
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }
}

enum RepeatPeriod {
    DAILY, WEEKLY, MONTHLY, ANNUALLY;
}

enum EndType {
    NEVER, UNTIL, COUNT
}
