import { LiveSearchResult, SearchQuery } from "../../../mail-app/search/model/SearchModel"
import { Mail } from "@tutao/entities/tutanota"
import m, { Children, ClassComponent, Vnode } from "mithril"
import { SearchBar, SearchBarAttrs } from "../../../mail-app/search/SearchBar"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { createRestriction } from "../../../mail-app/search/model/SearchUtils"
import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes"
import { isTutaTeamMail } from "../../../common/mailFunctionality/SharedMailUtils"
import Badge from "../../../../ui/base/Badge"
import { companyTeamLabel } from "../../../../platform-kit/app-env/boot/ClientConstants"
import { getSenderOrRecipientHeading } from "../../../mail-app/mail/view/MailViewerUtils"
import { formatTimeOrDateOrYesterday } from "../../../../ui/utils/Formatter"
import { Icon } from "../../../../ui/base/Icon"
import { getMailFolderIcon } from "../../../mail-app/mail/view/MailGuiUtils"
import { mailLocator } from "../../../mail-app/mailLocator"
import { Icons } from "../../../../ui/base/icons/Icons"
import { DriveFile, DriveFolder } from "@tutao/entities/drive"

export interface DriveSearchBarAttrs {
	loadResults: (searchQuery: SearchQuery) => Promise<void> //FIXME
	selectResult: (searchQuery: SearchQuery, entry: DriveFolder | DriveFile | null) => unknown
	shouldOfferUpgrade: boolean
}

export class DriveSearchBar implements ClassComponent<DriveSearchBarAttrs> {
	view({ attrs }: Vnode<DriveSearchBarAttrs, this>): Children | null {
		return m(SearchBar<DriveFile | DriveFolder>, {
			placeholder: lang.getTranslationText("searchDrive_placeholder"),
			loadResults: (query) => Promise.resolve().then(), //FIXME
			// attrs.loadResults({
			// 	query,
			// 	maxResults: 10, // FIXME
			// 	restriction: createRestriction(SearchCategoryType.drive, null, null, null, [], false),
			// }),
			selectResult: attrs.selectResult,
			renderResult: (entry: DriveFolder | DriveFile, isSelected: boolean) => this.renderDriveResult(entry, isSelected),
			shouldOfferUpgrade: attrs.shouldOfferUpgrade,
		} satisfies SearchBarAttrs<DriveFolder | DriveFile>)
	}

	private renderDriveResult(driveItem: DriveFolder | DriveFile, isSelected: boolean): Children {
		return m(".top.flex-space-between.badge-line-height")
	}
}
