/* generated file, don't edit. */


@file:Suppress("NAME_SHADOWING")
package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class MobilePaymentsFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: MobilePaymentsFacade,
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"requestSubscriptionToPlan" -> {
				val plan: String = json.decodeFromString(arg[0])
				val interval: Long = json.decodeFromString(arg[1])
				val customerIdBytes: DataWrapper = json.decodeFromString(arg[2])
				val result: MobilePaymentResult = this.facade.requestSubscriptionToPlan(
					plan,
					interval,
					customerIdBytes,
				)
				return json.encodeToString(result)
			}
			"getPlanPrices" -> {
				val result: List<MobilePlanPrice> = this.facade.getPlanPrices(
				)
				return json.encodeToString(result)
			}
			"showSubscriptionConfigView" -> {
				val result: Unit = this.facade.showSubscriptionConfigView(
				)
				return json.encodeToString(result)
			}
			"queryExternalSubscriptionOwnership" -> {
				val customerIdBytes: DataWrapper? = json.decodeFromString(arg[0])
				val result: MobilePaymentSubscriptionOwnership = this.facade.queryExternalSubscriptionOwnership(
					customerIdBytes,
				)
				return json.encodeToString(result)
			}
			"isExternalSubscriptionRenewalEnabled" -> {
				val result: Boolean = this.facade.isExternalSubscriptionRenewalEnabled(
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for MobilePaymentsFacade: $method")
		}
	}
}
