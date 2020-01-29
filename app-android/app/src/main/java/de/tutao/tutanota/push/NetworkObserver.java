package de.tutao.tutanota.push;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleObserver;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.OnLifecycleEvent;

public class NetworkObserver extends BroadcastReceiver implements LifecycleObserver {
	public static final String TAG = "NetworkObserver";

	private final ConnectivityManager connectivityManager;
	private final Context context;
	@Nullable
	private NetworkConnectivityListener networkConnectivityListener;

	NetworkObserver(Context context, LifecycleOwner lifecycleOwner) {
		connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
		this.context = context;
		context.registerReceiver(this, new IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION));

		lifecycleOwner.getLifecycle().addObserver(this);
	}

	@Override
	public void onReceive(Context context, Intent intent) {
		boolean hasConnection = hasNetworkConnection();
		if (!hasConnection) {
			Log.d(TAG, "Network is DOWN");
		} else {
			Log.d(TAG, "Network is UP");
		}
		if (networkConnectivityListener != null) {
			networkConnectivityListener.onNetworkConnectivityChange(hasConnection);
		}
	}

	public boolean hasNetworkConnection() {
		NetworkInfo networkInfo = connectivityManager.getActiveNetworkInfo();
		return networkInfo != null && networkInfo.isConnectedOrConnecting();
	}

	public void setNetworkConnectivityListener(@Nullable NetworkConnectivityListener networkConnectivityListener) {
		this.networkConnectivityListener = networkConnectivityListener;
	}

	interface NetworkConnectivityListener {
		void onNetworkConnectivityChange(boolean connected);
	}

	@OnLifecycleEvent(Lifecycle.Event.ON_DESTROY)
	void onDestroy() {
		context.unregisterReceiver(this);
	}
}
