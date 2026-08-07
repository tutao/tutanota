import { GetService, PostService, PutService, DeleteService, NonExistentDataTransferEntity, NonExistentDataTransferEntityTypeRef } from "@tutao/meta"

export const ApplicationTypesService_GET = new GetService<NonExistentDataTransferEntity, NonExistentDataTransferEntity>("base", "ApplicationTypesService", NonExistentDataTransferEntityTypeRef, NonExistentDataTransferEntityTypeRef)