import m, { Children, Component, Vnode } from "mithril"
import { styles } from "../../gui/styles"
import { px, size } from "../../gui/size"
import { PlanType } from "../../api/common/TutanotaConstants"
import { PersonalPaidPlanBox } from "./PersonalPaidPlanBox"
import { getApplePriceStr, getPriceStr } from "../SubscriptionUtils"
import { PersonalFreePlanBox } from "./PersonalFreePlanBox"
import { PlanConfig } from "./BusinessPlanContainer"
import { Icons } from "../../gui/base/icons/Icons"
import { filterPlanConfigsAndGetSelectedPlan, PlanBoxesAttrs } from "../utils/PlanSelectorUtils"

export class PersonalPlanContainer implements Component<PlanBoxesAttrs> {
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

	oncreate({ attrs }: Vnode<PlanBoxesAttrs>) {
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
			hasCampaign,
			isApplePrice,
			priceAndConfigProvider,
			selectedPlan,
			selectedSubscriptionOptions,
			showMultiUser,
		},
	}: Vnode<PlanBoxesAttrs>): Children {
		return m(
			`.flex-column${allowSwitchingPaymentInterval ? "" : ".mt"}`,
			{
				"data-testid": "dialog:select-subscription",
				style: {
					position: "relative",
					...(styles.isMobileLayout()
						? {
								// Ignore the horizontal paddings to use full width of the dialog for mobile
								width: `calc(100% + 2 * ${px(size.hpad_large)})`,
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
				this.paidPlanConfigs.map((planCofig: PlanConfig, idx) => {
					const getPriceStrProps = {
						priceAndConfigProvider,
						targetPlan: planCofig.type,
						paymentInterval: selectedSubscriptionOptions.paymentInterval(),
					}
					const { referencePriceStr, priceStr } = isApplePrice ? getApplePriceStr(getPriceStrProps) : getPriceStr(getPriceStrProps)
					const isCurrentPlanAndInterval = currentPlan === planCofig.type && currentPaymentInterval === selectedSubscriptionOptions.paymentInterval()

					return m(PersonalPaidPlanBox, {
						planConfig: planCofig,
						availablePlans: availablePlans,
						price: priceStr,
						referencePrice: referencePriceStr,
						isSelected: planCofig.type === selectedPlan(),
						// We have to allow payment interval switch for iOS in the plan selector as we hide payment interval switch in the setting
						isDisabled:
							(planCofig.type === PlanType.Revolutionary && !availablePlans.includes(PlanType.Revolutionary)) ||
							(planCofig.type === PlanType.Legend && !availablePlans.includes(PlanType.Legend)) ||
							isApplePrice
								? isCurrentPlanAndInterval
								: currentPlan === planCofig.type,
						isCurrentPlan: isApplePrice ? isCurrentPlanAndInterval : currentPlan === planCofig.type,
						onclick: (newPlan) => selectedPlan(newPlan),
						selectedPaymentInterval: selectedSubscriptionOptions.paymentInterval,
						priceAndConfigProvider,
						hasCampaign,
						isApplePrice,
						showMultiUser,
						position: idx % 2 === 0 ? "left" : "right",
					})
				}),
			),
			availablePlans.includes(PlanType.Free) &&
				m(PersonalFreePlanBox, {
					availablePlans: availablePlans,
					isSelected: selectedPlan() === PlanType.Free,
					isDisabled: !availablePlans.includes(PlanType.Free) || currentPlan === PlanType.Free,
					isCurrentPlan: currentPlan === PlanType.Free,
					onclick: (newPlan) => selectedPlan(newPlan),
					priceAndConfigProvider,
					hasCampaign,
				}),
		)
	}
}
