import m, { Children, Component, Vnode } from "mithril"
import { LegacyTextField } from "../../gui/base/LegacyTextField"
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
				m(LegacyTextField, {
					label: "name_label",
					value: newFinalData.name,
					oninput: (newInput) => {
						newFinalData.name = newInput
					},
					isReadOnly: !newFinalData.editableName,
				}),
				m(LegacyTextField, {
					label: "customNameGeneric_label",
					value: newFinalData.customName ?? "",
					oninput: (newInput) => {
						newFinalData.customName = newInput
					},
				}),
			]
		} else {
			return m(LegacyTextField, {
				label: "name_label",
				value: newFinalData.name,
				oninput: (newInput) => {
					newFinalData.name = newInput
				},
			})
		}
	}
}
