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
import { GetService, PostService, PutService, DeleteService, NullEntityTypeRef, NullEntity } from "@tutao/meta"

export const DriveCopyService_POST = new PostService<DriveCopyServicePostIn, DriveCopyServicePostOut>("drive", "DriveCopyService", DriveCopyServicePostInTypeRef, DriveCopyServicePostOutTypeRef)

export const DriveFolderService_POST = new PostService<DriveFolderServicePostIn, DriveFolderServicePostOut>("drive", "DriveFolderService", DriveFolderServicePostInTypeRef, DriveFolderServicePostOutTypeRef)
export const DriveFolderService_PUT = new PutService<DriveFolderServicePutIn, NullEntity>("drive", "DriveFolderService", DriveFolderServicePutInTypeRef, NullEntityTypeRef)
export const DriveFolderService_DELETE = new DeleteService<DriveFolderServiceDeleteIn, NullEntity>("drive", "DriveFolderService", DriveFolderServiceDeleteInTypeRef, NullEntityTypeRef)

export const DriveItemService_POST = new PostService<DriveItemPostIn, DriveItemPostOut>("drive", "DriveItemService", DriveItemPostInTypeRef, DriveItemPostOutTypeRef)
export const DriveItemService_PUT = new PutService<DriveItemPutIn, NullEntity>("drive", "DriveItemService", DriveItemPutInTypeRef, NullEntityTypeRef)
export const DriveItemService_DELETE = new DeleteService<DriveItemDeleteIn, DriveItemServiceDeleteOut>("drive", "DriveItemService", DriveItemDeleteInTypeRef, DriveItemServiceDeleteOutTypeRef)

export const DriveService_POST = new PostService<DrivePostIn, NullEntity>("drive", "DriveService", DrivePostInTypeRef, NullEntityTypeRef)