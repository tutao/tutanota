import m, { ClassComponent, Vnode } from "mithril"
import { WizardStepComponentAttrs } from "../../../ui/base/wizard/WizardStep"
import type { PlanSelectionModel } from "../subscription/PlanSelectionModel"
import { getCurrentPaymentInterval, PlanTypeToName, shouldShowExternalStorePrices, UpgradeType } from "../subscription/utils/SubscriptionUtils"
import { getDiscountDetails, getPlanSelectorSubtitle, getPlanSelectorTitle } from "../subscription/utils/PlanSelectorUtils"
import { TranslationKeyType } from "../../../ui/utils/TranslationKey"
import { PrimaryButtonAttrs } from "../../../ui/base/buttons/VariantButtons.js"
import { PlanSelector, PlanSelectorAttr, SubscriptionActionButtons } from "../subscription/PlanSelector"
import { getAsLazy } from "../../../ui/base/MaybeLazy"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { px } from "../../../ui/size"
import { Styles } from "../../../ui/styles"
import { MessageBanner } from "../../../ui/base/MessageBanner"
import { AvailablePlanType, PlanType } from "../../../entities/sys/Utils"
import { PaymentInterval } from "../subscription/utils/PriceUtils"

export interface PlanSelectorPageAttrs extends WizardStepComponentAttrs<PlanSelectionModel> {
	forceMobileBusinessLayout?: boolean
}

export class PlanSelectorPage implements ClassComponent<PlanSelectorPageAttrs> {
	view(vnode: Vnode<PlanSelectorPageAttrs>) {
		const ctx = vnode.attrs.ctx
		const { forceMobileBusinessLayout } = vnode.attrs
		const data = ctx.viewModel
		const { planPrices, acceptedPlans, accountingInfo } = data
		let availablePlans = acceptedPlans
		const isApplePrice = shouldShowExternalStorePrices(accountingInfo ?? null)
		const discountDetails = getDiscountDetails(isApplePrice, planPrices!)
		const promotionMessage = planPrices!.getRawPricingData().messageTextId as TranslationKeyType
		let message
		try {
			message = promotionMessage == null ? null : lang.getTranslation(promotionMessage)
		} catch (e) {
			message = null
		}
		const button: PrimaryButtonAttrs = {
			label: "pricing.select_action",
			onclick: () => {},
		}

		const actionButtons: SubscriptionActionButtons = {
			[PlanType.Free]: getAsLazy(button),
			[PlanType.Revolutionary]: getAsLazy(button),
			[PlanType.Legend]: getAsLazy(button),
		}
		const isWideBusinessLayout = data.options.businessUse() && !forceMobileBusinessLayout
		return m(
			`.full-width${Styles.get().isMobileLayout() ? ".pt-16" : ""}`,
			// Upgrade messages explain plan requirements; signup may report store-subscription errors.
			data.messageBoxMessage &&
				m(MessageBanner, { translation: data.messageBoxMessage, type: data.upgradeType === UpgradeType.Signup ? "error" : "base" }),
			// Headline for promotional messages
			message && m(MessageBanner, { translation: message, type: "base" }),
			m(
				".flex.flex-column.items-start.full-width",
				{
					style: {
						"max-width": px(1000),
						"margin-inline": "auto",
					},
				},
				[
					this.renderHeadline(data),
					this.renderSubtitle(data),
					m(
						`.plan-selector-wrapper.flex.gap-64.full-width${isWideBusinessLayout ? ".justify-center" : ""}`,
						m(
							".flex-grow",
							{
								style: {
									"max-width": Styles.get().isMobileLayout() ? "initial" : isWideBusinessLayout ? px(860) : px(530),
								},
							},
							m(PlanSelector, {
								options: data.options!,
								actionButtons: actionButtons,
								priceAndConfigProvider: planPrices!,
								availablePlans,
								isExternalStorePrice: isApplePrice,
								currentPlan: data.currentPlan ?? undefined,
								currentPaymentInterval: getCurrentPaymentInterval(accountingInfo) ?? PaymentInterval.Yearly,
								allowSwitchingPaymentInterval: isApplePrice || data.upgradeType !== UpgradeType.Switch,
								showMultiUser: false,
								discountDetails,
								targetPlan: data.targetPlanType!,
								onContinue: (selectedPlan: AvailablePlanType) => {
									data.targetPlanType = selectedPlan
									ctx.setLabel(PlanTypeToName[selectedPlan])
									ctx.goNext()
								},
								newSignupFlow: true,
								personalPlansAvailable: data.personalPlansAvailable,
								forceMobileBusinessLayout,
							} satisfies PlanSelectorAttr),
						),
					),
				],
			),
		)
	}
	private renderSubtitle(data: PlanSelectionModel) {
		const subtitleTranslationKey = getPlanSelectorSubtitle(data.globalCampaignName, data.bonusMonthForYearlyPlans > 0)
		return m(`p.mb-32`, lang.getTranslationText(subtitleTranslationKey))
	}

	private renderHeadline(data: PlanSelectionModel) {
		const titleTranslationKey = getPlanSelectorTitle(data.globalCampaignName, data.bonusMonthForYearlyPlans > 0)

		return m(
			`h1.font-mdio${Styles.get().isMobileLayout() ? ".h3" : ".h1"}`,
			{
				style: {
					position: "relative",
					top: px(-6),
				},
			},
			lang.getTranslationText(titleTranslationKey),
		)
	}
}
