import m, { Children, Component, Vnode } from "mithril"
import { FilterChip } from "../../../ui/base/FilterChip.js"
import { Icons } from "../../../ui/base/icons/Icons.js"
import { lang, TranslationKey } from "../../../ui/utils/LanguageViewModel.js"

export interface PlaceholderChip {
	placeholder: string
	label: TranslationKey
	required?: boolean
}

export interface PlaceholderChipsAttrs {
	chips: ReadonlyArray<PlaceholderChip>
	contentWithPlaceholder: string
	onInsert: (placeholder: string) => unknown
	onRemove: (placeholder: string) => unknown
}

/**
 * A row of chips, one for each placeholder that can be used in a template. Clicking a chip inserts the placeholder,
 * chips of placeholders that are already used are highlighted and remove the placeholder when clicked.
 */
export class PlaceholderChips implements Component<PlaceholderChipsAttrs> {
	view({ attrs }: Vnode<PlaceholderChipsAttrs>): Children {
		return m(
			".flex.flex-wrap.gap-8",
			{
				// keep the focus in the editor or text field when clicking a chip
				onmousedown: (e: MouseEvent) => e.preventDefault(),
			},
			attrs.chips.map(({ placeholder, label, required }) => {
				const used = attrs.contentWithPlaceholder.includes(placeholder)
				const text = lang.getTranslationText(label) + (required && !used ? " *" : "")
				return m(FilterChip, {
					label: lang.makeTranslation(placeholder, text),
					icon: used ? Icons.Checkmark : Icons.Plus,
					selected: used,
					chevron: false,
					onClick: () => {
						if (used) {
							attrs.onRemove(placeholder)
						} else {
							attrs.onInsert(placeholder)
						}
						m.redraw()
					},
				})
			}),
		)
	}
}
