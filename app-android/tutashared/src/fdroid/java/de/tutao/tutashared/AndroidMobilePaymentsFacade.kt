package de.tutao.tutashared

import android.app.Activity
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.MobilePaymentResult
import de.tutao.tutashared.ipc.MobilePaymentSubscriptionOwnership
import de.tutao.tutashared.ipc.MobilePaymentsFacade
import de.tutao.tutashared.ipc.MobilePlanPrice

/**
 * this implementation is used in the f-droid app since we're handling payments through the web app there.
 * Its only purpose is to say "go away" through the hasPlaystorePayment function.
 */
class AndroidMobilePaymentsFacade(_activity: Activity, _app: AppType) : MobilePaymentsFacade {

	fun hasPlaystorePayment(): Boolean {
		return false;
	}

	override suspend fun requestSubscriptionToPlan(
		plan: String,
		interval: Long,
		customerIdBytes: DataWrapper,
		currentInterval: Long?,
	): MobilePaymentResult {
		throw NotImplementedError("there is no requestSubscriptionToPlan for non-playstore apps")
	}

	override suspend fun getPlanPrices(): List<MobilePlanPrice> {
		throw NotImplementedError("there is no getPlanPrices for non-playstore apps")
	}

	override suspend fun showSubscriptionConfigView() {

		throw NotImplementedError("there is no showSubscriptionConfigView for non-playstore apps")
	}

	override suspend fun queryExternalSubscriptionOwnership(customerIdBytes: DataWrapper?): MobilePaymentSubscriptionOwnership {

		throw NotImplementedError("there is no queryExternalSubscriptionOwnership for non-playstore apps")
	}

	override suspend fun isExternalSubscriptionRenewalEnabled(): Boolean {
		throw NotImplementedError("there is no isExternalSubscriptionRenewalEnabled for non-playstore apps")
	}
}
