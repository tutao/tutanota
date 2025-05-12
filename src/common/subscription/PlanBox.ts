import m, { Component, Vnode } from "mithril"
import { px, size } from "../gui/size"
import { lang } from "../misc/LanguageViewModel"
import { type Callback } from "@tutao/tutanota-utils"
import { PlanType, PlanTypeToName } from "../api/common/TutanotaConstants"
import { PaymentInterval, PriceAndConfigProvider } from "./PriceUtils"
import Stream from "mithril/stream"
import { theme } from "../gui/theme.js"
import { FeatureListProvider, ReplacementKey } from "./FeatureListProvider.js"
import { Icon, IconSize } from "../gui/base/Icon.js"
import { Icons } from "../gui/base/icons/Icons.js"
import { getReplacement, Variant } from "./PlanSelector.js"
import { TranslationKeyType } from "../misc/TranslationKey.js"
import { styles } from "../gui/styles.js"
import { planBoxColors } from "./PlanBoxColors.js"
import { locator } from "../api/main/CommonLocator.js"

type AvailablePlan = PlanType.Revolutionary | PlanType.Legend

type PlanBoxAttrs = {
	price: string
	/**
	 * Null when we do not want to show the difference between actual price and reference price.
	 */
	referencePrice?: string
	selectedPaymentInterval: Stream<PaymentInterval>
	isSelected: boolean
	plan: AvailablePlan
	onclick: Callback<AvailablePlan>
	features: ReturnType<FeatureListProvider["getFeatureList"]>
	priceAndConfigProvider: PriceAndConfigProvider
	variant: Variant
	scale: CSSStyleDeclaration["scale"]
}

export class PlanBox implements Component<PlanBoxAttrs> {
	private revoIconSvg: string | undefined
	private legendIconSvg: string | undefined

	async oninit() {
		const [revo, legend] = await Promise.all([
			fetch(`${window.tutao.appState.prefixWithoutFile}/images/revo.svg`),
			fetch(`${window.tutao.appState.prefixWithoutFile}/images/legend.svg`),
		])
		this.revoIconSvg = await revo.text()
		this.legendIconSvg = await legend.text()

		m.redraw()
	}

	view({
		attrs: { plan, isSelected, onclick, priceAndConfigProvider, price, referencePrice, selectedPaymentInterval, variant, scale },
	}: Vnode<PlanBoxAttrs>) {
		const isLegendPlan = plan === PlanType.Legend
		const isYearly = selectedPaymentInterval() === PaymentInterval.Yearly

		const strikethroughPrice = isYearly ? referencePrice : undefined

		const renderFeature = this.generateRenderFeature(plan, priceAndConfigProvider, isSelected)

		return m(
			`.cursor-pointer.buyOptionBox-v2${isSelected ? ".selected" : ""}`,
			{
				style: {
					"background-color": planBoxColors.getBgColor({ isSelected }),
					color: planBoxColors.getTextColor({ isSelected }),
					scale,
					"z-index": isSelected ? "1" : "initial",
					"min-height": px(270),
					"border-style": "solid",
					"border-color": planBoxColors.getOutlineColor({ isSelected }),
					"border-width": isLegendPlan ? this.getLegendBorderWidth({ isSelected, variant }) : this.getRevoBorderWidth({ isSelected, variant }),
					"border-radius": isLegendPlan ? this.getLegendBorderRadius({ variant }) : this.getRevoBorderRadius({ variant }),
					"transform-origin": isLegendPlan ? "center right" : "center left",
					...(isSelected && { "box-shadow": planBoxColors.getBoxShadow() }),
					padding: `24px ${px(styles.isMobileLayout() ? 16 : 20)}`,
				},
				onclick: () => onclick?.(plan),
			},
			[
				m(
					".flex.items-center.pb",
					{
						style: {
							gap: "8px",
							"border-bottom": `1px solid ${this.getIconColor({ isSelected })}`,
							...(styles.isMobileLayout()
								? {
										"align-items": plan === PlanType.Revolutionary ? "flex-end" : "flex-start",
										"flex-direction": "column",
								  }
								: {
										...(plan === PlanType.Revolutionary && { "flex-direction": "row-reverse" }),
								  }),
						},
					},
					m("input[type=radio].m-0.big-radio", {
						name: "BuyOptionBox",
						checked: isSelected,
						style: {
							"accent-color": theme.experimental_on_primary_container,
						},
					}),
					m(
						// we need some margin for the discount banner for longer translations shown on the website
						".text-center.flex.col.center-horizontally.m-0.font-mdio",
						{
							style: {
								"font-size": px(styles.isMobileLayout() ? 18 : 20),
							},
						},
						PlanTypeToName[plan],
					),
				),
				m(
					".flex",
					{
						style: {
							"align-self": isLegendPlan ? "start" : "end",
						},
					},
					m(".smaller.mt-s", isLegendPlan ? lang.get("allYouNeed_label") : lang.get("mostPopular_label")),
				),
				m(
					".flex-space-between.gap-hpad.mt.mb",
					{
						style: { "flex-direction": isLegendPlan ? "row-reverse" : "row" },
					},
					[
						m(
							"",
							{
								style: {
									height: px(35),
									fill: this.getIconColor({ isSelected }),
								},
							},
							!this.revoIconSvg || !this.legendIconSvg || styles.bodyWidth <= 420
								? null
								: m.trust(isLegendPlan ? this.legendIconSvg : this.revoIconSvg),
						),
						m(
							".flex.flex-column",
							{
								style: {
									"align-items": isLegendPlan ? "start" : "end",
								},
							},
							m(
								".flex",
								{
									style: {
										gap: px(3),
										"align-items": "end",
										"flex-direction": isLegendPlan ? "row-reverse" : "row",
									},
								},
								strikethroughPrice?.trim() !== ""
									? m(
											".strike",
											{
												style: {
													fontSize: px(size.font_size_smaller),
													justifySelf: "end",
												},
											},
											strikethroughPrice,
									  )
									: m(""),
								m(
									".h1",
									{
										style: {
											"line-height": "100%",
										},
									},
									price,
								),
							),
							m(".small.flex", { style: { "justify-content": "center", "column-gap": px(1) } }, m("span", lang.get("pricing.perMonth_label"))),
						),
					],
				),

				m(
					".flex.flex-column.gap-vpad-s",
					renderFeature("pricing.comparisonStorage_msg", Icons.PricingStorage, "storage"),
					renderFeature("pricing.calendarsPremium_label", Icons.PricingCalendar),
					renderFeature("pricing.mailAddressAliasesShort_label", Icons.PricingMail, "mailAddressAliases"),
					renderFeature("pricing.comparisonCustomDomains_msg", Icons.PricingCustomDomain, "customDomains"),
					renderFeature(isLegendPlan ? "pricing.comparisonSupportPro_msg" : "pricing.comparisonSupportPremium_msg", Icons.PricingSupport),
				),
			],
		)
	}

