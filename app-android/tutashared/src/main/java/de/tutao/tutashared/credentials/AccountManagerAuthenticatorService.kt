package de.tutao.tutashared.credentials

import android.app.Service
import android.content.Intent

import android.os.IBinder


class AccountManagerAuthenticatorService : Service() {
	private var authenticator: AccountManagerAuthenticator? = null

	override fun onCreate() {
		super.onCreate()
		synchronized(lock) {
			if (authenticator == null) {
				authenticator = AccountManagerAuthenticator(this)
			}
		}
	}

	override fun onBind(intent: Intent?): IBinder {
		return authenticator!!.iBinder
	}

	companion object {
		private val lock = Any()
	}
}