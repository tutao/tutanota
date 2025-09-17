import m, { Component, Vnode } from "mithril"
import { px, size } from "../../gui/size.js"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
import { theme } from "../../gui/theme"

export type PlanBadgeAttrs = {
	langKey: TranslationKey
}

export class PlanBadge implements Component<PlanBadgeAttrs> {
	view({ attrs }: Vnode<PlanBadgeAttrs>) {
		return m(
			"span.small.fit-height.border-radius",
			{
				style: {
					color: theme.on_surface_variant,
					border: `1px solid ${theme.outline}`,
					padding: `${px(size.vpad_xs)} ${px(size.hpad_button)}`,
				},
			},
			lang.getTranslation(attrs.langKey).text,
		)
	}
}
