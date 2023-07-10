import m, { Children, Component, Vnode } from "mithril"
import { ListColumnWrapper } from "../gui/ListColumnWrapper"
import { theme } from "../gui/theme"
import ColumnEmptyMessageBox from "../gui/base/ColumnEmptyMessageBox"
import { createInitialTemplateListIfAllowed } from "../templates/TemplateGroupUtils"
import { showTemplateEditor } from "./TemplateEditor"
import { BaseSearchBar, BaseSearchBarAttrs } from "../gui/base/BaseSearchBar.js"
import { lang } from "../misc/LanguageViewModel.js"
import { IconButton } from "../gui/base/IconButton.js"
import { Icons } from "../gui/base/icons/Icons.js"

export type DummyTemplateListViewAttrs = void

export class DummyTemplateListView implements Component<DummyTemplateListViewAttrs> {
	private searchQuery: string = ""

	view(vnode: Vnode<DummyTemplateListViewAttrs>): Children {
		return m(
			ListColumnWrapper,
			{
				headerContent: m(
					".flex.flex-space-between.center-vertically.plr-l",
					m(BaseSearchBar, {
						text: this.searchQuery,
						onInput: (text) => (this.searchQuery = text),
						busy: false,
						onKeyDown: (e) => e.stopPropagation(),
						onClear: () => {
							this.searchQuery = ""
						},
						placeholder: lang.get("searchTemplates_placeholder"),
					} satisfies BaseSearchBarAttrs),
					m(
						".mr-negative-s",
						m(IconButton, {
							title: "addTemplate_label",
							icon: Icons.Add,
							click: () => {
								// SettingsView will reroute to the folder for the newly created template list (if there is one)
								createInitialTemplateListIfAllowed().then((groupRoot) => {
									if (groupRoot) {
										showTemplateEditor(null, groupRoot)
									}
								})
							},
						}),
					),
				),
			},
			m(
				".fill-absolute.overflow-hidden",
				m(ColumnEmptyMessageBox, {
					color: theme.list_message_bg,
					icon: Icons.ListAlt,
					message: "noEntries_msg",
				}),
			),
		)
	}
}
