import m, { Children, ClassComponent, Component, Vnode, VnodeDOM } from "mithril"
import { lang } from "../misc/LanguageViewModel"
import { PlanBox } from "./PlanBox.js"
import { formatMonthlyPrice, PaymentInterval, PriceAndConfigProvider } from "./PriceUtils"
import { FeatureListProvider, ReplacementKey, SelectedSubscriptionOptions, UpgradePriceType } from "./FeatureListProvider"
import { downcast, lazy } from "@tutao/tutanota-utils"
import { AvailablePlanType, CustomDomainType, CustomDomainTypeCountName, Keys, NewBusinessPlans, PlanType, TabIndex } from "../api/common/TutanotaConstants.js"
import { px, size } from "../gui/size.js"
import { LoginButton, LoginButtonAttrs, LoginButtonType } from "../gui/base/buttons/LoginButton.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { Button, ButtonType } from "../gui/base/Button.js"
import { theme } from "../gui/theme.js"
import { styles } from "../gui/styles.js"
import { FreePlanBox } from "./FreePlanBox.js"
import { AriaRole } from "../gui/AriaUtils.js"
import { isKeyPressed } from "../misc/KeyManager.js"
import { boxShadow } from "../gui/main-styles.js"
import { getPlanSelectorTest } from "./UpgradeSubscriptionWizard.js"
import { windowFacade } from "../misc/WindowFacade.js"
import { locator } from "../api/main/CommonLocator.js"

