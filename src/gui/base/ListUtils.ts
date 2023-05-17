import { ListElement } from "../../api/common/utils/EntityUtils.js"
import { ListModel } from "../../misc/ListModel.js"
import { Shortcut } from "../../misc/KeyManager.js"
import { Keys } from "../../api/common/TutanotaConstants.js"
import { mapLazily } from "@tutao/tutanota-utils"
import { MultiselectMode } from "./NewList.js"

export function listSelectionKeyboardShortcuts<T extends ListElement>(multiselectMode: MultiselectMode, list: () => ListModel<T> | null): Array<Shortcut> {
	const multiselectionEnabled = multiselectMode == MultiselectMode.Enabled ? () => true : () => false
	return [
		{
			key: Keys.UP,
			exec: mapLazily(list, (list) => list?.selectPrevious(false)),
			help: "selectPrevious_action",
		},
		{
			key: Keys.K,
			exec: mapLazily(list, (list) => list?.selectPrevious(false)),
			help: "selectPrevious_action",
		},
		{
			key: Keys.UP,
			shift: true,
			exec: mapLazily(list, (list) => list?.selectPrevious(true)),
			help: "addPrevious_action",
			enabled: multiselectionEnabled,
		},
		{
			key: Keys.K,
			shift: true,
			exec: mapLazily(list, (list) => list?.selectPrevious(true)),
			help: "addPrevious_action",
			enabled: multiselectionEnabled,
		},
		{
			key: Keys.DOWN,
			exec: mapLazily(list, (list) => list?.selectNext(false)),
			help: "selectNext_action",
		},
		{
			key: Keys.J,
			exec: mapLazily(list, (list) => list?.selectNext(false)),
			help: "selectNext_action",
		},
		{
			key: Keys.DOWN,
			shift: true,
			exec: mapLazily(list, (list) => list?.selectNext(true)),
			help: "addNext_action",
			enabled: multiselectionEnabled,
		},
		{
			key: Keys.J,
			shift: true,
			exec: mapLazily(list, (list) => list?.selectNext(true)),
			help: "addNext_action",
			enabled: multiselectionEnabled,
		},
		{
			key: Keys.A,
			ctrl: true,
			shift: true,
			exec: mapLazily(list, (list) => (list?.areAllSelected() ? list.selectNone() : list?.selectAll())),
			help: "selectAllLoaded_action",
			enabled: multiselectionEnabled,
		},
	]
}
