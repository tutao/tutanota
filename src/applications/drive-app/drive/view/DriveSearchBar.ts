import m, { Children, ClassComponent, Vnode } from "mithril"
import { SearchBar, SearchBarAttrs } from "../../../mail-app/search/SearchBar"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { createRestriction } from "../../../mail-app/search/model/SearchUtils"
import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes"
import { DriveFolder } from "@tutao/entities/drive"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { Icons } from "../../../../ui/base/icons/Icons"
import { FolderItem, toFolderItem } from "./DriveUtils"
import { getDisplayType, getFileIcon, getItemIconFill } from "../model/DriveMimeUtils"
import { isDriveFile } from "../../../common/api/common/drive/DriveUtils"
import { DriveFolderType } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { FontIcons } from "../../../../ui/base/icons/FontIcons"
import { DriveSearchResult } from "../../search/model/DriveSearchModel"
import { LiveSearchResult, SearchQuery } from "../../../common/search/SearchUtils"

export interface DriveSearchBarAttrs {
	loadResults: (searchQuery: SearchQuery) => Promise<LiveSearchResult<DriveSearchResult>>
	selectResult: (searchQuery: SearchQuery, entry: DriveSearchResult | null) => unknown
	shouldOfferUpgrade: boolean
}

export class DriveSearchBar implements ClassComponent<DriveSearchBarAttrs> {
	view({ attrs }: Vnode<DriveSearchBarAttrs, this>): Children | null {
		return m(SearchBar<DriveSearchResult>, {
			placeholder: lang.getTranslationText("searchDrive_placeholder"),
			loadResults: async (query) =>
				attrs.loadResults({
					query,
					maxResults: 10, // FIXME
					restriction: createRestriction(SearchCategoryType.drive, null, null, null, [], false),
				}),
			selectResult: attrs.selectResult,
			renderResult: (entry: DriveSearchResult, isSelected: boolean) => {
				const item = entry.item
				if (isDriveFile(item)) {
					const dt = getDisplayType(item.mimeType, item.name)
					const icon = getFileIcon(dt)
					const fill = getItemIconFill(dt)
				}

				return this.renderDriveResult(toFolderItem(item), isSelected, entry.parent)
			},
			shouldOfferUpgrade: attrs.shouldOfferUpgrade,
		} satisfies SearchBarAttrs<DriveSearchResult>)
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
				parentInfo = [m(".ion", FontIcons.HouseFilled), lang.getTranslationText("driveHome_label")]
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
