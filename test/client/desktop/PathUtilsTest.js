//@flow
import o from "ospec"
import path from 'path'
import n from "../nodemocker"
import {nonClobberingFilename, pathToFileURL} from "../../../src/desktop/PathUtils"

function setEnv(platform: string) {
	let sep = ''
	switch (platform) {
		case 'win32':
			sep = '\\'
			break
		case 'darwin':
		case 'linux':
			sep = '/'
			break
		default:
			throw new Error('invalid platform')
	}

	Object.defineProperty(process, 'platform', {
		value: platform,
		writable: false,
		enumerable: true
	})

	Object.defineProperty((path: any), 'sep', {
		value: sep,
		writable: false,
		enumerable: true
	})
}

o.spec("PathUtils", function () {
	o.spec("nonClobberingFileName Test", function () {
		o("noClash", function () {
			o(nonClobberingFilename(['bye.txt'], "hello.ext")).equals('hello.ext')
		})

		o("emptyDir", function () {
			o(nonClobberingFilename([], "hello.ext")).equals('hello.ext')
		})

		o("emptyString", function () {
			o(nonClobberingFilename([''], 'hello.ext')).equals('hello.ext')
		})

		o('duplicateFileNonClashing', function () {
			o(nonClobberingFilename([
				'hallo.txt',
				'hallo.txt'
			], 'hello.ext')).equals('hello.ext')
		})

		o('duplicateFileClashing', function () {
			o(nonClobberingFilename([
				'hello.ext',
				'hello.ext'
			], 'hello.ext')).equals('hello-1.ext')
		})

		o('clashingFiles', function () {
			o(nonClobberingFilename([
				'hello.ext'
			], 'hello.ext')).equals('hello-1.ext')

			o(nonClobberingFilename([
				'hello.ext',
				'hello-1.ext'
			], 'hello.ext')).equals('hello-2.ext')

			o(nonClobberingFilename([
				'hello.ext',
				'hello-1.ext',
				'hello-2.ext'
			], 'hello.ext')).equals('hello-3.ext')

			o(nonClobberingFilename([
				'hello.ext', 'hello-1.ext',
				'hello-2.ext', 'hello-3.ext',
				'hello-4.ext', 'hello-5.ext',
				'hello-6.ext', 'hello-7.ext',
				'hello-8.ext', 'hello-9.ext',
				'hello-10.ext',
			], 'hello.ext')).equals('hello-11.ext')


		})

		o('numberedFileNameNonClashing', function () {
			o(nonClobberingFilename([
				'hello.ext'
			], 'hello-1.ext')).equals('hello-1.ext')
		})

		o('numberedFileNameClashing', function () {
			o(nonClobberingFilename([
				'hello-1.ext'
			], 'hello-1.ext')).equals('hello-1-1.ext')
		})

		o('intermediate value', function () {
			o(nonClobberingFilename([
				'hello.ext',
				'hello-3.ext',
				'hello-1.ext',
				'hello-undefined.ext',
				'hello-Infinity.ext'
			], 'hello.ext')).equals('hello-2.ext')

			o(nonClobberingFilename([
				'hello-0.ext',
				'hello.ext',
				'hello-3.ext',
				'hello-1.ext',
			], 'hello.ext')).equals('hello-2.ext')

			o(nonClobberingFilename([
				'hello--2.ext',
				'hello-0.ext',
				'hello-3.ext',
				'hello-1.ext',
			], 'hello.ext')).equals('hello.ext')
		})

		o('truncated clashes', function () {
			o(nonClobberingFilename([
				'hello-.ext',
				'hello.',
				'hello',
				'ello.ext'
			], 'hello.ext')).equals('hello.ext')
		})

		o('almost clashes', function () {
			o(nonClobberingFilename([
				'hello.ext',
				'hello-a.ext',
				'hello-01.ext',
				'hello-0x01.ext'
			], 'hello.ext')).equals('hello-1.ext')
		})

		o('dotfiles', function () {
			o(nonClobberingFilename([
				'.ext', // unix dotfile w/o extension
			], '.ext')).equals('.ext-1')

			o(nonClobberingFilename([
				'.ext.txt', // unix dotfile w/o extension
			], '.ext.txt')).equals('.ext-1.txt')
		})

		o('malformedFilename', function () {
			o(nonClobberingFilename([
				'',
			], '')).equals('-1')

			o(nonClobberingFilename([
				'hello.ext',
			], '')).equals('')
		})

		o('invalid/reserved filenames', function () {
			o(nonClobberingFilename([], "\x00-\x1f\x80-\x9f.exe"))
				.equals('_-__-_.exe')

			n.setPlatform("win32")
			o(nonClobberingFilename(["CON-1.exe"], "CON.exe"))
				.equals('CON-2.exe')

			o(nonClobberingFilename([], "."))
				.equals("_")

			o(nonClobberingFilename(["_"], ".."))
				.equals("_-1")

			o(nonClobberingFilename([], "<>|?/\\.mp3"))
				.equals("______.mp3")

			o(nonClobberingFilename([], "CON<>|?/\\CON.mp3"))
				.equals("CON______CON.mp3")

			o(nonClobberingFilename([], "PRN.<p2."))
				.equals("PRN-1._p2_")

			o(nonClobberingFilename([], "LPT0"))
				.equals("LPT0-1")

			o(nonClobberingFilename([], "COM9"))
				.equals("COM9-1")

			o(nonClobberingFilename([], "AUX.AUX"))
				.equals("AUX-1.AUX")

			o(nonClobberingFilename([], "NUL"))
				.equals("NUL-1")

			o(nonClobberingFilename([], "nul"))
				.equals("nul-1")

			o(nonClobberingFilename([], "NULNUL"))
				.equals("NULNUL")

			o(nonClobberingFilename([], ".NUL"))
				.equals(".NUL")

			o(nonClobberingFilename([], "<>|?/\\CON."))
				.equals("______CON_")

			n.setPlatform("linux")
			o(nonClobberingFilename([], "nul"))
				.equals("nul")

			o(nonClobberingFilename([], ".."))
				.equals("_")
		})
	})

	o.spec("pathToFileURL Test", function () {
		let oldPlatform = process.platform

		o.before(function () {
			setEnv(oldPlatform)
		})

		o.after(function () {
			setEnv(oldPlatform)
		})

		o("emptyPath", function () {
			setEnv('linux')
			o(pathToFileURL(''))
				.equals('file://')

			setEnv('darwin')
			o(pathToFileURL(''))
				.equals('file://')

			setEnv('win32')
			o(pathToFileURL(''))
				.equals('file://')
		})

		o("normalPath", function () {
			setEnv('win32')
			o(pathToFileURL('C:\\home\\nig\\index.html'))
				.equals('file:///C%3A/home/nig/index.html')

			setEnv('darwin')
			o(pathToFileURL('/Users/nig/Library/Application Support/index.html'))
				.equals('file:///Users/nig/Library/Application%20Support/index.html')

			setEnv('linux')
			o(pathToFileURL('home/nig/index.html'))
				.equals('file://home/nig/index.html')
		})
	})
})