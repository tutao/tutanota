import m, { Children, Component, Vnode } from "mithril"
import { SignupViewModel } from "../SignupView"
import { AvailablePlanType, NewPersonalPlans, PlanType } from "../../api/common/TutanotaConstants"
import { Icons } from "../../gui/base/icons/Icons"
import { BusinessPlanBox } from "../../subscription/components/BusinessPlanBox"
import { PlanConfig } from "../../subscription/components/BusinessPlanContainer"
import { getApplePriceStr, getPriceStr, shouldShowApplePrices } from "../../subscription/utils/SubscriptionUtils"
import { getDiscountDetails, getHasCampaign } from "../../subscription/utils/PlanSelectorUtils"
import { PaymentInterval } from "../../subscription/utils/PriceUtils"
import { px, size } from "../../gui/size"

type SignupInlinePlanSelectorAttrs = {
	viewModel: SignupViewModel
	onPlanSelected?: () => void
}

export class SignupInlinePlanSelector implements Component<SignupInlinePlanSelectorAttrs> {
	private readonly planConfigs: PlanConfig[] = [
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
		{
			type: PlanType.Free,
			tagLine: "emptyString_msg",
			icon: Icons.Revo,
			features: [
				{
					label: "pricing.comparisonStorage_msg",
					icon: Icons.PricingStorage,
					replacementKey: "storage",
				},
				{
					label: "pricing.comparisonOneCalendar_msg",
					icon: Icons.PricingCalendar,
				},
				{
					label: "pricing.comparisonFaqSupport_msg",
					icon: Icons.PricingSupport,
				},
			],
		},
	]

	view({ attrs }: Vnode<SignupInlinePlanSelectorAttrs>): Children {
		const { viewModel, onPlanSelected } = attrs
		const priceAndConfigProvider = viewModel.planPrices
		if (!priceAndConfigProvider) return null

		const availablePlans = viewModel.acceptedPlans.filter((plan) => NewPersonalPlans.includes(plan))
		const isApplePrice = shouldShowApplePrices(viewModel.accountingInfo ?? null)
		const discountDetails = getDiscountDetails(isApplePrice, priceAndConfigProvider)
		const isYearly = viewModel.options.paymentInterval() === PaymentInterval.Yearly
		const anyPaidPlanHasCampaign =
			discountDetails && (getHasCampaign(discountDetails[PlanType.Revolutionary], isYearly) || getHasCampaign(discountDetails[PlanType.Legend], isYearly))
		const currentPlan = viewModel.currentPlan ?? undefined

		return m(
			".flex.flex-column.gap-16",
			{
				style: {
					width: "100%",
					"margin-top": anyPaidPlanHasCampaign ? px(size.spacing_32) : 0,
				},
			},
			this.planConfigs.map((planConfig) => {
				const priceInput = {
					priceAndConfigProvider,
					targetPlan: planConfig.type,
					paymentInterval: viewModel.options.paymentInterval(),
				}
				const prices = planConfig.type === PlanType.Free || !isApplePrice ? getPriceStr(priceInput) : getApplePriceStr(priceInput)
				const isSelected = viewModel.targetPlanType === planConfig.type
				const isDisabled = !availablePlans.includes(planConfig.type as AvailablePlanType) || currentPlan === planConfig.type
				const hasCampaign = getHasCampaign(discountDetails?.[planConfig.type], viewModel.options.paymentInterval() === PaymentInterval.Yearly)
				return m(
					`${hasCampaign ? ".mt-24" : ""}`,
					m(BusinessPlanBox, {
						planConfig,
						price: prices.priceStr,
						referencePrice: prices.referencePriceStr,
						isSelected,
						isDisabled,
						isCurrentPlan: currentPlan === planConfig.type,
						onclick: (plan) => {
							viewModel.targetPlanType = plan
							viewModel.updatePrice()
							onPlanSelected?.()
						},
						priceAndConfigProvider,
						discountDetail: discountDetails?.[planConfig.type],
						selectedPaymentInterval: viewModel.options.paymentInterval,
						forceMobileLayout: true,
						forceExpanded: true,
						priceHintLabel: "pricing.perMonth_label",
					}),
				)
			}),
		)
	}
}