type PlanSelectorAttr = {
	options: SelectedSubscriptionOptions
	actionButtons: SubscriptionActionButtons
	featureListProvider: FeatureListProvider
	priceAndConfigProvider: PriceAndConfigProvider
	variant: Variant
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

	oncreate() {
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

	view({ attrs: { options, priceAndConfigProvider, variant, featureListProvider, actionButtons } }: Vnode<PlanSelectorAttr>): Children {
		const isYearly = options.paymentInterval() === PaymentInterval.Yearly

		function renderFootnoteElement(): Children {
			if (priceAndConfigProvider.getRawPricingData().firstMonthForFreeForYearlyPlan && isYearly) {
				return m(".flex.column-gap-s", m("span", m("sup", "1")), m("span", lang.get("firstMonthForFreeDetail_msg")))
			}

			return undefined
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
					m(
						".flex.gap-hpad",
						{
							style: {
								"align-items": "center",
							},
						},
						m(
							"div",
							{
								class: [isYearly ? "font-weight-600" : "", "right", "full-width"].join(" "),
							},
							"Yearly",
						),
						m(PaymentIntervalSwitch, {
							state: isYearly ? "left" : "right",
							onclick: (value) => options.paymentInterval(value === "left" ? PaymentInterval.Yearly : PaymentInterval.Monthly),
							ariaLabel: lang.get("emptyString_msg"),
						}),
						m(
							"div",
							{
								class: [!isYearly ? "font-weight-600" : "", "left", "full-width"].join(" "),
							},
							"Monthly",
						),
					),
					m(
						".flex-column",
						{
							"data-testid": "dialog:select-subscription",
							style: {
								position: "relative",
								...(styles.isMobileLayout()
									? {
											width: `calc(100% + 2 * ${px(size.hpad_large)})`,
											left: "50%",
											transform: "translateX(-50%)",
									  }
									: {
											width: "fit-content",
											"margin-inline": "auto",
											"max-width": px(500),
									  }), // Collapse the padding caused by `Dialog.largeDialog` parent wrapper.
							},
						},
						m(
							"div.flex",
							{
								style: {
									width: "100%",
								},
							},
							[PlanType.Revolutionary, PlanType.Legend].map((personalPlan: PlanType.Legend | PlanType.Revolutionary) => {
								const { referencePriceStr, priceStr } = this.getPrices({
									priceAndConfigProvider,
									targetPlan: personalPlan,
									paymentInterval: options.paymentInterval(),
								})

								return m(PlanBox, {
									price: priceStr,
									referencePrice: referencePriceStr,
									plan: personalPlan,
									features: featureListProvider.getFeatureList(personalPlan),
									isSelected: personalPlan === this.currentPlan(),
									onclick: (newPlan) => this.currentPlan(newPlan),
									scale: this.scale[personalPlan],
									selectedPaymentInterval: options.paymentInterval,
									priceAndConfigProvider,
									variant: variant,
								})
							}),
						),
						variant === "C" &&
							m(FreePlanBox, {
								isSelected: this.currentPlan() === PlanType.Free,
								select: () => this.currentPlan(PlanType.Free),
								priceAndConfigProvider,
								features: featureListProvider.getFeatureList(PlanType.Free),
								scale: this.scale[PlanType.Free],
							}),
					),
				),
				m(
					".flex.flex-column.gap-vpad",
					m(
						"#continue-wrapper.flex-v-center",
						{
							style: this.shouldFixButtonPos() && {
								position: "fixed",
								height: px(size.button_floating_size),
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
									"min-width": px(265),
									"max-width": px(265),
									"margin-inline": "auto",
								},
							},
							m(LoginButton, {
								label: "continue_action",
								type: LoginButtonType.FullWidth,
								onclick: (event, dom) => actionButtons[this.currentPlan() as AvailablePlans]().onclick(event, dom),
							}),
						),
					),
					variant === "B" &&
						m(Button, {
							type: ButtonType.Secondary,
							label: lang.makeTranslation("", "Start with a free account"),
							click: (event, dom) => actionButtons[PlanType.Free]().onclick(event, dom),
						}),
				),
				m(".flex.flex-column", [
					m(".smaller.mb.center", lang.get("pricing.subscriptionPeriodInfoPrivate_msg")),
					m(".smaller.mb", renderFootnoteElement()),
				]),
			],
		)
	}

	private getPrices({
		priceAndConfigProvider,
		targetPlan,
		paymentInterval,
	}: {
		priceAndConfigProvider: PriceAndConfigProvider
		paymentInterval: PaymentInterval
		targetPlan: PlanType.Legend | PlanType.Revolutionary
	}) {
		const subscriptionPrice = priceAndConfigProvider.getSubscriptionPrice(paymentInterval, targetPlan, UpgradePriceType.PlanActualPrice)

		let priceStr: string
		let referencePriceStr: string | undefined = undefined
		const referencePrice = priceAndConfigProvider.getSubscriptionPrice(paymentInterval, targetPlan, UpgradePriceType.PlanReferencePrice)
		priceStr = formatMonthlyPrice(subscriptionPrice, paymentInterval)
		if (referencePrice > subscriptionPrice) {
			// if there is a discount for this plan we show the original price as reference
			referencePriceStr = formatMonthlyPrice(referencePrice, paymentInterval)
		} else if (paymentInterval == PaymentInterval.Yearly && subscriptionPrice !== 0) {
			// if there is no discount for any plan then we show the monthly price as reference
			const monthlyReferencePrice = priceAndConfigProvider.getSubscriptionPrice(PaymentInterval.Monthly, targetPlan, UpgradePriceType.PlanActualPrice)
			referencePriceStr = formatMonthlyPrice(monthlyReferencePrice, PaymentInterval.Monthly)
		}

		return { priceStr, referencePriceStr }
	}

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

	private readonly handleResize = () => {
		// Change the position of the "Continue" button to be fixed on the bottom
		// if there is not enough space to show the button without scrolling
		const planSelectorEl = document.querySelector("#plan-selector")
		const containerEl = document.querySelector(".dialog-container")
		if (planSelectorEl && containerEl) {
			const contentHeight = parseInt(getComputedStyle(planSelectorEl).height)
			const containerHeight = parseInt(getComputedStyle(containerEl).height)

			this.shouldFixButtonPos(contentHeight + size.button_floating_size > containerHeight)
		}
	}
}

export function completeSelectedStage(planType: PlanType, paymentInterval?: PaymentInterval): void {
	const test = getPlanSelectorTest()
	const stage = test.getStage(1)
	const planValue = getPlanMetricValue(planType, paymentInterval)

	if (planValue) {
		stage.setMetric({
			name: "plan",
			value: planValue,
		})

		void stage.complete()
	}
}

