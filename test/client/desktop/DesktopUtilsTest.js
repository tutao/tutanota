//@flow
import o from "ospec/ospec.js"
import DesktopUtils from "../../../src/desktop/DesktopUtils.js"
import path from 'path'
import n from '../nodemocker'

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

	Object.defineProperty(path, 'sep', {
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
})

o.spec("touch test", function () {
	n.startGroup(__filename, [
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
	])

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
