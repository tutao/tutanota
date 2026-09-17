export type PluginFileReference = {
	/** path of the file within the user's remote file space, relative to their root, e.g. "/Documents/invoice.pdf" */
	path: string
}

export interface FileImportExtension {
	receiveFileReference(fileReference: PluginFileReference): Promise<void>
}
