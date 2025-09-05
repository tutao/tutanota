import m, { Children, Component, Vnode } from "mithril"
import { styles } from "../../gui/styles"
import { px, size } from "../../gui/size"
import { PlanType } from "../../api/common/TutanotaConstants"
import { ReplacementKey } from "../FeatureListProvider"
import { getPriceStr } from "../utils/SubscriptionUtils"
import { AvailablePlans } from "../PlanSelector"
import { BusinessPlanBox } from "./BusinessPlanBox"
import { Icons } from "../../gui/base/icons/Icons"
import { TranslationKey } from "../../misc/LanguageViewModel"
import { filterPlanConfigsAndGetSelectedPlan, PlanBoxContainerAttrs } from "../utils/PlanSelectorUtils"

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
	isDisabled?: boolean
}

export class BusinessPlanContainer implements Component<PlanBoxContainerAttrs> {
	private planConfigs: PlanConfig[] = [
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
					label: "pricing.calendarsPremium_label",
					icon: Icons.PricingCalendar,
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
					label: "pricing.calendarsPremium_label",
					icon: Icons.PricingCalendar,
				},
				{
					label: "pricing.comparisonSupportPro_msg",
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
					label: "pricing.calendarsPremium_label",
					icon: Icons.PricingCalendar,
				},
				{
					label: "pricing.comparisonSupportPro_msg",
					icon: Icons.PricingSupport,
				},
				{
					label: "pricing.custom_title",
					icon: Icons.Wand,
				},
			],
		},
	]

	oncreate({ attrs }: Vnode<PlanBoxContainerAttrs>) {
		const { planConfigs, selectedPlan } = filterPlanConfigsAndGetSelectedPlan(
			this.planConfigs,
			attrs.availablePlans,
			attrs.selectedPlan(),
			attrs.currentPlan,
		)
		this.planConfigs = planConfigs
		attrs.selectedPlan(selectedPlan)
		m.redraw()
	}

	view({ attrs }: Vnode<PlanBoxContainerAttrs>): Children {
		const { currentPlan, priceAndConfigProvider, selectedPlan, selectedSubscriptionOptions, discountDetails } = attrs

		const container = styles.isMobileLayout()
			? {
					width: `calc(100% + 2 * ${px(size.spacing_24)})`,
					left: "50%",
					transform: "translateX(-50%)",
				}
			: {
					width: "fit-content",
					marginInline: "auto",
				}

		return m(
			`${styles.isMobileLayout() ? ".flex.flex-column.gap-16" : ".flex.gap-16"}`,
			{
				"data-testid": "dialog:select-subscription-business",
				style: { position: "relative", paddingInline: px(8), ...container },
			},
			this.planConfigs.map((planConfig) => {
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
					isDisabled: !!planConfig.isDisabled || currentPlan === planConfig.type,
					isCurrentPlan: currentPlan === planConfig.type,
					onclick: (p) => selectedPlan(p as AvailablePlans),
					priceAndConfigProvider: priceAndConfigProvider,
					discountDetail: discountDetails?.[planConfig.type],
					selectedPaymentInterval: selectedSubscriptionOptions.paymentInterval,
				})
			}),
		)
	}
}
