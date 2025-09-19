import m, { Children, Component, Vnode } from "mithril"
import Stream from "mithril/stream"
import { styles } from "../../gui/styles"
import { px, size } from "../../gui/size"
import { AvailablePlanType, PlanType } from "../../api/common/TutanotaConstants"
import { ReplacementKey, SelectedSubscriptionOptions } from "../FeatureListProvider"
import { PaymentInterval, PriceAndConfigProvider } from "../PriceUtils"
import { getPriceStr } from "../SubscriptionUtils"
import { AvailablePlans } from "../PlanSelector"
import { BusinessPlanBox } from "./BusinessPlanBox"
import { Icons } from "../../gui/base/icons/Icons"
import { TranslationKey } from "../../misc/LanguageViewModel"

export type PlanBoxesAttrs = {
	allowSwitchingPaymentInterval: boolean
	availablePlans: readonly AvailablePlanType[]
	currentPaymentInterval: PaymentInterval | undefined
	currentPlan: PlanType | undefined
	hasCampaign: boolean
	hidePaidPlans: boolean
	isApplePrice: boolean
	priceAndConfigProvider: PriceAndConfigProvider
	selectedPlan: Stream<PlanType>
	selectedSubscriptionOptions: SelectedSubscriptionOptions
	showMultiUser: boolean
}

export type PlanFeature = {
	label: TranslationKey
	icon: Icons
	replacementKey?: ReplacementKey
}

export type PlanConfig = {
	type: PlanType
	tagLine: TranslationKey
	icon: Icons
	features: PlanFeature[]
}

export class BusinessPlanBoxes implements Component<PlanBoxesAttrs> {
	private ORDER: readonly PlanType[] = [PlanType.Essential, PlanType.Advanced, PlanType.Unlimited] as const

	view({ attrs }: Vnode<PlanBoxesAttrs>): Children {
		const {
			availablePlans,
			currentPaymentInterval,
			currentPlan,
			hasCampaign,
			hidePaidPlans,
			isApplePrice,
			priceAndConfigProvider,
			selectedPlan,
			selectedSubscriptionOptions,
		} = attrs

		const container = styles.isMobileLayout()
			? {
					width: `calc(100% + 2 * ${px(size.hpad_large)})`,
					left: "50%",
					transform: "translateX(-50%)",
				}
			: {
					width: "fit-content",
					marginInline: "auto",
				}
		const planConfigs: PlanConfig[] = [
			{
				type: PlanType.Essential,
				tagLine: "pricing.taglineForFreelancers",
				icon: Icons.BusinessEssential,
				features: [
					{
						label: "pricing.comparisonStorage_msg",
						icon: Icons.PricingStorage,
						replacementKey: "storage",
					},
					{
						label: "pricing.calendarsPremium_label",
						icon: Icons.PricingCalendar,
					},
					{
						label: "pricing.mailAddressAliasesShort_label",
						icon: Icons.PricingMail,
						replacementKey: "mailAddressAliases",
					},
					{
						label: "pricing.comparisonCustomDomains_msg",
						icon: Icons.PricingCustomDomain,
						replacementKey: "customDomains",
					},
					{
						label: "pricing.comparisonSupportPremium_msg",
						icon: Icons.PricingSupport,
					},
				],
			},
			{
				type: PlanType.Advanced,
				tagLine: "pricing.taglineForTeams",
				icon: Icons.BusinessAdvanced,
				features: [
					{
						label: "pricing.comparisonStorage_msg",
						icon: Icons.PricingStorage,
						replacementKey: "storage",
					},
					{
						label: "pricing.calendarsPremium_label",
						icon: Icons.PricingCalendar,
					},
					{
						label: "pricing.mailAddressAliasesShort_label",
						icon: Icons.PricingMail,
						replacementKey: "mailAddressAliases",
					},
					{
						label: "pricing.comparisonCustomDomains_msg",
						icon: Icons.PricingCustomDomain,
						replacementKey: "customDomains",
					},
					{
						label: "pricing.comparisonSupportPremium_msg",
						icon: Icons.PricingSupport,
					},
				],
			},
			{
				type: PlanType.Unlimited,
				tagLine: "pricing.taglineForBusinesses",
				icon: Icons.BusinessUnlimited,
				features: [
					{
						label: "pricing.comparisonStorage_msg",
						icon: Icons.PricingStorage,
						replacementKey: "storage",
					},
					{
						label: "pricing.calendarsPremium_label",
						icon: Icons.PricingCalendar,
					},
					{
						label: "pricing.mailAddressAliasesShort_label",
						icon: Icons.PricingMail,
						replacementKey: "mailAddressAliases",
					},
					{
						label: "pricing.comparisonCustomDomains_msg",
						icon: Icons.PricingCustomDomain,
						replacementKey: "customDomains",
					},
					{
						label: "pricing.comparisonSupportPremium_msg",
						icon: Icons.PricingSupport,
					},
				],
			},
		]

		const visible = hidePaidPlans ? [] : this.ORDER.filter((p) => availablePlans.includes(p as AvailablePlanType))

		if (!visible.includes(selectedPlan() as PlanType) && visible.length) {
			selectedPlan(visible[1] as AvailablePlans) // Preselect Advanced Plan (i.e. the one in the middle)
		}

		return m(
			`${styles.isMobileLayout() ? ".flex-column" : ".flex.gap-vpad"}`,
			{
				"data-testid": "dialog:select-subscription-business",
				style: { position: "relative", paddingInline: px(8), ...container },
			},
			planConfigs.map((planConfig) => {
				const prices = getPriceStr({
					priceAndConfigProvider,
					targetPlan: planConfig.type,
					paymentInterval: selectedSubscriptionOptions.paymentInterval(),
				})

				return m(BusinessPlanBox, {
					planConfig,
					price: prices.priceStr,
					referencePrice: prices.referencePriceStr,
					isSelected: selectedPlan() === planConfig.type,
					isDisabled: currentPlan === planConfig.type,
					isCurrentPlan: currentPlan === planConfig.type,
					onclick: (p) => selectedPlan(p as AvailablePlans),
					priceAndConfigProvider: priceAndConfigProvider,
					hasCampaign: hasCampaign,
				})
			}),
		)
	}
}
