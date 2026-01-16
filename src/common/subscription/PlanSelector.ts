import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../misc/LanguageViewModel"
import { PaymentInterval, PriceAndConfigProvider } from "./utils/PriceUtils"
import { SelectedSubscriptionOptions } from "./FeatureListProvider"
import { lazy } from "@tutao/tutanota-utils"
import { AvailablePlanType, PlanType } from "../api/common/TutanotaConstants.js"
import { component_size, px, size } from "../gui/size.js"
import { LoginButton, LoginButtonAttrs, TertiaryButton, TertiaryButtonAttrs } from "../gui/base/buttons/LoginButton.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { theme } from "../gui/theme.js"
import { boxShadowHigh } from "../gui/main-styles.js"
import { windowFacade } from "../misc/WindowFacade.js"
import { getApplePriceStr, getPriceStr } from "./utils/SubscriptionUtils.js"
import { PaymentIntervalSwitch } from "./components/PaymentIntervalSwitch.js"
import { PersonalPlanContainer } from "./components/PersonalPlanContainer.js"
import { BusinessPlanContainer } from "./components/BusinessPlanContainer.js"
import { getSafeAreaInsetBottom } from "../gui/HtmlUtils.js"
import { anyHasGlobalFirstYearCampaign, DiscountDetails, isPersonalPlanAvailable, shouldFixButtonPosition } from "./utils/PlanSelectorUtils.js"
import { styles } from "../gui/styles"
import { isIOSApp } from "../api/common/Env"

export type PlanSelectorAttr = {
	options: SelectedSubscriptionOptions
	actionButtons: SubscriptionActionButtons
	priceAndConfigProvider: PriceAndConfigProvider
	availablePlans: readonly AvailablePlanType[]
	isApplePrice: boolean
	currentPlan?: PlanType
	currentPaymentInterval?: PaymentInterval
	allowSwitchingPaymentInterval: boolean
	showMultiUser: boolean
	discountDetails?: DiscountDetails
	targetPlan: PlanType
	onContinue?: any
	newSignupFlow?: boolean
}

export class PlanSelector implements Component<PlanSelectorAttr> {
	private readonly selectedPlan: Stream<PlanType>
	private shouldFixButtonPos: boolean = false

	constructor({ attrs }: Vnode<PlanSelectorAttr>) {
		this.selectedPlan = stream(attrs.targetPlan)
	}

	oncreate({ attrs: { availablePlans, currentPlan } }: Vnode<PlanSelectorAttr>) {
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
			discountDetails,
			onContinue,
			newSignupFlow = false,
		},
	}: Vnode<PlanSelectorAttr>): Children {
		const isYearly = options.paymentInterval() === PaymentInterval.Yearly

		options.businessUse(!isPersonalPlanAvailable(availablePlans) ? true : options.businessUse())

		const renderFootnoteElement = (): Children => {
			const getLegendPriceStrProps = {
				priceAndConfigProvider,
				paymentInterval: PaymentInterval.Yearly,
				targetPlan: PlanType.Legend,
			}
			const { referencePriceStr: legendRefPriceStr } = isApplePrice ? getApplePriceStr(getLegendPriceStrProps) : getPriceStr(getLegendPriceStrProps)

			if (!options.businessUse() && anyHasGlobalFirstYearCampaign(discountDetails)) {
				return m(
					".flex.column-gap-4",
					m("span", m("sup", "1")),
					m(
						"span",
						lang.get(isApplePrice ? "pricing.firstYearDiscountIos_msg" : "pricing.firstYearDiscount_msg", {
							"{price}": legendRefPriceStr ?? "",
						}),
					),
				)
			}

			return undefined
		}

		const getContinueButtonWidth = () => {
			if (!newSignupFlow || styles.isMobileLayout() || this.shouldFixButtonPos) return "full"
			return "flex"
		}

		const renderActionButton = (onContinue: any): Children => {
			let temp = (event: any, dom: any) => actionButtons[this.selectedPlan() as AvailablePlans]().onclick(event, dom)
			let isBusiness = options.businessUse()
			if (onContinue) {
				temp = () => onContinue(this.selectedPlan())
			}
			return m(
				`.gap-8${!this.shouldFixButtonPos && newSignupFlow ? "" : ".full-width"}`,
				{
					style: {
						"padding-inline": this.shouldFixButtonPos ? px(size.spacing_16) : 0,
						display: "inline-grid",
						"grid-auto-flow": styles.isMobileLayout() || !newSignupFlow ? "row" : "column",
						"grid-auto-columns": "1fr",
						"margin-left": newSignupFlow ? "auto" : "initial",
						"max-width": newSignupFlow ? "initial" : px(400),
						width: styles.isMobileLayout() || !newSignupFlow ? "100%" : "fit-content",
					},
				},
				!this.shouldFixButtonPos &&
					newSignupFlow &&
					!isIOSApp() &&
					m(TertiaryButton, {
						label: isBusiness ? "privateUse_action" : "businessUse_action",
						width: "flex",
						onclick: () => options.businessUse(!isBusiness),
						style: {
							order: styles.isMobileLayout() ? 1 : -1,
						},
					} satisfies TertiaryButtonAttrs),
				m(LoginButton, {
					// The label text for go european campaign shall not be translated.
					label: "continue_action",
					width: getContinueButtonWidth(),
					onclick: temp,
					style: { order: 0 },
				}),
			)
		}

		const renderPaymentIntervalSwitch = () => {
			return m(
				".flex.gap-12.items-center",
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

		const bottomPad = Math.max(size.spacing_16, getSafeAreaInsetBottom())
		return m(
			".flex.flex-column.gap-32",
			{
				style: this.shouldFixButtonPos && {
					"padding-bottom": px(component_size.button_height + size.spacing_16 + getSafeAreaInsetBottom()),
				},
				lang: lang.code,
			},
			[
				m(
					".flex.flex-column.gap-32",
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
					discountDetails,
				}),
				m(
					`#continue-wrapper.flex-v-start.items-center.pt-16${newSignupFlow ? "" : ".plr-16"}`,
					{
						style: this.shouldFixButtonPos && {
							position: "fixed",
							height: px(component_size.button_height + size.spacing_16 + bottomPad),
							bottom: 0,
							left: 0,
							right: 0,
							"padding-bottom": px(bottomPad),
							"background-color": theme.surface,
							"z-index": 1,
							"box-shadow": boxShadowHigh,
						},
					},

					renderActionButton(onContinue),
				),

				this.shouldFixButtonPos &&
					newSignupFlow &&
					!isIOSApp() &&
					m(TertiaryButton, {
						label: options.businessUse() ? "privateUse_action" : "businessUse_action",
						width: "flex",
						onclick: () => options.businessUse(!options.businessUse()),
					} satisfies TertiaryButtonAttrs),

				!(availablePlans.length === 1 && availablePlans.includes(PlanType.Free)) &&
					m(
						".flex.flex-column",
						{
							style: {
								width: "100%",
								"margin-inline": "auto",
							},
						},
						[m(".small.mb-16", lang.get("pricing.subscriptionPeriodInfoPrivate_msg")), m(".small.mb-16", renderFootnoteElement())],
					),
			],
		)
	}

	/**
	 * Change the position of the "Continue" button to be fixed on the bottom
	 * if there is not enough space to show the button without scrolling.
	 */
	private readonly handleResize = () => {
		this.shouldFixButtonPos = shouldFixButtonPosition()
	}
}

export type AvailablePlans = PlanType.Revolutionary | PlanType.Legend | PlanType.Free

export type SubscriptionActionButtons = Record<AvailablePlans, lazy<LoginButtonAttrs>>
