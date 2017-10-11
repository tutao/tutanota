// @flow
import DOMPurify from "dompurify"
import {Icons} from "../gui/base/icons/Icons"

// the svg data string must contain ' instead of " to avoid display errors in Edge
export const PREVENT_EXTERNAL_IMAGE_LOADING_ICON = 'data:image/svg+xml;utf8,' + Icons.Warning.replace(/\"/g, "'")


class HtmlSanitizer {

	_blockExternalContent: boolean
	_externalContent: string[]
	purifier: DOMPurify

	constructor() {
		this._blockExternalContent = false
		if (DOMPurify.isSupported) {
			this.purifier = DOMPurify
		} else {
			return
		}
		this.purifier.addHook('afterSanitizeElements', (currentNode, data, config) => {
				// Do something with the current node and return it
				//console.log("afterSanitizeElements", currentNode.constructor, currentNode, data, config, "prevent: ", this._blockExternalContent, "style", currentNode.style)
				if (this._blockExternalContent) {
					this._preventExternalImageLoading(currentNode)
				}

				// set target="_blank" for all links
				if (currentNode.tagName && (currentNode.tagName.toLowerCase() == "a" || currentNode.tagName.toLowerCase() == "area" )) {
					currentNode.setAttribute('rel', 'noopener noreferrer')
					currentNode.setAttribute('target', '_blank')
				}

				return currentNode;
			}
		)
	}

	/**
	 * Sanitizes the given html.
	 * @param  html The html content to sanitize.
	 * @param  blockExternalContent True if external content should be blocked
	 */
	sanitize(html: string, blockExternalContent: boolean): SanitizeResult {

		// must be set for use in dompurify hook
		this._blockExternalContent = blockExternalContent;
		this._externalContent = []

		// clean html contains only local references to non existing resources now (images and links)
		//var cleanHtml = html_sanitize(html, this._urlTransformer, this._nameIdClassTransformer);
		let cleanHtml = this.purifier.sanitize(html, {
			ADD_ATTR: ['target', 'controls'], // for target = _blank, controls for audio element
			ADD_URI_SAFE_ATTR: ['poster'], // for video element
			FORBID_TAGS: ['style'] // prevent loading of external fonts.
		});
		return {"text": cleanHtml, "externalContent": this._externalContent};
	}

	_preventExternalImageLoading(htmlNode) {
		if (htmlNode.attributes) {
			this._replaceSrcAttributes(htmlNode);
		}
		if (htmlNode.style) {
			if (htmlNode.style.backgroundImage) {
				//console.log(htmlNode.style.backgroundImage)
				this._replaceStyleImage(htmlNode, "backgroundImage")
				htmlNode.style.backgroundRepeat = "no-repeat"
			}
			if (htmlNode.style.listStyleImage) {
				this._replaceStyleImage(htmlNode, "listStyleImage")
			}
			if (htmlNode.style.content) {
				this._replaceStyleImage(htmlNode, "content")
			}
			if (htmlNode.style.cursor) {
				this._removeStyleImage(htmlNode, "cursor")
			}
			if (htmlNode.style.filter) {
				this._removeStyleImage(htmlNode, "filter")
			}
		}
	}


	_replaceSrcAttributes(htmlNode) {
		let imageSrcAttr = htmlNode.attributes.getNamedItem('src') || htmlNode.attributes.getNamedItem('poster');
		if (imageSrcAttr) {
			this._externalContent.push(imageSrcAttr.value)
			imageSrcAttr.value = PREVENT_EXTERNAL_IMAGE_LOADING_ICON;
			htmlNode.attributes.setNamedItem(imageSrcAttr);
		}
	}

	_removeStyleImage(htmlNode, styleAttributeName: string) {
		let value = htmlNode.style[styleAttributeName]
		if (value.match(/url\(/)) {
			this._externalContent.push(value)
			htmlNode.style.removeProperty(styleAttributeName)
		}
	}

	_replaceStyleImage(htmlNode, styleAttributeName: string) {
		let value = htmlNode.style[styleAttributeName]
		if (value.match(/^url\(/)) {
			// remove surrounding url definition. url(<link>)
			value = value.replace(/^url\("*/, "");
			value = value.replace(/"*\)$/, "");
			this._externalContent.push(value)
			let newImage = 'url("' + PREVENT_EXTERNAL_IMAGE_LOADING_ICON + '")'
			htmlNode.style[styleAttributeName] = newImage;
		}
	}

}

export const htmlSanitizer: HtmlSanitizer = new HtmlSanitizer()
