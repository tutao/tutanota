//@flow
import o from "ospec/ospec.js"
import DesktopUtils from "../../../src/desktop/DesktopUtils.js"
import path from 'path'
import n from '../nodemocker'

n.mock("./DesktopCryptoFacade", {}).set()

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

o.spec("nonClobberingFileName Test", function () {
	o("noClash", function () {
		o(DesktopUtils.nonClobberingFilename(['bye.txt'], "hello.ext")).equals('hello.ext')
	})

	o("emptyDir", function () {
		o(DesktopUtils.nonClobberingFilename([], "hello.ext")).equals('hello.ext')
	})

	o("emptyString", function () {
		o(DesktopUtils.nonClobberingFilename([''], 'hello.ext')).equals('hello.ext')
	})

	o('duplicateFileNonClashing', function () {
		o(DesktopUtils.nonClobberingFilename([
			'hallo.txt',
			'hallo.txt'
		], 'hello.ext')).equals('hello.ext')
	})

	o('duplicateFileClashing', function () {
		o(DesktopUtils.nonClobberingFilename([
			'hello.ext',
			'hello.ext'
		], 'hello.ext')).equals('hello-1.ext')
	})

	o('clashingFiles', function () {
		o(DesktopUtils.nonClobberingFilename([
			'hello.ext'
		], 'hello.ext')).equals('hello-1.ext')

		o(DesktopUtils.nonClobberingFilename([
			'hello.ext',
			'hello-1.ext'
		], 'hello.ext')).equals('hello-2.ext')

		o(DesktopUtils.nonClobberingFilename([
			'hello.ext',
			'hello-1.ext',
			'hello-2.ext'
		], 'hello.ext')).equals('hello-3.ext')

		o(DesktopUtils.nonClobberingFilename([
			'hello.ext', 'hello-1.ext',
			'hello-2.ext', 'hello-3.ext',
			'hello-4.ext', 'hello-5.ext',
			'hello-6.ext', 'hello-7.ext',
			'hello-8.ext', 'hello-9.ext',
			'hello-10.ext',
		], 'hello.ext')).equals('hello-11.ext')

		o(DesktopUtils.nonClobberingFilename(["A"], "a")).equals('a-1')
		o(DesktopUtils.nonClobberingFilename(["A", "a"], "a")).equals('a-1')
	})

	o('numberedFileNameNonClashing', function () {
		o(DesktopUtils.nonClobberingFilename([
			'hello.ext'
		], 'hello-1.ext')).equals('hello-1.ext')
	})

	o('numberedFileNameClashing', function () {
		o(DesktopUtils.nonClobberingFilename([
			'hello-1.ext'
		], 'hello-1.ext')).equals('hello-1-1.ext')
	})

	o('intermediate value', function () {
		o(DesktopUtils.nonClobberingFilename([
			'hello.ext',
			'hello-3.ext',
			'hello-1.ext',
			'hello-undefined.ext',
			'hello-Infinity.ext'
		], 'hello.ext')).equals('hello-2.ext')

		o(DesktopUtils.nonClobberingFilename([
			'hello-0.ext',
			'hello.ext',
			'hello-3.ext',
			'hello-1.ext',
		], 'hello.ext')).equals('hello-2.ext')

		o(DesktopUtils.nonClobberingFilename([
			'hello--2.ext',
			'hello-0.ext',
			'hello-3.ext',
			'hello-1.ext',
		], 'hello.ext')).equals('hello.ext')
	})

	o('truncated clashes', function () {
		o(DesktopUtils.nonClobberingFilename([
			'hello-.ext',
			'hello.',
			'hello',
			'ello.ext'
		], 'hello.ext')).equals('hello.ext')
	})

	o('almost clashes', function () {
		o(DesktopUtils.nonClobberingFilename([
			'hello.ext',
			'hello-a.ext',
			'hello-01.ext',
			'hello-0x01.ext'
		], 'hello.ext')).equals('hello-1.ext')
	})

	o('dotfiles', function () {
		o(DesktopUtils.nonClobberingFilename([
			'.ext', // unix dotfile w/o extension
		], '.ext')).equals('.ext-1')

		o(DesktopUtils.nonClobberingFilename([
			'.ext.txt', // unix dotfile w/o extension
		], '.ext.txt')).equals('.ext-1.txt')
	})

	o('malformedFilename', function () {
		o(DesktopUtils.nonClobberingFilename([
			'',
		], '')).equals('-1')

		o(DesktopUtils.nonClobberingFilename([
			'hello.ext',
		], '')).equals('')
	})

	o('invalid/reserved filenames', function () {
		o(DesktopUtils.nonClobberingFilename([], "\x00-\x1f\x80-\x9f.exe"))
			.equals('_-__-_.exe')

		n.setPlatform("win32")
		o(DesktopUtils.nonClobberingFilename(["CON-1.exe"], "CON.exe"))
			.equals('CON-2.exe')

		o(DesktopUtils.nonClobberingFilename([], "."))
			.equals("_")

		o(DesktopUtils.nonClobberingFilename(["_"], ".."))
			.equals("_-1")

		o(DesktopUtils.nonClobberingFilename([], "<>|?/\\.mp3"))
			.equals("______.mp3")

		o(DesktopUtils.nonClobberingFilename([], "CON<>|?/\\CON.mp3"))
			.equals("CON______CON.mp3")

		o(DesktopUtils.nonClobberingFilename([], "PRN.<p2."))
			.equals("PRN-1._p2_")

		o(DesktopUtils.nonClobberingFilename([], "LPT0"))
			.equals("LPT0-1")

		o(DesktopUtils.nonClobberingFilename([], "COM9"))
			.equals("COM9-1")

		o(DesktopUtils.nonClobberingFilename([], "AUX.AUX"))
			.equals("AUX-1.AUX")

		o(DesktopUtils.nonClobberingFilename([], "NUL"))
			.equals("NUL-1")

		o(DesktopUtils.nonClobberingFilename([], "nul"))
			.equals("nul-1")

		o(DesktopUtils.nonClobberingFilename([], "NULNUL"))
			.equals("NULNUL")

		o(DesktopUtils.nonClobberingFilename([], ".NUL"))
			.equals(".NUL")

		o(DesktopUtils.nonClobberingFilename([], "<>|?/\\CON."))
			.equals("______CON_")

		n.setPlatform("linux")
		o(DesktopUtils.nonClobberingFilename([], "nul"))
			.equals("nul")

		o(DesktopUtils.nonClobberingFilename([], ".."))
			.equals("_")
	})
})

