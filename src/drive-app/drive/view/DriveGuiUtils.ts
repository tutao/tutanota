import { DropdownChildAttrs } from "../../../common/gui/base/Dropdown"
import { lang } from "../../../common/misc/LanguageViewModel"

export function newItemActions({ onNewFile, onNewFolder }: { onNewFile: () => unknown; onNewFolder: () => unknown }): DropdownChildAttrs[] {
	return [
		{
			click: (event, dom) => {
				onNewFile()
			},
			// FIXME
			label: lang.makeTranslation("UploadFile", () => "Upload file"),
		},
		{
			click: (event, dom) => {
				onNewFolder()
			},
			// FIXME
			label: lang.makeTranslation("CreateFolder", () => "Create folder"),
		},
	]
}
