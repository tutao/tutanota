import o from "@tutao/otest"
import { deduplicateFilenames, sanitizeFilename } from "../../../../../src/common/api/common/utils/FileUtils.js"

o.spec("FileUtilsTest", function () {
	o("sanitizeFilename", function () {
		o(sanitizeFilename("hello")).equals("hello")
		o(sanitizeFilename("foo/bar")).equals("foo_bar")
		o(sanitizeFilename("\x001/./  ")).equals("_1_.__")
		o(sanitizeFilename("test.")).equals("test_")
	})

	o.spec("deduplicate filenames", function () {
		o("no duplicates", function () {
			const filenames = ["abc", "def", "ghi", "jkl"]
			const taken = new Set(["mno", "pqr", "stu"])
			const actual = deduplicateFilenames(filenames, taken)
			const expected = {
				abc: ["abc"],
				def: ["def"],
				ghi: ["ghi"],
				jkl: ["jkl"],
			}
			o(actual).deepEquals(expected)
		})

		o("yes duplicates, no taken", function () {
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
			o(actual).deepEquals(expected)
		})
		o("yes duplicates, yes taken with no duplicates", function () {
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
			o(actual).deepEquals(expected)
		})
		o("yes duplicates, yes taken with yes duplicates", function () {
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
			o(actual).deepEquals(expected)
		})
	})
})
