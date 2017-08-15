package de.tutao.tutanota;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.ShareCompat;
import android.util.Log;

import java.util.Arrays;

import static de.tutao.tutanota.MainActivity.activity;

public class ShareActivity extends Activity {
    static ShareActivity shareActivity;
    private Intent intent;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        this.intent = getIntent();

        if (activity == null) {
            shareActivity = this;
            startActivity(new Intent(getApplicationContext(), MainActivity.class));
        } else {
            activity.bringToForeground();
            share();
        }
        this.finish();
    }

    private static Intent bringToFront(MainActivity activity, Class<?> cls) {
        Intent intent = new Intent(activity.getBaseContext(), cls);
        intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        return intent;
    }

    /**
     * The sharing activity. Either invoked from MainActivity (if the app was not active when the
     * share occured) or from onCreate.
     */
    void share() {
        shareActivity = null;
        String action = intent.getAction();
        // see https://medium.com/google-developers/sharing-content-between-android-apps-2e6db9d1368b
        ShareCompat.IntentReader share = ShareCompat.IntentReader.from(this);
        Log.e("T", share.getType());
        Log.e("Subject", share.getSubject() != null ? share.getSubject() : "-");
        Log.e("To", share.getEmailTo() != null ? Arrays.toString(share.getEmailTo()) : "-");
        for (int i = 0; i < share.getStreamCount(); i++) {
            Log.e("URI", share.getStream(i).toString());
        }
        if (share.getText() != null) {
            Log.e("TEXT", share.getText().toString());
        }
        if (share.getHtmlText() != null) {
            Log.e("HTML", share.getHtmlText().toString());
        }
    }
}
