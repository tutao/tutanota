package de.tutao.tutanota;

import android.app.job.JobService;
import android.content.Intent;

import androidx.annotation.NonNull;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.LifecycleRegistry;

public abstract class LifecycleJobService extends JobService implements LifecycleOwner {

	private final LifecycleRegistry lifecycleRegistry = new LifecycleRegistry(this);

	@Override
	public void onCreate() {
		lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE);
		super.onCreate();
	}

	@SuppressWarnings("deprecation")
	@Override
	public void onStart(Intent intent, int startId) {
		lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_START);
		super.onStart(intent, startId);
	}

	@Override
	public void onDestroy() {
		lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_STOP);
		lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_DESTROY);
		super.onDestroy();
	}

	@NonNull
	@Override
	public Lifecycle getLifecycle() {
		return lifecycleRegistry;
	}
}
