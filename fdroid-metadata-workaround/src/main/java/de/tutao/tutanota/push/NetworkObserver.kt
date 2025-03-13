package de.tutao.tutanota.push

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.ConnectivityManager.NetworkCallback
import android.net.Network
import android.util.Log
import androidx.core.content.getSystemService
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.launch

class NetworkObserver internal constructor(private val context: Context, lifecycleOwner: LifecycleOwner) :
	BroadcastReceiver(), DefaultLifecycleObserver {
	private val connectivityManager: ConnectivityManager = context.getSystemService<ConnectivityManager>()!!
	private var networkConnectivityListener: NetworkConnectivityListener? = null
	private val networkObserverCallback = object : NetworkCallback() {
		override fun onAvailable(network: Network) {
			networkConnectivityListener?.onNetworkConnectivityChange(true)
		}

		override fun onLost(network: Network) {
			networkConnectivityListener?.onNetworkConnectivityChange(false)
		}
	}

	init {
		lifecycleOwner.lifecycleScope.launch {
			lifecycleOwner.lifecycle.repeatOnLifecycle(Lifecycle.State.CREATED) {
				connectivityManager.registerDefaultNetworkCallback(networkObserverCallback)
			}
		}
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
		return connectivityManager.activeNetwork != null
	}

	fun setNetworkConnectivityListener(networkConnectivityListener: NetworkConnectivityListener) {
		this.networkConnectivityListener = networkConnectivityListener
	}

	fun interface NetworkConnectivityListener {
		fun onNetworkConnectivityChange(connected: Boolean)
	}

	override fun onDestroy(owner: LifecycleOwner) {
		connectivityManager.unregisterNetworkCallback(this.networkObserverCallback)
	}

	companion object {
		const val TAG = "NetworkObserver"
	}

}