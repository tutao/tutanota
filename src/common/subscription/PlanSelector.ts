import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../misc/LanguageViewModel"
import { PaymentInterval, PriceAndConfigProvider } from "./utils/PriceUtils"
import { SelectedSubscriptionOptions } from "./FeatureListProvider"
import { lazy } from "@tutao/tutanota-utils"
import { AvailablePlanType, PlanType } from "../api/common/TutanotaConstants.js"
import { px, size } from "../gui/size.js"
import { LoginButton, LoginButtonAttrs, LoginButtonType } from "../gui/base/buttons/LoginButton.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { theme } from "../gui/theme.js"
import { styles } from "../gui/styles.js"
import { boxShadowHigh } from "../gui/main-styles.js"
import { windowFacade } from "../misc/WindowFacade.js"
import { getApplePriceStr, getPriceStr } from "./utils/SubscriptionUtils.js"
import { PaymentIntervalSwitch } from "./components/PaymentIntervalSwitch.js"
import { PersonalPlanContainer } from "./components/PersonalPlanContainer"
import { BusinessPlanContainer } from "./components/BusinessPlanContainer"
import { DiscountDetail, isPersonalPlanAvailable } from "./utils/PlanSelectorUtils"
import { SignupFlowUsageTestController } from "./usagetest/UpgradeSubscriptionWizardUsageTestUtils"

type PlanSelectorAttr = {
	options: SelectedSubscriptionOptions
	actionButtons: SubscriptionActionButtons
	priceAndConfigProvider: PriceAndConfigProvider
	availablePlans: readonly AvailablePlanType[]
	isApplePrice: boolean
	currentPlan?: PlanType
	currentPaymentInterval?: PaymentInterval
	allowSwitchingPaymentInterval: boolean
	showMultiUser: boolean
	discountDetail?: DiscountDetail
}

export class PlanSelector implements Component<PlanSelectorAttr> {
	private readonly selectedPlan: Stream<PlanType> = stream(
		SignupFlowUsageTestController.getUsageTestVariant() === 1 ? PlanType.Revolutionary : PlanType.Legend,
	)
	private readonly shouldFixButtonPos: Stream<boolean> = stream(false)

	oncreate({ attrs: { availablePlans, currentPlan } }: Vnode<PlanSelectorAttr>) {
		if (availablePlans.includes(PlanType.Free) && availablePlans.length === 1) {
			// Only Free plan is available. This would be the case if the user already has a paid Apple account.
			this.selectedPlan(PlanType.Free)
		} else if ((!availablePlans.includes(PlanType.Revolutionary) && availablePlans.includes(PlanType.Legend)) || currentPlan === PlanType.Revolutionary) {
			// Only Legend plan is available or the current plan is Revolutionary.
			this.selectedPlan(PlanType.Legend)
		}

		this.handleResize()
		windowFacade.addResizeListener(this.handleResize)
	}

	onbeforeremove(): void {
		windowFacade.removeResizeListener(this.handleResize)
	}

