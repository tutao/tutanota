import m from "mithril"
import { SidebarSection } from "../../../common/gui/SidebarSection"
import { lang } from "../../../common/misc/LanguageViewModel"
import { SettingsFolderRow } from "../../../common/settings/SettingsFolderRow"
import { NavButtonColor } from "../../../common/gui/base/NavButton"
import { Icons } from "../../../common/gui/base/icons/Icons"

export enum SelectedSidebarSection {
	Home,
	Favourites = 1,
}

export function renderSidebarFolders(whichOneIsActive: SelectedSidebarSection) {
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
					persistentBackground: whichOneIsActive === SelectedSidebarSection.Home,
				},
			}),
			m(SettingsFolderRow, {
				mainButtonAttrs: {
					label: lang.makeTranslation("asdf2", () => "Favourites"), // TODO
					icon: () => Icons.Heart,
					href: "/drive/favourites", // TODO
					colors: NavButtonColor.Nav,
					click: () => {},
					persistentBackground: whichOneIsActive === SelectedSidebarSection.Favourites,
				},
			}),
		],
	)
}
