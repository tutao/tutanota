import { DriveCopyServicePostIn, DriveCopyServicePostInTypeRef } from "./TypeRefs.js"
import { DriveCopyServicePostOut, DriveCopyServicePostOutTypeRef } from "./TypeRefs.js"
import { DriveFolderServicePostIn, DriveFolderServicePostInTypeRef } from "./TypeRefs.js"
import { DriveFolderServicePostOut, DriveFolderServicePostOutTypeRef } from "./TypeRefs.js"
import { DriveFolderServicePutIn, DriveFolderServicePutInTypeRef } from "./TypeRefs.js"
import { DriveFolderServiceDeleteIn, DriveFolderServiceDeleteInTypeRef } from "./TypeRefs.js"
import { DriveItemPostIn, DriveItemPostInTypeRef } from "./TypeRefs.js"
import { DriveItemPostOut, DriveItemPostOutTypeRef } from "./TypeRefs.js"
import { DriveItemPutIn, DriveItemPutInTypeRef } from "./TypeRefs.js"
import { DriveItemDeleteIn, DriveItemDeleteInTypeRef } from "./TypeRefs.js"
import { DriveItemServiceDeleteOut, DriveItemServiceDeleteOutTypeRef } from "./TypeRefs.js"
import { DrivePostIn, DrivePostInTypeRef } from "./TypeRefs.js"
import { GetService, PostService, PutService, DeleteService, NonExistentDataTransferEntity, NonExistentDataTransferEntityTypeRef } from "@tutao/meta"

export const DriveCopyService_POST = new PostService<DriveCopyServicePostIn, DriveCopyServicePostOut>("drive", "DriveCopyService", DriveCopyServicePostInTypeRef, DriveCopyServicePostOutTypeRef)

export const DriveFolderService_POST = new PostService<DriveFolderServicePostIn, DriveFolderServicePostOut>("drive", "DriveFolderService", DriveFolderServicePostInTypeRef, DriveFolderServicePostOutTypeRef)
export const DriveFolderService_PUT = new PutService<DriveFolderServicePutIn, NonExistentDataTransferEntity>("drive", "DriveFolderService", DriveFolderServicePutInTypeRef, NonExistentDataTransferEntityTypeRef)
export const DriveFolderService_DELETE = new DeleteService<DriveFolderServiceDeleteIn, NonExistentDataTransferEntity>("drive", "DriveFolderService", DriveFolderServiceDeleteInTypeRef, NonExistentDataTransferEntityTypeRef)

export const DriveItemService_POST = new PostService<DriveItemPostIn, DriveItemPostOut>("drive", "DriveItemService", DriveItemPostInTypeRef, DriveItemPostOutTypeRef)
export const DriveItemService_PUT = new PutService<DriveItemPutIn, NonExistentDataTransferEntity>("drive", "DriveItemService", DriveItemPutInTypeRef, NonExistentDataTransferEntityTypeRef)
export const DriveItemService_DELETE = new DeleteService<DriveItemDeleteIn, DriveItemServiceDeleteOut>("drive", "DriveItemService", DriveItemDeleteInTypeRef, DriveItemServiceDeleteOutTypeRef)

export const DriveService_POST = new PostService<DrivePostIn, NonExistentDataTransferEntity>("drive", "DriveService", DrivePostInTypeRef, NonExistentDataTransferEntityTypeRef)