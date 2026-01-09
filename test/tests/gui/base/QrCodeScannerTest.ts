import o from "@tutao/otest"
import jsQR from "jsqr"
import QRCode from "qrcode-svg"

function buildQrImageData(content: string, scale = 4, marginModules = 4): { data: Uint8ClampedArray; width: number; height: number } {
	const qrCode = new QRCode({ content })
	const modules = qrCode.qrcode.modules as boolean[][]
	const moduleCount = qrCode.qrcode.moduleCount
	const size = (moduleCount + marginModules * 2) * scale
	const data = new Uint8ClampedArray(size * size * 4)

	data.fill(255)

	for (let row = 0; row < moduleCount; row++) {
		for (let column = 0; column < moduleCount; column++) {
			if (!modules[row][column]) {
				continue
			}

			const startX = (column + marginModules) * scale
			const startY = (row + marginModules) * scale
			for (let y = 0; y < scale; y++) {
				for (let x = 0; x < scale; x++) {
					const index = ((startY + y) * size + (startX + x)) * 4
					data[index] = 0
					data[index + 1] = 0
					data[index + 2] = 0
					data[index + 3] = 255
				}
			}
		}
	}

	return { data, width: size, height: size }
}

o.spec("QrCodeScanner", function () {
	o("decodes qr code image data", function () {
		const payload = {
			mailAddress: "alice@example.com",
			recoveryCode: "0123456789abcdef".repeat(4),
		}
		const { data, width, height } = buildQrImageData(JSON.stringify(payload))

		const code = jsQR(data, width, height, { inversionAttempts: "dontInvert" })

		o(code).notEquals(null)
		if (code == null) {
			throw new Error("Expected QR code data")
		}
		o(JSON.parse(code.data)).deepEquals(payload)
	})
})
