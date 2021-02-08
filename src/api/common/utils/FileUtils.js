// @flow
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

/**
 * take array of file names and add numbered suffixes to the basename of
 * duplicates. Use to make a legal set of names for files written to disk
 * at the same time.
 *
 * treats file names that already have numbered suffixes as non-numbered.
 * assumes the file system is case insensitive (a.txt would overwrite A.TXT)
 *
 * @param files file names.
 * @param isReserved (optional) function returning true for filenames that are reserved and will be suffixed.
 * @returns map from old names to array of new names. use map[oldname].shift() to replace oldname with newname.
 */
export function legalizeFilenames(files: Array<string>, isReserved: ?(string)=>boolean): {[string]: Array<string>} {
	const suffix = (name, suf) => {
		const basename = name.substring(0, name.indexOf('.')) || name
		const ext = name.substring(name.indexOf('.'))
		return `${basename}-${suf}${ext}`
	}

	const unreserveFilename = name => (isReserved && isReserved(name))
		? suffix(name, "")
		: name

	let cleaned = files.map(sanitizeFilename).map(unreserveFilename)
	let dedup = new Set(cleaned.map(s => s.toLowerCase()))
	let conv = cleaned.map((e, i) => [files[i], e]) // pairs [oldname, newname]
	if (dedup.size === cleaned.length) {
		return conv.reduce((m, [o, n]) => ({...m, [o]: [n]}), {}) // convert into map oldname -> [newname]
	}

	const out = {}
	const news = {}
	conv.forEach(([o, n]) => {
		const lower = n.toLowerCase()
		let newname
		if (news[lower] === undefined) {
			news[lower] = 0
			newname = n
		} else {
			news[lower] = news[lower] + 1
			newname = suffix(n, news[lower])
		}
		if (out[o]) {
			out[o].push(newname)
		} else {
			out[o] = [newname]
		}
	})

	return out
}