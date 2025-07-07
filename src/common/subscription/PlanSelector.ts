import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../misc/LanguageViewModel"
import { PaidPlanBox } from "./PaidPlanBox.js"
import { PaymentInterval, PriceAndConfigProvider } from "./PriceUtils"
import { SelectedSubscriptionOptions } from "./FeatureListProvider"
import { lazy } from "@tutao/tutanota-utils"
import { PlanType } from "../api/common/TutanotaConstants.js"
import { px, size } from "../gui/size.js"
import { LoginButton, LoginButtonAttrs, LoginButtonType } from "../gui/base/buttons/LoginButton.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { theme } from "../gui/theme.js"
import { styles } from "../gui/styles.js"
import { FreePlanBox } from "./FreePlanBox.js"
import { boxShadow } from "../gui/main-styles.js"
import { windowFacade } from "../misc/WindowFacade.js"
import { getApplePriceStr, getPriceStr } from "./SubscriptionUtils.js"
import { PaymentIntervalSwitch } from "./PaymentIntervalSwitch.js"

type PlanSelectorAttr = {
	options: SelectedSubscriptionOptions
	actionButtons: SubscriptionActionButtons
	priceAndConfigProvider: PriceAndConfigProvider
	hasCampaign: boolean
	hidePaidPlans: boolean
	isApplePrice: boolean
}

export class PlanSelector implements Component<PlanSelectorAttr> {
	private readonly currentPlan: Stream<AvailablePlans> = stream(PlanType.Revolutionary)
	private readonly shouldFixButtonPos: Stream<boolean> = stream(false)

	/**
	 * Timeout to scale the plan boxes. This is used to animate the scale of the selected plan box on load.
	 */
	private scaleTimeout?: ReturnType<typeof setTimeout>

	/**
	 * The scale of the plan boxes. This is used to animate the scale of the selected plan box.
	 */
	private scale: Record<AvailablePlans, CSSStyleDeclaration["scale"]> = {
		[PlanType.Revolutionary]: "initial",
		[PlanType.Legend]: "initial",
		[PlanType.Free]: "initial",
	}

	oncreate({ attrs: { hidePaidPlans } }: Vnode<PlanSelectorAttr>) {
		// Set the default selection to free when we need to hide paid plans. This would be the case if the user already has a paid Apple account.
		if (hidePaidPlans) this.currentPlan(PlanType.Free)

		// Set the scale of the selected plan box to `1.03` after a timeout to animate the scale of the selected plan box on loading.
		this.scaleTimeout = setTimeout(() => {
			this.scale = { ...this.scale, [PlanType.Revolutionary]: SELECTED_PLAN_SCALE.toString() }
			// Subscribe to the current plan to update the scale of the selected plan box when the user selects a different plan.
			this.currentPlan.map(this.scaleCurrentPlan)
		}, 500)

		this.handleResize()
		windowFacade.addResizeListener(this.handleResize)
	}

	/**
	 * Clears the timeout to scale the plan boxes, if it exists.
	 */
	onbeforeremove(): void {
		if (this.scaleTimeout) {
			clearTimeout(this.scaleTimeout)
		}

		windowFacade.removeResizeListener(this.handleResize)
	}

	view({ attrs: { options, priceAndConfigProvider, actionButtons, hasCampaign, hidePaidPlans, isApplePrice } }: Vnode<PlanSelectorAttr>): Children {
		const isYearly = options.paymentInterval() === PaymentInterval.Yearly

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

			if (hasCampaign && isYearly) {
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
				onclick: (event, dom) => actionButtons[this.currentPlan() as AvailablePlans]().onclick(event, dom),
				...(hasCampaign && {
					// As we modify the size of the Login button for the campaign, the normal "Continue" button should have the same size to avoid layout shifting
					class: "go-european-button",
					icon: m("img.block", {
						src: `${window.tutao.appState.prefixWithoutFile}/images/go-european/eu-quantum.svg`,
						alt: "",
						rel: "noreferrer",
						loading: "lazy",
						decoding: "async",
						style: {
							height: px(36),
							width: px(36),
						},
					}),
				}),
			})
		}

		const renderPaymentIntervalSwitch = () => {
			return m(
				".flex.gap-hpad.items-center",
				m(`div.right.full-width${isYearly ? ".font-weight-600" : ""}`, lang.getTranslationText("pricing.yearly_label")),
				m(PaymentIntervalSwitch, {
					state: isYearly ? "left" : "right",
					onclick: (value) => options.paymentInterval(value === "left" ? PaymentInterval.Yearly : PaymentInterval.Monthly),
					ariaLabel: lang.get("emptyString_msg"),
				}),
				m(`div.left.full-width${!isYearly ? ".font-weight-600" : ""}`, lang.getTranslationText("pricing.monthly_label")),
			)
		}

		return m(
			".flex.flex-column.gap-vpad-l",
			{
				style: this.shouldFixButtonPos() && {
					"padding-bottom": px(size.button_floating_size + size.vpad),
				},
				lang: lang.code,
			},
			[
				m(
					"#plan-selector.flex.flex-column.gap-vpad-l",
					!hidePaidPlans && renderPaymentIntervalSwitch(),
					m(
						".flex-column",
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
							!hidePaidPlans &&
								[PlanType.Revolutionary, PlanType.Legend].map((personalPlan: PlanType.Legend | PlanType.Revolutionary) => {
									const getPriceStrProps = {
										priceAndConfigProvider,
										targetPlan: personalPlan,
										paymentInterval: options.paymentInterval(),
									}
									const { referencePriceStr, priceStr } = isApplePrice ? getApplePriceStr(getPriceStrProps) : getPriceStr(getPriceStrProps)

									return m(PaidPlanBox, {
										price: priceStr,
										referencePrice: referencePriceStr,
										plan: personalPlan,
										isSelected: personalPlan === this.currentPlan(),
										onclick: (newPlan) => this.currentPlan(newPlan),
										scale: this.scale[personalPlan],
										selectedPaymentInterval: options.paymentInterval,
										priceAndConfigProvider,
										hasCampaign,
										isApplePrice,
									})
								}),
						),
						m(FreePlanBox, {
							isSelected: this.currentPlan() === PlanType.Free,
							select: () => this.currentPlan(PlanType.Free),
							priceAndConfigProvider,
							scale: this.scale[PlanType.Free],
							hasCampaign,
						}),
					),
				),
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
								"background-color": theme.content_bg,
								"z-index": 1,
								"box-shadow": boxShadow,
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
				!hidePaidPlans &&
					m(".flex.flex-column", [
						m(".small.mb.center", lang.get("pricing.subscriptionPeriodInfoPrivate_msg")),
						m(".small.mb", renderFootnoteElement()),
					]),
			],
		)
	}

	/**
	 * Zoom the currently selected plan to emphasize it.
	 */
	private scaleCurrentPlan = (selectedPlan: keyof typeof this.scale) => {
		let newScale: string = SELECTED_PLAN_SCALE.toString()

		if (selectedPlan === PlanType.Free && styles.isMobileLayout()) {
			newScale = "initial"
		}

		this.scale = {
			[PlanType.Revolutionary]: "initial",
			[PlanType.Legend]: "initial",
			[PlanType.Free]: "initial",
			[selectedPlan]: newScale,
		}
		m.redraw()
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

const SELECTED_PLAN_SCALE = 1.03

type AvailablePlans = PlanType.Revolutionary | PlanType.Legend | PlanType.Free

export type SubscriptionActionButtons = Record<AvailablePlans, lazy<LoginButtonAttrs>>
