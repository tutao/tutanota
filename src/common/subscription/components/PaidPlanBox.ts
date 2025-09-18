import m, { Component, Vnode } from "mithril"
import { px, size } from "../../gui/size"
import { lang } from "../../misc/LanguageViewModel"
import { type Callback } from "@tutao/tutanota-utils"
import { PLAN_SELECTOR_SELECTED_BOX_SCALE, PlanType, PlanTypeToName } from "../../api/common/TutanotaConstants"
import { PaymentInterval, PriceAndConfigProvider } from "../PriceUtils"
import Stream from "mithril/stream"
import { theme } from "../../gui/theme.js"
import { ReplacementKey } from "../FeatureListProvider.js"
import { Icon, IconSize } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { TranslationKeyType } from "../../misc/TranslationKey.js"
import { styles } from "../../gui/styles.js"
import { getBlueTheme, planBoxColors } from "../PlanBoxColors.js"
import { isIOSApp } from "../../api/common/Env"
import { getFeaturePlaceholderReplacement } from "../SubscriptionUtils.js"
import { CurrentPlanLabel } from "./CurrentPlanLabel.js"
import { PlanConfig } from "./BusinessPlanBoxes"

type PlanBoxAttrs = {
	planConfig: PlanConfig
	price: string
	/**
	 * Null when we do not want to show the difference between actual price and reference price.
	 */
	referencePrice?: string
	selectedPaymentInterval: Stream<PaymentInterval>
	isSelected: boolean
	isDisabled: boolean
	isCurrentPlan: boolean
	onclick: Callback<PlanType>
	priceAndConfigProvider: PriceAndConfigProvider
	hasCampaign: boolean
	isApplePrice: boolean
	showMultiUser: boolean
	position: "left" | "right"
}

export class PaidPlanBox implements Component<PlanBoxAttrs> {
	private scale: string = "initial"
	private preventRescaling: boolean = true

	async oninit({ attrs }: Vnode<PlanBoxAttrs>) {
		if (attrs.isSelected) {
			setTimeout(() => {
				this.preventRescaling = false
				m.redraw()
			}, 500)
		} else {
			this.preventRescaling = false
		}

		m.redraw()
	}

