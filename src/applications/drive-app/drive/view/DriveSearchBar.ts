import { LiveSearchResult, SearchQuery } from "../../../mail-app/search/model/SearchModel"
import m, { Children, ClassComponent, Vnode } from "mithril"
import { SearchBar, SearchBarAttrs } from "../../../mail-app/search/SearchBar"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { createRestriction } from "../../../mail-app/search/model/SearchUtils"
import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes"
import { DriveFile, DriveFolder } from "@tutao/entities/drive"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { Icons } from "../../../../ui/base/icons/Icons"

export interface DriveSearchBarAttrs {
	loadResults: (searchQuery: SearchQuery) => Promise<LiveSearchResult<DriveFile | DriveFolder>>
	selectResult: (searchQuery: SearchQuery, entry: DriveFolder | DriveFile | null) => unknown
	shouldOfferUpgrade: boolean
}

export class DriveSearchBar implements ClassComponent<DriveSearchBarAttrs> {
	view({ attrs }: Vnode<DriveSearchBarAttrs, this>): Children | null {
		return m(SearchBar<DriveFile | DriveFolder>, {
			placeholder: lang.getTranslationText("searchDrive_placeholder"),
			loadResults: (query) =>
				attrs.loadResults({
					query,
					maxResults: 10, // FIXME
					restriction: createRestriction(SearchCategoryType.drive, null, null, null, [], false),
				}),
			selectResult: attrs.selectResult,
			renderResult: (entry: DriveFolder | DriveFile, isSelected: boolean) => this.renderDriveResult(entry, isSelected),
			shouldOfferUpgrade: attrs.shouldOfferUpgrade,
		} satisfies SearchBarAttrs<DriveFolder | DriveFile>)
	}

	private renderDriveResult(driveItem: DriveFolder | DriveFile, isSelected: boolean): Children {
		return m(".top.flex-space-between.badge-line-height.gap-8", [
			m(".text-ellipsis", driveItem.name),
			m(Icon, {
				icon: driveItem._type.typeId === 0 ? Icons.FolderFilled : Icons.EmptyDocumentFilled, //FIXME a better way to decide the right icon
				size: IconSize.PX24,
			}),
		])
	}
}
