import path from "node:path"
import { sanitizeFilename } from "../api/common/utils/FileUtils"
import { neverNull } from "@tutao/tutanota-utils"
import { promises as fs } from "node:fs"
import { PathExports } from "./ElectronExportTypes"

/**
 * Can be used when you want to ensure only valid file extensions are being provided. feel free to add some
 */
export type ValidExtension = "msg"

// taken from https://www.lifewire.com/list-of-executable-file-extensions-2626061
// we take the full list, which may be overkill
// we should update this semi-regularly
export const EXECUTABLE_EXTENSIONS = [
	"0xe",
	"73k",
	"89k",
	"a6p",
	"ac",
	"acc",
	"acr",
	"action",
	"actm",
	"ahk",
	"air",
	"apk",
	"app",
	"arscript",
	"as",
	"asb",
	"awk",
	"azw2",
	"bat",
	"beam",
	"bin",
	"btm",
	"cel",
	"celx",
	"chm",
	"cmd",
	"cof",
	"com",
	"command",
	"cpl",
	"crt",
	"csh",
	"dek",
	"dld",
	"dmc",
	"docm",
	"dotm",
	"dxl",
	"ear",
	"ebm",
	"ebs",
	"ebs2",
	"ecf",
	"eham",
	"elf",
	"es",
	"ex_",
	"ex4",
	"exe",
	"exopc",
	"ezs",
	"fas",
	"fky",
	"fpi",
	"frs",
	"fxp",
	"gadget",
	"gs",
	"ham",
	"hms",
	"hpf",
	"hta",
	"iim",
	"inf",
	"inf1",
	"ins",
	"inx",
	"ipa",
	"ipf",
	"isp",
	"isu",
	"jar",
	"job",
	"js",
	"jse",
	"jsx",
	"kix",
	"ksh",
	"lnk",
	"lo",
	"ls",
	"mam",
	"mcr",
	"mel",
	"mpx",
	"mrc",
	"ms",
	"msc",
	"msi",
	"msp",
	"mst",
	"mxe",
	"nexe",
	"obs",
	"ore",
	"osx",
	"otm",
	"out",
	"paf",
	"pex",
	"pif",
	"plx",
	"potm",
	"ppam",
	"ppsm",
	"pptm",
	"prc",
	"prg",
	"ps1",
	"pvd",
	"pwc",
	"pyc",
	"pyo",
	"qpx",
	"rbx",
	"reg",
	"rgs",
	"rox",
	"rpj",
	"run",
	"s2a",
	"sbs",
	"sca",
	"scar",
	"scb",
	"scr",
	"script",
	"sct",
	"shb",
	"shs",
	"smm",
	"spr",
	"tcp",
	"thm",
	"tlb",
	"tms",
	"u3p",
	"udf",
	"upx",
	"url",
	"vb",
	"vbe",
	"vbs",
	"vbscript",
	"vlx",
	"vpm",
	"wcm",
	"widget",
	"wiz",
	"workflow",
	"wpk",
	"wpm",
	"ws",
	"wsf",
	"wsh",
	"xap",
	"xbap",
	"xlam",
	"xlm",
	"xlsm",
	"xltm",
	"xqt",
	"xys",
	"zl9",
]

/**
 * compares a filename to a list of filenames and finds the first number-suffixed
 * filename not already contained in the list.
 * @returns {string} the basename appended with '-<first non-clashing positive number>.<ext>
 */
export function nonClobberingFilename(files: Array<string>, filename: string): string {
	filename = sanitizeFilename(filename)
	const clashingFile = files.find((f) => f === filename)

	if (typeof clashingFile !== "string") {
		// all is well
		return filename
	} else {
		// there are clashing file names
		const ext = path.extname(filename)
		const basename = path.basename(filename, ext)
		const clashNumbers: Array<number> = files
			.filter((f) => f.startsWith(`${basename}-`))
			.map((f) => f.slice(0, f.length - ext.length))
			.map((f) => f.slice(basename.length + 1, f.length))
			.map((f) => (!f.startsWith("0") ? parseInt(f, 10) : 0))
			.filter((n) => !isNaN(n) && n > 0)
		const clashNumbersSet: Set<number> = new Set(clashNumbers)
		clashNumbersSet.add(0)
		// if a number is bigger than its index, there is room somewhere before that number
		const firstGapMinusOne = Array.from(clashNumbersSet)
			.sort((a, b) => a - b)
			.find((n, i, a) => a[i + 1] > i + 1)
		return firstGapMinusOne != null && !isNaN(firstGapMinusOne)
			? `${basename}-${neverNull(firstGapMinusOne) + 1}${ext}`
			: `${basename}-${clashNumbersSet.size}${ext}`
	}
}

export function looksExecutable(file: string): boolean {
	const basename = path.basename(file)
	// if the file has an empty filename with just an extension (e.g. just ".exe" or ".bat")
	// then path.extname will return an empty string resulting in this function returning false
	// this is a problem because windows would still try to execute a file named ".exe", so it should return true
	const ext = basename.match(/^\.[^.]+$/) ? basename : path.extname(basename)

	return EXECUTABLE_EXTENSIONS.includes(ext.toLowerCase().slice(1))
}

/**
 * Determine if a file exists with a given path and it is a regular file
 * @param filePath
 * @returns Promise<boolean>
 */
export async function fileExists(filePath: string): Promise<boolean> {
	return fs
		.stat(filePath)
		.then((stats) => stats.isFile())
		.catch(() => false)
}

export function parseUrlOrNull(urlString: string): URL | null {
	try {
		return new URL(urlString)
	} catch (e) {
		return null
	}
}

export function urlIsPrefix(prefix: URL, url: URL): boolean {
	return (
		url.protocol === prefix.protocol &&
		url.hostname === prefix.hostname &&
		url.port === prefix.port &&
		url.username === prefix.username &&
		url.pathname.startsWith(prefix.pathname)
	)
}

/**
 * replace the last component in a file path with another
 * @param p path to a file/folder
 * @param file the file name to put in the last path component
 * @param pathModule path module to use for cross platform testing
 */
export function swapFilename(p: string, file: string, pathModule: PathExports = path): string {
	const dir = pathModule.dirname(p)
	return pathModule.join(dir, file)
}