	view({
		attrs: {
			planConfig,
			price,
			referencePrice,
			selectedPaymentInterval,
			isSelected,
			isDisabled,
			isCurrentPlan,
			onclick,
			priceAndConfigProvider,
			hasCampaign,
			isApplePrice,
			showMultiUser,
			position,
		},
	}: Vnode<PlanBoxAttrs>) {
		this.scale = isSelected && !this.preventRescaling ? PLAN_SELECTOR_SELECTED_BOX_SCALE : "initial"
		const isYearly = selectedPaymentInterval() === PaymentInterval.Yearly
		const strikethroughPrice = isYearly ? referencePrice : undefined
		// Only for Go European campaign as the campaign needs to use the blue theme always. This should be removed after the campaign.
		const localTheme = hasCampaign ? getBlueTheme() : theme

		const renderFeature = this.generateRenderFeature(planConfig.type, priceAndConfigProvider)
		const getPriceHintStr = (): string => {
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
					scale: this.scale,
					"z-index": isSelected ? "1" : "initial",
					"transform-origin": position === "right" ? "center right" : "center left",
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
								"border-radius": `${position === "right" ? "0" : px(size.border_radius_large)}
									${position === "right" ? px(size.border_radius_large) : "0"} 0 0`,
							}),
						},
					},
					(isIOSApp() ? lang.get("save_action") : lang.get("pricing.saveAmount_label", { "{amount}": "50%" })).toUpperCase(),
				),
			m(
				"",
				{
					style: {
						"background-color": isSelected ? localTheme.surface_container_high : localTheme.surface,
						color: localTheme.on_surface,
						"min-height": px(270),
						height: "100%",
						"border-style": "solid",
						"border-color": planBoxColors.getOutlineColor(isSelected),
						"border-width":
							position === "right" ? this.getLegendBorderWidth(isSelected, hasCampaign) : this.getRevoBorderWidth(isSelected, hasCampaign),
						"border-radius": position === "right" ? this.getLegendBorderRadius(hasCampaign) : this.getRevoBorderRadius(hasCampaign),
						...(isSelected && { "box-shadow": planBoxColors.getBoxShadow() }),
						overflow: "hidden",
						padding: `${px(20)} ${px(styles.isMobileLayout() ? 16 : 20)}`,
					},
					onclick: () => !isDisabled && onclick?.(planConfig.type),
				},

				m(
					".flex.items-center.pb",
					{
						style: {
							gap: "8px",
							...(styles.isMobileLayout()
								? {
										"align-items": position === "left" ? "flex-end" : "flex-start",
										"flex-direction": "column",
									}
								: {
										...(position === "left" && { "flex-direction": "row-reverse" }),
									}),
						},
					},
					m("input[type=radio].m-0.big-radio", {
						name: "BuyOptionBox",
						checked: isSelected,
						style: {
							"accent-color": localTheme.on_primary_container,
							opacity: isDisabled ? "0" : "1",
						},
						disabled: isDisabled,
					}),
					m(
						".text-center.flex.col.center-horizontally.m-0.font-mdio",
						{
							style: {
								"font-size": px(styles.isMobileLayout() ? 18 : 20),
								color: isSelected ? localTheme.primary : localTheme.on_surface,
							},
						},
						PlanTypeToName[planConfig.type],
					),
				),

				m("hr", {
					style: {
						height: px(1),
						display: "block",
						border: "none",
						backgroundColor: localTheme.outline_variant,
					},
				}),
				m(
					".flex.mt-s",
					{
						style: {
							"justify-content": position === "right" ? "start" : "end",
							"flex-direction": position === "right" ? "row-reverse" : "row",
							height: px(size.button_height_compact),
						},
					},
					isCurrentPlan ? m(CurrentPlanLabel) : m(".smaller", lang.get(planConfig.tagLine)),
				),
				m(".flex-space-between.gap-hpad.mt.mb", { style: { "flex-direction": position === "right" ? "row-reverse" : "row" } }, [
					m(
						"",
						{
							style: {
								height: px(35),
								fill: localTheme.on_surface_variant,
							},
						},
						styles.bodyWidth <= 420
							? null
							: m(Icon, {
									icon: planConfig.icon,
									size: IconSize.Medium,
									style: {
										fill: theme.on_surface_variant,
									},
								}),
					),
					m(
						".flex.flex-column",
						{
							style: {
								"align-items": position === "right" ? "start" : "end",
							},
						},
						m(
							".flex.items-end.wrap",
							{
								style: {
									gap: px(3),
									"flex-direction": position === "right" ? "row-reverse" : "row",
									"justify-content": position === "right" ? "start" : "end",
								},
							},
							strikethroughPrice?.trim() !== ""
								? m(
										".strike",
										{
											style: {
												color: localTheme.on_surface_variant,
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
					planConfig.features.map((feature) => renderFeature(feature.label, feature.icon, feature.replacementKey)),
				),
			),
		)
	}

	private generateRenderFeature(planType: PlanType, provider: PriceAndConfigProvider) {
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
						fill: theme.secondary,
					},
				}),
				m(".smaller", lang.get(langKey, getFeaturePlaceholderReplacement(replacement, planType, provider))),
			)
		}
	}

	private getLegendBorderWidth(isSelected: boolean, hasBanner: boolean) {
		if (isSelected) {
			return "0"
		}

		const topBorderWidth = hasBanner ? "0" : "2px"
		if (styles.isMobileLayout()) {
			return `${topBorderWidth} 0 1px 1px`
		} else {
			return `${topBorderWidth} 2px 1px 1px`
		}
	}

	private getLegendBorderRadius(hasBanner: boolean) {
		const topRightRadius = hasBanner ? "0" : px(size.border_radius_large)
		if (styles.isMobileLayout()) {
			return `0 0 0 0`
		} else {
			return `0 ${topRightRadius} 0 0`
		}
	}

	private getRevoBorderWidth(isSelected: boolean, hasBanner: boolean) {
		if (isSelected) {
			return "0"
		}

		const topBorderWidth = hasBanner ? "0" : "2px"
		if (styles.isMobileLayout()) {
			return `${topBorderWidth} 1px 1px 0`
		} else {
			return `${topBorderWidth} 1px 1px 2px`
		}
	}

	private getRevoBorderRadius(hasBanner: boolean) {
		const topLeftRadius = hasBanner ? "0" : px(size.border_radius_large)
		if (styles.isMobileLayout()) {
			return `0 0 0 0`
		} else {
			return `${topLeftRadius} 0 0 0`
		}
	}
}
