import { ListElementListModel } from "../../../common/misc/ListElementListModel"
import { File, FileTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { DriveFacade } from "../../../common/api/worker/facades/DriveFacade"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig"
import { compare, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"

export class DriveFolderContentListViewModel {
	public listModel: ListElementListModel<File>

	constructor(
		private readonly entityClient: EntityClient,
		private readonly driveFacade: DriveFacade,
	) {
		this.listModel = this.makeListModel(this.entityClient)

		this.listModel.loadInitial()
	}

	private makeListModel(entityClient: EntityClient) {
		const listModel = new ListElementListModel<File>({
			autoSelectBehavior(): ListAutoSelectBehavior {
				return ListAutoSelectBehavior.NONE
			},
			loadSingle(listId: Id, itemId: Id): Promise<File | null> {
				return entityClient.load(FileTypeRef, [listId, itemId])
			},
			sortCompare: (f1: File, f2: File) => {
				return compare(stringToUtf8Uint8Array(f1.name), stringToUtf8Uint8Array(f2.name))
			},
			fetch: async (_lastFetchedEntity, _count) => {
				// load all entries at once to apply custom sort order
				const allEntries = await this.driveFacade.getRootFiles()
				return { items: allEntries, complete: true }
			},
		})

		return listModel
	}
}
