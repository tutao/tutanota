import { LiveSearchResult, SearchQuery } from "../../../mail-app/search/model/SearchModel"
import m, { Children, ClassComponent, Vnode } from "mithril"
import { SearchBar, SearchBarAttrs } from "../../../mail-app/search/SearchBar"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { createRestriction } from "../../../mail-app/search/model/SearchUtils"
import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes"
import { DriveFile, DriveFolder } from "@tutao/entities/drive"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { Icons } from "../../../../ui/base/icons/Icons"
import { FolderItem, toFolderItem } from "./DriveUtils"
import { getDisplayType, getFileIcon, getItemIconFill } from "../model/DriveMimeUtils"
import { isDriveFile } from "../../../common/api/common/drive/DriveUtils"
import { DriveFolderType } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { FontIcons } from "../../../../ui/base/icons/FontIcons"

export interface DriveSearchBarAttrs {
	loadResults: (searchQuery: SearchQuery) => Promise<LiveSearchResult<DriveFile | DriveFolder>>
	selectResult: (searchQuery: SearchQuery, entry: DriveFolder | DriveFile | null) => unknown
	shouldOfferUpgrade: boolean
	getDirectParent: (item: DriveFolder | DriveFile) => Promise<DriveFolder | null>
}

export class DriveSearchBar implements ClassComponent<DriveSearchBarAttrs> {
	private cachedParentFolders = new Map<IdTuple, DriveFolder>()

	view({ attrs }: Vnode<DriveSearchBarAttrs, this>): Children | null {
		return m(SearchBar<DriveFile | DriveFolder>, {
			placeholder: lang.getTranslationText("searchDrive_placeholder"),
			loadResults: async (query) => {
				const results = await attrs.loadResults({
					query,
					maxResults: 10, // FIXME
					restriction: createRestriction(SearchCategoryType.drive, null, null, null, [], false),
				})

				// FIXME: Would be cool if we could return this alongside the results
				//  without having to keep track of this cache on the side...
				this.cachedParentFolders.clear()
				for (const item of results.items) {
					const directParent = await attrs.getDirectParent(item)
					if (directParent) {
						this.cachedParentFolders.set(item._id, directParent)
					}
				}

				return results
			},
			selectResult: attrs.selectResult,
			renderResult: (entry: DriveFolder | DriveFile, isSelected: boolean) => {
				if (isDriveFile(entry)) {
					const dt = getDisplayType(entry.mimeType, entry.name)
					const icon = getFileIcon(dt)
					const fill = getItemIconFill(dt)
				}

				return this.renderDriveResult(toFolderItem(entry), isSelected, this.cachedParentFolders.get(entry._id))
			},
			shouldOfferUpgrade: attrs.shouldOfferUpgrade,
		} satisfies SearchBarAttrs<DriveFolder | DriveFile>)
	}

	private renderDriveResult(item: FolderItem, isSelected: boolean, parent?: DriveFolder): Children {
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
