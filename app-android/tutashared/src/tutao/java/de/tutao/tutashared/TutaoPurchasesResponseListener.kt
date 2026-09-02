package de.tutao.tutashared

import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesResponseListener

class TutaoPurchasesResponseListener(
	private val handleUpdate: (
		billingResult: BillingResult,
		purchases: List<Purchase>
	) -> Unit
) : PurchasesResponseListener {
	override fun onQueryPurchasesResponse(billingResult: BillingResult, purchases: List<Purchase?>) {
		handleUpdate(billingResult, purchases.filterNotNull())
	}
}
