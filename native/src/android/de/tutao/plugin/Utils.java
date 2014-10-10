package de.tutao.plugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

import org.apache.commons.io.IOUtils;

import android.content.Context;
import android.net.Uri;
import android.util.Base64;

public class Utils {

	public static String bytesToBase64(byte[] bytes) {
		return Base64.encodeToString(bytes, Base64.NO_WRAP);
	}

	public static byte[] base64ToBytes(String base64) {
		return Base64.decode(base64, Base64.NO_WRAP);
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

	public static String getStack(Exception e) {
		StringWriter errors = new StringWriter();
		e.printStackTrace(new PrintWriter(errors));
		String stack = errors.toString();
		return stack;
	}

	public static String fileToUri(File file) {
		return file.toURI().toString();
	}

	public static File uriToFile(Context context, String uri) {
		File file = new File(uri);
		if (file.exists()) {
			return file;
		} else {
			// is used to convert content-Urls into files
			return com.ipaulpro.afilechooser.utils.FileUtils.getFile(context, Uri.parse(uri));
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
	
	public static void run(Runnable runnable) {
		// currently creating a new Thread because cordova.getThreadPool().execute is too slow (takes 3 times as long).
		new Thread(runnable).start();
	}

}
