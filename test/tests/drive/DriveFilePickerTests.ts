import o from "@tutao/otest"
import { AppFilePicker, DriveFilePicker } from "../../../src/applications/drive-app/drive/view/DriveFilePicker"
import { NativeFileApp } from "../../../src/app-kit/native-bridge/common/FileApp"
import { object, when } from "testdouble"
import { PosRect } from "../../../src/ui/utils/PosRect"
import { withOverriddenEnv } from "../TestUtils"

o.spec("DriveFilePicker", function () {
	let picker: DriveFilePicker
	let fileApp: NativeFileApp
	let rect: PosRect
	o.beforeEach(async () => {
		fileApp = object()
		await withOverriddenEnv({ mode: "Desktop" }, () => {
			picker = new AppFilePicker(fileApp)
		})
		rect = object()
	})
	o.test("folder picker returns a tree of folder contents", async function () {
		when(fileApp.openFolderChooser()).thenResolve("./home/parentFolder")
		const files = ["./home/parentFolder/file1.txt", "./home/parentFolder/file2.txt"]
		when(fileApp.readDirectory("./home/parentFolder")).thenResolve({
			name: "parentFolder",
			path: "./home/parentFolder",
			files: files,
			folders: ["./home/parentFolder/childFolder"],
		})
		when(fileApp.getFilesMetaData(files)).thenResolve([
			{ _type: "FileReference", name: "file1.txt", mimeType: "text/plain", size: 1024, location: "./home/parentFolder/file1.txt" },
			{ _type: "FileReference", name: "file2.txt", mimeType: "text/plain", size: 1024, location: "./home/parentFolder/file2.txt" },
		])
		const childFiles = ["./home/parentFolder/childFolder/file3.txt", "./home/parentFolder/childFolder/file4.txt"]
		when(fileApp.getFilesMetaData(childFiles)).thenResolve([
			{ _type: "FileReference", name: "file3.txt", mimeType: "text/plain", size: 1024, location: "./home/parentFolder/childFolder/file3.txt" },
			{ _type: "FileReference", name: "file4.txt", mimeType: "text/plain", size: 1024, location: "./home/parentFolder/childFolder/file4.txt" },
		])
		when(fileApp.readDirectory("./home/parentFolder/childFolder")).thenResolve({
			name: "childFolder",
			files: childFiles,
			folders: [],
			path: "./home/parentFolder/childFolder",
		})
		o.check(await picker.pickFolders(rect)).deepEquals([
			{
				name: "parentFolder",
				files: [
					{ _type: "FileReference", name: "file1.txt", mimeType: "text/plain", size: 1024, location: "./home/parentFolder/file1.txt" },
					{ _type: "FileReference", name: "file2.txt", mimeType: "text/plain", size: 1024, location: "./home/parentFolder/file2.txt" },
				],
				folders: [
					{
						name: "childFolder",
						files: [
							{
								_type: "FileReference",
								name: "file3.txt",
								mimeType: "text/plain",
								size: 1024,
								location: "./home/parentFolder/childFolder/file3.txt",
							},
							{
								_type: "FileReference",
								name: "file4.txt",
								mimeType: "text/plain",
								size: 1024,
								location: "./home/parentFolder/childFolder/file4.txt",
							},
						],
						folders: [],
					},
				],
			},
		])
	})
})
