// @flow

import m from "mithril"
import {ListColumnWrapper} from "../gui/ListColumnWrapper"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {theme} from "../gui/theme"
import ColumnEmptyMessageBox from "../gui/base/ColumnEmptyMessageBox"
import {createInitialTemplateListIfAllowed} from "../templates/TemplateGroupUtils"
import {showTemplateEditor} from "./TemplateEditor"

export type DummyTemplateListViewAttrs = void

export class DummyTemplateListView implements MComponent<DummyTemplateListViewAttrs> {
	view(vnode: Vnode<DummyTemplateListViewAttrs>): Children {
		return m(ListColumnWrapper, {
				headerContent: m(".mr-negative-s.align-self-end", m(ButtonN, {
					label: "addTemplate_label",
					type: ButtonType.Primary,
					click: () => {
						// SettingsView will reroute to the folder for the newly created template list (if there is one)
						createInitialTemplateListIfAllowed().then(groupRoot => {
							if (groupRoot) {
								showTemplateEditor(null, groupRoot)
							}
						})
					},
				}))
			},
			m(ColumnEmptyMessageBox, {
				color: theme.list_message_bg,
				message: "noEntries_msg"
			}))
	}
}