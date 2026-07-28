import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes.js"
import { TypeRef } from "../../../../platform-kit/meta"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig.js"
import { ListModel } from "../../../common/misc/ListModel"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, Mail, MailTypeRef } from "@tutao/entities/tutanota"
import { DriveFile, DriveFileTypeRef } from "@tutao/entities/drive"
import { ListFetchResult } from "../../../../ui/base/ListUtils"

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
//FIXME move to a common place
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
