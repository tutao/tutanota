package de.tutao.tutanota;

import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.OpenableColumns;
import android.util.Base64;

import org.apache.commons.io.IOUtils;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;


public class Utils {

    public static String bytesToBase64(byte[] bytes) {
        return Base64.encodeToString(bytes, Base64.NO_WRAP);
    }

    public static byte[] base64ToBytes(String base64) {
        return Base64.decode(base64, Base64.NO_WRAP);
    }

    public static String base64ToBase64Url(String base64) {
        return base64.replaceAll("\\+", "-")
                .replaceAll("/", "_")
                .replaceAll("=", "");
    }


    public static byte[] readFile(File file) throws IOException {
        FileInputStream in = new FileInputStream(file);
        try {
            byte[] bytes = IOUtils.toByteArray(in);
            return bytes;
        } finally {
            in.close();
        }
    }

    public static void writeFile(File outputFile, byte[] bytes)
            throws FileNotFoundException, IOException {
        if (!outputFile.getParentFile().exists()) {
            outputFile.getParentFile().mkdirs();
        }
        if (!outputFile.exists()) {
            outputFile.createNewFile();
        }
        FileOutputStream out = new FileOutputStream(outputFile);
        try {
            IOUtils.write(bytes, out);
        } finally {
            out.close();
        }
    }

    public static String fileToUri(File file) {
        return Uri.fromFile(file).toString();
    }

    public static FileInfo getFileInfo(Context context, Uri fileUri) throws FileNotFoundException {
        String scheme = fileUri.getScheme();
        if (scheme == null || scheme.equals("file")) {
            return new FileInfo(fileUri.getLastPathSegment(), new File(fileUri.getPath()).length());
        } else if (scheme.equals("content")) {
            try (Cursor cursor = context.getContentResolver().query(fileUri, null, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    String filename = cursor.getString(cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME));
                    if (filename == null) {
                        // From Android docs:
                        // "If this is not provided then the name should default to the the last
                        // segment of the file's URI."
                        // It's not clear if it's responsibility of the provider or of us but it
                        // seems like some providers are not implemented correctly so we default
                        // by ourselves.
                        filename = fileUri.getLastPathSegment();
                    }
                    return new FileInfo(filename, cursor.getLong(cursor.getColumnIndex(OpenableColumns.SIZE)));
                }
            } catch (SecurityException e) {
                // When file is deleted SecurityException may be thrown instead.
                throw new FileNotFoundException(fileUri.toString());
            }
        }
        throw new RuntimeException("could not resolve file name / size for uri " + fileUri);
    }


    public static byte[] merge(byte[]... arrays) {
        int length = 0;
        for (int i = 0; i < arrays.length; i++) {
            length += arrays[i].length;
        }
        byte[] merged = new byte[length];
        int position = 0;
        for (int i = 0; i < arrays.length; i++) {
            byte[] array = arrays[i];
            System.arraycopy(array, 0, merged, position, array.length);
            position += array.length;
        }
        return merged;
    }


    public static File getDir(Context context) {
        return context.getFilesDir();
    }

    public static boolean atLeastOreo() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O;
    }

    public static boolean atLeastNougat() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.N;
    }

}

class FileInfo {
    String name;
    long size;

    public FileInfo(String name, long size) {
        this.name = name;
        this.size = size;
    }
}
