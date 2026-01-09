import m, { Component, Vnode } from "mithril"
import { AllIcons, Icon, IconSize } from "../../gui/base/Icon"
import { theme } from "../../gui/theme"
import { Translation } from "../../misc/LanguageViewModel"
import { px, size } from "../../gui/size"

interface PlanSelectorHeadlineAttrs {
	translation: Translation
	icon?: AllIcons
}

export class PlanSelectorHeadlineNew implements Component<PlanSelectorHeadlineAttrs> {
	view({ attrs: { translation, icon } }: Vnode<PlanSelectorHeadlineAttrs>) {
		return m(
			".flex-center.items-center.gap-4.mb-16.plr-24.pt-16.pb-16",
			{
				style: {
					background: theme.primary,
					// border: `1px solid ${theme.on_primary}`,
					color: theme.on_primary,
					borderRadius: px(size.radius_16),
					marginInline: "auto",
					width: "fit-content",
					"line-break": "strict",
				},
			},
			icon &&
				m(Icon, {
					icon,
					size: IconSize.PX32,
					container: "div",
					style: { fill: theme.on_primary },
				}),
			m(".center.h5.font-mdio", translation.text),
		)
	}
}
