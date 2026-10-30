import Foundation

class IconFactory {
	static func createFontImage(iconId: String, fontName: String, fontSize: CGFloat) -> UIImage {
		let size = CGSize(width: fontSize, height: fontSize)
		guard let font = UIFont(name: fontName, size: fontSize) else { fatalError("Invalid font name: \(fontName)") }
		let paragraphStyle = NSMutableParagraphStyle()
		paragraphStyle.alignment = .center
		let attributes: [NSAttributedString.Key: Any] = [
			.font: font, .foregroundColor: UIColor.blue, .backgroundColor: UIColor.clear, .paragraphStyle: paragraphStyle,
		]
		let attributedString = NSAttributedString(string: iconId, attributes: attributes)

		let renderer = UIGraphicsImageRenderer(size: size)
		let fontImage = renderer.image { (context) in
		    attributedString.draw(in: CGRect(x: 0, y: 0, width: size.width, height: size.height))
		}
		return fontImage
	}
}
