package de.tutao.tutanota;

import android.content.Context;
import android.net.Uri;

import org.apache.commons.io.IOUtils;

import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;

final public class LogReader {
	static Uri getLogFile(Context context) {
		try {
			File logFile = new File(new File(Utils.getDir(context), "temp"), "log.txt");
			logFile.delete();
			logFile.createNewFile();
			String strPID = "--pid=" + android.os.Process.myPid();
			Process process = Runtime.getRuntime().exec(new String[]{"logcat", "-d", "-T", "500", /*strPID, */"-f", logFile.getAbsolutePath()});
			try {
				process.waitFor();
			} catch (InterruptedException ignored) {
			}
			if (process.exitValue() != 0) {
				String error = IOUtils.toString(process.getErrorStream(), Charset.defaultCharset());
				throw new RuntimeException("Reading logs failed: " + process.exitValue() + ", " + error);
			}
			return Uri.fromFile(logFile);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}
}
