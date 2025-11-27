import m from "mithril"
import { SidebarSection } from "../../../common/gui/SidebarSection"
import { lang } from "../../../common/misc/LanguageViewModel"
import { SettingsFolderRow } from "../../../common/settings/SettingsFolderRow"
import { NavButtonColor } from "../../../common/gui/base/NavButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { elementIdPart, listIdPart } from "../../../common/api/common/utils/EntityUtils"

export function renderSidebarFolders({ rootFolderId, trashFolderId }: { rootFolderId: IdTuple; trashFolderId: IdTuple }, userMailAddress: string) {
	return m(
		SidebarSection,
		{
			name: lang.makeTranslation("driveFolders_title", () => userMailAddress),
		},
		[
			m(SettingsFolderRow, {
				mainButtonAttrs: {
					label: lang.makeTranslation("asdf", () => "Home"), // TODO
					icon: () => Icons.Drive,
					href: `/drive/${listIdPart(rootFolderId)}/${elementIdPart(rootFolderId)}`,
					colors: NavButtonColor.Nav,
					click: () => {},
				},
			}),
			m(SettingsFolderRow, {
				mainButtonAttrs: {
					label: lang.makeTranslation("asdf2", () => "Trash"), // TODO
					icon: () => Icons.Trash,
					href: `/drive/${listIdPart(trashFolderId)}/${elementIdPart(trashFolderId)}`,
					colors: NavButtonColor.Nav,
					click: () => {},
				},
			}),
		],
	)
}
