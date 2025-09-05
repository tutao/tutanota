import m, { Children, Component, Vnode } from "mithril"
import { TextField } from "../../gui/base/TextField"
import { GroupNameData } from "../model/GroupSettingsModel"

interface GroupSettingNameInputFieldsAttrs {
	groupNameData: GroupNameData
}

/**
 * Shows editor for group names (either single name or both shared and and the custom name)
 */
export class GroupSettingNameInputFields implements Component<GroupSettingNameInputFieldsAttrs> {
	view({ attrs: { groupNameData } }: Vnode<GroupSettingNameInputFieldsAttrs>): Children {
		const newFinalData = groupNameData
		if (newFinalData.kind === "shared") {
			return [
				m(TextField, {
					label: "name_label",
					value: newFinalData.name,
					oninput: (newInput) => {
						newFinalData.name = newInput
					},
					isReadOnly: !newFinalData.editableName,
				}),
				m(TextField, {
					label: "customNameGeneric_label",
					value: newFinalData.customName ?? "",
					oninput: (newInput) => {
						newFinalData.customName = newInput
					},
				}),
			]
		} else {
			return m(TextField, {
				label: "name_label",
				value: newFinalData.name,
				oninput: (newInput) => {
					newFinalData.name = newInput
				},
			})
		}
	}
}
