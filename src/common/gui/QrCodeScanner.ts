import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import jsQR, { QRCode } from "jsqr"
import { assertNotNull } from "@tutao/tutanota-utils"
import { lang } from "../misc/LanguageViewModel.js"
import { assertMainOrNode, isApp, isAppleDevice, isDesktop } from "../api/common/Env.js"
import { locator } from "../api/main/CommonLocator.js"
import { PermissionType } from "../native/common/generatedipc/PermissionType.js"

assertMainOrNode()

export type QrCodeScannerErrorType = "camera_permission_denied" | "camera_not_found" | "video_source_error" | "unknown"

enum QrCameraState {
	STOPPED,
	PERMISSION_CHECK,
	INIT_VIDEO,
	SCANNING,
	PERMISSION_DENIED,
}

export type QrCodeScannerAttrs = {
	onScan: (code: QRCode) => void | Promise<void>
	onError?: (type: QrCodeScannerErrorType) => void
	requestCameraPermission?: () => Promise<boolean>
}

export class QrCodeScanner implements Component<QrCodeScannerAttrs> {
	private qrVideo: HTMLVideoElement | null = null
	private qrMediaStream: MediaStream | null = null
	private qrCameraState: QrCameraState = QrCameraState.STOPPED

	oncreate(vnode: VnodeDOM<QrCodeScannerAttrs>): void {
		this.requestCameraPermission(vnode.attrs).then(() => m.redraw())
	}

	onremove() {
		this.cleanupVideo()
	}

	view(vnode: Vnode<QrCodeScannerAttrs>): Children {
		return [m(".center", this.qrCameraState === QrCameraState.SCANNING ? null : this.getStateMessage()), this.getVideoElement(vnode.attrs)]
	}

	private cleanupVideo() {
		this.qrCameraState = QrCameraState.STOPPED

		this.qrVideo?.pause()

		if (this.qrMediaStream != null) {
			for (const stream of this.qrMediaStream.getTracks()) {
				stream.stop()
			}
		}
		this.qrMediaStream = null
	}

	private getVideoElement(attrs: QrCodeScannerAttrs): Children | null {
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
							attrs.onError?.("camera_permission_denied")
							m.redraw()
						} else if (e instanceof DOMException && e.name === "NotFoundError") {
							attrs.onError?.("camera_not_found")
							m.redraw()
						} else if (e instanceof DOMException && e.name === "NotReadableError") {
							attrs.onError?.("video_source_error")
							m.redraw()
						} else if (navigator.mediaDevices === undefined) {
							// is not defined in iOS lockdown mode.
							attrs.onError?.("camera_not_found")
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
		return null
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

	private async runQrScanner(attrs: QrCodeScannerAttrs) {
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

	private async runQrScannerTick(video: HTMLVideoElement, canvas: HTMLCanvasElement, context2d: CanvasRenderingContext2D, attrs: QrCodeScannerAttrs) {
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
					await attrs.onScan(code)
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

	private async requestCameraPermission(attrs: QrCodeScannerAttrs): Promise<void> {
		this.qrCameraState = QrCameraState.PERMISSION_CHECK
		const hasPermission = attrs.requestCameraPermission ? await attrs.requestCameraPermission() : await this.requestDefaultCameraPermission()

		if (hasPermission) {
			this.qrCameraState = QrCameraState.INIT_VIDEO
		} else {
			this.qrCameraState = QrCameraState.PERMISSION_DENIED
		}
	}

	private async requestDefaultCameraPermission(): Promise<boolean> {
		let hasPermission = true
		if (isApp()) {
			hasPermission = await locator.systemFacade.hasPermission(PermissionType.Camera)
			if (!hasPermission) {
				try {
					await locator.systemFacade.requestPermission(PermissionType.Camera)
					hasPermission = await locator.systemFacade.hasPermission(PermissionType.Camera)
				} catch (e) {
					hasPermission = false
				}
			}
		} else if (isDesktop() && isAppleDevice()) {
			hasPermission = await locator.desktopSystemFacade.requestVideoPermission()
		}

		return hasPermission
	}
}
