// @flow
import o from "ospec"
import {fileController} from "../../../src/file/FileController"
import {createDataFile} from "../../../src/api/common/DataFile"

o.spec("FileControllerTest", function () {
	o("rename duplicates", () => {
		let files = [
			createDataFile("duplicate.txt", "text/plain", new Uint8Array([0])),
			createDataFile("duplicate.txt", "text/plain", new Uint8Array([1])),
			createDataFile("duplicate.txt", "text/plain", new Uint8Array([2])),
			createDataFile("noduplicate.txt", "text/plain", new Uint8Array([3])),
			createDataFile("noduplicate.csv", "text/plain", new Uint8Array([4])),
		]
		fileController.renameDuplicateFiles(files);
		o(files[0].name).equals("duplicate.txt")
		o(files[1].name).equals("duplicate-1.txt")
		o(files[2].name).equals("duplicate-2.txt")
		o(files[3].name).equals("noduplicate.txt")
		o(files[4].name).equals("noduplicate.csv")
	})

	o("no renaming if no duplicates", () => {
		let files = [
			createDataFile("somefile.doc", "text/plain", new Uint8Array([0, 1, 2, 3, 4])),
			createDataFile("noduplicate.txt", "text/plain", new Uint8Array([0, 1, 2, 3, 4])),
			createDataFile("noduplicate.csv", "text/plain", new Uint8Array([0, 1, 2, 3, 4])),
		]
		fileController.renameDuplicateFiles(files);
		o(files).deepEquals(files)
	})

	o("multiple extensions", () => {
		let files = [
			createDataFile("somefile.doc.xml", "text/plain", new Uint8Array([0, 1, 2, 3, 4])),
			createDataFile("somefile.doc", "text/plain", new Uint8Array([0, 1, 2, 3, 4])),
			createDataFile("duplicate.txt.txt", "text/plain", new Uint8Array([0, 1, 2, 3, 4])),
			createDataFile("duplicate.txt.txt", "text/plain", new Uint8Array([0, 1, 2, 3, 4])),
		]
		fileController.renameDuplicateFiles(files);
		o(files.length).equals(4)
		o(files[0].name).equals("somefile.doc.xml")
		o(files[1].name).equals("somefile.doc")
		o(files[2].name).equals("duplicate.txt.txt")
		o(files[3].name).equals("duplicate-1.txt.txt")
	})
})
