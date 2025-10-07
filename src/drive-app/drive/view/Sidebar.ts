import m from "mithril"
import { SidebarSection } from "../../../common/gui/SidebarSection"
import { lang } from "../../../common/misc/LanguageViewModel"
import { SettingsFolderRow } from "../../../common/settings/SettingsFolderRow"
import { NavButtonColor } from "../../../common/gui/base/NavButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { VirtualFolder } from "./DriveViewModel"

export enum SelectedSidebarSection {
	Home,
	Favourites = 1,
}

export function renderSidebarFolders(virtualFolder: VirtualFolder) {
	return m(
		SidebarSection,
		{
			name: lang.makeTranslation("driveFolders_title", () => "user@tutanota.de"), // TODO: use real user account address
		},
		[
			m(SettingsFolderRow, {
				mainButtonAttrs: {
					label: lang.makeTranslation("asdf", () => "Home"), // TODO
					icon: () => Icons.Drive,
					href: "/drive",
					colors: NavButtonColor.Nav,
					click: () => {},
					persistentBackground: virtualFolder === VirtualFolder.None,
				},
			}),
			m(SettingsFolderRow, {
				mainButtonAttrs: {
					label: lang.makeTranslation("asdf2", () => "Favourites"), // TODO
					icon: () => Icons.Heart,
					href: "/drive/favourites", // TODO
					colors: NavButtonColor.Nav,
					click: () => {},
					persistentBackground: virtualFolder === VirtualFolder.Favourites,
				},
			}),
		],
	)
}
