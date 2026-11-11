import Stream from "mithril/stream"
import { PaymentInterval } from "./utils/PriceUtils.js"
import { downcast } from "@tutao/utils"
import { PlanPrices } from "@tutao/entities/sys"
import { PlanType } from "../../../entities/sys/Utils"
import { PlanTypeToName } from "./utils/SubscriptionUtils"

/**
 * tutanota-3 has a typeRef for plan prices, while the web site defines the type with only
 * some of the properties of the model type. using this method to maintain symmetry.
 */
export type WebsitePlanPrices = Pick<PlanPrices, "additionalUserPriceMonthly" | "firstYearDiscount" | "monthlyPrice" | "monthlyReferencePrice">

export type SelectedSubscriptionOptions = {
	businessUse: Stream<boolean>
	paymentInterval: Stream<PaymentInterval>
}

/**
 * since some translations contain slots that will be populated with
 * dynamic content (depending on options & locale),
 * we have to provide functions to produce it. these
 * are used to select the correct one.
 **/
export type ReplacementKey = "customDomains" | "mailAddressAliases" | "storage" | "label"

/**
 * @returns the name to show to the user for the current subscription (PremiumBusiness -> Premium etc.)
 */
export function getDisplayNameOfPlanType(planType: PlanType): string {
	switch (planType) {
		case PlanType.PremiumBusiness:
			return downcast(PlanTypeToName[PlanType.Premium])
		case PlanType.TeamsBusiness:
			return downcast(PlanTypeToName[PlanType.Teams])
		default:
			return downcast(PlanTypeToName[planType])
	}
}

export const enum UpgradePriceType {
	PlanReferencePrice = "0",
	PlanActualPrice = "1",
	PlanNextYearsPrice = "2",
	AdditionalUserPrice = "3",
	ContactFormPrice_UNUSED = "4",
}
