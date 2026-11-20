import m from "mithril"
import { Dialog, DialogType } from "../../../ui/base/Dialog.js"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../../../ui/base/DialogHeaderBar.js"
import { ButtonType } from "../../../ui/base/Button.js"
import { ContentWithOptionsDialog } from "../../../ui/dialogs/ContentWithOptionsDialog.js"
import { Card } from "../../../ui/base/Card.js"
import { TextField } from "../../../ui/base/TextField.js"
import { Editor } from "../../../ui/editor/Editor.js"
import { lang, TranslationKey } from "../../../ui/utils/LanguageViewModel.js"
import { px } from "../../../ui/size.js"
import { ALLOWED_IMAGE_FORMATS, MAX_BASE64_IMAGE_SIZE } from "@tutao/app-env"
import { newPromise, uint8ArrayToBase64 } from "@tutao/utils"
import { FileChooserMultiMode, showFileChooser } from "../file/FileController.js"

const IMAGE_STYLE = "max-width: 100%"

/**
 * Click handler for the image button of the toolbar. The user can upload an image or add an image from a link.
 * Both require an alternative text because not every email client displays the image.
 * @param allowUpload false if images can not be uploaded, e.g. on the apps
 */
export function createSignatureImageClickHandler(allowUpload: boolean): (ev: Event, editor: Editor) => void {
	return (_ev, editor) => {
		if (allowUpload) {
			showImageOptionsDialog(editor)
		} else {
			showImageLinkDialog(editor)
		}
	}
}

// Ask for an alternative text for embedded (base64) images that the user pastes. If the user cancels, the pasted images are removed.
export function promptAltTextForPastedImages(editor: Editor) {
	editor.setAfterPasteHandler(async (imagesBeforePaste) => {
		const pastedImages = Array.from(editor.getDOM().querySelectorAll<HTMLImageElement>('img[src^="data:"]')).filter(
			(image) => !imagesBeforePaste.has(image) && (image.getAttribute("alt") ?? "").trim() === "",
		)
		if (pastedImages.length === 0) {
			return
		}
		const altTexts = await promptAltTexts(
			pastedImages.map((image) => image.src),
			"pastedImagesAltText_msg",
		)
		editor.squire!.modifyDocument(() => {
			for (let index = 0; index < pastedImages.length; index++) {
				const image = pastedImages[index]
				if (altTexts === null) {
					image.remove()
				} else {
					image.setAttribute("alt", altTexts[index])
				}
			}
		})
	})
}

function showImageOptionsDialog(editor: Editor) {
	const headerBarAttrs: DialogHeaderBarAttrs = {
		left: [{ type: ButtonType.Secondary, label: "close_alt", click: () => dialog.close() }],
		middle: "insertImage_action",
	}
	const dialog = new Dialog(DialogType.Popup_S, {
		view: () =>
			m(".flex.col.border-radius", { style: { height: "100%" } }, [
				m(DialogHeaderBar, headerBarAttrs),
				m(
					".plr-24.flex-grow",
					m(
						ContentWithOptionsDialog,
						{
							mainActionText: "imageUpload_action",
							mainActionClick: () => {
								dialog.close()
								uploadImages(editor)
							},
							subActionText: "imageLink_action",
							subActionClick: () => {
								dialog.close()
								showImageLinkDialog(editor)
							},
						},
						m(Card, m("p.mt-8.text-preline", lang.getTranslationText("signatureImageInfo_msg"))),
					),
				),
			]),
	})
	dialog.show()
}

async function uploadImages(editor: Editor) {
	const files = await showFileChooser(FileChooserMultiMode.Multi, ALLOWED_IMAGE_FORMATS)
	const tooBig = files.filter((file) => file.size > MAX_BASE64_IMAGE_SIZE)
	const images = files.filter((file) => file.size <= MAX_BASE64_IMAGE_SIZE).map((file) => `data:${file.mimeType};base64,${uint8ArrayToBase64(file.data)}`)

	if (tooBig.length > 0) {
		await Dialog.message(lang.getTranslation("tooBigInlineImages_msg", { "{size}": MAX_BASE64_IMAGE_SIZE / 1024 }))
	}
	if (images.length === 0) {
		return
	}
	const altTexts = await promptAltTexts(images, "imageAltTextInfo_msg")
	if (altTexts != null) {
		for (const [index, image] of images.entries()) editor.insertImage(image, { style: IMAGE_STYLE, alt: altTexts[index] })
	}
}

function showImageLinkDialog(editor: Editor) {
	let url = ""
	let altText = ""
	Dialog.showActionDialog({
		title: "imageLink_action",
		type: DialogType.Popup_S,
		child: {
			view: () => [
				m(".small.mt-8.text-preline", lang.getTranslationText("signatureImageInfo_msg")),
				m(TextField, { label: "url_label", value: url, oninput: (value) => (url = value) }),
				m(TextField, {
					label: "imageAltText_label",
					value: altText,
					oninput: (value) => (altText = value),
					helpLabel: () => lang.getTranslationText("imageAltTextInfo_msg"),
				}),
			],
		},
		validator: async () => (isWebAddress(url.trim()) ? (altText.trim() === "" ? "imageAltTextRequired_msg" : null) : "invalidLink_msg"),
		okAction: (dialog) => {
			dialog.close()
			editor.insertImage(url.trim(), { style: IMAGE_STYLE, alt: altText.trim() })
		},
	})
}

function isWebAddress(value: string): boolean {
	try {
		const protocol = new URL(value).protocol
		return protocol === "https:" || protocol === "http:"
	} catch (e) {
		return false
	}
}

function promptAltTexts(imageSources: readonly string[], infoText: TranslationKey): Promise<string[] | null> {
	return newPromise((resolve) => {
		const altTexts = imageSources.map(() => "")
		Dialog.showActionDialog({
			title: "imageAltText_label",
			type: DialogType.Popup_S,
			child: {
				view: () => [
					m(".small.mt-8.text-preline", lang.getTranslationText(infoText)),
					imageSources.map((source, index) => [
						m("img.mt-16", { src: source, style: { display: "block", maxWidth: "100%", maxHeight: px(100) } }),
						m(TextField, { label: "imageAltText_label", value: altTexts[index], oninput: (value) => (altTexts[index] = value) }),
					]),
				],
			},
			validator: async () => (altTexts.every((altText) => altText.trim() !== "") ? null : "imageAltTextRequired_msg"),
			okAction: (dialog) => {
				dialog.close()
				resolve(altTexts.map((altText) => altText.trim()))
			},
			cancelAction: () => resolve(null),
		})
	})
}
