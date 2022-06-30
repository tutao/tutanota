import type {ImageHandler} from "../model/MailUtils"
import {ALLOWED_IMAGE_FORMATS, MAX_BASE64_IMAGE_SIZE} from "../../api/common/TutanotaConstants"
import {uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {lang} from "../../misc/LanguageViewModel"
import {Dialog} from "../../gui/base/Dialog"
import {locator} from "../../api/main/MainLocator"
import {DataFile} from "../../api/common/DataFile"
import {showFileChooser} from "../../file/FileController.js"

export function insertInlineImageB64ClickHandler(ev: Event, handler: ImageHandler) {
	showFileChooser(true, ALLOWED_IMAGE_FORMATS).then(files => {
		const tooBig: DataFile[] = []

		for (let file of files) {
			if (file.size > MAX_BASE64_IMAGE_SIZE) {
				tooBig.push(file)
			} else {
				const b64 = uint8ArrayToBase64(file.data)
				const dataUrlString = `data:${file.mimeType};base64,${b64}`
				handler.insertImage(dataUrlString, {
					style: "max-width: 100%",
				})
			}
		}

		if (tooBig.length > 0) {
			Dialog.message(() =>
				lang.get("tooBigInlineImages_msg", {
					"{size}": MAX_BASE64_IMAGE_SIZE / 1024,
				}),
			)
		}
	})
}