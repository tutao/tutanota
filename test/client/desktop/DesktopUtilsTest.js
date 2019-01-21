//@flow
import o from "ospec/ospec.js"
import DesktopUtils from "../../../src/desktop/DesktopUtils.js"
import path from 'path'

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
		o(DesktopUtils.nonClobberingFileName(['bye.txt'], "hello.ext")).equals('hello.ext')
	})

	o("emptyDir", function () {
		o(DesktopUtils.nonClobberingFileName([], "hello.ext")).equals('hello.ext')
	})

	o("emptyString", function () {
		o(DesktopUtils.nonClobberingFileName([''], 'hello.ext')).equals('hello.ext')
	})

	o('duplicateFileNonClashing', function () {
		o(DesktopUtils.nonClobberingFileName([
			'hallo.txt',
			'hallo.txt'
		], 'hello.ext')).equals('hello.ext')
	})

	o('duplicateFileClashing', function () {
		o(DesktopUtils.nonClobberingFileName([
			'hello.ext',
			'hello.ext'
		], 'hello.ext')).equals('hello-1.ext')
	})

	o('oneClashingFile', function () {
		o(DesktopUtils.nonClobberingFileName([
			'hello.ext'
		], 'hello.ext')).equals('hello-1.ext')
	})

	o('numberedFileNameNonClashing', function () {
		o(DesktopUtils.nonClobberingFileName([
			'hello.ext'
		], 'hello-1.ext')).equals('hello-1.ext')
	})

	o('numberedFileNameClashing', function () {
		o(DesktopUtils.nonClobberingFileName([
			'hello-1.ext'
		], 'hello-1.ext')).equals('hello-1-1.ext')
	})

	o('intermediate value', function () {
		o(DesktopUtils.nonClobberingFileName([
			'hello.ext',
			'hello-3.ext',
			'hello-1.ext',
			'hello-undefined.ext',
			'hello-Infinity.ext'
		], 'hello.ext')).equals('hello-2.ext')

		o(DesktopUtils.nonClobberingFileName([
			'hello-0.ext',
			'hello.ext',
			'hello-3.ext',
			'hello-1.ext',
		], 'hello.ext')).equals('hello-2.ext')

		o(DesktopUtils.nonClobberingFileName([
			'hello-0.ext',
			'hello-3.ext',
			'hello-1.ext',
		], 'hello.ext')).equals('hello.ext')
	})

	o('truncated clashes', function () {
		o(DesktopUtils.nonClobberingFileName([
			'hello-.ext',
			'hello.',
			'hello',
			'ello.ext'
		], 'hello.ext')).equals('hello.ext')
	})

	o('almost clashes', function () {
		o(DesktopUtils.nonClobberingFileName([
			'hello.ext',
			'hello-a.ext',
			'hello-01.ext',
			'hello-0x01.ext'
		], 'hello.ext')).equals('hello-1.ext')
	})

	o('dotfiles', function () {
		o(DesktopUtils.nonClobberingFileName([
			'.ext', // unix dotfile w/o extension
		], '.ext')).equals('.ext-1')

		o(DesktopUtils.nonClobberingFileName([
			'.ext.txt', // unix dotfile w/o extension
		], '.ext.txt')).equals('.ext-1.txt')
	})

	o('malformedFilename', function () {
		o(DesktopUtils.nonClobberingFileName([
			'',
		], '')).equals('-1')

		o(DesktopUtils.nonClobberingFileName([
			'hello.ext',
		], '')).equals('')
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