/* generated file, don't edit. */

import { DirectoryReference } from "./DirectoryReference.js"
export interface DirectoryReference {
	readonly name: string
	readonly path: string
	readonly files: ReadonlyArray<string>
	readonly folders: ReadonlyArray<DirectoryReference>
}
