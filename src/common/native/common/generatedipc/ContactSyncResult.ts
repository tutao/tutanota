/* generated file, don't edit. */

import { StructuredContact } from "./StructuredContact.js"
export interface ContactSyncResult {
	readonly createdOnDevice: ReadonlyArray<StructuredContact>
	readonly editedOnDevice: ReadonlyArray<StructuredContact>
	readonly deletedOnDevice: ReadonlyArray<string>
}
