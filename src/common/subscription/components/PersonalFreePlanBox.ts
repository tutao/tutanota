import m, { Component, Vnode } from "mithril"
import { px, size } from "../../gui/size"
import { lang } from "../../misc/LanguageViewModel"
import { PLAN_SELECTOR_SELECTED_BOX_SCALE, PlanType } from "../../api/common/TutanotaConstants"
import { PriceAndConfigProvider } from "../utils/PriceUtils"
import { theme } from "../../gui/theme.js"
import { ReplacementKey } from "../FeatureListProvider.js"
import { Icon, IconSize } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { TranslationKeyType } from "../../misc/TranslationKey.js"
import { styles } from "../../gui/styles.js"
import { getFeaturePlaceholderReplacement } from "../utils/SubscriptionUtils.js"
import { PlanBadge } from "./PlanBadge.js"
import { Callback } from "@tutao/tutanota-utils"
import { boxShadowHigh } from "../../gui/main-styles"
import { DiscountDetail, getBorderRadius, getBorderWidth } from "../utils/PlanSelectorUtils"

type FreePlanBoxAttrs = {
	isSelected: boolean
	isDisabled: boolean
	isCurrentPlan: boolean
	onclick: Callback<PlanType>
	priceAndConfigProvider: PriceAndConfigProvider
	discountDetail?: DiscountDetail
}

export class PersonalFreePlanBox implements Component<FreePlanBoxAttrs> {
	view({ attrs: { isSelected, isDisabled, isCurrentPlan, onclick, priceAndConfigProvider, discountDetail } }: Vnode<FreePlanBoxAttrs>) {
		const hasGlobalCampaign = discountDetail?.discountType === "GlobalFirstYear"
		const scale = isSelected && !styles.isMobileLayout() ? PLAN_SELECTOR_SELECTED_BOX_SCALE : "initial"
		const renderFeature = this.generateRenderFeature(priceAndConfigProvider)

		return m(
			`.buyOptionBox-v2`,
			{
				style: {
					cursor: isDisabled ? "not-allowed" : "pointer",
					"background-color": isSelected ? theme.surface_container_high : theme.surface,
					opacity: isDisabled ? 0.6 : 1,
					color: theme.on_surface,
					display: "flex",
					"z-index": isSelected ? "1" : "initial",
					scale,
					"flex-direction": "column",
					width: "100%",
					"transform-origin": "top",
					"box-shadow": isSelected ? boxShadowHigh : "none",
					"border-width": getBorderWidth(isSelected, "bottom"),
					"border-radius": getBorderRadius(hasGlobalCampaign, "bottom"),
					"border-style": "solid",
					"border-color": isSelected ? theme.primary : theme.outline_variant,
					padding: "24px 16px",
				},
				onclick: () => !isDisabled && onclick(PlanType.Free),
			},
			[
				m(
					".flex-space-between.items-center.pb-16",
					m(
						".flex.items-center.column-gap-12",
						m(
							// we need some margin for the discount banner for longer translations shown on the website
							".text-center.flex.col.center-horizontally.m-0.font-mdio",
							{
								style: {
									"font-size": px(styles.isMobileLayout() ? 18 : 20),
									color: isSelected ? theme.primary : theme.on_surface,
								},
							},
							"Free",
						),
						(isCurrentPlan || isDisabled) && m(PlanBadge, { langKey: isCurrentPlan ? "pricing.currentPlan_label" : "unavailable_label" }),
					),
					!isDisabled &&
						m("input[type=radio].m-0.big-radio", {
							name: "BuyOptionBox",
							checked: isSelected,
							style: {
								"accent-color": theme.on_primary_container,
							},
						}),
				),

				m(
					".flex.flex-wrap",
					{
						style: {
							gap: this.getFeaturesGap(),
							...(styles.isMobileLayout() && { "flex-wrap": "wrap" }),
						},
					},
					renderFeature("pricing.comparisonStorage_msg", Icons.PricingStorage, "storage"),
					renderFeature("pricing.comparisonOneCalendar_msg", Icons.PricingCalendar, undefined, true),
					renderFeature("pricing.comparisonFaqSupport_msg", Icons.PricingSupport, undefined),
				),
			],
		)
	}

	private getFeaturesGap() {
		if (styles.isMobileLayout()) {
			return `${px(size.spacing_8)} 0`
		}

		return `${px(size.spacing_8)} ${px(size.spacing_24)}`
	}

	private generateRenderFeature = (provider: PriceAndConfigProvider) => {
		return (langKey: TranslationKeyType, icon: Icons, replacement?: ReplacementKey, shouldShift?: boolean) => {
			return m(
				".flex",
				{
					style: {
						width: styles.isMobileLayout() ? "50%" : "fit-content",
						gap: px(size.spacing_4),
						"padding-left": shouldShift && styles.isMobileLayout() ? px(size.spacing_16) : "initial",
					},
				},
				[
					m(Icon, {
						icon,
						style: {
							fill: theme.secondary,
						},
					}),
					m(".smaller", lang.get(langKey, getFeaturePlaceholderReplacement(replacement, PlanType.Free, provider))),
				],
			)
		}
	}
}
