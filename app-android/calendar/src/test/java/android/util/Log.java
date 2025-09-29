package android.util;

/**
 * Mock of the native Android Log class
 */
public class Log {
	public static int d(String tag, String msg) {
		System.out.println("DEBUG: " + tag + ": " + msg);
		return 0;
	}

	public static int i(String tag, String msg) {
		System.out.println("INFO: " + tag + ": " + msg);
		return 0;
	}

	public static int w(String tag, String msg) {
		System.out.println("WARN: " + tag + ": " + msg);
		return 0;
	}

	public static int e(String tag, String msg) {
		System.out.println("ERROR: " + tag + ": " + msg);
		return 0;
	}

	public static int d(String tag, String msg, Throwable e) {
		System.out.println("DEBUG: " + tag + ": " + msg + " " + e.toString());
		return 0;
	}

	public static int i(String tag, String msg, Throwable e) {
		System.out.println("INFO: " + tag + ": " + msg + " " + e.toString());
		return 0;
	}

	public static int w(String tag, String msg, Throwable e) {
		System.out.println("WARN: " + tag + ": " + msg + " " + e.toString());
		return 0;
	}

	public static int e(String tag, String msg, Throwable e) {
		System.out.println("ERROR: " + tag + ": " + msg + " " + e.toString());
		return 0;
	}
}