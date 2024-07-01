import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { base64ToUint8Array, base64UrlToBase64 } from "@tutao/tutanota-utils"
import { TempFs } from "../../../../src/common/desktop/files/TempFs.js"

o.spec("TempFsTest", function () {
	o("delete tutanotaTempDir can handle multiple subfolders, some of which aren't ours", function () {
		const fs: any = object()
		const app: any = object()
		const electron: any = { app }
		const cryptoFns: any = object()
		when(cryptoFns.randomBytes(matchers.anything())).thenReturn(base64ToUint8Array(base64UrlToBase64("9E9u8bnXUGWYCk05eF0Xjw")))
		when(app.getPath("temp")).thenReturn("/tmp")
		when(fs.readdirSync("/tmp/tutanota")).thenReturn(["mine", "thine", "anothermine", "removed", "lastmine"])
		when(fs.rmSync("/tmp/tutanota/thine", { recursive: true })).thenThrow({ code: "EACCES" } as any)
		when(fs.rmSync("/tmp/tutanota/mine", { recursive: true })).thenReturn(null)
		when(fs.rmSync("/tmp/tutanota/anothermine", { recursive: true })).thenReturn(null)
		when(fs.rmSync("/tmp/tutanota/removed", { recursive: true })).thenThrow({ code: "ENOENT" } as any)
		when(fs.rmSync("/tmp/tutanota/lastmine", { recursive: true })).thenReturn(null)
		const tfs = new TempFs(fs, electron, cryptoFns)
		tfs.clear()
		verify(fs.rmSync(matchers.anything(), { recursive: true }), { times: 5 })
	})
})
