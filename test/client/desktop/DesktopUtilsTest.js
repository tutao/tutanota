//@flow
import o from "ospec/ospec.js"
import DesktopUtils from "../../../src/desktop/DesktopUtils.js"
import path from 'path'
import {isMailAddress} from "../../../src/misc/FormatValidator"
import {JsonTypeError} from "../../../src/api/common/error/JsonTypeError"
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

o.spec("json type check test", function () {
	o("string type check", () => {
		o(() => DesktopUtils.checkDataFormat({
			some: "content"
		}, {
			some: {type: "string"}
		})).notThrows()

		o(() => DesktopUtils.checkDataFormat({
			some: 0
		}, {
			some: {type: "string"}
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({
			some: true
		}, {
			some: {type: "string"}
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({
			some: function () { return ""}
		}, {
			some: {type: "string"}
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({
			some: ["a"]
		}, {
			some: {type: "string"}
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({}, {
			some: {type: "string"}
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({
			some: null
		}, {
			some: {type: "string"}
		})).throws(JsonTypeError)
	})

	o("boolean type check", () => {
		o(() => DesktopUtils.checkDataFormat(true, {type: "boolean"})).notThrows()

		o(() => DesktopUtils.checkDataFormat({
			some: "content"
		}, {
			some: {type: "boolean"}
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({
			some: 0
		}, {
			some: {type: "boolean"}
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({
			some: true
		}, {
			some: {type: "boolean"}
		})).notThrows()

		o(() => DesktopUtils.checkDataFormat({
			some: function () { return ""}
		}, {
			some: {type: "boolean"}
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({
			some: ["a"]
		}, {
			some: {type: "boolean"}
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({}, {
			some: {type: "boolean"}
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({
			some: null
		}, {
			some: {type: "boolean"}
		})).throws(JsonTypeError)
	})

	o("array type check", () => {
		o(() => DesktopUtils.checkDataFormat({
			some: "not an array"
		}, {
			some: [{type: "string"}]
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({
			some: [0, 1, 2, 3]
		}, {
			some: []
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({
			some: [0, 1, 2, 3]
		}, {
			some: [{type: "number"}, {type: "number"}]
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({
			some: [0, 1, 2, 3]
		}, {
			some: [{type: "number"}]
		})).notThrows()

		o(() => DesktopUtils.checkDataFormat({
			some: [0, 1, "a", 3]
		}, {
			some: [{type: "number"}]
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({
			some: ["a", "b", "c", "d"]
		}, {
			some: [{type: "string"}]
		})).notThrows()

		o(() => DesktopUtils.checkDataFormat({
			some: ["a", "b", 0, "d"]
		}, {
			some: [{type: "string"}]
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({
			some: [true, false, true]
		}, {
			some: [{type: "boolean"}]
		})).notThrows()

		o(() => DesktopUtils.checkDataFormat({
			some: [
				{elementProp1: "a", elementProp2: 1},
				{elementProp1: "c", elementProp2: 2},
				{elementProp1: "b", elementProp2: 3}
			]
		}, {
			some: [
				{
					elementProp1: {type: "string"},
					elementProp2: {type: "number"}
				}
			]
		})).notThrows()

		o(() => DesktopUtils.checkDataFormat({
			some: [
				{elementProp1: "a", elementProp2: 1},
				{elementProp1: "c", elementProp2: 2},
				{elementProp1: "b", elementProp2: false}
			]
		}, {
			some: [
				{
					elementProp1: {type: "string"},
					elementProp2: {type: "number"}
				}
			]
		})).throws(JsonTypeError)
	})

	o("patterns with asserts", () => {
		o(() => DesktopUtils.checkDataFormat({
			number: 1
		}, {
			number: {type: "number", assert: v => v > 0}
		})).notThrows()

		o(() => DesktopUtils.checkDataFormat({
			number: -1
		}, {
			number: {type: "number", assert: v => v > 0}
		})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat(
			[0, 1, 2],
			[{type: "number", assert: v => v < 2}]
		)).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat(
			[0, 1, 2],
			[{type: "number", assert: v => v < 3}]
		)).notThrows()
	})

	o("patterns with optional properties", () => {
		o(() => DesktopUtils.checkDataFormat(
			[{prop: 1}, {}, {prop: 3}],
			[{prop: {type: "number", optional: true}}]
			)
		).notThrows()

		o(() => DesktopUtils.checkDataFormat(
			[{prop: 1}, {prop: null}, {prop: 3}],
			[{prop: {type: "number", optional: true}}]
			)
		).notThrows()

		o(() => DesktopUtils.checkDataFormat(
			[{prop: 1}, {prop: undefined}, {prop: 3}],
			[{prop: {type: "number", optional: true}}]
			)
		).notThrows()

		o(() => DesktopUtils.checkDataFormat(undefined, {type: "boolean", optional: true}))
			.notThrows()
	})

	o("basic type tests", () => {
		o(() => DesktopUtils.checkDataFormat(true, {type: 'boolean'})).notThrows()
		o(() => DesktopUtils.checkDataFormat("", {type: 'string'})).notThrows()
		o(() => DesktopUtils.checkDataFormat(42, {type: 'number'})).notThrows()

		o(() => DesktopUtils.checkDataFormat(true, {type: 'string'})).throws(JsonTypeError)
		o(() => DesktopUtils.checkDataFormat("", {type: 'number'})).throws(JsonTypeError)
		o(() => DesktopUtils.checkDataFormat(42, {type: 'boolean'})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat({type: "string"}, {type: {type: 'string'}})).notThrows()
		o(() => DesktopUtils.checkDataFormat({type: "string"}, {type: 'string'})).throws(JsonTypeError)

		o(() => DesktopUtils.checkDataFormat([1, 3, 4], [{type: "hello"}])).throws(JsonTypeError)
	})

	o("sse notification type check", () => {
		const pattern = {
			title: {type: 'string'},
			confirmationId: {type: 'string'},
			hasAlarmNotifications: {type: 'boolean'},
			changeTime: {type: 'string'},
			notificationInfos:
				{
					address: {type: 'string', assert: v => isMailAddress(v, true)},
					counter: {type: 'number', assert: v => v >= 0},
					userId: {type: 'string'}
				}

		}

		const testNotification1 = {
			title: "new mail",
			confirmationId: "someId",
			hasAlarmNotifications: false,
			changeTime: "123456789",
			notificationInfos: [
				{address: "ha@ho.hi", counter: 3, userId: "someUserId"},
				{address: "ha@hoho.hi", counter: 1, userId: "someOtherUserId"}
			]
		}
		const testNotification2 = {
			title: "new mail",
			confirmationId: "someId",
			hasAlarmNotifications: false,
			changeTime: "123456789",
			notificationInfos: [
				{address: "haho.hi", counter: 3, userId: "someUserId"},
				{address: "ha@hoho.hi", counter: 1, userId: "someOtherUserId"}
			]
		}

		const testNotification3 = {
			title: "new mail",
			confirmationId: "someId",
			hasAlarmNotifications: false,
			changeTime: "123456789",
			notificationInfos: [
				{address: "ha@ho.hi", counter: -3, userId: "someUserId"},
				{address: "ha@hoho.hi", counter: 1, userId: "someOtherUserId"}
			]
		}

		o(() => DesktopUtils.checkDataFormat(testNotification1, pattern)).notThrows()
		o(() => DesktopUtils.checkDataFormat(testNotification2, pattern)).throws(JsonTypeError)
		o(() => DesktopUtils.checkDataFormat(testNotification3, pattern)).throws(JsonTypeError)
	})
})
