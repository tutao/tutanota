import m, { Children, ClassComponent, Vnode } from "mithril"
import { MailFilterType } from "../model/MailUtils.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { createDropdown } from "../../gui/base/Dropdown.js"
import { ToggleButton } from "../../gui/base/buttons/ToggleButton.js"

export interface MailFilterButtonAttrs {
	filter: MailFilterType | null
	setFilter: (filter: MailFilterType | null) => unknown
}

export class MailFilterButton implements ClassComponent<MailFilterButtonAttrs> {
	view({ attrs }: Vnode<MailFilterButtonAttrs>): Children {
		return m(ToggleButton, {
			icon: Icons.Filter,
			title: "filter_label",
			toggled: attrs.filter != null,
			onToggled: (_, event) => this.showDropdown(attrs, event),
		})
	}

	private showDropdown({ filter, setFilter }: MailFilterButtonAttrs, event: MouseEvent) {
		createDropdown({
			lazyButtons: () => [
				{
					selected: filter === MailFilterType.Unread,
					label: "filterUnread_label",
					click: () => {
						setFilter(MailFilterType.Unread)
					},
				},
				{
					selected: filter === MailFilterType.Read,
					label: "filterRead_label",
					click: () => {
						setFilter(MailFilterType.Read)
					},
				},
				{
					selected: filter === MailFilterType.WithAttachments,
					label: "filterWithAttachments_label",
					click: () => {
						setFilter(MailFilterType.WithAttachments)
					},
				},
				{
					label: "filterAllMails_label",
					click: () => {
						setFilter(null)
					},
				},
			],
		})(event, event.target as HTMLElement)
	}
}
