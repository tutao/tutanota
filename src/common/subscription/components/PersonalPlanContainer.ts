import m, { Children, Component, Vnode } from "mithril"
import { styles } from "../../gui/styles"
import { px, size } from "../../gui/size"
import { PlanType, PlanTypeToName } from "../../api/common/TutanotaConstants"
import { PersonalPaidPlanBox } from "./PersonalPaidPlanBox"
import { getApplePriceStr, getPriceStr } from "../utils/SubscriptionUtils"
import { PersonalFreePlanBox } from "./PersonalFreePlanBox"
import { PlanConfig } from "./BusinessPlanContainer"
import { Icons } from "../../gui/base/icons/Icons"
import { anyHasGlobalFirstYearCampaign, filterPlanConfigsAndGetSelectedPlan, PlanBoxContainerAttrs } from "../utils/PlanSelectorUtils"

export class PersonalPlanContainer implements Component<PlanBoxContainerAttrs> {
	private paidPlanConfigs: PlanConfig[] = [
		{
			type: PlanType.Revolutionary,
			tagLine: "mostPopular_label",
			icon: Icons.Revo,
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
			type: PlanType.Legend,
			tagLine: "allYouNeed_label",
			icon: Icons.Legend,
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
					label: "pricing.comparisonSupportPro_msg",
					icon: Icons.PricingSupport,
				},
			],
		},
	]

	oncreate({ attrs }: Vnode<PlanBoxContainerAttrs>) {
		const { planConfigs, selectedPlan } = filterPlanConfigsAndGetSelectedPlan(
			this.paidPlanConfigs,
			attrs.availablePlans,
			attrs.selectedPlan(),
			attrs.currentPlan,
		)
		this.paidPlanConfigs = planConfigs
		attrs.selectedPlan(selectedPlan)
		m.redraw()
	}

	view({
		attrs: {
			allowSwitchingPaymentInterval,
			availablePlans,
			currentPaymentInterval,
			currentPlan,
			isApplePrice,
			priceAndConfigProvider,
			selectedPlan,
			selectedSubscriptionOptions,
			showMultiUser,
			discountDetails,
		},
	}: Vnode<PlanBoxContainerAttrs>): Children {
		return m(
			`.flex-column${allowSwitchingPaymentInterval ? "" : ".mt-16"}${anyHasGlobalFirstYearCampaign(discountDetails) ? ".mt-32" : ""}`,
			{
				"data-testid": "dialog:select-subscription",
				style: {
					position: "relative",
					...(styles.isMobileLayout()
						? {
								// Ignore the horizontal paddings to use full width of the dialog for mobile
								width: `calc(100% + 2 * ${px(size.spacing_24)})`,
								left: "50%",
								transform: "translateX(-50%)",
							}
						: {
								width: "fit-content",
								"margin-inline": "auto",
								"max-width": px(500),
							}),
				},
			},
			m(
				"div.flex",
				{
					style: {
						width: "100%",
					},
				},
				this.paidPlanConfigs.map((planConfig: PlanConfig, idx) => {
					const getPriceStrProps = {
						priceAndConfigProvider,
						targetPlan: planConfig.type,
						paymentInterval: selectedSubscriptionOptions.paymentInterval(),
					}
					const { referencePriceStr, priceStr } = isApplePrice ? getApplePriceStr(getPriceStrProps) : getPriceStr(getPriceStrProps)
					const isCurrentPlanAndInterval = currentPlan === planConfig.type && currentPaymentInterval === selectedSubscriptionOptions.paymentInterval()

					return m(PersonalPaidPlanBox, {
						planConfig: planConfig,
						price: priceStr,
						referencePrice: referencePriceStr,
						isSelected: planConfig.type === selectedPlan(),
						// We have to allow payment interval switch for iOS in the plan selector as we hide payment interval switch in the setting
						isDisabled: !!planConfig.isDisabled || (isApplePrice ? isCurrentPlanAndInterval : currentPlan === planConfig.type),
						isCurrentPlan: isApplePrice ? isCurrentPlanAndInterval : currentPlan === planConfig.type,
						onclick: (newPlan) => selectedPlan(newPlan),
						selectedPaymentInterval: selectedSubscriptionOptions.paymentInterval,
						priceAndConfigProvider,
						isApplePrice,
						showMultiUser,
						position: idx % 2 === 0 ? "left" : "right",
						discountDetail: discountDetails?.[planConfig.type],
					})
				}),
			),
			m(PersonalFreePlanBox, {
				isSelected: selectedPlan() === PlanType.Free,
				isDisabled: !availablePlans.includes(PlanType.Free) || currentPlan === PlanType.Free,
				isCurrentPlan: currentPlan === PlanType.Free,
				onclick: (newPlan) => selectedPlan(newPlan),
				priceAndConfigProvider,
			}),
		)
	}
}