/**
 * get a string to insert into a translation with a slot.
 * if no key is found, undefined is returned and nothing is replaced.
 */
export function getReplacement(
	key: ReplacementKey | undefined,
	subscription: PlanType,
	priceAndConfigProvider: PriceAndConfigProvider,
): Record<string, string | number> | undefined {
	switch (key) {
		case "customDomains": {
			const customDomainType = downcast<CustomDomainType>(priceAndConfigProvider.getPlanPricesForPlan(subscription).planConfiguration.customDomainType)
			return { "{amount}": CustomDomainTypeCountName[customDomainType] }
		}
		case "mailAddressAliases":
			return { "{amount}": priceAndConfigProvider.getPlanPricesForPlan(subscription).planConfiguration.nbrOfAliases }
		case "storage":
			return { "{amount}": priceAndConfigProvider.getPlanPricesForPlan(subscription).planConfiguration.storageGb }
		case "label": {
			return { "{amount}": priceAndConfigProvider.getPlanPricesForPlan(subscription).planConfiguration.maxLabels }
		}
	}
}

type AvailablePlans = PlanType.Revolutionary | PlanType.Legend | PlanType.Free

type SwitchState = "left" | "right"

type HTMLElementWithAttrs = Partial<Pick<m.Attributes, "class"> & Omit<HTMLElement, "style"> & PaymentIntervalSwitchAttrs>

interface PaymentIntervalSwitchAttrs {
	state: SwitchState
	onclick: (newState: SwitchState) => unknown
	ariaLabel: string
	classes?: Array<string>
}

class PaymentIntervalSwitch implements ClassComponent<PaymentIntervalSwitchAttrs> {
	private checkboxDom?: HTMLInputElement

	view({ attrs: { state, ariaLabel, onclick, classes }, children }: Vnode<PaymentIntervalSwitchAttrs>) {
		const childrenArr = [children, this.buildTogglePillComponent(state === "right", onclick)]

		return m(
			"label.tutaui-switch.flash",
			{
				class: [...(classes ?? []), "click", "fit-content"].join(" "),
				role: AriaRole.Switch,
				ariaLabel: ariaLabel,
				ariaChecked: String(state === "right"),
				ariaDisabled: undefined,
				tabIndex: Number(TabIndex.Default),
				onkeydown: (e: KeyboardEvent) => {
					if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
						e.preventDefault()
						this.checkboxDom?.click()
					}
				},
			} satisfies HTMLElementWithAttrs,
			childrenArr,
		)
	}

	private buildTogglePillComponent(checked: boolean = false, onclick: (state: SwitchState) => unknown) {
		return m(
			`span.tutaui-toggle-pill${locator.themeController.isLightTheme() ? ".payment-interval.light" : ".payment-interval.dark"}`,
			{
				style: {
					"background-color": locator.themeController.isLightTheme() ? "black" : "white",
				},
				class: this.checkboxDom?.checked ? "checked" : "unchecked",
			},
			m("input[type='checkbox']", {
				role: AriaRole.Switch,
				onclick: () => {
					onclick(this.checkboxDom?.checked ? "right" : "left")
				},
				oncreate: ({ dom }: VnodeDOM<HTMLInputElement>) => {
					this.checkboxDom = dom as HTMLInputElement
					this.checkboxDom.checked = checked
				},
				tabIndex: TabIndex.Programmatic,
				disabled: undefined,
			}),
		)
	}
}

const SELECTED_PLAN_SCALE = 1.03

function getPlanMetricValue(planType: PlanType, interval?: PaymentInterval) {
	if (planType == PlanType.Free) {
		return "Free"
	} else if (planType == PlanType.Revolutionary) {
		return interval == PaymentInterval.Monthly ? "Monthly_Revolutionary" : "Yearly_Revolutionary"
	} else if (planType == PlanType.Legend) {
		return interval == PaymentInterval.Monthly ? "Monthly_Legend" : "Yearly_Legend"
	} else if (NewBusinessPlans.includes(planType as AvailablePlanType)) {
		return "Business"
	}

	return null
}

export type SubscriptionActionButtons = Record<AvailablePlans, lazy<LoginButtonAttrs>>

export type Variant = "B" | "C"
