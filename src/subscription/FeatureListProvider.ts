import Stream from "mithril/stream";
import {PlanPrices} from "../api/entities/sys/TypeRefs"
import {TranslationKey} from "../misc/LanguageViewModel"
import {PaymentInterval} from "./PriceUtils.js"

const FEATURE_LIST_RESOURCE_URL = "https://tutanota.com/resources/data/features.json"
let dataProvider: HiddenFeatureListProvider | null = null

export interface FeatureListProvider {
	getFeatureList(targetSubscription: SubscriptionType): FeatureLists[SubscriptionType]

	featureLoadingDone(): boolean
}

export async function getFeatureListProvider(): Promise<FeatureListProvider> {
	if (dataProvider == null) {
		dataProvider = new HiddenFeatureListProvider()
		await dataProvider.init()
	}
	return dataProvider
}

class HiddenFeatureListProvider implements FeatureListProvider {

	private featureList: FeatureLists | null = null

	async init(): Promise<void> {
		if ("undefined" === typeof fetch) return
		this.featureList = await resolveOrNull(
			() => fetch(FEATURE_LIST_RESOURCE_URL).then(r => r.json()),
			e => console.log("failed to fetch feature list:", e)
		)
	}

	getFeatureList(targetSubscription: SubscriptionType): FeatureLists[SubscriptionType] {
		return this.featureList == null
			? {features: [], subtitle: "emptyString_msg"}
			: this.featureList[targetSubscription]
	}

	featureLoadingDone(): boolean {
		return this.featureList != null
	}
}

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

async function resolveOrNull<T>(fn: () => Promise<T>, handler: (a: Error) => void): Promise<T | null> {
	try {
		return await fn()
	} catch (e) {
		handler(e)
		return null
	}
}

export type SelectedSubscriptionOptions = {
	businessUse: Stream<boolean>
	paymentInterval: Stream<PaymentInterval>
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

export const enum UpgradePriceType {
	PlanReferencePrice = "0",
	PlanActualPrice = "1",
	PlanNextYearsPrice = "2",
	AdditionalUserPrice = "3",
	ContactFormPrice = "4",
}