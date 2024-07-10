import Stream from "mithril/stream"
import { PlanPrices } from "../api/entities/sys/TypeRefs"
import { TranslationKey } from "../misc/LanguageViewModel"
import { PaymentInterval } from "./PriceUtils.js"
import { AvailablePlans, PlanName, PlanType, PlanTypeToName } from "../api/common/TutanotaConstants.js"
import { downcast, getFromMap } from "@tutao/tutanota-utils"
import { isIOSApp } from "../api/common/Env.js"

let dataProvider: FeatureListProvider | null = null

const IOS_EXCLUDED_FEATURES: TranslationKey[] = ["pricing.family_label"]

export class FeatureListProvider {
	private featureList: FeatureLists | null = null

	private constructor(private readonly domainConfig: DomainConfig) {}

	private async init(): Promise<void> {
		if ("undefined" === typeof fetch) return
		const listResourceUrl = `${this.domainConfig.websiteBaseUrl}/resources/data/features.json`
		try {
			const featureList = await fetch(listResourceUrl).then((r) => r.json())
			if (isIOSApp()) {
				this.stripUnsupportedIosFeatures(featureList)
			}
			this.countFeatures([...featureList.Free.categories, ...featureList.Revolutionary.categories, ...featureList.Legend.categories])
			this.countFeatures([...featureList.Essential.categories, ...featureList.Advanced.categories, ...featureList.Unlimited.categories])
			this.featureList = featureList
		} catch (e) {
			console.warn(`failed to fetch feature list from  ${listResourceUrl}`, e)
		}
	}

	private countFeatures(categories: FeatureCategory[]): void {
		const featureCounts = new Map<string, { max: number }>()
		for (const category of categories) {
			var count = featureCounts.get(category.title)
			const numberOfFeatures = category.features.length
			if (count == null || numberOfFeatures > count.max) {
				featureCounts.set(category.title, { max: numberOfFeatures })
			}
		}
		for (const category of categories) {
			category.featureCount = getFromMap(featureCounts, category.title, () => {
				return { max: 0 }
			})
		}
	}

	static async getInitializedInstance(domainConfig: DomainConfig): Promise<FeatureListProvider> {
		if (dataProvider == null) {
			dataProvider = new FeatureListProvider(domainConfig)
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

	/**
	 * Remove features from the feature list that are unsupported for iOS and shouldn't be displayed to iOS users.
	 * @param featureList feature list obtained from the server
	 * @private
	 */
	private stripUnsupportedIosFeatures(featureList: any) {
		for (const plan of AvailablePlans) {
			const features: { categories: FeatureCategory[] } = featureList[PlanTypeToName[plan]]
			for (const category of features.categories) {
				category.features = category.features.filter(({ text }) => {
					return !IOS_EXCLUDED_FEATURES.includes(text)
				})
			}
		}
	}
}

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
export type ReplacementKey = "customDomains" | "mailAddressAliases" | "storage"

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
	ContactFormPrice_UNUSED = "4",
}
