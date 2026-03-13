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

	o.test("getting a DisplayFileType with an overridden format works", async function () {
		const dt = getDisplayType("audio/mpeg", "test.mp3")
		o.check(dt.fileType).equals(FileType.Audio)
		o.check(dt.fileFormat).equals("MP3")
	})

	o.test("getting a DisplayFileType works for an unknown mime type", async function () {
		const dt = getDisplayType("audio/x-tuta", "test.tuta")
		o.check(dt.fileType).equals(FileType.Default)
		o.check(dt.fileFormat).equals("File")
	})
})
