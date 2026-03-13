import o from "@tutao/otest"
import { FileType, getDisplayType } from "../../../src/drive-app/drive/model/DriveMimeUtils"

/*
⠀⠀⠀⠀⠀⠀⠀⢠⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣠⠴⠒⠛⠛⠉⠉⠉⠛⠛⢦⡄⠀⠀⠀
⠀⠀⢀⡴⠋⠁⠀⡀⠠⠀⠄⠐⢀⣒⣈⣿⠁⠀⠀⠀
⠀⠀⠸⠷⣖⣈⣤⡤⠶⠖⠚⠉⠉⠻⡄⣿⠀⠀⠀⠀
⠀⠀⠀⠀⢿⣾⠀⢀⡀⠀⠀⢀⡀⠀⣿⡟⠀⠀⠀⠀
⠀⠀⠀⠀⣿⠉⠀⢏⡱⠀⠀⢎⡱⠀⠉⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠈⢿⠀⠈⠀⢀⡀⠀⠁⠀⡿⠁⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠈⢧⡀⠀⠉⠉⠀⢀⡼⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⣿⠓⠢⠔⠚⣿⡀⠀⠀⠀⠀⠀⠀
⠀⠀⣀⣤⣶⣛⣉⣻⣦⣀⣀⣴⣟⣉⣛⣶⣤⣀⠀⠀
⢠⡾⠭⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠭⢷⡄
⣿⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⠒⣿
 */

o.spec("DriveMimeUtils", function () {
	o.test("getting a DisplayFileType works", async function () {
		const dt = getDisplayType("audio/mpeg", "test.mp2")
		o.check(dt.fileType).equals(FileType.Audio)
		o.check(dt.fileFormat).equals("MPEG")
	})

	o.test("getting a DisplayFileType works for an extended mime type with a parameter too", async function () {
		const dt = getDisplayType("audio/mpeg; charset=UTF-8", "test.mp2")
		o.check(dt.fileType).equals(FileType.Audio)
		o.check(dt.fileFormat).equals("MPEG")
	})

	o.test("getting a DisplayFileType with an overridden format works", async function () {
		const dt = getDisplayType("audio/mpeg", "test.mp3")
		o.check(dt.fileType).equals(FileType.Audio)
		o.check(dt.fileFormat).equals("MP3")
	})

	o.test("getting a generic DisplayFileType works for unknown mime types", async function () {
		let dt = getDisplayType("audio/x-tuta", "test.tuta")
		o.check(dt).deepEquals({ fileType: FileType.Audio, fileFormat: "Audio" })

		dt = getDisplayType("video/x-tuta", "test.tuta")
		o.check(dt).deepEquals({ fileType: FileType.Video, fileFormat: "Video" })

		dt = getDisplayType("image/x-tuta", "test.tuta")
		o.check(dt).deepEquals({ fileType: FileType.Image, fileFormat: "Image" })

		dt = getDisplayType("text/x-tuta", "test.tuta")
		o.check(dt).deepEquals({ fileType: FileType.Document, fileFormat: "Text" })

		dt = getDisplayType("application/x-tuta", "test.tuta")
		o.check(dt).deepEquals({ fileType: FileType.Generic, fileFormat: "File" })
	})
})
