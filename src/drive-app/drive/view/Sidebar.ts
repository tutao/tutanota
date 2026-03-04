import m, { Children } from "mithril"
import { SidebarSection } from "../../../common/gui/SidebarSection"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { isSelectedPrefix, NavButton, NavButtonColor } from "../../../common/gui/base/NavButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { elementIdPart, listIdPart } from "../../../common/api/common/utils/EntityUtils"
import { theme } from "../../../common/gui/theme"
import { pureComponent } from "../../../common/gui/base/PureComponent"
import { AllIcons } from "../../../common/gui/base/Icon"
import { DriveDropData } from "../../../common/gui/base/GuiUtils"
import { DriveFolderType } from "./DriveViewModel"
import { FolderItemId } from "./DriveUtils"
import { parseDragItems } from "./DriveGuiUtils"

export function renderSidebarFolders(
	{ rootFolderId, trashFolderId }: { rootFolderId: IdTuple; trashFolderId: IdTuple },
	userMailAddress: string,
	onTrash: (items: FolderItemId[]) => unknown,
	onMove: (items: FolderItemId[], destination: IdTuple) => unknown,
	isDropAllowed: boolean,
): Children {
	return m(
		SidebarSection,
		{
			name: lang.makeTranslation("driveFolders_title", () => userMailAddress),
		},
		[
			m(DriveFolderRow, {
				label: lang.getTranslation("driveHome_label"),
				icon: Icons.Home,
				href: `/drive/${listIdPart(rootFolderId)}/${elementIdPart(rootFolderId)}`,
				folderType: DriveFolderType.Root,
				dropHandler: isDropAllowed
					? (dropData: FolderItemId[]) => {
							onMove(dropData, rootFolderId)
						}
					: undefined,
			}),
			m(DriveFolderRow, {
				label: lang.getTranslation("driveTrash_label"),
				icon: Icons.Trash,
				href: `/drive/${listIdPart(trashFolderId)}/${elementIdPart(trashFolderId)}`,
				folderType: DriveFolderType.Trash,
				dropHandler: isDropAllowed
					? (dropData: FolderItemId[]) => {
							onTrash(dropData)
						}
					: undefined,
			}),
		],
	)
}

const DriveFolderRow = pureComponent(
	(
		{
			href,
			icon,
			label,
			folderType,
			dropHandler,
		}: { label: Translation; icon: AllIcons; href: string; folderType: DriveFolderType; dropHandler?: (dropData: FolderItemId[]) => unknown },
		children,
	) => {
		return m(
			".folder-row.flex.flew-row.mlr-8.border-radius-4.state-bg",
			{
				style: {
					background: isSelectedPrefix(href) ? theme.state_bg_hover : "",
				},
			},
			m(NavButton, {
				label,
				icon: () => icon,
				href,
				colors: NavButtonColor.Nav,
				click: () => {},
				disableSelectedBackground: true,
				dropHandler: dropHandler
					? (dropData: DriveDropData) => {
							const data = parseDragItems(dropData.data)
							dropHandler(data ?? [])
						}
					: undefined,
			}),
		)
	},
)
