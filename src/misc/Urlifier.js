//@flow
import {startsWith} from "../api/common/utils/StringUtils"
import Autolinker from "autolinker"

/**
 * Replaces plain text links in the given text by html links. Already existing html links are not changed.
 * @param text The text to be checked for links.
 * @returns {string} The text with html links.
 */

export function urlify(text: string): string {
	return Autolinker.link(text, {
		stripPrefix: false,
		urls: true,
		emails: true,
		phone: false,
		mention: false, // twitter, instagram
		hashtag: false,
		replaceFn: (match) => {
			switch (match.getType()) {
				case 'url' :
					// true: let Autolinker perform its normal anchor tag replacement,  false: don't auto-link this particular item leave as-is
					if (startsWith(match.getMatchedText(), "http") || startsWith(match.getMatchedText(), "www.")) {
						var tag = match.buildTag(); // returns an `Autolinker.HtmlTag` instance for an <a> tag
						tag.setAttr('target', '_blank');
						tag.setAttr('rel', 'noopener noreferrer');
						return tag;
					} else {
						return false;
					}
			}
		}
	})
}