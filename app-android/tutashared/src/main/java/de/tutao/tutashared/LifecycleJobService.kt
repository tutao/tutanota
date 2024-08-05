@file:Suppress("OverrideDeprecatedMigration")

package de.tutao.tutashared

import android.app.job.JobService
import android.content.Intent
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry

abstract class LifecycleJobService : JobService(), LifecycleOwner {
	private val lifecycleRegistry = LifecycleRegistry(this)
	override fun onCreate() {
		lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE)
		super.onCreate()
	}

	override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
		lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_START)
		return super.onStartCommand(intent, flags, startId)
	}

	override fun onDestroy() {
		lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_STOP)
		lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_DESTROY)
		super.onDestroy()
	}

	override val lifecycle: Lifecycle
		get() = lifecycleRegistry
}