package de.tutao.tutanota.push

import android.os.Handler
import android.os.Looper
import android.util.Log

internal class LooperThread(private val initRunnable: Runnable) : Thread() {
	@Volatile
	var handler: Handler? = null
		private set

	override fun run() {
		Log.d("LooperThread", "LooperThread is started")
		Looper.prepare()
		handler = Handler(Looper.myLooper()!!)
		handler!!.post(initRunnable)
		Looper.loop()
	}
}