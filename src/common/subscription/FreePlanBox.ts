import m, { Component, Vnode } from "mithril"
import { px, size } from "../gui/size"
import { lang } from "../misc/LanguageViewModel"
import { PlanType } from "../api/common/TutanotaConstants"
import { PriceAndConfigProvider } from "./PriceUtils"
import { theme } from "../gui/theme.js"
import { FeatureListProvider, ReplacementKey } from "./FeatureListProvider.js"
import { Icon, IconSize } from "../gui/base/Icon.js"
import { Icons } from "../gui/base/icons/Icons.js"
import { getReplacement } from "./PlanSelector.js"
import { TranslationKeyType } from "../misc/TranslationKey.js"
import { planBoxColors } from "./PlanBoxColors.js"
import { styles } from "../gui/styles.js"

type FreePlanBoxAttrs = {
	isSelected: boolean
	select: VoidFunction
	features: ReturnType<FeatureListProvider["getFeatureList"]>
	priceAndConfigProvider: PriceAndConfigProvider
	scale: CSSStyleDeclaration["scale"]
}

export class FreePlanBox implements Component<FreePlanBoxAttrs> {
	view({ attrs: { isSelected, select, scale, priceAndConfigProvider } }: Vnode<FreePlanBoxAttrs>) {
		const renderFeature = this.generateRenderFeature(priceAndConfigProvider, isSelected)

		return m(
			".cursor-pointer.buyOptionBox-v2",
			{
				style: {
					"background-color": planBoxColors.getBgColor({ isSelected }),
					color: planBoxColors.getTextColor({ isSelected }),
					display: "flex",
					"z-index": isSelected ? "1" : "initial",
					scale,
					"flex-direction": "column",
					width: "100%",
					"transform-origin": "bottom",
					...(isSelected && { "box-shadow": planBoxColors.getBoxShadow() }),
					"border-width": this.getBorderWidth({ isSelected }),
					"border-radius": this.getBorderRadius(),
					"border-style": "solid",
					"border-color": planBoxColors.getOutlineColor({ isSelected }),
					padding: "24px 16px",
				},
				onclick: () => select(),
			},
			[
				m(
					".flex-space-between.items-center.pb",
					m(
						// we need some margin for the discount banner for longer translations shown on the website
						".text-center.flex.col.center-horizontally.m-0.font-mdio",
						{
							style: {
								"font-size": px(styles.isMobileLayout() ? 18 : 20),
							},
						},
						"Free",
					),
					m("input[type=radio].m-0.big-radio", {
						name: "BuyOptionBox",
						checked: isSelected,
						style: {
							"accent-color": theme.experimental_on_primary_container,
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
			return `${px(size.vpad_small)} 0`
		}

		return `${px(size.vpad_small)} ${px(size.hpad_medium)}`
	}

	private generateRenderFeature = (provider: PriceAndConfigProvider, isSelected: boolean) => {
		return (langKey: TranslationKeyType, icon: Icons, replacement?: ReplacementKey, shouldShift?: boolean) => {
			return m(
				".flex",
				{
					style: {
						width: styles.isMobileLayout() ? "50%" : "fit-content",
						gap: px(size.hpad_small),
						"padding-left": shouldShift && styles.isMobileLayout() ? px(size.vpad) : "initial",
					},
				},
				[
					m(Icon, {
						icon,
						size: IconSize.Normal,
						style: {
							fill: planBoxColors.getFeatureIconColor({ isSelected, planType: PlanType.Free }),
						},
					}),
					m(".smaller", lang.get(langKey, getReplacement(replacement, PlanType.Free, provider))),
				],
			)
		}
	}

	private getBorderWidth({ isSelected }: { isSelected: boolean }) {
		if (isSelected) {
			return "0"
		}

		if (styles.isMobileLayout()) {
			return "1px 0 2px 0"
		} else {
			return "1px 2px 2px 2px"
		}
	}

	private getBorderRadius() {
		if (styles.isMobileLayout()) {
			return "0 0 0 0"
		} else {
			return `0 0 ${px(size.border_radius_large)} ${px(size.border_radius_large)}`
		}
	}
}