	private generateRenderFeature(planType: PlanType, provider: PriceAndConfigProvider, isSelected: boolean) {
		return (langKey: TranslationKeyType, icon: Icons, replacement?: ReplacementKey) => {
			return m(
				".flex",
				{
					style: {
						gap: px(size.hpad_small),
					},
				},
				[
					m(Icon, {
						icon,
						size: IconSize.Normal,
						style: {
							fill: planBoxColors.getFeatureIconColor({ isSelected, planType }),
						},
					}),
					m(".smaller", lang.get(langKey, getReplacement(replacement, planType, provider))),
				],
			)
		}
	}

	private getLegendBorderWidth({ isSelected, variant }: { isSelected: boolean; variant: Variant }) {
		if (isSelected) {
			return "0"
		}

		if (variant === "C") {
			if (styles.isMobileLayout()) {
				return "2px 0 1px 1px"
			} else {
				return "2px 2px 1px 1px"
			}
		}

		if (variant === "B") {
			if (styles.isMobileLayout()) {
				return "2px 0 2px 1px"
			} else {
				return "2px 2px 2px 0"
			}
		}

		return "0"
	}

	private getLegendBorderRadius({ variant }: { variant: Variant }) {
		if (variant === "B") {
			if (styles.isMobileLayout()) {
				return "0 0 0 0"
			} else {
				return `0 ${px(size.border_radius_large)} ${px(size.border_radius_large)} 0`
			}
		}

		if (variant === "C") {
			if (styles.isMobileLayout()) {
				return `0 0 0 0`
			} else {
				return `0 ${px(size.border_radius_large)} 0 0`
			}
		}

		return "0"
	}

	private getRevoBorderWidth({ isSelected, variant }: { isSelected: boolean; variant: Variant }) {
		if (isSelected) {
			return "0"
		}

		if (variant === "C") {
			if (styles.isMobileLayout()) {
				return "2px 1px 1px 0"
			} else {
				return "2px 1px 1px 2px"
			}
		}

		if (variant === "B") {
			if (styles.isMobileLayout()) {
				return "2px 1px 2px 0"
			} else {
				return "2px 1px 2px 2px"
			}
		}

		return "0"
	}

	private getRevoBorderRadius({ variant }: { variant: Variant }) {
		if (variant === "B") {
			if (styles.isMobileLayout()) {
				return "0 0 0 0"
			} else {
				return `${px(size.border_radius_large)} 0 0 ${px(size.border_radius_large)}`
			}
		}

		if (variant === "C") {
			if (styles.isMobileLayout()) {
				return `0 0 0 0`
			} else {
				return `${px(size.border_radius_large)} 0 0 0`
			}
		}

		return "0"
	}

	// TODO: Update color to follow the Material 3 color rules after the color token update
	private getIconColor({ isSelected }: { isSelected: boolean }): string {
		if (locator.themeController.isLightTheme()) {
			if (isSelected) {
				return "#DED2CB" // light-dark-peach
			} else {
				return "#D5D5D5"
			}
		} else {
			if (isSelected) {
				return "#9F8D83" // dark-dark-peach
			} else {
				return "#707070"
			}
		}
	}
}
