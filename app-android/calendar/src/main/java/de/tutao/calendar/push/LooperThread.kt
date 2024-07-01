package de.tutao.calendar.push

import android.os.Handler
import android.os.Looper
import android.util.Log

internal class LooperThread(private val initRunnable: Runnable) : Thread() {
	val handler: Handler
		get() = _handler ?: error("LooperThread has not been started yet!")

	@Volatile
	var _handler: Handler? = null
		private set

	override fun run() {
		Log.d("LooperThread", "LooperThread is started")
		Looper.prepare()
		_handler = Handler(Looper.myLooper()!!)
		_handler!!.post(initRunnable)
		Looper.loop()
	}
}