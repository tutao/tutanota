import m, { Component, Vnode } from "mithril"
import { px, size } from "../../../ui/size.js"
import { lang, TranslationKey } from "../../../ui/utils/LanguageViewModel"
import { theme } from "../../../ui/theme"

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
					padding: `${px(size.spacing_4)} ${px(size.spacing_8)}`,
				},
			},
			lang.getTranslation(attrs.langKey).text,
		)
	}
}
