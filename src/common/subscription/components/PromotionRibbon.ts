import m, { Component, Vnode } from "mithril"
import { Theme, theme } from "../../gui/theme"
import { px, size } from "../../gui/size"
import { Translation } from "../../misc/LanguageViewModel"
import { PlanBoxPosition } from "../utils/PlanSelectorUtils"
import { DynamicColorSvg } from "../../gui/base/DynamicColorSvg"
import { isApp } from "../../api/common/Env"

interface PromotionRibbonAttrs {
	translation: Translation
	planBoxPosition: Exclude<PlanBoxPosition, "bottom"> | "center"
	localTheme?: Theme
}

export class PromotionRibbon implements Component<PromotionRibbonAttrs> {
	view({ attrs: { translation, planBoxPosition, localTheme = theme } }: Vnode<PromotionRibbonAttrs>) {
		return m("", [
			m(
				".abs.z3",
				{
					style: isApp()
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
					path: `${window.tutao.appState.prefixWithoutFile}/images/dynamic-color-svg/birthday-hat.svg`,
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
