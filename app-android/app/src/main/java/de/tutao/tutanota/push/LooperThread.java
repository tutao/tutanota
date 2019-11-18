package de.tutao.tutanota.push;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

final class LooperThread extends Thread {

	private volatile Handler handler;
	private Runnable initRunnable;

	LooperThread(Runnable initRunnable) {
		this.initRunnable = initRunnable;
	}

	@Override
	public void run() {
		Log.d("LooperThread", "LooperThread is started");
		Looper.prepare();
		handler = new Handler();
		handler.post(initRunnable);
		Looper.loop();
	}

	public Handler getHandler() {
		return handler;
	}
}
