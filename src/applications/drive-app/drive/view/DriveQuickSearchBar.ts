import m, { Children, ClassComponent, Vnode } from "mithril"
import { QuickSearchBar, SearchBarAttrs } from "../../../common/gui/QuickSearchBar"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { DriveFolder } from "@tutao/entities/drive"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { Icons } from "../../../../ui/base/icons/Icons"
import { FolderItem } from "./DriveUtils"
import { getDisplayType, getFileIcon, getItemIconFill } from "../model/DriveMimeUtils"
import { DriveFolderType } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { FontIcons } from "../../../../ui/base/icons/FontIcons"
import { LiveSearchResult, QuickSearchQuery, SearchQuery } from "../../../common/search/SearchUtils"

export interface DriveSearchBarAttrs {
	loadResults: (searchQuery: QuickSearchQuery) => Promise<LiveSearchResult<FolderItem>>
	selectResult: (searchQuery: SearchQuery, entry: FolderItem | null) => unknown
}

export class DriveQuickSearchBar implements ClassComponent<DriveSearchBarAttrs> {
	view({ attrs }: Vnode<DriveSearchBarAttrs, this>): Children | null {
		return m(QuickSearchBar<FolderItem>, {
			placeholder: lang.getTranslationText("searchDrive_placeholder"),
			loadResults: async (query) =>
				attrs.loadResults({
					query,
					maxResults: 10,
				}),
			selectResult: attrs.selectResult,
			renderResult: (entry: FolderItem, isSelected: boolean) => {
				return this.renderDriveResult(entry, isSelected, entry.parentFolder)
			},
			shouldOfferUpgrade: false,
		} satisfies SearchBarAttrs<FolderItem>)
	}

	private renderDriveResult(item: FolderItem, isSelected: boolean, parent: DriveFolder | null): Children {
		let icon: Icons
		let fill: string
		if (item.type === "file") {
			const displayType = getDisplayType(item.file.mimeType)
			icon = getFileIcon(displayType)
			fill = getItemIconFill(displayType)
		} else {
			icon = Icons.FolderFilled
			fill = getItemIconFill(null)
		}

		let parentInfo: Children = null
		if (parent) {
			if (parent.type === DriveFolderType.Root) {
				parentInfo = lang.getTranslationText("driveHome_label")
			} else if (parent.type === DriveFolderType.Trash) {
				parentInfo = [m(".ion", FontIcons.TrashFilled), lang.getTranslationText("driveTrash_label")]
			} else {
				// Do not draw a folder icon for each parent folder, would be too noisy.
				parentInfo = parent.name
			}
		}

		return m(".flex.center-vertically.badge-line-height.gap-8", [
			m(Icon, {
				icon,
				size: IconSize.PX24,
				style: {
					fill,
				},
			}),
			m(".flex-v-center.min-width-0", [
				m(".top.text-ellipsis", item.type === "file" ? item.file.name : item.folder.name),
				m(".bottom.text-ellipsis", m("small.flex.center-vertically.gap-4", parentInfo)),
			]),
		])
	}
}
