// @flow

import {union} from "./ArrayUtils"
import {toLowerCase} from "./StringUtils"

type StringPredicate = string => boolean
const _false: StringPredicate = () => false

/**
 * removes invalid characters from the given filename
 * by replacing them with underscores (non-platform-specific)
 */
export function sanitizeFilename(filename: string, isReservedFileName: StringPredicate = _false): string {
	// / ? < > \ : * | "
	const illegalRe = /[\/\?<>\\:\*\|"]/g
	// unicode control codes
	const controlRe = /[\x00-\x1f\x80-\x9f]/g
	// trailing period in windows file names
	// this is valid in linux but can't be checked from the browser
	const windowsTrailingRe = /[\. ]+$/

	const unreserveFilename = name => isReservedFileName(name)
		? `_${name}`
		: name

	return unreserveFilename(filename)
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
export function legalizeFilenames(files: Array<string>, isReserved: StringPredicate = _false): {[string]: Array<string>} {
	const suffix = (name, suf) => {
		const basename = name.substring(0, name.indexOf('.')) || name
		const ext = name.substring(name.indexOf('.'))
		return `${basename}-${suf}${ext}`
	}

	const sanitizedNames = files.map(name => sanitizeFilename(name, isReserved))
	const deduplicatedNames = new Set(sanitizedNames.map(s => s.toLowerCase()))
	const oldNewPairs = sanitizedNames.map((name, idx) => [files[idx], name]) // pairs [oldname, newname]

	// if there are no duplicates then we can just return the sanitized names
	if (deduplicatedNames.size === sanitizedNames.length) {
		return oldNewPairs.reduce((map, [oldName, newName]) => ({...map, [oldName]: [newName]}), {}) // convert into map oldname -> [newname]
	}

	// do the deduplication
	const out = {}
	const duplicatesCount = {}
	for (let [oldName, cleanName] of oldNewPairs) {
		const lower = cleanName.toLowerCase()
		let newName
		if (duplicatesCount[lower] === undefined) {
			duplicatesCount[lower] = 0
			newName = cleanName
		} else {
			duplicatesCount[lower] = duplicatesCount[lower] + 1
			newName = suffix(cleanName, duplicatesCount[lower])
		}
		if (!out[oldName]) {
			out[oldName] = []
		}
		out[oldName].push(newName)
	}

	return out
}

/**
 * Uniqueify all the names in fileNames, case-insensitively
 * @param filenames
 * @param taken: file names that are taken but won't be included in the output
 * @returns {*[]}
 */
export function deduplicateFilenames(filenames: Array<string>, _taken: $ReadOnlySet<string> = new Set()): {[string]: Array<string>} {
	// make taken lowercase aswell for case insensitivity
	const taken = new Set(Array.from(_taken).map(toLowerCase))

	// Check first if we need to do a deduplication
	const deduplicatedNames = new Set(filenames.map(toLowerCase))
	if (deduplicatedNames.size === filenames.length && union(deduplicatedNames, taken).size === 0) {
		// if all file names are good then just return an identity map
		return filenames.reduce((map, name) => ({...map, name: [name]}), {}) // convert into map oldname -> [newname]
	}

	const suffix = (name, number) => {
		const basename = name.substring(0, name.indexOf('.')) || name
		// get the file extension or an empty string
		const ext = (name.match(/\..+$/) || [""])[0]
		return `${basename} (${number})${ext}`
	}

	// do the deduplication
	const out = {}
	const duplicateCounts = {}
	for (let name of filenames) {
		const lower = name.toLowerCase()
		let dedupName
		if (duplicateCounts[lower] === undefined) {
			duplicateCounts[lower] = 0
			dedupName = taken.has(lower)
				? suffix(name, ++duplicateCounts[lower])
				: name
		} else {
			dedupName = suffix(name, ++duplicateCounts[lower])
		}
		if (!out[name]) {
			out[name] = []
		}
		out[name].push(dedupName)
	}

	return out
}

/**
 * checks if the given filename is a reserved filename on the current platform
 * @param filename
 * @returns {boolean}
 * @private
 */
export function isReservedFilename(filename: string): boolean {
	// CON, CON.txt, COM0 etc. (windows device files)
	const winReservedRe = /^(CON|PRN|LPT[0-9]|COM[0-9]|AUX|NUL)($|\..*$)/i
	// .. and .
	const reservedRe = /^\.{1,2}$/

	return (env.platformId === "win32" && winReservedRe.test(filename)) || reservedRe.test(filename)
}