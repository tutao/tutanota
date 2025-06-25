import m, { Component, Vnode } from "mithril"
import { px, size } from "../gui/size"
import { lang } from "../misc/LanguageViewModel"
import { type Callback } from "@tutao/tutanota-utils"
import { PlanType, PlanTypeToName } from "../api/common/TutanotaConstants"
import { PaymentInterval, PriceAndConfigProvider } from "./PriceUtils"
import Stream from "mithril/stream"
import { theme } from "../gui/theme.js"
import { ReplacementKey } from "./FeatureListProvider.js"
import { Icon, IconSize } from "../gui/base/Icon.js"
import { Icons } from "../gui/base/icons/Icons.js"
import { TranslationKeyType } from "../misc/TranslationKey.js"
import { styles } from "../gui/styles.js"
import { getBlueTheme, planBoxColors } from "./PlanBoxColors.js"
import { locator } from "../api/main/CommonLocator.js"
import { isIOSApp } from "../api/common/Env"
import { getFeaturePlaceholderReplacement } from "./SubscriptionUtils.js"
import { CurrentPlanLabel } from "./parts/CurrentPlanLabel.js"

type AvailablePlan = PlanType.Revolutionary | PlanType.Legend

type PlanBoxAttrs = {
	price: string
	/**
	 * Null when we do not want to show the difference between actual price and reference price.
	 */
	referencePrice?: string
	selectedPaymentInterval: Stream<PaymentInterval>
	isSelected: boolean
	isDisabled: boolean
	isCurrentPlan: boolean
	plan: AvailablePlan
	onclick: Callback<AvailablePlan>
	priceAndConfigProvider: PriceAndConfigProvider
	scale: CSSStyleDeclaration["scale"]
	hasCampaign: boolean
	isApplePrice: boolean
	/*
	 * Depends on whether the free plan box is rendered under the paid plans, styles for the paid plan boxes will be changed
	 */
	hideFreePlan: boolean
	showMultiUser: boolean
}

