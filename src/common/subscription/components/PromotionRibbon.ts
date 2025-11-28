import m, { Component, Vnode } from "mithril"
import { Theme, theme } from "../../gui/theme"
import { styles } from "../../gui/styles"
import { px, size } from "../../gui/size"
import { Translation } from "../../misc/LanguageViewModel"
import { PlanBoxPosition } from "../utils/PlanSelectorUtils"

interface PromotionRibbonAttrs {
	translation: Translation
	planBoxPosition: Exclude<PlanBoxPosition, "bottom"> | "center"
	localTheme?: Theme
}

export class PromotionRibbon implements Component<PromotionRibbonAttrs> {
	view({ attrs: { translation, planBoxPosition, localTheme = theme } }: Vnode<PromotionRibbonAttrs>) {
		return m(
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
		)
	}
}
