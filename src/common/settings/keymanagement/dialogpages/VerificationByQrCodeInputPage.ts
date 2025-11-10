import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { lang } from "../../../misc/LanguageViewModel"
import { KeyVerificationModel } from "../KeyVerificationModel"
import { assertNotNull } from "@tutao/tutanota-utils"
import jsQR from "jsqr"
import { IdentityKeyQrVerificationResult, IdentityKeyVerificationMethod } from "../../../api/common/TutanotaConstants"
import { isApp, isAppleDevice, isDesktop, isElectronClient } from "../../../api/common/Env"
import { TitleSection } from "../../../gui/TitleSection"

export type QrCodePageErrorType = "camera_permission_denied" | "malformed_qr" | "email_not_found" | "camera_not_found" | "video_source_error" | "unknown"

export type GoToErrorPageHandler = (et: QrCodePageErrorType) => void

enum QrCameraState {
	STOPPED,
	PERMISSION_CHECK,
	INIT_VIDEO,
	SCANNING,
	PERMISSION_DENIED,
}

type VerificationByQrCodePageAttrs = {
	model: KeyVerificationModel
	goToSuccessPage: () => void
	goToErrorPage: GoToErrorPageHandler
	goToMismatchPage: () => void
}

export class VerificationByQrCodeInputPage implements Component<VerificationByQrCodePageAttrs> {
	qrVideo: HTMLVideoElement | null = null
	qrMediaStream: MediaStream | null = null
	qrCameraState: QrCameraState = QrCameraState.STOPPED

	oncreate(vnode: VnodeDOM<VerificationByQrCodePageAttrs>): any {
		this.requestCameraPermission(vnode.attrs.model).then((r) => m.redraw())
	}

	onremove() {
		this.cleanupVideo()
	}

	view(vnode: Vnode<VerificationByQrCodePageAttrs>): Children {
		return m(".pt-16.pb-16.flex.col.gap-16", [
			m(TitleSection, {
				title: lang.get("keyManagement.qrVerification_label"),
				subTitle: lang.get("keyManagement.verificationByQrCodeScan_label"),
			}),
			this.renderQrVideoStream(vnode.attrs),
		])
	}

	private cleanupVideo() {
		this.qrCameraState = QrCameraState.STOPPED

		this.qrVideo?.pause()

		if (this.qrMediaStream != null) {
			for (const stream of this.qrMediaStream.getTracks()) {
				stream.stop()
			}
		}
	}

	private renderQrVideoStream(attrs: VerificationByQrCodePageAttrs): Children {
		return [m(".center", this.qrCameraState === QrCameraState.SCANNING ? null : this.getStateMessage()), this.getVideoElement(attrs)]
	}

	private getVideoElement(attrs: VerificationByQrCodePageAttrs): Children | null {
		if (this.qrCameraState === QrCameraState.INIT_VIDEO || this.qrCameraState === QrCameraState.SCANNING) {
			const video = m("video[autoplay][muted][playsinline]", {
				oncreate: async (videoNode) => {
					this.qrVideo = assertNotNull(videoNode.dom as HTMLVideoElement)
					try {
						await this.runQrScanner(attrs)
					} catch (e) {
						if (e instanceof DOMException && e.name === "AbortError") {
							// Operation cancelled by user. Nothing we can really do about it.
						} else if (e instanceof DOMException && e.name === "NotAllowedError") {
							this.qrCameraState = QrCameraState.PERMISSION_DENIED
							attrs.goToErrorPage("camera_permission_denied")
							m.redraw()
						} else if (e instanceof DOMException && e.name === "NotFoundError") {
							attrs.goToErrorPage("camera_not_found")
							m.redraw()
						} else if (e instanceof DOMException && e.name === "NotReadableError") {
							attrs.goToErrorPage("video_source_error")
							m.redraw()
						} else if (navigator.mediaDevices === undefined) {
							// is not defined in iOS lockdown mode.
							attrs.goToErrorPage("camera_not_found")
							m.redraw()
						} else {
							throw e
						}
					}
				},
				style: { display: "block", "max-width": "100%" },
			})
			return m(".mt-16.mb-16.ml-12.mr-12.border-radius", { style: { overflow: "clip" } }, video)
		}
	}

	private getStateMessage(): string {
		switch (this.qrCameraState) {
			case QrCameraState.SCANNING:
				return "Scan QR code" // should not be shown, but just in case...
			case QrCameraState.INIT_VIDEO:
				return lang.get("keyManagement.waitingForVideo_msg")
			case QrCameraState.PERMISSION_DENIED:
				return lang.get("keyManagement.cameraPermissionNeeded_msg")
			case QrCameraState.PERMISSION_CHECK:
				return lang.get("keyManagement.permissionWaiting_msg")
			default:
				return ""
		}
	}

	private async runQrScanner(attrs: VerificationByQrCodePageAttrs) {
		// "environment" tells the web engine to prefer the rear camera if there are multiple
		this.qrMediaStream = await navigator.mediaDevices.getUserMedia({
			audio: false,
			video: { facingMode: "environment" },
		})
		const video = assertNotNull(this.qrVideo)

		video.srcObject = this.qrMediaStream
		await video.play()

		const canvas = document.createElement("canvas")
		const context2d = assertNotNull(canvas.getContext("2d", { willReadFrequently: true }))

		requestAnimationFrame(() => this.runQrScannerTick(video, canvas, context2d, attrs))
	}

	private async runQrScannerTick(
		video: HTMLVideoElement,
		canvas: HTMLCanvasElement,
		context2d: CanvasRenderingContext2D,
		attrs: VerificationByQrCodePageAttrs,
	) {
		if (video.readyState === video.HAVE_ENOUGH_DATA) {
			if (this.qrCameraState === QrCameraState.INIT_VIDEO) {
				this.qrCameraState = QrCameraState.SCANNING
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
					const verificationResult = await attrs.model.validateQrCodeAddress(code)
					if (verificationResult === IdentityKeyQrVerificationResult.QR_OK) {
						await attrs.model.trust(IdentityKeyVerificationMethod.qr)
						attrs.goToSuccessPage()
					} else {
						if (verificationResult === IdentityKeyQrVerificationResult.QR_FINGERPRINT_MISMATCH) {
							attrs.goToMismatchPage()
						} else {
							attrs.goToErrorPage(this.resultToErrorType(verificationResult))
						}
					}
					// prevent reading more qr codes and possibly triggering the corresponding actions now that we
					// already have a result
					this.cleanupVideo()
				}
			}
		}

		requestAnimationFrame(() => {
			if (this.qrCameraState === QrCameraState.SCANNING) {
				this.runQrScannerTick(video, canvas, context2d, attrs)
			}
		})
	}

	resultToErrorType(kr: IdentityKeyQrVerificationResult | undefined): QrCodePageErrorType {
		switch (kr) {
			case IdentityKeyQrVerificationResult.QR_MAIL_ADDRESS_NOT_FOUND: {
				return "email_not_found"
			}
			case IdentityKeyQrVerificationResult.QR_MALFORMED_PAYLOAD: {
				return "malformed_qr"
			}
		}
		return "unknown"
	}

	async requestCameraPermission(model: KeyVerificationModel): Promise<void> {
		this.qrCameraState = QrCameraState.PERMISSION_CHECK
		let hasPermission = await model.requestCameraPermission()

		if (hasPermission) {
			this.qrCameraState = QrCameraState.INIT_VIDEO
		} else {
			this.qrCameraState = QrCameraState.PERMISSION_DENIED
		}
	}
}
