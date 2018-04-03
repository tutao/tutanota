package de.tutao.tutanota;

import android.Manifest;
import android.content.ContentResolver;
import android.database.Cursor;
import android.os.Build;
import android.provider.ContactsContract;

import org.jdeferred.DoneFilter;
import org.jdeferred.Promise;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import static android.provider.ContactsContract.*;
import static android.provider.ContactsContract.CommonDataKinds.*;

/**
 * Created by mpfau on 4/12/17.
 */

public class Contact {

    private final MainActivity activity;

    private static final String[] PROJECTION = {
            Contacts._ID,
            Contacts.DISPLAY_NAME_PRIMARY,
            Email.ADDRESS,
    };

    public Contact(MainActivity activity) {
        this.activity = activity;
    }

    private Promise<Void, Exception, Void> requestContactsPermission() {
        return activity.getPermission(Manifest.permission.READ_CONTACTS);
    }


    public Promise<JSONArray, Exception, Void> findSuggestions(String queryString) {
        final String query ="%" + queryString + "%";
        return requestContactsPermission().then(new DoneFilter<Void, JSONArray>() {
            @Override
            public JSONArray filterDone(Void nothing) {
                ContentResolver cr = activity.getApplicationContext().getContentResolver();
                String selection = Email.ADDRESS + " LIKE ? OR " + Contacts.DISPLAY_NAME_PRIMARY + " LIKE ?";
                Cursor cursor = cr.query(Email.CONTENT_URI, PROJECTION, selection, new String[]{query, query}, Contacts.DISPLAY_NAME_PRIMARY + " ASC ");
                JSONArray result = new JSONArray();
                try {
                    while (cursor.moveToNext()) {
                        JSONObject c = new JSONObject();
                        c.put("name", cursor.getString(1));
                        c.put("mailAddress", cursor.getString(2));
                        result.put(c);
                    }
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                } finally {
                    cursor.close();
                }

                return result;
            }
        });
    }
}
