package de.tutao.calendar.push

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.util.Log
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner

class NetworkObserver internal constructor(private val context: Context, lifecycleOwner: LifecycleOwner) :
		BroadcastReceiver(), DefaultLifecycleObserver {
	private val connectivityManager: ConnectivityManager =
			context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
	private var networkConnectivityListener: NetworkConnectivityListener? = null

	init {
		context.registerReceiver(this, IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION))
		lifecycleOwner.lifecycle.addObserver(this)
	}

	override fun onReceive(context: Context, intent: Intent) {
		val hasConnection = hasNetworkConnection()
		if (!hasConnection) {
			Log.d(TAG, "Network is DOWN")
		} else {
			Log.d(TAG, "Network is UP")
		}
		if (networkConnectivityListener != null) {
			networkConnectivityListener!!.onNetworkConnectivityChange(hasConnection)
		}
	}

	fun hasNetworkConnection(): Boolean {
		val networkInfo = connectivityManager.activeNetworkInfo
		return networkInfo != null && networkInfo.isConnectedOrConnecting
	}

	fun setNetworkConnectivityListener(networkConnectivityListener: NetworkConnectivityListener) {
		this.networkConnectivityListener = networkConnectivityListener
	}

	fun interface NetworkConnectivityListener {
		fun onNetworkConnectivityChange(connected: Boolean)
	}

	override fun onDestroy(owner: LifecycleOwner) {
		context.unregisterReceiver(this)
	}

	companion object {
		const val TAG = "NetworkObserver"
	}

}