	view({
		attrs: {
			options,
			priceAndConfigProvider,
			actionButtons,
			availablePlans,
			isApplePrice,
			currentPlan,
			currentPaymentInterval,
			allowSwitchingPaymentInterval,
			showMultiUser,
			discountDetail,
		},
	}: Vnode<PlanSelectorAttr>): Children {
		const isYearly = options.paymentInterval() === PaymentInterval.Yearly

		options.businessUse(!isPersonalPlanAvailable(availablePlans) ? true : options.businessUse())

		const renderFootnoteElement = (): Children => {
			const getRevoPriceStrProps = {
				priceAndConfigProvider,
				paymentInterval: PaymentInterval.Yearly,
				targetPlan: PlanType.Revolutionary,
			}
			const { referencePriceStr: revoRefPriceStr } = isApplePrice ? getApplePriceStr(getRevoPriceStrProps) : getPriceStr(getRevoPriceStrProps)

			const getLegendPriceStrProps = {
				priceAndConfigProvider,
				paymentInterval: PaymentInterval.Yearly,
				targetPlan: PlanType.Legend,
			}
			const { referencePriceStr: legendRefPriceStr } = isApplePrice ? getApplePriceStr(getLegendPriceStrProps) : getPriceStr(getLegendPriceStrProps)

			if (discountDetail?.discountType === "GlobalFirstYear" && isYearly) {
				return m(
					".flex.column-gap-s",
					m("span", m("sup", "1")),
					m(
						"span",
						lang.get(isApplePrice ? "pricing.firstYearDiscountIos_revo_legend_msg" : "pricing.firstYearDiscount_revo_legend_msg", {
							"{revo-price}": revoRefPriceStr ?? "",
							"{legend-price}": legendRefPriceStr ?? "",
						}),
					),
				)
			}

			return undefined
		}

		const renderActionButton = (): Children => {
			return m(LoginButton, {
				// The label text for go european campaign shall not be translated.
				label: "continue_action",
				type: LoginButtonType.FullWidth,
				onclick: (event, dom) => actionButtons[this.selectedPlan() as AvailablePlans]().onclick(event, dom),
				// Used for changing button design during global campaigns.
				// ...(discountDetail?.discountType === "GlobalFirstYear" && {
				// 	// As we modify the size of the Login button for the campaign, the normal "Continue" button should have the same size to avoid layout shifting
				// 	class: "go-european-button",
				// 	icon: m("img.block", {
				// 		src: `${window.tutao.appState.prefixWithoutFile}/images/go-european/eu-quantum.svg`,
				// 		alt: "",
				// 		rel: "noreferrer",
				// 		loading: "lazy",
				// 		decoding: "async",
				// 		style: {
				// 			height: px(36),
				// 			width: px(36),
				// 		},
				// 	}),
				// }),
			})
		}

		const renderPaymentIntervalSwitch = () => {
			return m(
				".flex.gap-hpad.items-center",
				m(`div.right.full-width${isYearly ? ".font-weight-600" : ""}`, lang.getTranslationText("pricing.yearly_label")),
				m(PaymentIntervalSwitch, {
					state: isYearly ? "left" : "right",
					onclick: (value) => {
						const targetInterval = value === "left" ? PaymentInterval.Yearly : PaymentInterval.Monthly
						options.paymentInterval(targetInterval)
						// Switch the selectedPlan to another plan to do not select the current plan with the current interval
						if (targetInterval === currentPaymentInterval && this.selectedPlan() === currentPlan) {
							this.selectedPlan(currentPlan === PlanType.Revolutionary ? PlanType.Legend : PlanType.Revolutionary)
						}
					},
					ariaLabel: lang.get("emptyString_msg"),
				}),
				m(`div.left.full-width${!isYearly ? ".font-weight-600" : ""}`, lang.getTranslationText("pricing.monthly_label")),
			)
		}

		return m(
			"#plan-selector.flex.flex-column.gap-vpad-l",
			{
				style: this.shouldFixButtonPos() && {
					"padding-bottom": px(size.button_floating_size + size.vpad),
				},
				lang: lang.code,
			},
			[
				m(
					".flex.flex-column.gap-vpad-l",
					!(availablePlans.length === 1 && availablePlans.includes(PlanType.Free)) && allowSwitchingPaymentInterval && renderPaymentIntervalSwitch(),
				),

				m(options.businessUse() ? BusinessPlanContainer : PersonalPlanContainer, {
					allowSwitchingPaymentInterval,
					availablePlans,
					currentPaymentInterval,
					currentPlan,
					isApplePrice,
					priceAndConfigProvider,
					selectedPlan: this.selectedPlan,
					selectedSubscriptionOptions: options,
					showMultiUser,
					discountDetail,
				}),
				m(
					".flex.flex-column.gap-vpad",
					m(
						"#continue-wrapper.flex-v-center.plr",
						{
							style: this.shouldFixButtonPos() && {
								position: "fixed",
								height: px(size.button_floating_size + size.vpad_xsm * 2),
								bottom: 0,
								left: 0,
								right: 0,
								"background-color": theme.surface,
								"z-index": 1,
								"box-shadow": boxShadowHigh,
							},
						},
						m(
							"",
							{
								style: {
									"min-width": styles.isMobileLayout() ? "100%" : px(265),
									"max-width": styles.isMobileLayout() ? "100%" : px(265),
									"margin-inline": "auto",
								},
							},
							renderActionButton(),
						),
					),
				),
				!(availablePlans.length === 1 && availablePlans.includes(PlanType.Free)) &&
					m(".flex.flex-column", [
						m(".small.mb.center", lang.get("pricing.subscriptionPeriodInfoPrivate_msg")),
						m(".small.mb", renderFootnoteElement()),
					]),
			],
		)
	}

	/**
	 * Change the position of the "Continue" button to be fixed on the bottom
	 * if there is not enough space to show the button without scrolling.
	 */
	private readonly handleResize = () => {
		const planSelectorEl = document.querySelector("#plan-selector")
		const containerEl = document.querySelector(".dialog-container")
		if (planSelectorEl && containerEl) {
			const contentHeight = parseInt(getComputedStyle(planSelectorEl).height)
			const containerHeight = parseInt(getComputedStyle(containerEl).height)

			this.shouldFixButtonPos(contentHeight + size.button_floating_size > containerHeight)
		}
	}
}

export type AvailablePlans = PlanType.Revolutionary | PlanType.Legend | PlanType.Free

export type SubscriptionActionButtons = Record<AvailablePlans, lazy<LoginButtonAttrs>>
