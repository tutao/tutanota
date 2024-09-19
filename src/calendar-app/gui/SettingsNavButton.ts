import { Icon, IconSize, lazyIcon } from "../../common/gui/base/Icon.js"
import { lang, TranslationText } from "../../common/misc/LanguageViewModel.js"
import { ClickHandler } from "../../common/gui/base/GuiUtils.js"
import m, { Children, Component, Vnode } from "mithril"
import { BaseButton } from "../../common/gui/base/buttons/BaseButton.js"
import { Icons } from "../../common/gui/base/icons/Icons.js"
import { lazyStringValue } from "@tutao/tutanota-utils"

export interface SettingsNavButtonAttrs {
	icon?: lazyIcon
	label: TranslationText
	click: ClickHandler
	href?: string
	class?: string
}

export class SettingsNavButton implements Component<SettingsNavButtonAttrs> {
	view({ attrs }: Vnode<SettingsNavButtonAttrs>): Children {
		const child = m(
			BaseButton,
			{
				label: lang.getMaybeLazy(attrs.label),
				text: m("span.flex-grow", lang.getMaybeLazy(attrs.label)),
				icon: attrs.icon
					? m(Icon, {
							icon: attrs.icon?.(),
							container: "div",
							class: "center-h",
							size: IconSize.Large,
					  })
					: null,
				onclick: attrs.click,
				class: `flex justify-start full-width gap-vpad pl-vpad-m pr-m items-center`,
			},
			m(Icon, {
				icon: Icons.ArrowForward,
				container: "div",
				class: "center-h items-ends",
				size: IconSize.Large,
			}),
		)

		if (!attrs.href) {
			return child
		}

		return m(
			m.route.Link,
			{
				href: lazyStringValue(attrs.href),
				title: attrs.label,
				selector: `a.noselect.items-center.click.no-text-decoration ${attrs.class ?? ""}`,
			},
			child,
		)
	}
}
