package de.tutao.tutashared

import android.content.Context
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.MobilePaymentResult
import de.tutao.tutashared.ipc.MobilePaymentSubscriptionOwnership
import de.tutao.tutashared.ipc.MobilePaymentsFacade
import de.tutao.tutashared.ipc.MobilePlanPrice

class AndroidMobilePaymentsFacade(private val ctx: Context) : MobilePaymentsFacade {

	override suspend fun requestSubscriptionToPlan(
		plan: String,
		interval: Long,
		customerIdBytes: DataWrapper
	): MobilePaymentResult {
		TODO("Not yet implemented")
	}

	override suspend fun getPlanPrices(): List<MobilePlanPrice> {
		TODO("Not yet implemented")
	}

	override suspend fun showSubscriptionConfigView() {
		TODO("Not yet implemented")
	}

	override suspend fun queryExternalSubscriptionOwnership(customerIdBytes: DataWrapper?): MobilePaymentSubscriptionOwnership {
		TODO("Not yet implemented")
	}

	override suspend fun isExternalSubscriptionRenewalEnabled(): Boolean {
		TODO("Not yet implemented")
	}

}
