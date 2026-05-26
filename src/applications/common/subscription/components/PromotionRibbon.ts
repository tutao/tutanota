import m, { Component, Vnode } from "mithril"
import { Theme, theme } from "../../../../ui/theme"
import { px, size } from "../../../../ui/size"
import { Translation } from "../../../../ui/utils/LanguageViewModel"
import { CAMPAIGN_NAME, PlanBoxPosition } from "../utils/PlanSelectorUtils"
import { DynamicColorSvg } from "../../../../ui/base/DynamicColorSvg"
import { styles } from "../../../../ui/styles"

interface PromotionRibbonAttrs {
	translation: Translation
	planBoxPosition: Exclude<PlanBoxPosition, "bottom"> | "center"
	localTheme?: Theme
	campaignName: string | null
}

export class PromotionRibbon implements Component<PromotionRibbonAttrs> {
	view({ attrs: { translation, planBoxPosition, localTheme = theme, campaignName } }: Vnode<PromotionRibbonAttrs>) {
		return m("", [
			campaignName &&
				campaignName === CAMPAIGN_NAME.BIRTHDAY_12_CAMPAIGN &&
				planBoxPosition === "right" &&
				m(
					".abs.z3",
					{
						style: styles.isMobileLayout()
							? {
									top: px(-88),
									right: px(9),
									width: px(35),
									rotate: "40deg",
								}
							: {
									top: px(-90),
									right: px(0),
									width: px(40),
									rotate: "45deg",
								},
					},

					m(DynamicColorSvg, {
						path: `/images/dynamic-color-svg/birthday-hat.svg`,
					}),
				),
			m(
				".full-width.pt-4.pb-4.text-center.b.smaller.abs",
				{
					style: {
						backgroundColor: localTheme?.tertiary,
						color: localTheme?.on_tertiary,
						transform: "translateY(-100%)",
						"border-radius": `${px(size.radius_8)} ${px(size.radius_8)} 0 0`,
					},
				},
				translation.text,
			),
		])
	}
}
