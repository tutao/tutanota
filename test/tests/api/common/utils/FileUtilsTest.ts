import o from "@tutao/otest"
import { deduplicateFilenames, getFileBaseNameAndExtensions, sanitizeFilename } from "../../../../../src/common/api/common/utils/FileUtils.js"

o.spec("FileUtils", function () {
	o.test("sanitizeFilename", function () {
		o.check(sanitizeFilename("hello")).equals("hello")
		o.check(sanitizeFilename("foo/bar")).equals("foo_bar")
		o.check(sanitizeFilename("\x001/./  ")).equals("_1_.__")
		o.check(sanitizeFilename("test.")).equals("test_")
	})

	o.spec("deduplicate filenames", function () {
		o.test("no duplicates", function () {
			const filenames = ["abc", "def", "ghi", "jkl"]
			const taken = new Set(["mno", "pqr", "stu"])
			const actual = deduplicateFilenames(filenames, taken)
			const expected = {
				abc: ["abc"],
				def: ["def"],
				ghi: ["ghi"],
				jkl: ["jkl"],
			}
			o.check(actual).deepEquals(expected)
		})

		o.test("yes duplicates, no taken", function () {
			const filenames = ["abc", "abc", "Abc", "def", "DEF", "ghi", "jkl"]
			const taken = new Set<string>()
			const actual = deduplicateFilenames(filenames, taken)
			const expected = {
				abc: ["abc", "abc (1)"],
				Abc: ["Abc (2)"],
				def: ["def"],
				DEF: ["DEF (1)"],
				ghi: ["ghi"],
				jkl: ["jkl"],
			}
			o.check(actual).deepEquals(expected)
		})
		o.test("yes duplicates, yes taken with no duplicates", function () {
			const filenames = ["abc", "abc", "Abc", "def", "DEF", "ghi", "jkl"]
			const taken = new Set(["mno", "pqr", "stu"])
			const actual = deduplicateFilenames(filenames, taken)
			const expected = {
				abc: ["abc", "abc (1)"],
				Abc: ["Abc (2)"],
				def: ["def"],
				DEF: ["DEF (1)"],
				ghi: ["ghi"],
				jkl: ["jkl"],
			}
			o.check(actual).deepEquals(expected)
		})
		o.test("yes duplicates, yes taken with yes duplicates", function () {
			const filenames = ["abc", "abc", "Abc", "def", "DEF", "ghi", "jkl", "file.txt", "FILE.txt", "FILE.TXT", "file1.txt"]
			const taken = new Set(["ghi", "JKL", "mno", "pqr", "stu"])
			const actual = deduplicateFilenames(filenames, taken)
			const expected = {
				abc: ["abc", "abc (1)"],
				Abc: ["Abc (2)"],
				def: ["def"],
				DEF: ["DEF (1)"],
				ghi: ["ghi (1)"],
				jkl: ["jkl (1)"],
				"file.txt": ["file.txt"],
				"FILE.txt": ["FILE (1).txt"],
				"FILE.TXT": ["FILE (2).TXT"],
				"file1.txt": ["file1.txt"],
			}
			o.check(actual).deepEquals(expected)
		})
	})

	o.spec("filename splitting", function () {
		o.test("getFileBaseNameAndExtensions -- [empty string]", function () {
			const [base, ext] = getFileBaseNameAndExtensions("")
			o.check(base).equals("")
			o.check(ext).equals(null)
		})

		o.test("getFileBaseNameAndExtensions -- hello.txt", function () {
			const [base, ext] = getFileBaseNameAndExtensions("hello.txt")
			o.check(base).equals("hello")
			o.check(ext).equals(".txt")
		})

		o.test("getFileBaseNameAndExtensions -- hello.tar.gz", function () {
			const [base, ext] = getFileBaseNameAndExtensions("hello.tar.gz")
			o.check(base).equals("hello")
			o.check(ext).equals(".tar.gz")
		})

		o.test("getFileBaseNameAndExtensions -- .hello", function () {
			const [base, ext] = getFileBaseNameAndExtensions(".hello")
			o.check(base).equals("")
			o.check(ext).equals(".hello")
		})

		o.test("getFileBaseNameAndExtensions -- hello", function () {
			const [base, ext] = getFileBaseNameAndExtensions("hello")
			o.check(base).equals("hello")
			o.check(ext).equals(null)
		})

		o.test("getFileBaseNameAndExtensions -- hello.", function () {
			const [base, ext] = getFileBaseNameAndExtensions("hello.")
			o.check(base).equals("hello.")
			o.check(ext).equals(null)
		})

		o.test("getFileBaseNameAndExtensions -- h. el.lo.", function () {
			const [base, ext] = getFileBaseNameAndExtensions("h. el.lo.")
			o.check(base).equals("h")
			o.check(ext).equals(". el.lo.")
		})
	})
})
