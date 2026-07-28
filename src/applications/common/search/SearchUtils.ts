import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, Mail, MailTypeRef } from "@tutao/entities/tutanota"
import { DriveFile, DriveFileTypeRef } from "@tutao/entities/drive"
import { SearchCategoryType } from "../api/worker/search/SearchTypes"
import { TypeRef } from "@tutao/meta"
import { ListModel } from "../misc/ListModel"
import { ListFetchResult } from "../../../ui/base/ListUtils"
import { ListAutoSelectBehavior } from "../misc/DeviceConfig"
import m, { Children } from "mithril"
import { isBrowser } from "@tutao/app-env"
import { InfoLink, lang } from "../../../ui/utils/LanguageViewModel"

export type SearchableTypes = Mail | Contact | CalendarEvent | DriveFile

export enum PaidFunctionResult {
	Success,
	PaidSubscriptionNeeded,
}

export function searchCategoryTypeToTypeRef(searchType: SearchCategoryType): TypeRef<SearchableTypes> {
	switch (searchType) {
		case SearchCategoryType.mail:
			return MailTypeRef
		case SearchCategoryType.contact:
			return ContactTypeRef
		case SearchCategoryType.calendar:
			return CalendarEventTypeRef
		case SearchCategoryType.drive:
			// FIXME: this won't work, need to remove all of it
			return DriveFileTypeRef
	}
}
export function emptyListModel<ItemType, IdType>(): ListModel<ItemType, IdType> {
	return new ListModel({
		async fetch(last: ItemType | null | undefined, count: number): Promise<ListFetchResult<ItemType>> {
			return { items: [] as ItemType[], complete: true }
		},
		sortCompare(item1: ItemType, item2: ItemType): number {
			return 0
		},
		getItemId(item: ItemType): IdType {
			throw new Error()
		},
		isSameId(id1: IdType, id2: IdType): boolean {
			throw new Error()
		},
		autoSelectBehavior: () => ListAutoSelectBehavior.NEWER,
	})
}
export function renderSearchInOurApps(): Children | null {
	if (!isBrowser()) {
		return null
	} else {
		return m.trust(
			lang.get("searchInOurApps_msg", {
				"{link}": `<a href="${InfoLink.Download}" target="_blank">${lang.get("searchInOurAppsLinkText_msg")}</a>`,
			}),
		)
	}
}
