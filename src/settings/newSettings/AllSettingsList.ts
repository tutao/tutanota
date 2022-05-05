import m, {Children, Component, Vnode} from "mithril"
import {assertMainOrNode} from "../../api/common/Env"
import type {SettingsSection} from "./SettingsModel"
import {SettingsModel} from "./SettingsModel"
import {SettingsSelectList} from "./SettingsSelectList"

assertMainOrNode()

interface AllSettingsListAttrs {
	model: SettingsModel
}

export class AllSettingsList implements Component<AllSettingsListAttrs> {

	view({attrs}: Vnode<AllSettingsListAttrs>): Children {
		return m(SettingsSelectList, {
			items: attrs.model.sections,
			selectedItem: attrs.model.selectedSection,
			emptyListMessage: "emptyList_msg",
			renderItem: (setting: SettingsSection) => m(new SettingsRow(setting), {
				settingObject: setting
			})
		})
	}
}

export class SettingsRow {

	constructor(private readonly settingsObject: SettingsSection) {
	}

	view(): Children {
		const {
			heading,
			category
		} = this.settingsObject;
		return [m(".top", [m(".name", heading)]), m(".bottom.flex-space-between", [m("small.mail-address", category)])];
	}

}