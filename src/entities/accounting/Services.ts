import { CustomerAccountReturn, CustomerAccountReturnTypeRef } from "./TypeRefs.js"
import { GetService, PostService, PutService, DeleteService, NonExistentDataTransferEntity, NonExistentDataTransferEntityTypeRef } from "@tutao/meta"

export const CustomerAccountService_GET = new GetService<NonExistentDataTransferEntity, CustomerAccountReturn>("accounting", "CustomerAccountService", NonExistentDataTransferEntityTypeRef, CustomerAccountReturnTypeRef)