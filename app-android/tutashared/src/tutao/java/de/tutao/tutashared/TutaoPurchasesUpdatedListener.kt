package de.tutao.tutashared

import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener

class TutaoPurchasesUpdatedListener(
	private val handleUpdate: (
			billingResult: BillingResult,
			purchases: List<Purchase>
			) -> Unit
) : PurchasesUpdatedListener {
	override fun onPurchasesUpdated(billingResult: BillingResult, purchases: List<Purchase>?) {
			handleUpdate(billingResult, purchases.orEmpty())
	}
}