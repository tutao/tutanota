import m from "mithril"
import { SidebarSection } from "../../../common/gui/SidebarSection"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { isSelectedPrefix, NavButton, NavButtonColor } from "../../../common/gui/base/NavButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { elementIdPart, listIdPart } from "@tutao/typeRefs"
import { theme } from "../../../common/gui/theme"
import { pureComponent } from "../../../common/gui/base/PureComponent"
import { AllIcons } from "../../../common/gui/base/Icon"
import { ClickHandler, DriveDropData } from "../../../common/gui/base/GuiUtils"
import { FolderItemId } from "./DriveUtils"
import { parseDragItems } from "./DriveGuiUtils"
import { DriveFolderType } from "../../../common/api/worker/facades/lazy/DriveFacade"

export interface RootFolderIds {
	rootFolderId: IdTuple
	trashFolderId: IdTuple
}
type DriveSidebarAttrs = {
	rootFolders: RootFolderIds
	userEmailAddress: string
	onTrash: (items: FolderItemId[]) => unknown
	onMove: (items: FolderItemId[], destination: IdTuple) => unknown
	isDropAllowed: boolean
	onFolderClick: ClickHandler
}
export const DriveSidebar = pureComponent(
	({ rootFolders: { rootFolderId, trashFolderId }, userEmailAddress, onTrash, onMove, isDropAllowed, onFolderClick }: DriveSidebarAttrs) => {
		return m(
			SidebarSection,
			{
				name: lang.makeTranslation("driveFolders_title", () => userEmailAddress),
			},
			[
				m(DriveFolderRow, {
					label: lang.getTranslation("driveHome_label"),
					icon: Icons.HouseFilled,
					href: `/drive/${listIdPart(rootFolderId)}/${elementIdPart(rootFolderId)}`,
					folderType: DriveFolderType.Root,
					click: onFolderClick,
					dropHandler: isDropAllowed
						? (dropData: FolderItemId[]) => {
								onMove(dropData, rootFolderId)
							}
						: undefined,
				}),
				m(DriveFolderRow, {
					label: lang.getTranslation("driveTrash_label"),
					icon: Icons.TrashFilled,
					href: `/drive/${listIdPart(trashFolderId)}/${elementIdPart(trashFolderId)}`,
					folderType: DriveFolderType.Trash,
					click: onFolderClick,
					dropHandler: isDropAllowed
						? (dropData: FolderItemId[]) => {
								onTrash(dropData)
							}
						: undefined,
				}),
			],
		)
	},
)

const DriveFolderRow = pureComponent(
	(
		{
			href,
			icon,
			label,
			folderType,
			dropHandler,
			click,
		}: {
			label: Translation
			icon: AllIcons
			href: string
			folderType: DriveFolderType
			dropHandler?: (dropData: FolderItemId[]) => unknown
			click: ClickHandler
		},
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
				click,
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
