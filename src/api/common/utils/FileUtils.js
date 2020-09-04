/**
 * removes invalid characters from the given filename
 * by replacing them with underscores (non-platform-specific)
 */
export function sanitizeFilename(filename: string): string {
	// / ? < > \ : * | "
	const illegalRe = /[\/\?<>\\:\*\|"]/g
	// unicode control codes
	const controlRe = /[\x00-\x1f\x80-\x9f]/g
	// trailing period in windows file names
	// this is valid in linux but can't be checked from the browser
	const windowsTrailingRe = /[\. ]+$/

	return filename
		.replace(illegalRe, "_")
		.replace(controlRe, "_")
		.replace(windowsTrailingRe, "_")
}
