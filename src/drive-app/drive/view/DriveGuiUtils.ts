import { DropdownChildAttrs } from "../../../common/gui/base/Dropdown"
import { lang } from "../../../common/misc/LanguageViewModel"

export function newItemActions({ onNewFile, onNewFolder }: { onNewFile: () => unknown; onNewFolder: () => unknown }): DropdownChildAttrs[] {
	return [
		{
			click: (event, dom) => {
				onNewFile()
			},
			label: lang.getTranslation("uploadFile_action"),
		},
		{
			click: (event, dom) => {
				onNewFolder()
			},
			label: lang.getTranslation("createFolder_action"),
		},
	]
}
