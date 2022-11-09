import Stream from "mithril/stream";
import {PlanPrices} from "../api/entities/sys/TypeRefs"
import {ProgrammingError} from "../api/common/error/ProgrammingError"
import {TranslationKey} from "../misc/LanguageViewModel"
import {formatPrice, getSubscriptionPrice} from "./PriceUtils"

const FEATURE_LIST_RESOURCE_URL = "https://tutanota.com/resources/data/features.json"
const SUBSCRIPTION_CONFIG_RESOURCE_URL = "https://tutanota.com/resources/data/subscriptions.json"
const PRICES_RESOURCE_URL = "https://tutanota.com/resources/data/prices.json"

let subscriptionFeatureList: FeatureLists | null = null
let possibleSubscriptionList: { [K in SubscriptionType]: SubscriptionConfig } | null = null

/**
 * tutanota-3 has a typeRef for plan prices, while the web site defines the type with only
 * some of the properties of the model type. using this method to maintain symmetry.
 */
export type WebsitePlanPrices = Pick<PlanPrices,
	"additionalUserPriceMonthly" |
	"contactFormPriceMonthly" |
	"firstYearDiscount" |
	"monthlyPrice" |
	"monthlyReferencePrice">

let planPrices: { [K in SubscriptionType]: WebsitePlanPrices } | null = null

;(async function initializeData(): Promise<void> {
	if("undefined" === typeof fetch) return
	subscriptionFeatureList = await resolveOrNull(
		() => fetch(FEATURE_LIST_RESOURCE_URL).then(r => r.json()),
		e => console.log("failed to fetch subscription list:", e)
	)
	possibleSubscriptionList = await resolveOrNull(
		() => fetch(SUBSCRIPTION_CONFIG_RESOURCE_URL).then(r => r.json()),
		e => console.log("failed to fetch subscription config", e)
	)

	planPrices = await resolveOrNull(
		() => fetch(PRICES_RESOURCE_URL).then(r => r.json()),
		e => console.log("failed to fetch prices", e)
	)
})()

async function resolveOrNull<T>(fn: () => Promise<T>, handler: (a: Error) => void): Promise<T | null> {
	try {
		return await fn()
	} catch (e) {
		handler(e)
		return null
	}
}

export function featureLoadingDone(): boolean {
	return subscriptionFeatureList == null
}

export function getSubscriptionFeatures(targetSubscription: SubscriptionType): FeatureLists[SubscriptionType] {
	if (subscriptionFeatureList == null) {
		return {
			subtitle: "emptyString_msg",
			features: []
		}
	}
	return subscriptionFeatureList[targetSubscription]
}

export function getSubscriptionConfig(targetSubscription: SubscriptionType): SubscriptionConfig {
	if (possibleSubscriptionList == null) {
		return {
			nbrOfAliases: 0,
			orderNbrOfAliases: 0,
			storageGb: 0,
			orderStorageGb: 0,
			sharing: false,
			business: false,
			whitelabel: false,
		}
	}
	return possibleSubscriptionList[targetSubscription]
}

export type SelectedSubscriptionOptions = {
	businessUse: Stream<boolean>
	paymentInterval: Stream<number>
}

export const enum SubscriptionType {
	Free = "Free",
	Premium = "Premium",
	PremiumBusiness = "PremiumBusiness",
	Teams = "Teams",
	TeamsBusiness = "TeamsBusiness",
	Pro = "Pro",
}

export type SubscriptionConfig = {
	nbrOfAliases: number
	orderNbrOfAliases: number
	storageGb: number
	orderStorageGb: number
	sharing: boolean
	business: boolean
	whitelabel: boolean
}

/**
 * since some translations contain slots that will be populated with
 * dynamic content (depending on options & locale),
 * we have to provide functions to produce it. these
 * are used to select the correct one.
 **/
export type ReplacementKey
	= "pricePerExtraUser"
	| "mailAddressAliases"
	| "storage"
	| "contactForm"

/**
 * one item in the list that's shown below a subscription box,
 * text: translation key for the label,
 * toolTip: translation key for the tooltip that will be shown on hover,
 * omit: whether this can be omitted from the compact feature list,
 * antiFeature: some list items are denoting the lack of a feature and are
 *   rendered with an different icon.
 * replacements: a key to select the correct content to replace the slots in the translation
 */
export type FeatureListItem = {
	text: TranslationKey,
	toolTip?: TranslationKey,
	omit: boolean,
	antiFeature?: boolean,
	replacements?: ReplacementKey
}

/**
 * subtitle: the short text shown below the subscription name in the buy box
 * features: flat, ordered list of features for this subscription type
 */
type FeatureLists = { [K in SubscriptionType]: {subtitle: string, features: Array<FeatureListItem>} }

/**
 * @returns the name to show to the user for the current subscription (PremiumBusiness -> Premium etc.)
 */
export function getDisplayNameOfSubscriptionType(
	subscription: SubscriptionType
): string {
	switch (subscription) {
		case SubscriptionType.PremiumBusiness:
			return SubscriptionType.Premium

		case SubscriptionType.TeamsBusiness:
			return SubscriptionType.Teams

		default:
			return subscription
	}
}

export type SubscriptionPlanPrices = {
	Premium: PlanPrices
	PremiumBusiness: PlanPrices
	Teams: PlanPrices
	TeamsBusiness: PlanPrices
	Pro: PlanPrices
}

export function getPlanPrices(subscription: SubscriptionType): WebsitePlanPrices {
	if (planPrices == null) {
		return {
			"additionalUserPriceMonthly": "",
			"contactFormPriceMonthly": "",
			"firstYearDiscount": "",
			"monthlyPrice": "",
			"monthlyReferencePrice": "",
		}
	}
	const ret = planPrices[subscription]
	if (ret == null) throw new ProgrammingError(`plan ${subscription} is not valid!`)
	return ret
}

export const enum UpgradePriceType {
	PlanReferencePrice = "0",
	PlanActualPrice = "1",
	PlanNextYearsPrice = "2",
	AdditionalUserPrice = "3",
	ContactFormPrice = "4",
}

export function getFormattedSubscriptionPrice(
	paymentInterval: number,
	subscription: SubscriptionType,
	type: UpgradePriceType
): string {
	return formatPrice(getSubscriptionPrice(paymentInterval, subscription, type), true)
}