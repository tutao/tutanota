import m, { Component, Vnode } from "mithril"
import { AllIcons, Icon, IconSize } from "../../gui/base/Icon"
import { theme } from "../../gui/theme"
import { Translation } from "../../misc/LanguageViewModel"
import { px } from "../../gui/size"

interface PlanSelectorHeadlineAttrs {
	translation: Translation
	icon?: AllIcons
}

export class PlanSelectorHeadline implements Component<PlanSelectorHeadlineAttrs> {
	view({ attrs: { translation, icon } }: Vnode<PlanSelectorHeadlineAttrs>) {
		return m(
			".flex-center.items-start.gap-4.mb-16",
			{
				style: {
					background: theme.surface_container,
					color: theme.on_surface,
					borderRadius: px(8),
					padding: `${px(8)} ${px(12)}`,
					marginInline: "auto",
					width: "fit-content",
				},
			},
			icon &&
				m(Icon, {
					icon,
					size: IconSize.PX24,
					container: "div",
					style: { fill: theme.primary },
				}),
			m(".center.smaller", translation.text),
		)
	}
}