o.spec("legalizeFilenames Test", function () {
	o("empty array is OK ", function () {
		o(DesktopUtils.legalizeFilenames([]))
			.deepEquals({})
	})

	o("windows reserved filenames get legalized", function () {
		const arr = ["nul", "con", "con.pdf", "123.ex", "123.ex"]
		const pf = process.platform
		n.setPlatform("linux")
		o(DesktopUtils.legalizeFilenames(arr))
			.deepEquals({
				"nul": ["nul"],
				"con": ["con"],
				"con.pdf": ["con.pdf"],
				"123.ex": ["123.ex", "123-1.ex"]
			})
		n.setPlatform("win32")
		o(DesktopUtils.legalizeFilenames(arr))
			.deepEquals({
				"nul": ["nul-"],
				"con": ["con-"],
				"con.pdf": ["con-.pdf"],
				"123.ex": ["123.ex", "123-1.ex"]
			})
		n.setPlatform(pf)
	})

	o("no dupes", function () {
		o(DesktopUtils.legalizeFilenames(["1.pdf", "2.pdf", "3.pdf"]))
			.deepEquals({
				'1.pdf': ['1.pdf'],
				'2.pdf': ['2.pdf'],
				'3.pdf': ['3.pdf']
			})

		o(DesktopUtils.legalizeFilenames([
			'/tmp/4ec6fa51ddfb6a92219729f1/2020-10-01-18h54m44s-?.eml',
			'/tmp/4ec6fa51ddfb6a92219729f1/2020-10-01-18h52m35s->.eml',
			'/tmp/4ec6fa51ddfb6a92219729f1/2020-10-01-18h52m29s->.eml',
			'/tmp/4ec6fa51ddfb6a92219729f1/2020-10-01-18h37m31s-<.eml'
		])).deepEquals({
			'/tmp/4ec6fa51ddfb6a92219729f1/2020-10-01-18h54m44s-?.eml':
				['_tmp_4ec6fa51ddfb6a92219729f1_2020-10-01-18h54m44s-_.eml'],
			'/tmp/4ec6fa51ddfb6a92219729f1/2020-10-01-18h52m35s->.eml':
				['_tmp_4ec6fa51ddfb6a92219729f1_2020-10-01-18h52m35s-_.eml'],
			'/tmp/4ec6fa51ddfb6a92219729f1/2020-10-01-18h52m29s->.eml':
				['_tmp_4ec6fa51ddfb6a92219729f1_2020-10-01-18h52m29s-_.eml'],
			'/tmp/4ec6fa51ddfb6a92219729f1/2020-10-01-18h37m31s-<.eml':
				['_tmp_4ec6fa51ddfb6a92219729f1_2020-10-01-18h37m31s-_.eml']
		})
	})

	o("only dupes", function () {
		o(DesktopUtils.legalizeFilenames(["1.pdf", "1.pdf", "1.pdf"]))
			.deepEquals({
				'1.pdf': ['1.pdf', '1-1.pdf', '1-2.pdf'],
			})
	})

	o("cleaned filenames clash after unreserving/sanitization", function () {
		o(DesktopUtils.legalizeFilenames(["?", ">", "?"]))
			.deepEquals({
				'?': ['_', '_-2'],
				'>': ['_-1'],
			})
		const pf = process.platform
		n.setPlatform('win32')
		o(DesktopUtils.legalizeFilenames(["con-", "con"]))
			.deepEquals({
				'con-': ['con-'],
				'con': ['con--1']
			})
		n.setPlatform(pf)
	})

	o("assume case insensitivity", function () {
		o(DesktopUtils.legalizeFilenames(['A', 'A', 'a']))
			.deepEquals({
				"A": ['A', 'A-1'],
				"a": ['a-2']
			})
	})
})

