import type { UpdatableSettingsViewer } from "./Interfaces"
import m, { Children, Vnode } from "mithril"
import { deviceConfig } from "../misc/DeviceConfig"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { DropDownSelector, DropDownSelectorAttrs, SelectorItemList } from "../../../ui/base/DropDownSelector"
import { EntityUpdateData } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"

export class DriveSettingsViewer implements UpdatableSettingsViewer {
	private scrollTimeOptions: Array<{ name: string; value: boolean }> = [
		{ name: "Default behaviour", value: false },
		{ name: "Folders before files", value: true },
	]

	view(vnode: Vnode): Children {
		return m(".fill-absolute.scroll.plr-24.pb-48", [
			m("#driveview.h4.mt-32", lang.getTranslation("driveView_action").text), // FIXME
			m("#devicesettings.h4.mt-32", lang.getTranslation("settingsForDevice_label").text), // FIXME
			m("#prioritizeFolders", m(DropDownSelector, this.makePrioritizeFoldersDropdown())),
		])
	}

	private makePrioritizeFoldersDropdown(): DropDownSelectorAttrs<boolean> {
		return {
			label: lang.makeTranslation("", "Folders sorting behaviour"), // FIXME
			helpLabel: () => lang.makeTranslation("", "").text, // FIXME
			items: this.scrollTimeOptions as SelectorItemList<boolean>,
			selectedValue: deviceConfig.getDrivePrioritizeFolders(),
			selectionChangedHandler: (value) => deviceConfig.setDrivePrioritizeFolders(value),
			dropdownWidth: 300,
		}
	}

	onEntityUpdatesReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<unknown> {
		return Promise.resolve(undefined)
	}
}