export class PaidPlanBox implements Component<PlanBoxAttrs> {
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
		attrs: {
			price,
			referencePrice,
			selectedPaymentInterval,
			isSelected,
			isDisabled,
			isCurrentPlan,
			plan,
			onclick,
			priceAndConfigProvider,
			scale,
			hasCampaign,
			isApplePrice,
			showMultiUser,
            hideFreePlan
		},
	}: Vnode<PlanBoxAttrs>) {
		const isLegendPlan = plan === PlanType.Legend
		const isYearly = selectedPaymentInterval() === PaymentInterval.Yearly
		const strikethroughPrice = isYearly ? referencePrice : undefined
		// Only for Go European campaign as the campaign needs to use the blue theme always. This should be removed after the campaign.
		const localTheme = hasCampaign ? getBlueTheme() : theme

		const renderFeature = this.generateRenderFeature(plan, priceAndConfigProvider, isSelected, isDisabled, hasCampaign)
		const getPriceHintStr = (): String => {
			if (showMultiUser) {
				return lang.get("pricing.perUserMonth_label")
			}
			if (isApplePrice && isYearly) {
				return lang.get("pricing.perYear_label")
			} else {
				return lang.get("pricing.perMonth_label")
			}
		}

		return m(
			`.buyOptionBox-v2${isSelected ? ".selected" : ""}${isDisabled ? "" : ".cursor-pointer"}`,
			{
				style: {
					scale,
					"z-index": isSelected ? "1" : "initial",
					"transform-origin": isLegendPlan ? "center right" : "center left",
					"pointer-event": isDisabled ? "none" : "initial",
				},
			},

			hasCampaign &&
				m(
					".full-width.pt-xs.pb-xs.text-center.b.smaller",
					{
						style: {
							"background-color": theme.go_european,
							color: theme.on_go_european,
							...(!styles.isMobileLayout() && {
								"border-radius": `${isLegendPlan ? "0" : px(size.border_radius_large)}
									${isLegendPlan ? px(size.border_radius_large) : "0"} 0 0`,
							}),
						},
					},
					(isIOSApp() ? lang.get("save_action") : lang.get("pricing.saveAmount_label", { "{amount}": "50%" })).toUpperCase(),
				),
			m(
				"",
				{
					style: {
						"background-color": planBoxColors.getBgColor(isSelected),
						color: planBoxColors.getTextColor(isSelected, isDisabled, hasCampaign),
						"min-height": px(270),
						height: "100%",
						"border-style": "solid",
						"border-color": planBoxColors.getOutlineColor(isSelected),
						"border-width": isLegendPlan
							? this.getLegendBorderWidth(isSelected, hasCampaign, hideFreePlan)
							: this.getRevoBorderWidth(isSelected, hasCampaign, hideFreePlan),
						"border-radius": isLegendPlan
							? this.getLegendBorderRadius(hasCampaign, hideFreePlan)
							: this.getRevoBorderRadius(hasCampaign, hideFreePlan),
						...(isSelected && { "box-shadow": planBoxColors.getBoxShadow() }),
						overflow: "hidden",
						padding: `${px(20)} ${px(styles.isMobileLayout() ? 16 : 20)}`,
					},
					onclick: () => !isDisabled && onclick?.(plan),
				},

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
							"accent-color": localTheme.experimental_on_primary_container,
							opacity: isDisabled ? "0" : "1",
						},
						disabled: isDisabled,
					}),
					m(
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
					".flex.mt-s",
					{
						style: {
							"justify-content": isLegendPlan ? "start" : "end",
							"flex-direction": isLegendPlan ? "row-reverse" : "row",
							height: px(size.button_height_compact),
						},
					},
					isCurrentPlan ? m(CurrentPlanLabel) : m(".smaller", isLegendPlan ? lang.get("allYouNeed_label") : lang.get("mostPopular_label")),
				),
				m(".flex-space-between.gap-hpad.mt.mb", { style: { "flex-direction": isLegendPlan ? "row-reverse" : "row" } }, [
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
							".flex.items-end.wrap",
							{
								style: {
									gap: px(3),
									"flex-direction": isLegendPlan ? "row-reverse" : "row",
									"justify-content": isLegendPlan ? "start" : "end",
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
										...(isApplePrice && { "font-size": px(20), "font-weight": "bold" }),
									},
								},
								price,
							),
						),
						m(
							".small.flex",
							{ style: { "justify-content": "center", "column-gap": px(1) } },
							m("span", getPriceHintStr()),
							hasCampaign && m("sup", { style: { "font-size": px(8) } }, "1"),
						),
					),
				]),

				m(
					".flex.flex-column.gap-vpad-s",
					renderFeature("pricing.comparisonStorage_msg", Icons.PricingStorage, "storage"),
					renderFeature("pricing.calendarsPremium_label", Icons.PricingCalendar),
					renderFeature("pricing.mailAddressAliasesShort_label", Icons.PricingMail, "mailAddressAliases"),
					renderFeature("pricing.comparisonCustomDomains_msg", Icons.PricingCustomDomain, "customDomains"),
					renderFeature(isLegendPlan ? "pricing.comparisonSupportPro_msg" : "pricing.comparisonSupportPremium_msg", Icons.PricingSupport),
				),
			),
		)
	}

	private generateRenderFeature(planType: PlanType, provider: PriceAndConfigProvider, isSelected: boolean, isDisabled: boolean, hasCampaign: boolean) {
		return (langKey: TranslationKeyType, icon: Icons, replacement?: ReplacementKey) => {
			return m(
				".flex",
				{
					style: {
						gap: px(size.hpad_small),
					},
				},
				m(Icon, {
					icon,
					size: IconSize.Normal,
					style: {
						fill: planBoxColors.getFeatureIconColor(isSelected, isDisabled, planType, hasCampaign),
					},
				}),
				m(".smaller", lang.get(langKey, getFeaturePlaceholderReplacement(replacement, planType, provider))),
			)
		}
	}

	private getLegendBorderWidth(isSelected: boolean, hasBanner: boolean, hideFreePlan: boolean) {
		const bottomBorderWidth = hideFreePlan ? "2px" : "1px"

		if (isSelected) {
			return "0"
		}

		const topBorderWidth = hasBanner ? "0" : "2px"
		if (styles.isMobileLayout()) {
			return `${topBorderWidth} 0 ${bottomBorderWidth} 1px`
		} else {
			return `${topBorderWidth} 2px ${bottomBorderWidth} 1px`
		}
	}

	private getLegendBorderRadius(hasBanner: boolean, hideFreePlan: boolean) {
		const bottomRightRadius = hideFreePlan ? px(size.border_radius_large) : 0
		const topRightRadius = hasBanner ? "0" : px(size.border_radius_large)
		if (styles.isMobileLayout()) {
			return `0 0 0 0`
		} else {
			return `0 ${topRightRadius} ${bottomRightRadius} 0`
		}
	}

	private getRevoBorderWidth(isSelected: boolean, hasBanner: boolean, hideFreePlan: boolean) {
		const bottomBorderWidth = hideFreePlan ? "2px" : "1px"

		if (isSelected) {
			return "0"
		}

		const topBorderWidth = hasBanner ? "0" : "2px"
		if (styles.isMobileLayout()) {
			return `${topBorderWidth} 1px ${bottomBorderWidth} 0`
		} else {
			return `${topBorderWidth} 1px ${bottomBorderWidth} 2px`
		}
	}

	private getRevoBorderRadius(hasBanner: boolean, hideFreePlan: boolean) {
		const bottomLeftRadius = hideFreePlan ? px(size.border_radius_large) : 0
		const topLeftRadius = hasBanner ? "0" : px(size.border_radius_large)
		if (styles.isMobileLayout()) {
			return `0 0 0 0`
		} else {
			return `${topLeftRadius} 0 0 ${bottomLeftRadius}`
		}
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
