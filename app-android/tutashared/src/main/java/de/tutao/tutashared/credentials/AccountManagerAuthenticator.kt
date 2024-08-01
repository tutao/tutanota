package de.tutao.tutashared.credentials

import android.accounts.*
import android.content.Context
import android.os.Bundle

class AccountManagerAuthenticator(context: Context) : AbstractAccountAuthenticator(context) {
	private val context: Context

	init {
		this.context = context
	}

	override fun addAccount(response: AccountAuthenticatorResponse,
							accountType: String,
							authTokenType: String,
							requiredFeatures: Array<String>,
							options: Bundle): Bundle? {
		return null
	}

	override fun confirmCredentials(response: AccountAuthenticatorResponse, account: Account, options: Bundle): Bundle? {
		return null
	}

	override fun editProperties(response: AccountAuthenticatorResponse, accountType: String): Bundle? {
		return null
	}

	override fun getAuthToken(response: AccountAuthenticatorResponse, account: Account, authTokenType: String, options: Bundle): Bundle? {
		return null
	}

	override fun getAuthTokenLabel(authTokenType: String): String? {
		return null
	}

	override fun hasFeatures(response: AccountAuthenticatorResponse, account: Account, features: Array<String>): Bundle? {
		return null
	}

	override fun updateCredentials(response: AccountAuthenticatorResponse, account: Account, authTokenType: String, options: Bundle): Bundle? {
		return null
	}
}