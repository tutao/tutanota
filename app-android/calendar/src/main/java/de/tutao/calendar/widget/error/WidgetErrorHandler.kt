package de.tutao.calendar.widget.error

import android.content.Context
import android.content.Intent
import de.tutao.calendar.MainActivity
import de.tutao.tutashared.TempDir
import de.tutao.tutashared.getLogcat

class WidgetErrorHandler {
	companion object {
		private const val NEW_LINE = "\n";
		fun buildLogsIntent(context: Context, error: WidgetError?): Intent {
			val tempDir = TempDir(context)
			val logCat = getLogcat(tempDir.root, "widget-log")

			var fullLog = StringBuilder()

			if (error != null) {
				fullLog = fullLog.append(error.message)
					.append(NEW_LINE)
					.append(error.stackTrace)
					.append(NEW_LINE)
			}

			fullLog = fullLog
				.append("===== LOGCAT =====")
				.append(NEW_LINE)
				.append(logCat)

			val openCalendarLogs = Intent(context, MainActivity::class.java)
			openCalendarLogs.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
			openCalendarLogs.action = MainActivity.OPEN_LOGS_ACTION
			openCalendarLogs.putExtra(MainActivity.OPEN_LOGS_DATA_KEY, fullLog.toString())
			println(fullLog.toString())

			return openCalendarLogs
		}
	}
}