import o from "@tutao/otest"
import { EXECUTABLE_EXTENSIONS, looksExecutable, nonClobberingFilename, swapFilename } from "../../../src/common/desktop/PathUtils.js"
import path from "node:path"

o.spec("PathUtils", function () {
	o.spec("nonClobberingFileName Test", function () {
		o("noClash", function () {
			o(nonClobberingFilename(["bye.txt"], "hello.ext")).equals("hello.ext")
		})
		o("emptyDir", function () {
			o(nonClobberingFilename([], "hello.ext")).equals("hello.ext")
		})
		o("emptyString", function () {
			o(nonClobberingFilename([""], "hello.ext")).equals("hello.ext")
		})
		o("duplicateFileNonClashing", function () {
			o(nonClobberingFilename(["hallo.txt", "hallo.txt"], "hello.ext")).equals("hello.ext")
		})
		o("duplicateFileClashing", function () {
			o(nonClobberingFilename(["hello.ext", "hello.ext"], "hello.ext")).equals("hello-1.ext")
		})
		o("clashingFiles", function () {
			o(nonClobberingFilename(["hello.ext"], "hello.ext")).equals("hello-1.ext")
			o(nonClobberingFilename(["hello.ext", "hello-1.ext"], "hello.ext")).equals("hello-2.ext")
			o(nonClobberingFilename(["hello.ext", "hello-1.ext", "hello-2.ext"], "hello.ext")).equals("hello-3.ext")
			o(
				nonClobberingFilename(
					[
						"hello.ext",
						"hello-1.ext",
						"hello-2.ext",
						"hello-3.ext",
						"hello-4.ext",
						"hello-5.ext",
						"hello-6.ext",
						"hello-7.ext",
						"hello-8.ext",
						"hello-9.ext",
						"hello-10.ext",
					],
					"hello.ext",
				),
			).equals("hello-11.ext")
		})
		o("numberedFileNameNonClashing", function () {
			o(nonClobberingFilename(["hello.ext"], "hello-1.ext")).equals("hello-1.ext")
		})
		o("numberedFileNameClashing", function () {
			o(nonClobberingFilename(["hello-1.ext"], "hello-1.ext")).equals("hello-1-1.ext")
		})
		o("intermediate value", function () {
			o(nonClobberingFilename(["hello.ext", "hello-3.ext", "hello-1.ext", "hello-undefined.ext", "hello-Infinity.ext"], "hello.ext")).equals(
				"hello-2.ext",
			)
			o(nonClobberingFilename(["hello-0.ext", "hello.ext", "hello-3.ext", "hello-1.ext"], "hello.ext")).equals("hello-2.ext")
			o(nonClobberingFilename(["hello--2.ext", "hello-0.ext", "hello-3.ext", "hello-1.ext"], "hello.ext")).equals("hello.ext")
		})
		o("truncated clashes", function () {
			o(nonClobberingFilename(["hello-.ext", "hello.", "hello", "ello.ext"], "hello.ext")).equals("hello.ext")
		})
		o("almost clashes", function () {
			o(nonClobberingFilename(["hello.ext", "hello-a.ext", "hello-01.ext", "hello-0x01.ext"], "hello.ext")).equals("hello-1.ext")
		})
		o("dotfiles", function () {
			o(
				nonClobberingFilename(
					[
						".ext", // unix dotfile w/o extension
					],
					".ext",
				),
			).equals(".ext-1")
			o(
				nonClobberingFilename(
					[
						".ext.txt", // unix dotfile w/o extension
					],
					".ext.txt",
				),
			).equals(".ext-1.txt")
		})
		o("malformedFilename", function () {
			o(nonClobberingFilename([""], "")).equals("-1")
			o(nonClobberingFilename(["hello.ext"], "")).equals("")
		})
		// These would rather be in sanitize file name tests
		o("invalid/reserved filenames", function () {
			o(nonClobberingFilename([], "\x00-\x1f\x80-\x9f.exe")).equals("_-__-_.exe")
			// n.setPlatform("win32")
			env.platformId = "win32"
			o(nonClobberingFilename(["CON-1.exe"], "CON.exe")).equals("CON_.exe")
			o(nonClobberingFilename([], ".")).equals("._")
			o(nonClobberingFilename(["._"], ".")).equals("._-1")
			o(nonClobberingFilename([], "..")).equals(".._")
			// sanitizeFilename converts .. to .._
			// and then nonClobbering filename thinks ._ is the extension so if you have two files named .. then this is what you get
			// this isn't pretty, but lucky for us I also don't think it's possible to have a file named .. on windows or linux or mac, so it should
			// not even be an issue when dealing with attachments, unless we somehow cause this in code.
			// i'd rather not special case the code for something that may not even be a case
			// tl;dr this assertion could probably be removed altogether
			o(nonClobberingFilename([".._"], "..")).equals(".-1._")
			o(nonClobberingFilename([], "<>|?/\\.mp3")).equals("______.mp3")
			o(nonClobberingFilename([], "CON<>|?/\\CON.mp3")).equals("CON______CON.mp3")
			o(nonClobberingFilename([], "PRN.<p2.")).equals("PRN_._p2_")
			o(nonClobberingFilename([], "LPT0")).equals("LPT0_")
			o(nonClobberingFilename([], "COM9")).equals("COM9_")
			o(nonClobberingFilename([], "AUX.AUX")).equals("AUX_.AUX")
			o(nonClobberingFilename([], "NUL")).equals("NUL_")
			o(nonClobberingFilename([], "nul")).equals("nul_")
			o(nonClobberingFilename([], "NULNUL")).equals("NULNUL")
			o(nonClobberingFilename([], ".NUL")).equals(".NUL")
			o(nonClobberingFilename([], "<>|?/\\CON.")).equals("______CON_")
			// n.setPlatform("linux")
			env.platformId = "linux"
			o(nonClobberingFilename([], "nul")).equals("nul")
			o(nonClobberingFilename([], "..")).equals(".._")
		})
	})
	o.spec("swapFileName Test", function () {
		o("replace file with file, posix", function () {
			o(swapFilename("/a/b/c.txt", "d.txt")).equals("/a/b/d.txt")
			o(swapFilename("a/b/c.txt", "d.txt")).equals("a/b/d.txt")
			o(swapFilename("/a/b/c.txt", "d")).equals("/a/b/d")
			o(swapFilename("/a/b/c", "d.txt")).equals("/a/b/d.txt")
			o(swapFilename("/a/b/c", "d.txt")).equals("/a/b/d.txt")
			o(swapFilename("/", "bla.txt")).equals("/bla.txt")
		})
		o("replace file with file, windows", function () {
			o(swapFilename("C:\\tmp\\file.html", "text.txt", path.win32)).equals("C:\\tmp\\text.txt")
			o(swapFilename("C:\\tmp\\file.html", "text", path.win32)).equals("C:\\tmp\\text")
			o(swapFilename("C:\\tmp\\folder\\", "text", path.win32)).equals("C:\\tmp\\text")
			o(swapFilename("tmp\\file.html", "text.txt", path.win32)).equals("tmp\\text.txt")
			o(swapFilename("tmp", "text.txt", path.win32)).equals("text.txt")
			o(swapFilename("C:\\", "text.txt", path.win32)).equals("C:\\text.txt")
		})
	})

	o.spec("looksExecutable", function () {
		function testDoesLookExecutable(filename) {
			o(`should detect "${filename}" as looking executable`, function () {
				o(looksExecutable(filename)).equals(true)
			})
		}

		for (const extension of EXECUTABLE_EXTENSIONS) testDoesLookExecutable(`someFile.${extension}`)
		for (const extension of EXECUTABLE_EXTENSIONS) testDoesLookExecutable(`C:\\a\\b\\someFile.${extension}`)
		for (const extension of EXECUTABLE_EXTENSIONS) testDoesLookExecutable(`C:\\a\\b\\.${extension}`)
		for (const extension of EXECUTABLE_EXTENSIONS) testDoesLookExecutable(`/a/b/someFile.${extension}`)
		for (const extension of EXECUTABLE_EXTENSIONS) testDoesLookExecutable(`/a/b/.${extension}`)
		for (const extension of EXECUTABLE_EXTENSIONS) testDoesLookExecutable(`file:///a/b/someFile.${extension}`)
		for (const extension of EXECUTABLE_EXTENSIONS) testDoesLookExecutable(`file:///a/b/.${extension}`)
		for (const extension of EXECUTABLE_EXTENSIONS) testDoesLookExecutable(`.${extension}`)

		o("should not detect non executable extensions as looking executable", function () {
			o(looksExecutable("picture.jpg")).equals(false)
			o(looksExecutable(".jpg")).equals(false)
		})
	})
})
