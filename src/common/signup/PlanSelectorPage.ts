import m, { ClassComponent, Vnode } from "mithril"
import { WizardStepComponentAttrs } from "../gui/base/wizard/WizardStep"
import { SignupViewModel } from "./SignupView"
import { getCurrentPaymentInterval, shouldShowApplePrices, UpgradeType } from "../subscription/utils/SubscriptionUtils"
import { anyHasGlobalFirstYearCampaign, getDiscountDetails } from "../subscription/utils/PlanSelectorUtils"
import { TranslationKeyType } from "../misc/TranslationKey"
import { LoginButtonAttrs } from "../gui/base/buttons/LoginButton"
import { PlanSelector, PlanSelectorAttr, SubscriptionActionButtons } from "../subscription/PlanSelector"
import { AvailablePlanType, PlanType, PlanTypeToName } from "../api/common/TutanotaConstants"
import { getAsLazy } from "@tutao/tutanota-utils"
import { lang } from "../misc/LanguageViewModel"
import { px } from "../gui/size"
import { styles } from "../gui/styles"
import { MessageBanner } from "../subscription/components/MessageBanner"
import { Icons } from "../gui/base/icons/Icons"

export class PlanSelectorPage implements ClassComponent<WizardStepComponentAttrs<SignupViewModel>> {
	view(vnode: Vnode<WizardStepComponentAttrs<SignupViewModel>>) {
		const ctx = vnode.attrs.ctx
		const data = ctx.viewModel
		const { planPrices, acceptedPlans, accountingInfo } = data
		let availablePlans = acceptedPlans
		const isApplePrice = shouldShowApplePrices(accountingInfo ?? null)
		const discountDetails = getDiscountDetails(isApplePrice, planPrices!)
		const promotionMessage = planPrices!.getRawPricingData().messageTextId as TranslationKeyType

		const button: LoginButtonAttrs = {
			label: "pricing.select_action",
			onclick: () => {},
		}

		const actionButtons: SubscriptionActionButtons = {
			[PlanType.Free]: getAsLazy(button),
			[PlanType.Revolutionary]: getAsLazy(button),
			[PlanType.Legend]: getAsLazy(button),
		}
		const isBusiness = ctx.viewModel.options.businessUse()

		return m(
			`.full-width${styles.isMobileLayout() ? ".pt-16" : ""}`,
			// Headline for a global campaign
			!data.options!.businessUse() &&
				anyHasGlobalFirstYearCampaign(discountDetails) &&
				m(
					"",
					{ style: { "max-width": px(530) } },

					m(MessageBanner, { translation: lang.getTranslation("pricing.cyber_monday_msg"), type: "base", icon: Icons.Gift }),
				),
			// Headline for general messages
			data.msg && m(MessageBanner, { translation: data.msg, type: "base" }),
			// Headline for promotional messages
			promotionMessage && m(MessageBanner, { translation: lang.getTranslation(promotionMessage), type: "base" }),

			m(
				".flex.flex-column.items-start.full-width",
				{
					style: {
						"max-width": px(1000),
						"margin-inline": "auto",
					},
				},
				[
					m(
						`h1.font-mdio${styles.isMobileLayout() ? ".h3" : ".h1"}`,
						{
							style: {
								position: "relative",
								top: px(-6),
							},
						},
						lang.getTranslationText("planselector_page_title"),
					),
					m(`p.mb-32`, lang.getTranslationText("planselector_page_subtitle")),
					m(
						`.flex.gap-64.full-width${isBusiness ? ".justify-center" : ""}`,
						m(
							".flex-grow",
							{
								style: {
									"max-width": styles.isMobileLayout() ? "initial" : isBusiness ? px(860) : px(530),
								},
							},
							m(PlanSelector, {
								options: data.options!,
								actionButtons: actionButtons,
								priceAndConfigProvider: planPrices!,
								availablePlans: availablePlans!,
								isApplePrice,
								currentPlan: data.currentPlan ?? undefined,
								currentPaymentInterval: getCurrentPaymentInterval(accountingInfo!),
								allowSwitchingPaymentInterval: isApplePrice || data.upgradeType !== UpgradeType.Switch,
								showMultiUser: false,
								discountDetails,
								targetPlan: data.targetPlanType!,
								onContinue: (selectedPlan: AvailablePlanType) => {
									data.targetPlanType = selectedPlan
									data.updatePrice()
									ctx.setLabel(PlanTypeToName[selectedPlan])
									ctx.goNext()
								},
								newSignupFlow: true,
							} satisfies PlanSelectorAttr),
						),
					),
				],
			),
		)
	}
}
