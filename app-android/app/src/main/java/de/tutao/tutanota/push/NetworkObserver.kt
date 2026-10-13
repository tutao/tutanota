package de.tutao.tutanota.push

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.ConnectivityManager.NetworkCallback
import android.net.Network
import android.net.NetworkCapabilities
import android.os.Build
import android.util.Log
import androidx.core.content.getSystemService
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.launch

class NetworkObserver internal constructor(
	context: Context,
	lifecycleOwner: LifecycleOwner,
	private val pushNotificationJobState: PushNotificationService.PushNotificationJobState
) : BroadcastReceiver(), DefaultLifecycleObserver {
	private val connectivityManager: ConnectivityManager = context.getSystemService<ConnectivityManager>()!!
	private var networkConnectivityListener: NetworkConnectivityListener? = null
	private val networkObserverCallback = object : NetworkCallback() {
		override fun onAvailable(network: Network) {
			Log.d(TAG, "onAvailable")
			networkConnectivityListener?.onNetworkConnectivityChange(true, pushNotificationJobState.active)
		}

		override fun onLost(network: Network) {
			Log.d(TAG, "onLost")
			networkConnectivityListener?.onNetworkConnectivityChange(false, pushNotificationJobState.active)
		}

		override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
			// only try and re-connect when not already connected
			if (!pushNotificationJobState.active) {
				val networkConnected = hasNetworkConnection(networkCapabilities)
				Log.d(TAG, "Seeing if notifications should reconnect, networkConnected=$networkConnected")
				networkConnectivityListener?.onNetworkConnectivityChange(networkConnected, pushNotificationJobState.active)
			}
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
		networkConnectivityListener?.onNetworkConnectivityChange(hasConnection, pushNotificationJobState.active)
	}

	fun hasNetworkConnection(): Boolean {
		val capabilities = connectivityManager.getNetworkCapabilities(connectivityManager.activeNetwork)
		return connectivityManager.activeNetwork != null && capabilities != null && hasNetworkConnection(capabilities)
	}

	private fun hasNetworkConnection(capabilities: NetworkCapabilities): Boolean {
		// NetworkCapabilities.NET_CAPABILITY_INTERNET is present for Wi-Fi without internet access, that's why we need to check both
		return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
				&& capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
				&& if(Build.VERSION.SDK_INT < Build.VERSION_CODES.P) true else capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_SUSPENDED)
	}

	fun setNetworkConnectivityListener(networkConnectivityListener: NetworkConnectivityListener) {
		this.networkConnectivityListener = networkConnectivityListener
	}

	fun interface NetworkConnectivityListener {
		fun onNetworkConnectivityChange(connected: Boolean, hasActiveJob: Boolean)
	}

	override fun onDestroy(owner: LifecycleOwner) {
		connectivityManager.unregisterNetworkCallback(this.networkObserverCallback)
	}

	companion object {
		const val TAG = "NetworkObserver"
	}

}