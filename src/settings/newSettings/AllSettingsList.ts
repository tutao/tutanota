import m, {Children, Vnode} from "mithril"
import { assertMainOrNode } from "../../api/common/Env"
import type { SettingsSection } from "./SettingsModel"
import { SettingsModel } from "./SettingsModel"
import type { SettingsSelectListAttrs } from "./SettingsSelectList"
import { SettingsSelectList } from "./SettingsSelectList"
assertMainOrNode()

export class AllSettingsList {

	constructor(
		private readonly sectionList: Array<SettingsSection>,
		private readonly model: SettingsModel
	) {}

  view(): Children {
    const settingSelectListAttrs: SettingsSelectListAttrs<SettingsSection> = {
      items: this.model.sections,
      selectedItem: this.model.selectedSection,
      emptyListMessage: "emptyList_msg",
      renderItem: setting => m(new SettingsRow(setting), {
        settingObject: setting
      })
    };
    return m(SettingsSelectList, settingSelectListAttrs);
  }
}

export class SettingsRow {

	constructor(private readonly settingsObject: SettingsSection) {}

  view(): Children {
    const {
      heading,
      category
    } = this.settingsObject;
    return [m(".top", [m(".name", heading)]), m(".bottom.flex-space-between", [m("small.mail-address", category)])];
  }

}