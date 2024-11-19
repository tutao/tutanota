import { Dialog } from "../../gui/base/Dialog"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
import { getCleanedMailAddress } from "../../misc/parsing/MailAddressParser"
import { KeyVerificationFacade } from "../../api/worker/facades/lazy/KeyVerificationFacade"
import m, { Children } from "mithril"
import { TextField, TextFieldType } from "../../gui/base/TextField"
import { KeyVerificationProcessModel } from "./KeyVerificationProcessModel"
import { DropDownSelector, DropDownSelectorAttrs } from "../../gui/base/DropDownSelector"
import { KeyVerificationMethodOptions, KeyVerificationMethodType } from "../../api/common/TutanotaConstants"
import { assertNotNull } from "@tutao/tutanota-utils"
import { KeyVerificationQrPayload } from "./KeyVerificationQrPayload"
import jsQR from "jsqr"
import { UserError } from "../../api/main/UserError"
import { MalformedQrPayloadError } from "../../api/common/error/MalformedQrPayloadError"

export class KeyVerificationProcessDialog {
	keyVerificationFacade: KeyVerificationFacade
	model: KeyVerificationProcessModel
	reloadParent: () => Promise<void>
	dialogWidget: Dialog

	qrVideo: HTMLVideoElement | null = null
	qrMediaStream: MediaStream | null = null
	qrWaitingForVideo: boolean = true
	qrStopScanning: boolean = false

	constructor(keyVerificationFacade: KeyVerificationFacade, model: KeyVerificationProcessModel, reloadParent: () => Promise<void>) {
		this.keyVerificationFacade = keyVerificationFacade
		this.model = model
		this.reloadParent = reloadParent

		this.dialogWidget = Dialog.createActionDialog({
			title: lang.get("keyManagement.verifyMailAddress_action"),
			child: {
				view: () => this.render(),
			},
			validator: () => this.validateInputs(),
			allowOkWithReturn: true,
			okAction: async (dialog: Dialog) => {
				await this.keyVerificationFacade.addToPool(this.model.mailAddress, this.model.fingerprint)

				this.cleanup()

				dialog.close()
				this.reloadParent()
			},
			cancelAction: async (dialog: Dialog) => {
				this.cleanup()
			},
		})
	}

	show() {
		this.dialogWidget.show()
	}

	cleanup() {
		this.qrStopScanning = true

		this.qrVideo?.pause()

		if (this.qrMediaStream != null) {
			for (const stream of this.qrMediaStream.getTracks()) {
				stream.stop()
			}
		}
	}

	render(): Children {
		const dropdownAttrs: DropDownSelectorAttrs<KeyVerificationMethodType> = {
			label: "type_label",
			selectedValue: this.model.selectedMethod,
			selectionChangedHandler: (newValue) => this.model.onMethodSelected(newValue),
			items: KeyVerificationMethodOptions,
			dropdownWidth: 300,
		}

		let renderChosenVerificationMethod: () => Children = () => {
			return null
		}
		if (this.model.selectedMethod === KeyVerificationMethodType.text) {
			renderChosenVerificationMethod = this.renderForTextMethod
		}
		if (this.model.selectedMethod === KeyVerificationMethodType.qr) {
			renderChosenVerificationMethod = this.renderForQrMethod
		}

		return [m(DropDownSelector, dropdownAttrs), renderChosenVerificationMethod.bind(this)()]
	}

	private renderForTextMethod(): Children {
		return [
			m(TextField, {
				label: "mailAddress_label",
				value: this.model.mailAddress,
				type: TextFieldType.Email,
				oninput: (newValue) => (this.model.mailAddress = newValue),
			}),
			m(TextField, {
				label: "keyManagement.fingerprint_label",
				value: this.model.fingerprint,
				type: TextFieldType.Email,
				oninput: (newValue) => (this.model.fingerprint = newValue),
			}),
		]
	}

	private renderForQrMethod(): Children {
		const video = m("video", {
			oncreate: async (vnode) => {
				this.qrVideo = assertNotNull(vnode.dom as HTMLVideoElement)
				await this.runQrScanner(this.qrVideo)
			},
			style: { "margin-top": "1em", "max-width": "100%" },
		})

		return [this.qrWaitingForVideo ? lang.get("keyManagement.waitingForVideo_msg") : [], video]
	}

	private validateInputs(): TranslationKey | null {
		/* TODO:
		Properly validate mail address. Only Tuta domains are reasonable for this problem space
		so only those should be considered valid. */

		// validate email address (syntactically)
		if (getCleanedMailAddress(this.model.mailAddress) == null) {
			return "mailAddressInvalid_msg"
		}

		// validate fingerprint (syntactically): it's expected to be a 64-char hex digest
		const fingerprintRegex = /^[0-9a-f]{64}$/
		if (!fingerprintRegex.test(this.model.fingerprint)) {
			return "keyManagement.invalidFingerprint_msg"
		}

		return null // null means OK
	}

	private async runQrScanner(video: HTMLVideoElement) {
		this.qrMediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
		video.srcObject = this.qrMediaStream
		await video.play()

		const canvas = document.createElement("canvas")
		const context2d = assertNotNull(canvas.getContext("2d"))

		const runScannerTick = async () => {
			if (video.readyState === video.HAVE_ENOUGH_DATA) {
				if (this.qrWaitingForVideo) {
					this.qrWaitingForVideo = false
					m.redraw()
				}

				// These are the logical dimensions of the camera's video stream.
				// They are unrelated to the size of the video element.
				canvas.height = video.videoHeight
				canvas.width = video.videoWidth

				// Fetch image from video stream by painting onto a canvas and reading from it
				context2d.drawImage(video, 0, 0, canvas.width, canvas.height)
				const imageData = context2d.getImageData(0, 0, canvas.width, canvas.height)

				if (imageData) {
					const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" })
					if (code) {
						// at this point, a QR code has been detected and decoded

						let payload: KeyVerificationQrPayload
						try {
							payload = JSON.parse(code.data) as KeyVerificationQrPayload
							if (payload.mailAddress == null || payload.fingerprint == null) {
								throw new MalformedQrPayloadError("")
							}

							await this.keyVerificationFacade.addToPool(payload.mailAddress, payload.fingerprint)
						} catch (e) {
							if (e instanceof SyntaxError || e instanceof MalformedQrPayloadError) {
								// SyntaxError: JSON.parse failed
								// MalformedQrPayloadError: malformed payload
								throw new UserError("keyManagement.invalidQrCode_msg")
							} else {
								throw e
							}
						} finally {
							this.cleanup()
							this.dialogWidget.close()
							this.reloadParent()
						}
					}
				}
			}

			if (!this.qrStopScanning) {
				requestAnimationFrame(runScannerTick)
			}
		}

		requestAnimationFrame(runScannerTick)
	}
}
