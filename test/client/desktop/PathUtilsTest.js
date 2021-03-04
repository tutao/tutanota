//@flow
import o from "ospec"
import n from "../nodemocker"
import {nonClobberingFilename} from "../../../src/desktop/PathUtils"

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

		// These would rather be in sanitize file name tests
		o('invalid/reserved filenames', function () {
			o(nonClobberingFilename([], "\x00-\x1f\x80-\x9f.exe"))
				.equals('_-__-_.exe')

			// n.setPlatform("win32")
			env.platformId = "win32"
			o(nonClobberingFilename(["CON-1.exe"], "CON.exe"))
				.equals('CON_.exe')

			o(nonClobberingFilename([], "."))
				.equals("._")

			o(nonClobberingFilename(["._"], "."))
				.equals("._-1")

			o(nonClobberingFilename([], ".."))
				.equals(".._")

			// sanitizeFilename converts .. to .._
			// and then nonClobbering filename thinks ._ is the extension so if you have two files named .. then this is what you get
			// this isn't pretty, but lucky for us I also don't think it's possible to have a file named .. on windows or linux or mac, so it should
			// not even be an issue when dealing with attachments, unless we somehow cause this in code.
			// i'd rather not special case the code for something that may not even be a case
			// tl;dr this assertion could probably be removed altogether
			o(nonClobberingFilename([".._"], ".."))
				.equals(".-1._")

			o(nonClobberingFilename([], "<>|?/\\.mp3"))
				.equals("______.mp3")

			o(nonClobberingFilename([], "CON<>|?/\\CON.mp3"))
				.equals("CON______CON.mp3")

			o(nonClobberingFilename([], "PRN.<p2."))
				.equals("PRN_._p2_")

			o(nonClobberingFilename([], "LPT0"))
				.equals("LPT0_")

			o(nonClobberingFilename([], "COM9"))
				.equals("COM9_")

			o(nonClobberingFilename([], "AUX.AUX"))
				.equals("AUX_.AUX")

			o(nonClobberingFilename([], "NUL"))
				.equals("NUL_")

			o(nonClobberingFilename([], "nul"))
				.equals("nul_")

			o(nonClobberingFilename([], "NULNUL"))
				.equals("NULNUL")

			o(nonClobberingFilename([], ".NUL"))
				.equals(".NUL")

			o(nonClobberingFilename([], "<>|?/\\CON."))
				.equals("______CON_")

			// n.setPlatform("linux")
			env.platformId = "linux"
			o(nonClobberingFilename([], "nul"))
				.equals("nul")

			o(nonClobberingFilename([], ".."))
				.equals(".._")
		})
	})
})