o.spec("touch test", function () {
	n.startGroup({
		group: __filename, allowables: [
			'../api/common/utils/Utils.js',
			'../TutanotaConstants',
			'./utils/Utils',
			'../EntityFunctions',
			'./utils/Encoding',
			'../error/CryptoError',
			'./TutanotaError',
			'./StringUtils',
			'./EntityConstants',
			'./utils/Utils',
			'./utils/ArrayUtils',
			'./Utils',
			'./MapUtils',
			'./Utils',
			'../api/common/error/JsonTypeError',
			'./TutanotaError'
		]
	})

	o('touch a file', function () {
		const fsMock = n.mock('fs-extra', {
			closeSync: (id) => {},
			openSync: (path, mode) => 42
		}).set()

		const electronMock = n.mock('electron', {}).set()
		const cpMock = n.mock('child_process', {}).set()
		const cryptoMock = n.mock('crypto', {}).set()

		const desktopUtils = n.subject("../../src/desktop/DesktopUtils.js").default

		desktopUtils.touch('hello')

		o(fsMock.openSync.callCount).equals(1)
		o(fsMock.openSync.args[0]).equals('hello')
		o(fsMock.openSync.args[1]).equals('a')
		o(fsMock.openSync.args[2]).equals(undefined)

		o(fsMock.closeSync.callCount).equals(1)
		o(fsMock.closeSync.args[0]).equals(42)
		o(fsMock.closeSync.args[1]).equals(undefined)

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
		o(DesktopUtils.pathToFileURL(''))
			.equals('file://')

		setEnv('darwin')
		o(DesktopUtils.pathToFileURL(''))
			.equals('file://')

		setEnv('win32')
		o(DesktopUtils.pathToFileURL(''))
			.equals('file://')
	})

	o("normalPath", function () {
		setEnv('win32')
		o(DesktopUtils.pathToFileURL('C:\\home\\nig\\index.html'))
			.equals('file:///C%3A/home/nig/index.html')

		setEnv('darwin')
		o(DesktopUtils.pathToFileURL('/Users/nig/Library/Application Support/index.html'))
			.equals('file:///Users/nig/Library/Application%20Support/index.html')

		setEnv('linux')
		o(DesktopUtils.pathToFileURL('home/nig/index.html'))
			.equals('file://home/nig/index.html')
	})
})
