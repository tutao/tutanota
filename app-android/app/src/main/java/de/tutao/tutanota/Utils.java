package de.tutao.tutanota;

import android.content.Context;
import android.net.Uri;
import android.util.Base64;

import com.ipaulpro.afilechooser.utils.FileUtils;

import org.apache.commons.io.IOUtils;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

public class Utils {

	public static String bytesToBase64(byte[] bytes) {
		return Base64.encodeToString(bytes, Base64.NO_WRAP);
	}

	public static byte[] base64ToBytes(String base64) {
		return Base64.decode(base64, Base64.NO_WRAP);
	}

	public static String  base64ToBase64Url(String base64) {
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

	public static File uriToFile(Context context, String uri) {
		File file = new File(uri);
		if (file.exists()) {
			return file;
		} else {
			// is used to convert content-Urls into files
			return FileUtils.getFile(context, Uri.parse(uri));
		}
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

}
