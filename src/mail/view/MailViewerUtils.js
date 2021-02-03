//@flow
import type {ImageHandler} from "../model/MailUtils"
import {fileController} from "../../file/FileController"
import {ALLOWED_IMAGE_FORMATS, MAX_BASE64_IMAGE_SIZE} from "../../api/common/TutanotaConstants"
import {uint8ArrayToBase64} from "../../api/common/utils/Encoding"
import {lang} from "../../misc/LanguageViewModel"
import {Dialog} from "../../gui/base/Dialog"

export function insertInlineImageB64ClickHandler(ev: Event, handler: ImageHandler) {
	fileController.showFileChooser(true, ALLOWED_IMAGE_FORMATS).then((files) => {
		const tooBig = []
		for (let file of files) {
			if (file.size > MAX_BASE64_IMAGE_SIZE) {
				tooBig.push(file)
			} else {
				const b64 = uint8ArrayToBase64(file.data)
				const dataUrlString = `data:${file.mimeType};base64,${b64}`
				handler.insertImage(dataUrlString, {style: "max-width: 100%"})
			}
		}
		if (tooBig.length > 0) {
			Dialog.error(() => lang.get("tooBigInlineImages_msg", {"{size}": MAX_BASE64_IMAGE_SIZE / 1024}))
		}
	})
}