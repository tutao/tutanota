import m, { Component, Vnode } from "mithril"
import { component_size, font_size, px, size } from "../../gui/size"
import { lang } from "../../misc/LanguageViewModel"
import { type Callback } from "@tutao/tutanota-utils"
import { PLAN_SELECTOR_SELECTED_BOX_SCALE, PlanType, PlanTypeToName } from "../../api/common/TutanotaConstants"
import { PaymentInterval, PriceAndConfigProvider } from "../utils/PriceUtils"
import Stream from "mithril/stream"
import { Theme, theme } from "../../gui/theme.js"
import { ReplacementKey } from "../FeatureListProvider.js"
import { Icon, IconSize } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { TranslationKeyType } from "../../misc/TranslationKey.js"
import { styles } from "../../gui/styles.js"
import { getFeaturePlaceholderReplacement } from "../utils/SubscriptionUtils.js"
import { PlanBadge } from "./PlanBadge.js"
import { PlanConfig } from "./BusinessPlanContainer"
import { boxShadowHigh } from "../../gui/main-styles"
import { blackFridayTheme, DiscountDetail, getBorderColor, getBorderRadius, getBorderWidth, getHasCampaign, PlanBoxPosition } from "../utils/PlanSelectorUtils"
import { PromotionRibbon } from "./PromotionRibbon"

type PersonalPlanBoxAttrs = {
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
	isApplePrice: boolean
	showMultiUser: boolean
	position: Exclude<PlanBoxPosition, "bottom">
	discountDetail?: DiscountDetail
}

export class PersonalPaidPlanBox implements Component<PersonalPlanBoxAttrs> {
	private scale: string = "initial"
	private preventRescaling: boolean = true

	async oncreate({ attrs }: Vnode<PersonalPlanBoxAttrs>) {
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
			isApplePrice,
			showMultiUser,
			position,
			discountDetail,
		},
	}: Vnode<PersonalPlanBoxAttrs>) {
		this.scale = isSelected && !this.preventRescaling ? PLAN_SELECTOR_SELECTED_BOX_SCALE : "initial"
		const isYearly = selectedPaymentInterval() === PaymentInterval.Yearly
		const hasCampaign = getHasCampaign(discountDetail, isYearly)
		const localTheme = hasCampaign ? blackFridayTheme() : theme
		const strikethroughPrice = hasCampaign || isYearly ? referencePrice : undefined

		const renderFeature = this.generateRenderFeature(planConfig.type, priceAndConfigProvider, localTheme)
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

		const transformOrigin = () => {
			if (position === "right") {
				return styles.isMobileLayout() ? "center right" : "center left"
			} else {
				return styles.isMobileLayout() ? "center left" : "center right"
			}
		}

		return m(
			`.buyOptionBox-v2${isSelected ? ".selected" : ""}${isDisabled ? "" : ".cursor-pointer"}`,
			{
				style: {
					opacity: isDisabled ? 0.6 : 1,
					scale: this.scale,
					"z-index": isSelected ? "1" : "initial",
					"transform-origin": transformOrigin(),
					"pointer-event": isDisabled ? "none" : "initial",
				},

				onclick: () => !isDisabled && onclick(planConfig.type),
			},
			hasCampaign &&
				m(PromotionRibbon, {
					planBoxPosition: position,
					translation: discountDetail!.ribbonTranslation,
					localTheme,
				}),
			m(
				"",
				{
					style: {
						cursor: isDisabled ? "not-allowed" : "pointer",
						"background-color": isSelected ? localTheme.surface_container_high : localTheme.surface,
						color: localTheme.on_surface,
						"min-height": px(270),
						height: "100%",
						"border-style": "solid",
						"border-color": getBorderColor(isSelected, hasCampaign, localTheme),
						"border-width": getBorderWidth(isSelected, position),
						"border-radius": getBorderRadius(hasCampaign, position),
						"box-shadow": isSelected ? boxShadowHigh : "none",
						overflow: "hidden",
						padding: `${px(20)} ${px(styles.isMobileLayout() ? 16 : 20)}`,
					},
				},

				m(
					".flex.items-center.pb-16",
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
							"accent-color": localTheme.primary,
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
					".flex.mt-8",
					{
						style: {
							"justify-content": position === "right" ? "start" : "end",
							"flex-direction": position === "right" ? "row-reverse" : "row",
							height: px(component_size.button_height_compact),
						},
					},
					isCurrentPlan || isDisabled
						? m(PlanBadge, { langKey: isCurrentPlan ? "pricing.currentPlan_label" : "unavailable_label" })
						: m(".smaller", lang.get(planConfig.tagLine)),
				),
				m(".flex-space-between.gap-12.mt-16.mb-16", { style: { "flex-direction": position === "right" ? "row-reverse" : "row" } }, [
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
									size: IconSize.PX32,
									style: {
										fill: localTheme.on_surface_variant,
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
							strikethroughPrice?.trim() !== "" &&
								m(
									".strike",
									{
										style: {
											color: localTheme.on_surface_variant,
											fontSize: px(font_size.smaller),
											justifySelf: "end",
										},
									},
									strikethroughPrice,
								),
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
							discountDetail?.discountType === "GlobalFirstYear" && isYearly && m("sup", { style: { "font-size": px(8) } }, "1"),
						),
					),
				]),

				m(
					".flex.flex-column.gap-8",
					planConfig.features.map((feature) => renderFeature(feature.label, feature.icon, feature.replacementKey)),
				),
			),
		)
	}

	private generateRenderFeature(planType: PlanType, provider: PriceAndConfigProvider, localTheme: Theme) {
		return (langKey: TranslationKeyType, icon: Icons, replacement?: ReplacementKey) => {
			return m(
				".flex",
				{
					style: {
						gap: px(size.spacing_4),
					},
				},
				m(Icon, {
					icon,
					style: {
						fill: localTheme.secondary,
					},
				}),
				m(".smaller", lang.get(langKey, getFeaturePlaceholderReplacement(replacement, planType, provider))),
			)
		}
	}
}
