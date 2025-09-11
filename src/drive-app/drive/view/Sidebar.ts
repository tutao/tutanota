import m, { Children } from "mithril"
import { SidebarSection } from "../../../common/gui/SidebarSection"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { isSelectedPrefix, NavButton, NavButtonColor } from "../../../common/gui/base/NavButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { elementIdPart, listIdPart } from "../../../common/api/common/utils/EntityUtils"
import { theme } from "../../../common/gui/theme"
import { pureComponent } from "../../../common/gui/base/PureComponent"
import { AllIcons } from "../../../common/gui/base/Icon"

export function renderSidebarFolders({ rootFolderId, trashFolderId }: { rootFolderId: IdTuple; trashFolderId: IdTuple }, userMailAddress: string): Children {
	return m(
		SidebarSection,
		{
			name: lang.makeTranslation("driveFolders_title", () => userMailAddress),
		},
		[
			m(DriveFolderRow, {
				label: lang.makeTranslation("asdf", () => "Home"), // TODO
				icon: Icons.Drive,
				href: `/drive/${listIdPart(rootFolderId)}/${elementIdPart(rootFolderId)}`,
			}),
			m(DriveFolderRow, {
				label: lang.makeTranslation("asdf2", () => "Trash"), // TODO
				icon: Icons.Trash,
				href: `/drive/${listIdPart(trashFolderId)}/${elementIdPart(trashFolderId)}`,
			}),
		],
	)
}

const DriveFolderRow = pureComponent(({ href, icon, label }: { label: Translation; icon: AllIcons; href: string }, children) => {
	return m(
		".folder-row.flex.flew-row.mlr-8.border-radius-4.state-bg",
		{
			style: {
				background: isSelectedPrefix(href) ? theme.state_bg_hover : "",
			},
		},
		m(NavButton, {
			label, // TODO
			icon: () => icon,
			href,
			colors: NavButtonColor.Nav,
			click: () => {},
			disableSelectedBackground: true,
		}),
	)
})
