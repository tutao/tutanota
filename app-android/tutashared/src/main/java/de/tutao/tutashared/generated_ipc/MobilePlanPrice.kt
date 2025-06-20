/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class MobilePlanPrice(
	val name: String,
	val rawMonthlyPerMonth: String,
	val rawYearlyPerYear: String,
	val displayMonthlyPerMonth: String,
	val displayYearlyPerYear: String,
	val displayOfferYearlyPerYear: String?,
	val isEligibleForIntroOffer: Boolean,
)
