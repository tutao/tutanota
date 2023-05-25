import Stream from "mithril/stream"
import { PlanPrices } from "../api/entities/sys/TypeRefs"
import { TranslationKey } from "../misc/LanguageViewModel"
import { PaymentInterval } from "./PriceUtils.js"
import { PlanName, PlanType, PlanTypeToName } from "../api/common/TutanotaConstants.js"
import { downcast } from "@tutao/tutanota-utils"

const FEATURE_LIST_RESOURCE_URL = "https://tutanota.com/resources/data/features.json"
// const FEATURE_LIST_RESOURCE_URL = "http://localhost:9000/resources/data/features.json"
let dataProvider: FeatureListProvider | null = null

export class FeatureListProvider {
	private featureList: FeatureLists | null = null

	private constructor() {}

	private async init(): Promise<void> {
		if ("undefined" === typeof fetch) return
		this.featureList = await resolveOrNull(
			() => fetch(FEATURE_LIST_RESOURCE_URL).then((r) => r.json()),
			(e) => console.log("failed to fetch feature list:", e),
		).then((featureList) => {
			this.countFeatures([...featureList.Free.categories, ...featureList.Revolutionary.categories, ...featureList.Legend.categories])
			this.countFeatures([...featureList.Essential.categories, ...featureList.Advanced.categories, ...featureList.Unlimited.categories])
			return featureList
		})
	}

	private countFeatures(categories: FeatureCategory[]): void {
		const featureCounts = new Map<string, { max: number }>()
		categories.forEach((category) => {
			var count = featureCounts.get(category.title)
			const numberOfFeatures = category.features.length
			if (count == null || numberOfFeatures > count.max) {
				category.featureCount = { max: numberOfFeatures }
			} else {
				category.featureCount = count
			}
			featureCounts.set(category.title, category.featureCount)
		})
	}

	static async getInitializedInstance(): Promise<FeatureListProvider> {
		if (dataProvider == null) {
			dataProvider = new FeatureListProvider()
			await dataProvider.init()
		}
		return dataProvider
	}

	getFeatureList(targetSubscription: PlanType): FeatureLists[PlanName] {
		if (this.featureList == null) {
			return { subtitle: "emptyString_msg", categories: [] }
		} else {
			return this.featureList[PlanTypeToName[targetSubscription]]
		}
	}

	featureLoadingDone(): boolean {
		return this.featureList != null
	}
}

/**
 * tutanota-3 has a typeRef for plan prices, while the web site defines the type with only
 * some of the properties of the model type. using this method to maintain symmetry.
 */
export type WebsitePlanPrices = Pick<
	PlanPrices,
	"additionalUserPriceMonthly" | "contactFormPriceMonthly" | "firstYearDiscount" | "monthlyPrice" | "monthlyReferencePrice"
>

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
export type ReplacementKey = "customDomains" | "mailAddressAliases" | "storage" | "contactForm"

/**
 * A category of features to be shown
 * title: translation key for the title
 * features: List of features in this category
 * omit: whether this can be omitted from the compact feature list,
 */
export type FeatureCategory = {
	title: TranslationKey
	features: Array<FeatureListItem>
	featureCount: { max: number }
}

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
	text: TranslationKey
	toolTip?: TranslationKey
	omit: boolean
	antiFeature?: boolean
	replacements?: ReplacementKey
	heart?: boolean
}

/**
 * subtitle: the short text shown below the subscription name in the buy box
 * features: flat, ordered list of features for this subscription type
 */
type FeatureLists = { [K in PlanName]: { subtitle: string; categories: Array<FeatureCategory> } }

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

export type SubscriptionPlanPrices = Record<PlanType, PlanPrices>

export const enum UpgradePriceType {
	PlanReferencePrice = "0",
	PlanActualPrice = "1",
	PlanNextYearsPrice = "2",
	AdditionalUserPrice = "3",
	ContactFormPrice = "4",
}
