import { __commonJS, __require, __toESM } from "./chunk-chunk.js";
import { isAndroidApp, isApp, isIOSApp } from "./Env-chunk.js";
import { client } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { assertNotNull, count, filterInt, noOp, ofClass } from "./dist2-chunk.js";
import { InfoLink, lang } from "./LanguageViewModel-chunk.js";
import { DefaultAnimationTime } from "./styles-chunk.js";
import { theme } from "./theme-chunk.js";
import { Const, Keys, PaymentMethodType, PlanType } from "./TutanotaConstants-chunk.js";
import { px, size } from "./size-chunk.js";
import { CustomerInfoTypeRef, CustomerTypeRef, GiftCardTypeRef } from "./TypeRefs2-chunk.js";
import { BadGatewayError, PreconditionFailedError } from "./RestError-chunk.js";
import { GiftCardService } from "./Services-chunk.js";
import { ButtonType } from "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import { Dialog } from "./Dialog-chunk.js";
import { BootIcons, Icon, IconSize } from "./Icon-chunk.js";
import { IconButton } from "./IconButton-chunk.js";
import { urlEncodeHtmlTags } from "./Formatter-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { UserError } from "./UserError-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import { Checkbox } from "./Checkbox-chunk.js";
import { copyToClipboard } from "./ClipboardUtils-chunk.js";
import { showUserError } from "./ErrorHandlerImpl-chunk.js";
import { LoginButton } from "./LoginButton-chunk.js";
import { InfoIcon } from "./InfoIcon-chunk.js";
import { htmlSanitizer } from "./HtmlSanitizer-chunk.js";
import { SegmentControl } from "./SegmentControl-chunk.js";
import { getPreconditionFailedPaymentMsg } from "./SubscriptionUtils-chunk.js";
import { PaymentInterval, PriceAndConfigProvider, UpgradePriceType, formatPrice, isReferenceDateWithinCyberMondayCampaign } from "./PriceUtils-chunk.js";

//#region src/common/subscription/BuyOptionBox.ts
function getActiveSubscriptionActionButtonReplacement() {
	return () => mithril_default(".buyOptionBox.content-accent-fg.center-vertically.text-center", { style: { "border-radius": px(size.border_radius_small) } }, lang.get("pricing.currentPlan_label"));
}
const BOX_MARGIN = 10;
var BuyOptionDetails = class {
	featuresExpanded = false;
	featureListItemSelector = ".flex";
	onbeforeupdate(vnode, old) {
		if (vnode.attrs.featuresExpanded && !old.attrs.featuresExpanded) this.featureListItemSelector = ".flex.expand";
else this.featureListItemSelector = ".flex";
	}
	view(vnode) {
		const { attrs } = vnode;
		this.featuresExpanded = attrs.featuresExpanded || false;
		return mithril_default(".mt.pl", attrs.categories.map((fc) => {
			return [
				this.renderCategoryTitle(fc, attrs.renderCategoryTitle),
				fc.features.filter((f) => !f.omit || this.featuresExpanded).map((f) => mithril_default(this.featureListItemSelector, { key: f.key }, [
					f.heart ? mithril_default(Icon, {
						icon: BootIcons.Heart,
						style: attrs.iconStyle
					}) : mithril_default(Icon, {
						icon: f.antiFeature ? Icons.Cancel : Icons.Checkmark,
						style: attrs.iconStyle
					}),
					mithril_default(".small.text-left.align-self-center.pl-s.button-height.flex-grow.min-width-0.break-word", [mithril_default("span", f.text)]),
					f.toolTip ? mithril_default(InfoIcon, { text: f.toolTip }) : null
				])),
				this.renderPlaceholders(fc)
			];
		}));
	}
	renderCategoryTitle(fc, renderCategoryTitle) {
		if (fc.title && this.featuresExpanded) return [mithril_default(".b.text-left.align-self-center.pl-s.button-height.flex-grow.min-width-0.break-word", ""), mithril_default(".b.text-left.align-self-center.pl-s.button-height.flex-grow.min-width-0.break-word", renderCategoryTitle ? fc.title : "")];
else return [];
	}
	renderPlaceholders(fc) {
		if (!this.featuresExpanded) return [];
else {
			const placeholderCount = fc.featureCount.max - fc.features.length;
			return [...Array(placeholderCount)].map(() => mithril_default(".button-height", ""));
		}
	}
};
var BuyOptionBox = class {
	view(vnode) {
		const { attrs } = vnode;
		const isCyberMonday = isReferenceDateWithinCyberMondayCampaign(Const.CURRENT_DATE ?? new Date());
		const isLegendPlan = attrs.targetSubscription === PlanType.Legend;
		const isYearly = (attrs.selectedPaymentInterval == null ? attrs.accountPaymentInterval : attrs.selectedPaymentInterval()) === PaymentInterval.Yearly;
		const shouldApplyCyberMondayDesign = isLegendPlan && isCyberMonday && isYearly;
		return mithril_default(".fg-black", { style: {
			width: px(attrs.width),
			padding: "10px",
			height: "100%"
		} }, [mithril_default(".buyOptionBox" + (attrs.highlighted ? shouldApplyCyberMondayDesign ? ".highlighted.cyberMonday" : ".highlighted" : ""), { style: {
			display: "flex",
			"flex-direction": "column",
			"min-height": px(attrs.height),
			"border-radius": "3px",
			height: "100%"
		} }, [
			shouldApplyCyberMondayDesign ? this.renderCyberMondayRibbon() : this.renderBonusMonthsRibbon(attrs.bonusMonths),
			typeof attrs.heading === "string" ? this.renderHeading(attrs.heading) : attrs.heading,
			this.renderPrice(attrs.price, isYearly ? attrs.referencePrice : undefined),
			mithril_default(".small.text-center", attrs.priceHint ? lang.getTranslationText(attrs.priceHint) : lang.get("emptyString_msg")),
			mithril_default(".small.text-center.pb-ml", lang.getTranslationText(attrs.helpLabel)),
			this.renderPaymentIntervalControl(attrs.selectedPaymentInterval, shouldApplyCyberMondayDesign),
			attrs.actionButton ? mithril_default(".button-min-height", { style: { "margin-top": "auto" } }, attrs.actionButton()) : null
		])]);
	}
	renderPrice(price, strikethroughPrice) {
		return mithril_default(".pt-ml.text-center", { style: {
			display: "grid",
			"grid-template-columns": "1fr auto 1fr",
			"align-items": "center"
		} }, strikethroughPrice != null && strikethroughPrice.trim() !== "" ? mithril_default(".span.strike", { style: {
			color: theme.content_button,
			fontSize: px(size.font_size_base),
			justifySelf: "end",
			margin: "auto 0.4em 0 0",
			padding: "0.4em 0"
		} }, strikethroughPrice) : mithril_default(""), mithril_default(".h1", price), mithril_default(""));
	}
	renderBonusMonthsRibbon(bonusMonths) {
		return bonusMonths > 0 ? this.renderRibbon(`+${bonusMonths} ${lang.get("pricing.months_label")}`) : null;
	}
	renderRibbon(text) {
		return mithril_default(".ribbon-horizontal", mithril_default(".text-center.b", { style: { padding: px(3) } }, text));
	}
	renderCyberMondayRibbon() {
		const text = isIOSApp() ? "DEAL" : lang.get("pricing.cyberMonday_label");
		return mithril_default(".ribbon-horizontal.ribbon-horizontal-cyber-monday", mithril_default(".text-center.b", { style: { padding: px(3) } }, text));
	}
	renderPaymentIntervalControl(paymentInterval, shouldApplyCyberMonday) {
		const paymentIntervalItems = [{
			name: lang.get("pricing.yearly_label"),
			value: PaymentInterval.Yearly
		}, {
			name: lang.get("pricing.monthly_label"),
			value: PaymentInterval.Monthly
		}];
		return paymentInterval ? mithril_default(SegmentControl, {
			selectedValue: paymentInterval(),
			items: paymentIntervalItems,
			onValueSelected: (v) => {
				paymentInterval?.(v);
				mithril_default.redraw();
			},
			shouldApplyCyberMonday
		}) : null;
	}
	renderHeading(heading) {
		return mithril_default(
			// we need some margin for the discount banner for longer translations shown on the website
			`.h4.text-center.mb-small-line-height.flex.col.center-horizontally.mlr-l.dialog-header`,
			{ style: { "font-size": heading.length > 20 ? "smaller" : undefined } },
			heading
);
	}
};

//#endregion
//#region src/common/misc/Website.ts
async function requestFromWebsite(path, domainConfig) {
	const url = new URL(path, domainConfig.websiteBaseUrl);
	return fetch(url.href);
}

//#endregion
//#region src/common/subscription/TermsAndConditions.ts
const CURRENT_TERMS_VERSION = "3.2";
const CURRENT_PRIVACY_VERSION = "3.1";
const CURRENT_GIFT_CARD_TERMS_VERSION = "1.0";
function renderTermsAndConditionsButton(terms, version) {
	let label;
	let link;
	switch (terms) {
		case TermsSection.GiftCards:
			label = lang.get("giftCardTerms_label");
			link = InfoLink.GiftCardsTerms;
			break;
		case TermsSection.Terms:
			label = lang.get("termsAndConditionsLink_label");
			link = InfoLink.Terms;
			break;
		case TermsSection.Privacy:
			label = lang.get("privacyLink_label");
			link = InfoLink.Privacy;
			break;
	}
	return mithril_default(`a[href=${link}][target=_blank]`, { onclick: (e) => {
		if (isApp()) {
			showServiceTerms(terms, version);
			e.preventDefault();
		}
	} }, label);
}
let TermsSection = function(TermsSection$1) {
	TermsSection$1["Terms"] = "terms-entries";
	TermsSection$1["Privacy"] = "privacy-policy-entries";
	TermsSection$1["GiftCards"] = "giftCardsTerms-entries";
	return TermsSection$1;
}({});
async function showServiceTerms(section, version) {
	const path = `/${section}/${version}.json`;
	const termsFromWebsite = await requestFromWebsite(path, locator.domainConfigProvider().getCurrentDomainConfig()).then((res) => res.json());
	let visibleLang = lang.code.startsWith("de") ? "de" : "en";
	let dialog;
	let sanitizedTerms;
	function getSection() {
		return htmlSanitizer.sanitizeHTML(termsFromWebsite[visibleLang], { blockExternalContent: false }).html;
	}
	let headerBarAttrs = {
		left: [{
			label: lang.makeTranslation("lang_toggle", "EN/DE"),
			click: () => {
				visibleLang = visibleLang === "de" ? "en" : "de";
				sanitizedTerms = getSection();
				mithril_default.redraw();
			},
			type: ButtonType.Secondary
		}],
		right: [{
			label: "ok_action",
			click: () => dialog.close(),
			type: ButtonType.Primary
		}]
	};
	sanitizedTerms = getSection();
	dialog = Dialog.largeDialog(headerBarAttrs, { view: () => mithril_default(".text-break", mithril_default.trust(sanitizedTerms)) }).show();
}

//#endregion
//#region libs/qrcode.js
var require_qrcode = __commonJS({ "libs/qrcode.js"(exports, module) {
	/**
	* @fileoverview
	* - modified davidshimjs/qrcodejs library for use in node.js
	* - Using the 'QRCode for Javascript library'
	* - Fixed dataset of 'QRCode for Javascript library' for support full-spec.
	* - this library has no dependencies.
	*
	* @version 0.9.1 (2016-02-12)
	* @author davidshimjs, papnkukn
	* @see <a href="http://www.d-project.com/" target="_blank">http://www.d-project.com/</a>
	* @see <a href="http://jeromeetienne.github.com/jquery-qrcode/" target="_blank">http://jeromeetienne.github.com/jquery-qrcode/</a>
	* @see <a href="https://github.com/davidshimjs/qrcodejs" target="_blank">https://github.com/davidshimjs/qrcodejs</a>
	*/
	function QR8bitByte(data) {
		this.mode = QRMode.MODE_8BIT_BYTE;
		this.data = data;
		this.parsedData = [];
		for (var i$1 = 0, l = this.data.length; i$1 < l; i$1++) {
			var byteArray = [];
			var code = this.data.charCodeAt(i$1);
			if (code > 65536) {
				byteArray[0] = 240 | (code & 1835008) >>> 18;
				byteArray[1] = 128 | (code & 258048) >>> 12;
				byteArray[2] = 128 | (code & 4032) >>> 6;
				byteArray[3] = 128 | code & 63;
			} else if (code > 2048) {
				byteArray[0] = 224 | (code & 61440) >>> 12;
				byteArray[1] = 128 | (code & 4032) >>> 6;
				byteArray[2] = 128 | code & 63;
			} else if (code > 128) {
				byteArray[0] = 192 | (code & 1984) >>> 6;
				byteArray[1] = 128 | code & 63;
			} else byteArray[0] = code;
			this.parsedData.push(byteArray);
		}
		this.parsedData = Array.prototype.concat.apply([], this.parsedData);
		if (this.parsedData.length != this.data.length) {
			this.parsedData.unshift(191);
			this.parsedData.unshift(187);
			this.parsedData.unshift(239);
		}
	}
	QR8bitByte.prototype = {
		getLength: function(buffer) {
			return this.parsedData.length;
		},
		write: function(buffer) {
			for (var i$1 = 0, l = this.parsedData.length; i$1 < l; i$1++) buffer.put(this.parsedData[i$1], 8);
		}
	};
	function QRCodeModel(typeNumber, errorCorrectLevel) {
		this.typeNumber = typeNumber;
		this.errorCorrectLevel = errorCorrectLevel;
		this.modules = null;
		this.moduleCount = 0;
		this.dataCache = null;
		this.dataList = [];
	}
	QRCodeModel.prototype = {
		addData: function(data) {
			var newData = new QR8bitByte(data);
			this.dataList.push(newData);
			this.dataCache = null;
		},
		isDark: function(row, col) {
			if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) throw new Error(row + "," + col);
			return this.modules[row][col];
		},
		getModuleCount: function() {
			return this.moduleCount;
		},
		make: function() {
			this.makeImpl(false, this.getBestMaskPattern());
		},
		makeImpl: function(test, maskPattern) {
			this.moduleCount = this.typeNumber * 4 + 17;
			this.modules = new Array(this.moduleCount);
			for (var row = 0; row < this.moduleCount; row++) {
				this.modules[row] = new Array(this.moduleCount);
				for (var col = 0; col < this.moduleCount; col++) this.modules[row][col] = null;
			}
			this.setupPositionProbePattern(0, 0);
			this.setupPositionProbePattern(this.moduleCount - 7, 0);
			this.setupPositionProbePattern(0, this.moduleCount - 7);
			this.setupPositionAdjustPattern();
			this.setupTimingPattern();
			this.setupTypeInfo(test, maskPattern);
			if (this.typeNumber >= 7) this.setupTypeNumber(test);
			if (this.dataCache == null) this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
			this.mapData(this.dataCache, maskPattern);
		},
		setupPositionProbePattern: function(row, col) {
			for (var r = -1; r <= 7; r++) {
				if (row + r <= -1 || this.moduleCount <= row + r) continue;
				for (var c = -1; c <= 7; c++) {
					if (col + c <= -1 || this.moduleCount <= col + c) continue;
					if (0 <= r && r <= 6 && (c == 0 || c == 6) || 0 <= c && c <= 6 && (r == 0 || r == 6) || 2 <= r && r <= 4 && 2 <= c && c <= 4) this.modules[row + r][col + c] = true;
else this.modules[row + r][col + c] = false;
				}
			}
		},
		getBestMaskPattern: function() {
			var minLostPoint = 0;
			var pattern = 0;
			for (var i$1 = 0; i$1 < 8; i$1++) {
				this.makeImpl(true, i$1);
				var lostPoint = QRUtil.getLostPoint(this);
				if (i$1 == 0 || minLostPoint > lostPoint) {
					minLostPoint = lostPoint;
					pattern = i$1;
				}
			}
			return pattern;
		},
		createMovieClip: function(target_mc, instance_name, depth) {
			var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
			var cs = 1;
			this.make();
			for (var row = 0; row < this.modules.length; row++) {
				var y = row * cs;
				for (var col = 0; col < this.modules[row].length; col++) {
					var x = col * cs;
					var dark = this.modules[row][col];
					if (dark) {
						qr_mc.beginFill(0, 100);
						qr_mc.moveTo(x, y);
						qr_mc.lineTo(x + cs, y);
						qr_mc.lineTo(x + cs, y + cs);
						qr_mc.lineTo(x, y + cs);
						qr_mc.endFill();
					}
				}
			}
			return qr_mc;
		},
		setupTimingPattern: function() {
			for (var r = 8; r < this.moduleCount - 8; r++) {
				if (this.modules[r][6] != null) continue;
				this.modules[r][6] = r % 2 == 0;
			}
			for (var c = 8; c < this.moduleCount - 8; c++) {
				if (this.modules[6][c] != null) continue;
				this.modules[6][c] = c % 2 == 0;
			}
		},
		setupPositionAdjustPattern: function() {
			var pos = QRUtil.getPatternPosition(this.typeNumber);
			for (var i$1 = 0; i$1 < pos.length; i$1++) for (var j = 0; j < pos.length; j++) {
				var row = pos[i$1];
				var col = pos[j];
				if (this.modules[row][col] != null) continue;
				for (var r = -2; r <= 2; r++) for (var c = -2; c <= 2; c++) if (r == -2 || r == 2 || c == -2 || c == 2 || r == 0 && c == 0) this.modules[row + r][col + c] = true;
else this.modules[row + r][col + c] = false;
			}
		},
		setupTypeNumber: function(test) {
			var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
			for (var i$1 = 0; i$1 < 18; i$1++) {
				var mod = !test && (bits >> i$1 & 1) == 1;
				this.modules[Math.floor(i$1 / 3)][i$1 % 3 + this.moduleCount - 8 - 3] = mod;
			}
			for (var i$1 = 0; i$1 < 18; i$1++) {
				var mod = !test && (bits >> i$1 & 1) == 1;
				this.modules[i$1 % 3 + this.moduleCount - 8 - 3][Math.floor(i$1 / 3)] = mod;
			}
		},
		setupTypeInfo: function(test, maskPattern) {
			var data = this.errorCorrectLevel << 3 | maskPattern;
			var bits = QRUtil.getBCHTypeInfo(data);
			for (var i$1 = 0; i$1 < 15; i$1++) {
				var mod = !test && (bits >> i$1 & 1) == 1;
				if (i$1 < 6) this.modules[i$1][8] = mod;
else if (i$1 < 8) this.modules[i$1 + 1][8] = mod;
else this.modules[this.moduleCount - 15 + i$1][8] = mod;
			}
			for (var i$1 = 0; i$1 < 15; i$1++) {
				var mod = !test && (bits >> i$1 & 1) == 1;
				if (i$1 < 8) this.modules[8][this.moduleCount - i$1 - 1] = mod;
else if (i$1 < 9) this.modules[8][15 - i$1 - 1 + 1] = mod;
else this.modules[8][15 - i$1 - 1] = mod;
			}
			this.modules[this.moduleCount - 8][8] = !test;
		},
		mapData: function(data, maskPattern) {
			var inc = -1;
			var row = this.moduleCount - 1;
			var bitIndex = 7;
			var byteIndex = 0;
			for (var col = this.moduleCount - 1; col > 0; col -= 2) {
				if (col == 6) col--;
				while (true) {
					for (var c = 0; c < 2; c++) if (this.modules[row][col - c] == null) {
						var dark = false;
						if (byteIndex < data.length) dark = (data[byteIndex] >>> bitIndex & 1) == 1;
						var mask = QRUtil.getMask(maskPattern, row, col - c);
						if (mask) dark = !dark;
						this.modules[row][col - c] = dark;
						bitIndex--;
						if (bitIndex == -1) {
							byteIndex++;
							bitIndex = 7;
						}
					}
					row += inc;
					if (row < 0 || this.moduleCount <= row) {
						row -= inc;
						inc = -inc;
						break;
					}
				}
			}
		}
	};
	QRCodeModel.PAD0 = 236;
	QRCodeModel.PAD1 = 17;
	QRCodeModel.createData = function(typeNumber, errorCorrectLevel, dataList) {
		var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
		var buffer = new QRBitBuffer();
		for (var i$1 = 0; i$1 < dataList.length; i$1++) {
			var data = dataList[i$1];
			buffer.put(data.mode, 4);
			buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
			data.write(buffer);
		}
		var totalDataCount = 0;
		for (var i$1 = 0; i$1 < rsBlocks.length; i$1++) totalDataCount += rsBlocks[i$1].dataCount;
		if (buffer.getLengthInBits() > totalDataCount * 8) throw new Error("code length overflow. (" + buffer.getLengthInBits() + ">" + totalDataCount * 8 + ")");
		if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4);
		while (buffer.getLengthInBits() % 8 != 0) buffer.putBit(false);
		while (true) {
			if (buffer.getLengthInBits() >= totalDataCount * 8) break;
			buffer.put(QRCodeModel.PAD0, 8);
			if (buffer.getLengthInBits() >= totalDataCount * 8) break;
			buffer.put(QRCodeModel.PAD1, 8);
		}
		return QRCodeModel.createBytes(buffer, rsBlocks);
	};
	QRCodeModel.createBytes = function(buffer, rsBlocks) {
		var offset = 0;
		var maxDcCount = 0;
		var maxEcCount = 0;
		var dcdata = new Array(rsBlocks.length);
		var ecdata = new Array(rsBlocks.length);
		for (var r = 0; r < rsBlocks.length; r++) {
			var dcCount = rsBlocks[r].dataCount;
			var ecCount = rsBlocks[r].totalCount - dcCount;
			maxDcCount = Math.max(maxDcCount, dcCount);
			maxEcCount = Math.max(maxEcCount, ecCount);
			dcdata[r] = new Array(dcCount);
			for (var i$1 = 0; i$1 < dcdata[r].length; i$1++) dcdata[r][i$1] = 255 & buffer.buffer[i$1 + offset];
			offset += dcCount;
			var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
			var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
			var modPoly = rawPoly.mod(rsPoly);
			ecdata[r] = new Array(rsPoly.getLength() - 1);
			for (var i$1 = 0; i$1 < ecdata[r].length; i$1++) {
				var modIndex = i$1 + modPoly.getLength() - ecdata[r].length;
				ecdata[r][i$1] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
			}
		}
		var totalCodeCount = 0;
		for (var i$1 = 0; i$1 < rsBlocks.length; i$1++) totalCodeCount += rsBlocks[i$1].totalCount;
		var data = new Array(totalCodeCount);
		var index = 0;
		for (var i$1 = 0; i$1 < maxDcCount; i$1++) for (var r = 0; r < rsBlocks.length; r++) if (i$1 < dcdata[r].length) data[index++] = dcdata[r][i$1];
		for (var i$1 = 0; i$1 < maxEcCount; i$1++) for (var r = 0; r < rsBlocks.length; r++) if (i$1 < ecdata[r].length) data[index++] = ecdata[r][i$1];
		return data;
	};
	var QRMode = {
		MODE_NUMBER: 1,
		MODE_ALPHA_NUM: 2,
		MODE_8BIT_BYTE: 4,
		MODE_KANJI: 8
	};
	var QRErrorCorrectLevel = {
		L: 1,
		M: 0,
		Q: 3,
		H: 2
	};
	var QRMaskPattern = {
		PATTERN000: 0,
		PATTERN001: 1,
		PATTERN010: 2,
		PATTERN011: 3,
		PATTERN100: 4,
		PATTERN101: 5,
		PATTERN110: 6,
		PATTERN111: 7
	};
	var QRUtil = {
		PATTERN_POSITION_TABLE: [
			[],
			[6, 18],
			[6, 22],
			[6, 26],
			[6, 30],
			[6, 34],
			[
				6,
				22,
				38
			],
			[
				6,
				24,
				42
			],
			[
				6,
				26,
				46
			],
			[
				6,
				28,
				50
			],
			[
				6,
				30,
				54
			],
			[
				6,
				32,
				58
			],
			[
				6,
				34,
				62
			],
			[
				6,
				26,
				46,
				66
			],
			[
				6,
				26,
				48,
				70
			],
			[
				6,
				26,
				50,
				74
			],
			[
				6,
				30,
				54,
				78
			],
			[
				6,
				30,
				56,
				82
			],
			[
				6,
				30,
				58,
				86
			],
			[
				6,
				34,
				62,
				90
			],
			[
				6,
				28,
				50,
				72,
				94
			],
			[
				6,
				26,
				50,
				74,
				98
			],
			[
				6,
				30,
				54,
				78,
				102
			],
			[
				6,
				28,
				54,
				80,
				106
			],
			[
				6,
				32,
				58,
				84,
				110
			],
			[
				6,
				30,
				58,
				86,
				114
			],
			[
				6,
				34,
				62,
				90,
				118
			],
			[
				6,
				26,
				50,
				74,
				98,
				122
			],
			[
				6,
				30,
				54,
				78,
				102,
				126
			],
			[
				6,
				26,
				52,
				78,
				104,
				130
			],
			[
				6,
				30,
				56,
				82,
				108,
				134
			],
			[
				6,
				34,
				60,
				86,
				112,
				138
			],
			[
				6,
				30,
				58,
				86,
				114,
				142
			],
			[
				6,
				34,
				62,
				90,
				118,
				146
			],
			[
				6,
				30,
				54,
				78,
				102,
				126,
				150
			],
			[
				6,
				24,
				50,
				76,
				102,
				128,
				154
			],
			[
				6,
				28,
				54,
				80,
				106,
				132,
				158
			],
			[
				6,
				32,
				58,
				84,
				110,
				136,
				162
			],
			[
				6,
				26,
				54,
				82,
				110,
				138,
				166
			],
			[
				6,
				30,
				58,
				86,
				114,
				142,
				170
			]
		],
		G15: 1335,
		G18: 7973,
		G15_MASK: 21522,
		getBCHTypeInfo: function(data) {
			var d = data << 10;
			while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) d ^= QRUtil.G15 << QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15);
			return (data << 10 | d) ^ QRUtil.G15_MASK;
		},
		getBCHTypeNumber: function(data) {
			var d = data << 12;
			while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) d ^= QRUtil.G18 << QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18);
			return data << 12 | d;
		},
		getBCHDigit: function(data) {
			var digit = 0;
			while (data != 0) {
				digit++;
				data >>>= 1;
			}
			return digit;
		},
		getPatternPosition: function(typeNumber) {
			return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
		},
		getMask: function(maskPattern, i$1, j) {
			switch (maskPattern) {
				case QRMaskPattern.PATTERN000: return (i$1 + j) % 2 == 0;
				case QRMaskPattern.PATTERN001: return i$1 % 2 == 0;
				case QRMaskPattern.PATTERN010: return j % 3 == 0;
				case QRMaskPattern.PATTERN011: return (i$1 + j) % 3 == 0;
				case QRMaskPattern.PATTERN100: return (Math.floor(i$1 / 2) + Math.floor(j / 3)) % 2 == 0;
				case QRMaskPattern.PATTERN101: return i$1 * j % 2 + i$1 * j % 3 == 0;
				case QRMaskPattern.PATTERN110: return (i$1 * j % 2 + i$1 * j % 3) % 2 == 0;
				case QRMaskPattern.PATTERN111: return (i$1 * j % 3 + (i$1 + j) % 2) % 2 == 0;
				default: throw new Error("bad maskPattern:" + maskPattern);
			}
		},
		getErrorCorrectPolynomial: function(errorCorrectLength) {
			var a = new QRPolynomial([1], 0);
			for (var i$1 = 0; i$1 < errorCorrectLength; i$1++) a = a.multiply(new QRPolynomial([1, QRMath.gexp(i$1)], 0));
			return a;
		},
		getLengthInBits: function(mode, type) {
			if (1 <= type && type < 10) switch (mode) {
				case QRMode.MODE_NUMBER: return 10;
				case QRMode.MODE_ALPHA_NUM: return 9;
				case QRMode.MODE_8BIT_BYTE: return 8;
				case QRMode.MODE_KANJI: return 8;
				default: throw new Error("mode:" + mode);
			}
else if (type < 27) switch (mode) {
				case QRMode.MODE_NUMBER: return 12;
				case QRMode.MODE_ALPHA_NUM: return 11;
				case QRMode.MODE_8BIT_BYTE: return 16;
				case QRMode.MODE_KANJI: return 10;
				default: throw new Error("mode:" + mode);
			}
else if (type < 41) switch (mode) {
				case QRMode.MODE_NUMBER: return 14;
				case QRMode.MODE_ALPHA_NUM: return 13;
				case QRMode.MODE_8BIT_BYTE: return 16;
				case QRMode.MODE_KANJI: return 12;
				default: throw new Error("mode:" + mode);
			}
else throw new Error("type:" + type);
		},
		getLostPoint: function(qrCode) {
			var moduleCount = qrCode.getModuleCount();
			var lostPoint = 0;
			for (var row = 0; row < moduleCount; row++) for (var col = 0; col < moduleCount; col++) {
				var sameCount = 0;
				var dark = qrCode.isDark(row, col);
				for (var r = -1; r <= 1; r++) {
					if (row + r < 0 || moduleCount <= row + r) continue;
					for (var c = -1; c <= 1; c++) {
						if (col + c < 0 || moduleCount <= col + c) continue;
						if (r == 0 && c == 0) continue;
						if (dark == qrCode.isDark(row + r, col + c)) sameCount++;
					}
				}
				if (sameCount > 5) lostPoint += 3 + sameCount - 5;
			}
			for (var row = 0; row < moduleCount - 1; row++) for (var col = 0; col < moduleCount - 1; col++) {
				var count$1 = 0;
				if (qrCode.isDark(row, col)) count$1++;
				if (qrCode.isDark(row + 1, col)) count$1++;
				if (qrCode.isDark(row, col + 1)) count$1++;
				if (qrCode.isDark(row + 1, col + 1)) count$1++;
				if (count$1 == 0 || count$1 == 4) lostPoint += 3;
			}
			for (var row = 0; row < moduleCount; row++) for (var col = 0; col < moduleCount - 6; col++) if (qrCode.isDark(row, col) && !qrCode.isDark(row, col + 1) && qrCode.isDark(row, col + 2) && qrCode.isDark(row, col + 3) && qrCode.isDark(row, col + 4) && !qrCode.isDark(row, col + 5) && qrCode.isDark(row, col + 6)) lostPoint += 40;
			for (var col = 0; col < moduleCount; col++) for (var row = 0; row < moduleCount - 6; row++) if (qrCode.isDark(row, col) && !qrCode.isDark(row + 1, col) && qrCode.isDark(row + 2, col) && qrCode.isDark(row + 3, col) && qrCode.isDark(row + 4, col) && !qrCode.isDark(row + 5, col) && qrCode.isDark(row + 6, col)) lostPoint += 40;
			var darkCount = 0;
			for (var col = 0; col < moduleCount; col++) for (var row = 0; row < moduleCount; row++) if (qrCode.isDark(row, col)) darkCount++;
			var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
			lostPoint += ratio * 10;
			return lostPoint;
		}
	};
	var QRMath = {
		glog: function(n) {
			if (n < 1) throw new Error("glog(" + n + ")");
			return QRMath.LOG_TABLE[n];
		},
		gexp: function(n) {
			while (n < 0) n += 255;
			while (n >= 256) n -= 255;
			return QRMath.EXP_TABLE[n];
		},
		EXP_TABLE: new Array(256),
		LOG_TABLE: new Array(256)
	};
	for (var i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
	for (var i = 8; i < 256; i++) QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
	for (var i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
	function QRPolynomial(num, shift) {
		if (num.length == undefined) throw new Error(num.length + "/" + shift);
		var offset = 0;
		while (offset < num.length && num[offset] == 0) offset++;
		this.num = new Array(num.length - offset + shift);
		for (var i$1 = 0; i$1 < num.length - offset; i$1++) this.num[i$1] = num[i$1 + offset];
	}
	QRPolynomial.prototype = {
		get: function(index) {
			return this.num[index];
		},
		getLength: function() {
			return this.num.length;
		},
		multiply: function(e) {
			var num = new Array(this.getLength() + e.getLength() - 1);
			for (var i$1 = 0; i$1 < this.getLength(); i$1++) for (var j = 0; j < e.getLength(); j++) num[i$1 + j] ^= QRMath.gexp(QRMath.glog(this.get(i$1)) + QRMath.glog(e.get(j)));
			return new QRPolynomial(num, 0);
		},
		mod: function(e) {
			if (this.getLength() - e.getLength() < 0) return this;
			var ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
			var num = new Array(this.getLength());
			for (var i$1 = 0; i$1 < this.getLength(); i$1++) num[i$1] = this.get(i$1);
			for (var i$1 = 0; i$1 < e.getLength(); i$1++) num[i$1] ^= QRMath.gexp(QRMath.glog(e.get(i$1)) + ratio);
			return new QRPolynomial(num, 0).mod(e);
		}
	};
	function QRRSBlock(totalCount, dataCount) {
		this.totalCount = totalCount;
		this.dataCount = dataCount;
	}
	QRRSBlock.RS_BLOCK_TABLE = [
		[
			1,
			26,
			19
		],
		[
			1,
			26,
			16
		],
		[
			1,
			26,
			13
		],
		[
			1,
			26,
			9
		],
		[
			1,
			44,
			34
		],
		[
			1,
			44,
			28
		],
		[
			1,
			44,
			22
		],
		[
			1,
			44,
			16
		],
		[
			1,
			70,
			55
		],
		[
			1,
			70,
			44
		],
		[
			2,
			35,
			17
		],
		[
			2,
			35,
			13
		],
		[
			1,
			100,
			80
		],
		[
			2,
			50,
			32
		],
		[
			2,
			50,
			24
		],
		[
			4,
			25,
			9
		],
		[
			1,
			134,
			108
		],
		[
			2,
			67,
			43
		],
		[
			2,
			33,
			15,
			2,
			34,
			16
		],
		[
			2,
			33,
			11,
			2,
			34,
			12
		],
		[
			2,
			86,
			68
		],
		[
			4,
			43,
			27
		],
		[
			4,
			43,
			19
		],
		[
			4,
			43,
			15
		],
		[
			2,
			98,
			78
		],
		[
			4,
			49,
			31
		],
		[
			2,
			32,
			14,
			4,
			33,
			15
		],
		[
			4,
			39,
			13,
			1,
			40,
			14
		],
		[
			2,
			121,
			97
		],
		[
			2,
			60,
			38,
			2,
			61,
			39
		],
		[
			4,
			40,
			18,
			2,
			41,
			19
		],
		[
			4,
			40,
			14,
			2,
			41,
			15
		],
		[
			2,
			146,
			116
		],
		[
			3,
			58,
			36,
			2,
			59,
			37
		],
		[
			4,
			36,
			16,
			4,
			37,
			17
		],
		[
			4,
			36,
			12,
			4,
			37,
			13
		],
		[
			2,
			86,
			68,
			2,
			87,
			69
		],
		[
			4,
			69,
			43,
			1,
			70,
			44
		],
		[
			6,
			43,
			19,
			2,
			44,
			20
		],
		[
			6,
			43,
			15,
			2,
			44,
			16
		],
		[
			4,
			101,
			81
		],
		[
			1,
			80,
			50,
			4,
			81,
			51
		],
		[
			4,
			50,
			22,
			4,
			51,
			23
		],
		[
			3,
			36,
			12,
			8,
			37,
			13
		],
		[
			2,
			116,
			92,
			2,
			117,
			93
		],
		[
			6,
			58,
			36,
			2,
			59,
			37
		],
		[
			4,
			46,
			20,
			6,
			47,
			21
		],
		[
			7,
			42,
			14,
			4,
			43,
			15
		],
		[
			4,
			133,
			107
		],
		[
			8,
			59,
			37,
			1,
			60,
			38
		],
		[
			8,
			44,
			20,
			4,
			45,
			21
		],
		[
			12,
			33,
			11,
			4,
			34,
			12
		],
		[
			3,
			145,
			115,
			1,
			146,
			116
		],
		[
			4,
			64,
			40,
			5,
			65,
			41
		],
		[
			11,
			36,
			16,
			5,
			37,
			17
		],
		[
			11,
			36,
			12,
			5,
			37,
			13
		],
		[
			5,
			109,
			87,
			1,
			110,
			88
		],
		[
			5,
			65,
			41,
			5,
			66,
			42
		],
		[
			5,
			54,
			24,
			7,
			55,
			25
		],
		[
			11,
			36,
			12
		],
		[
			5,
			122,
			98,
			1,
			123,
			99
		],
		[
			7,
			73,
			45,
			3,
			74,
			46
		],
		[
			15,
			43,
			19,
			2,
			44,
			20
		],
		[
			3,
			45,
			15,
			13,
			46,
			16
		],
		[
			1,
			135,
			107,
			5,
			136,
			108
		],
		[
			10,
			74,
			46,
			1,
			75,
			47
		],
		[
			1,
			50,
			22,
			15,
			51,
			23
		],
		[
			2,
			42,
			14,
			17,
			43,
			15
		],
		[
			5,
			150,
			120,
			1,
			151,
			121
		],
		[
			9,
			69,
			43,
			4,
			70,
			44
		],
		[
			17,
			50,
			22,
			1,
			51,
			23
		],
		[
			2,
			42,
			14,
			19,
			43,
			15
		],
		[
			3,
			141,
			113,
			4,
			142,
			114
		],
		[
			3,
			70,
			44,
			11,
			71,
			45
		],
		[
			17,
			47,
			21,
			4,
			48,
			22
		],
		[
			9,
			39,
			13,
			16,
			40,
			14
		],
		[
			3,
			135,
			107,
			5,
			136,
			108
		],
		[
			3,
			67,
			41,
			13,
			68,
			42
		],
		[
			15,
			54,
			24,
			5,
			55,
			25
		],
		[
			15,
			43,
			15,
			10,
			44,
			16
		],
		[
			4,
			144,
			116,
			4,
			145,
			117
		],
		[
			17,
			68,
			42
		],
		[
			17,
			50,
			22,
			6,
			51,
			23
		],
		[
			19,
			46,
			16,
			6,
			47,
			17
		],
		[
			2,
			139,
			111,
			7,
			140,
			112
		],
		[
			17,
			74,
			46
		],
		[
			7,
			54,
			24,
			16,
			55,
			25
		],
		[
			34,
			37,
			13
		],
		[
			4,
			151,
			121,
			5,
			152,
			122
		],
		[
			4,
			75,
			47,
			14,
			76,
			48
		],
		[
			11,
			54,
			24,
			14,
			55,
			25
		],
		[
			16,
			45,
			15,
			14,
			46,
			16
		],
		[
			6,
			147,
			117,
			4,
			148,
			118
		],
		[
			6,
			73,
			45,
			14,
			74,
			46
		],
		[
			11,
			54,
			24,
			16,
			55,
			25
		],
		[
			30,
			46,
			16,
			2,
			47,
			17
		],
		[
			8,
			132,
			106,
			4,
			133,
			107
		],
		[
			8,
			75,
			47,
			13,
			76,
			48
		],
		[
			7,
			54,
			24,
			22,
			55,
			25
		],
		[
			22,
			45,
			15,
			13,
			46,
			16
		],
		[
			10,
			142,
			114,
			2,
			143,
			115
		],
		[
			19,
			74,
			46,
			4,
			75,
			47
		],
		[
			28,
			50,
			22,
			6,
			51,
			23
		],
		[
			33,
			46,
			16,
			4,
			47,
			17
		],
		[
			8,
			152,
			122,
			4,
			153,
			123
		],
		[
			22,
			73,
			45,
			3,
			74,
			46
		],
		[
			8,
			53,
			23,
			26,
			54,
			24
		],
		[
			12,
			45,
			15,
			28,
			46,
			16
		],
		[
			3,
			147,
			117,
			10,
			148,
			118
		],
		[
			3,
			73,
			45,
			23,
			74,
			46
		],
		[
			4,
			54,
			24,
			31,
			55,
			25
		],
		[
			11,
			45,
			15,
			31,
			46,
			16
		],
		[
			7,
			146,
			116,
			7,
			147,
			117
		],
		[
			21,
			73,
			45,
			7,
			74,
			46
		],
		[
			1,
			53,
			23,
			37,
			54,
			24
		],
		[
			19,
			45,
			15,
			26,
			46,
			16
		],
		[
			5,
			145,
			115,
			10,
			146,
			116
		],
		[
			19,
			75,
			47,
			10,
			76,
			48
		],
		[
			15,
			54,
			24,
			25,
			55,
			25
		],
		[
			23,
			45,
			15,
			25,
			46,
			16
		],
		[
			13,
			145,
			115,
			3,
			146,
			116
		],
		[
			2,
			74,
			46,
			29,
			75,
			47
		],
		[
			42,
			54,
			24,
			1,
			55,
			25
		],
		[
			23,
			45,
			15,
			28,
			46,
			16
		],
		[
			17,
			145,
			115
		],
		[
			10,
			74,
			46,
			23,
			75,
			47
		],
		[
			10,
			54,
			24,
			35,
			55,
			25
		],
		[
			19,
			45,
			15,
			35,
			46,
			16
		],
		[
			17,
			145,
			115,
			1,
			146,
			116
		],
		[
			14,
			74,
			46,
			21,
			75,
			47
		],
		[
			29,
			54,
			24,
			19,
			55,
			25
		],
		[
			11,
			45,
			15,
			46,
			46,
			16
		],
		[
			13,
			145,
			115,
			6,
			146,
			116
		],
		[
			14,
			74,
			46,
			23,
			75,
			47
		],
		[
			44,
			54,
			24,
			7,
			55,
			25
		],
		[
			59,
			46,
			16,
			1,
			47,
			17
		],
		[
			12,
			151,
			121,
			7,
			152,
			122
		],
		[
			12,
			75,
			47,
			26,
			76,
			48
		],
		[
			39,
			54,
			24,
			14,
			55,
			25
		],
		[
			22,
			45,
			15,
			41,
			46,
			16
		],
		[
			6,
			151,
			121,
			14,
			152,
			122
		],
		[
			6,
			75,
			47,
			34,
			76,
			48
		],
		[
			46,
			54,
			24,
			10,
			55,
			25
		],
		[
			2,
			45,
			15,
			64,
			46,
			16
		],
		[
			17,
			152,
			122,
			4,
			153,
			123
		],
		[
			29,
			74,
			46,
			14,
			75,
			47
		],
		[
			49,
			54,
			24,
			10,
			55,
			25
		],
		[
			24,
			45,
			15,
			46,
			46,
			16
		],
		[
			4,
			152,
			122,
			18,
			153,
			123
		],
		[
			13,
			74,
			46,
			32,
			75,
			47
		],
		[
			48,
			54,
			24,
			14,
			55,
			25
		],
		[
			42,
			45,
			15,
			32,
			46,
			16
		],
		[
			20,
			147,
			117,
			4,
			148,
			118
		],
		[
			40,
			75,
			47,
			7,
			76,
			48
		],
		[
			43,
			54,
			24,
			22,
			55,
			25
		],
		[
			10,
			45,
			15,
			67,
			46,
			16
		],
		[
			19,
			148,
			118,
			6,
			149,
			119
		],
		[
			18,
			75,
			47,
			31,
			76,
			48
		],
		[
			34,
			54,
			24,
			34,
			55,
			25
		],
		[
			20,
			45,
			15,
			61,
			46,
			16
		]
	];
	QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {
		var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
		if (rsBlock == undefined) throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
		var length = rsBlock.length / 3;
		var list = [];
		for (var i$1 = 0; i$1 < length; i$1++) {
			var count$1 = rsBlock[i$1 * 3 + 0];
			var totalCount = rsBlock[i$1 * 3 + 1];
			var dataCount = rsBlock[i$1 * 3 + 2];
			for (var j = 0; j < count$1; j++) list.push(new QRRSBlock(totalCount, dataCount));
		}
		return list;
	};
	QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectLevel) {
		switch (errorCorrectLevel) {
			case QRErrorCorrectLevel.L: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
			case QRErrorCorrectLevel.M: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
			case QRErrorCorrectLevel.Q: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
			case QRErrorCorrectLevel.H: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
			default: return undefined;
		}
	};
	function QRBitBuffer() {
		this.buffer = [];
		this.length = 0;
	}
	QRBitBuffer.prototype = {
		get: function(index) {
			var bufIndex = Math.floor(index / 8);
			return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) == 1;
		},
		put: function(num, length) {
			for (var i$1 = 0; i$1 < length; i$1++) this.putBit((num >>> length - i$1 - 1 & 1) == 1);
		},
		getLengthInBits: function() {
			return this.length;
		},
		putBit: function(bit) {
			var bufIndex = Math.floor(this.length / 8);
			if (this.buffer.length <= bufIndex) this.buffer.push(0);
			if (bit) this.buffer[bufIndex] |= 128 >>> this.length % 8;
			this.length++;
		}
	};
	var QRCodeLimitLength = [
		[
			17,
			14,
			11,
			7
		],
		[
			32,
			26,
			20,
			14
		],
		[
			53,
			42,
			32,
			24
		],
		[
			78,
			62,
			46,
			34
		],
		[
			106,
			84,
			60,
			44
		],
		[
			134,
			106,
			74,
			58
		],
		[
			154,
			122,
			86,
			64
		],
		[
			192,
			152,
			108,
			84
		],
		[
			230,
			180,
			130,
			98
		],
		[
			271,
			213,
			151,
			119
		],
		[
			321,
			251,
			177,
			137
		],
		[
			367,
			287,
			203,
			155
		],
		[
			425,
			331,
			241,
			177
		],
		[
			458,
			362,
			258,
			194
		],
		[
			520,
			412,
			292,
			220
		],
		[
			586,
			450,
			322,
			250
		],
		[
			644,
			504,
			364,
			280
		],
		[
			718,
			560,
			394,
			310
		],
		[
			792,
			624,
			442,
			338
		],
		[
			858,
			666,
			482,
			382
		],
		[
			929,
			711,
			509,
			403
		],
		[
			1003,
			779,
			565,
			439
		],
		[
			1091,
			857,
			611,
			461
		],
		[
			1171,
			911,
			661,
			511
		],
		[
			1273,
			997,
			715,
			535
		],
		[
			1367,
			1059,
			751,
			593
		],
		[
			1465,
			1125,
			805,
			625
		],
		[
			1528,
			1190,
			868,
			658
		],
		[
			1628,
			1264,
			908,
			698
		],
		[
			1732,
			1370,
			982,
			742
		],
		[
			1840,
			1452,
			1030,
			790
		],
		[
			1952,
			1538,
			1112,
			842
		],
		[
			2068,
			1628,
			1168,
			898
		],
		[
			2188,
			1722,
			1228,
			958
		],
		[
			2303,
			1809,
			1283,
			983
		],
		[
			2431,
			1911,
			1351,
			1051
		],
		[
			2563,
			1989,
			1423,
			1093
		],
		[
			2699,
			2099,
			1499,
			1139
		],
		[
			2809,
			2213,
			1579,
			1219
		],
		[
			2953,
			2331,
			1663,
			1273
		]
	];
	/** Constructor */
	function QRCode$1(options) {
		this.options = {
			padding: 4,
			width: 256,
			height: 256,
			typeNumber: 4,
			color: "#000000",
			background: "#ffffff",
			ecl: "M"
		};
		if (typeof options === "string") options = { content: options };
		if (options) for (var i$1 in options) this.options[i$1] = options[i$1];
		if (typeof this.options.content !== "string") throw new Error("Expected 'content' as string!");
		if (this.options.content.length === 0) throw new Error("Expected 'content' to be non-empty!");
		if (!(this.options.padding >= 0)) throw new Error("Expected 'padding' value to be non-negative!");
		if (!(this.options.width > 0) || !(this.options.height > 0)) throw new Error("Expected 'width' or 'height' value to be higher than zero!");
		function _getErrorCorrectLevel(ecl$1) {
			switch (ecl$1) {
				case "L": return QRErrorCorrectLevel.L;
				case "M": return QRErrorCorrectLevel.M;
				case "Q": return QRErrorCorrectLevel.Q;
				case "H": return QRErrorCorrectLevel.H;
				default: throw new Error("Unknwon error correction level: " + ecl$1);
			}
		}
		function _getTypeNumber(content$1, ecl$1) {
			var length = _getUTF8Length(content$1);
			var type$1 = 1;
			var limit = 0;
			for (var i$2 = 0, len = QRCodeLimitLength.length; i$2 <= len; i$2++) {
				var table = QRCodeLimitLength[i$2];
				if (!table) throw new Error("Content too long: expected " + limit + " but got " + length);
				switch (ecl$1) {
					case "L":
						limit = table[0];
						break;
					case "M":
						limit = table[1];
						break;
					case "Q":
						limit = table[2];
						break;
					case "H":
						limit = table[3];
						break;
					default: throw new Error("Unknwon error correction level: " + ecl$1);
				}
				if (length <= limit) break;
				type$1++;
			}
			if (type$1 > QRCodeLimitLength.length) throw new Error("Content too long");
			return type$1;
		}
		function _getUTF8Length(content$1) {
			var result = encodeURI(content$1).toString().replace(/\%[0-9a-fA-F]{2}/g, "a");
			return result.length + (result.length != content$1 ? 3 : 0);
		}
		var content = this.options.content;
		var type = _getTypeNumber(content, this.options.ecl);
		var ecl = _getErrorCorrectLevel(this.options.ecl);
		this.qrcode = new QRCodeModel(type, ecl);
		this.qrcode.addData(content);
		this.qrcode.make();
	}
	/** Generates QR Code as SVG image */
	QRCode$1.prototype.svg = function(opt) {
		var options = this.options || {};
		var modules = this.qrcode.modules;
		if (typeof opt == "undefined") opt = { container: options.container || "svg" };
		var pretty = typeof options.pretty != "undefined" ? !!options.pretty : true;
		var indent = pretty ? "  " : "";
		var EOL = pretty ? "\r\n" : "";
		var width = options.width;
		var height = options.height;
		var length = modules.length;
		var xsize = width / (length + 2 * options.padding);
		var ysize = height / (length + 2 * options.padding);
		var join = typeof options.join != "undefined" ? !!options.join : false;
		var swap = typeof options.swap != "undefined" ? !!options.swap : false;
		var xmlDeclaration = typeof options.xmlDeclaration != "undefined" ? !!options.xmlDeclaration : true;
		var predefined = typeof options.predefined != "undefined" ? !!options.predefined : false;
		var defs = predefined ? indent + "<defs><path id=\"qrmodule\" d=\"M0 0 h" + ysize + " v" + xsize + " H0 z\" style=\"fill:" + options.color + ";shape-rendering:crispEdges;\" /></defs>" + EOL : "";
		var bgrect = indent + "<rect x=\"0\" y=\"0\" width=\"" + width + "\" height=\"" + height + "\" style=\"fill:" + options.background + ";shape-rendering:crispEdges;\"/>" + EOL;
		var modrect = "";
		var pathdata = "";
		for (var y = 0; y < length; y++) for (var x = 0; x < length; x++) {
			var module$1 = modules[x][y];
			if (module$1) {
				var px$1 = x * xsize + options.padding * xsize;
				var py = y * ysize + options.padding * ysize;
				if (swap) {
					var t = px$1;
					px$1 = py;
					py = t;
				}
				if (join) {
					var w = xsize + px$1;
					var h = ysize + py;
					px$1 = Number.isInteger(px$1) ? Number(px$1) : px$1.toFixed(2);
					py = Number.isInteger(py) ? Number(py) : py.toFixed(2);
					w = Number.isInteger(w) ? Number(w) : w.toFixed(2);
					h = Number.isInteger(h) ? Number(h) : h.toFixed(2);
					pathdata += "M" + px$1 + "," + py + " V" + h + " H" + w + " V" + py + " H" + px$1 + " Z ";
				} else if (predefined) modrect += indent + "<use x=\"" + px$1.toString() + "\" y=\"" + py.toString() + "\" href=\"#qrmodule\" />" + EOL;
else modrect += indent + "<rect x=\"" + px$1.toString() + "\" y=\"" + py.toString() + "\" width=\"" + xsize + "\" height=\"" + ysize + "\" style=\"fill:" + options.color + ";shape-rendering:crispEdges;\"/>" + EOL;
			}
		}
		if (join) modrect = indent + "<path x=\"0\" y=\"0\" style=\"fill:" + options.color + ";shape-rendering:crispEdges;\" d=\"" + pathdata + "\" />";
		var svg = "";
		switch (opt.container) {
			case "svg":
				if (xmlDeclaration) svg += "<?xml version=\"1.0\" standalone=\"yes\"?>" + EOL;
				svg += "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"" + width + "\" height=\"" + height + "\">" + EOL;
				svg += defs + bgrect + modrect;
				svg += "</svg>";
				break;
			case "svg-viewbox":
				if (xmlDeclaration) svg += "<?xml version=\"1.0\" standalone=\"yes\"?>" + EOL;
				svg += "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 " + width + " " + height + "\">" + EOL;
				svg += defs + bgrect + modrect;
				svg += "</svg>";
				break;
			case "g":
				svg += "<g width=\"" + width + "\" height=\"" + height + "\">" + EOL;
				svg += defs + bgrect + modrect;
				svg += "</g>";
				break;
			default:
				svg += (defs + bgrect + modrect).replace(/^\s+/, "");
				break;
		}
		return svg;
	};
	/** Writes QR Code image to a file */
	QRCode$1.prototype.save = function(file, callback) {
		var data = this.svg();
		if (typeof callback != "function") callback = function(error, result) {};
		try {
			var fs = __require("fs");
			fs.writeFile(file, data, callback);
		} catch (e) {
			callback(e);
		}
	};
	if (typeof module != "undefined") module.exports = QRCode$1;
} });

//#endregion
//#region src/common/subscription/giftcards/GiftCardUtils.ts
var import_qrcode = __toESM(require_qrcode(), 1);
let GiftCardStatus = function(GiftCardStatus$1) {
	GiftCardStatus$1["Deactivated"] = "0";
	GiftCardStatus$1["Usable"] = "1";
	GiftCardStatus$1["Redeemed"] = "2";
	GiftCardStatus$1["Refunded"] = "3";
	GiftCardStatus$1["Disputed"] = "4";
	return GiftCardStatus$1;
}({});
async function getTokenFromUrl(url) {
	const token = url.substring(url.indexOf("#") + 1);
	try {
		if (!token) throw new Error();
		return await locator.giftCardFacade.decodeGiftCardToken(token);
	} catch (e) {
		throw new UserError("invalidGiftCard_msg");
	}
}
function loadGiftCards(customerId) {
	const entityClient = locator.entityClient;
	return entityClient.load(CustomerTypeRef, customerId).then((customer) => entityClient.load(CustomerInfoTypeRef, customer.customerInfo)).then((customerInfo) => {
		if (customerInfo.giftCards) return entityClient.loadAll(GiftCardTypeRef, customerInfo.giftCards.items);
else return Promise.resolve([]);
	});
}
async function generateGiftCardLink(giftCard) {
	const token = await locator.giftCardFacade.encodeGiftCardToken(giftCard);
	const giftCardBaseUrl = locator.domainConfigProvider().getCurrentDomainConfig().giftCardBaseUrl;
	const giftCardUrl = new URL(giftCardBaseUrl);
	giftCardUrl.hash = token;
	return giftCardUrl.href;
}
function showGiftCardToShare(giftCard) {
	generateGiftCardLink(giftCard).then((link) => {
		let infoMessage = "emptyString_msg";
		const dialog = Dialog.largeDialog({
			right: [{
				type: ButtonType.Secondary,
				label: "close_alt",
				click: () => dialog.close()
			}],
			middle: "giftCard_label"
		}, { view: () => [
			mithril_default(".flex-center.full-width.pt.pb", mithril_default(".pt-l", { style: { width: "480px" } }, renderGiftCardSvg(parseFloat(giftCard.value), link, giftCard.message))),
			mithril_default(".flex-center", [
				mithril_default(IconButton, {
					click: () => {
						dialog.close();
						setTimeout(() => import("./MailEditor2-chunk.js").then((editor) => editor.writeGiftCardMail(link)), DefaultAnimationTime);
					},
					title: "shareViaEmail_action",
					icon: BootIcons.Mail
				}),
				isAndroidApp() ? mithril_default(IconButton, {
					click: () => {
						locator.systemFacade.shareText(lang.get("nativeShareGiftCard_msg", { "{link}": link }), lang.get("nativeShareGiftCard_label"));
					},
					title: "share_action",
					icon: BootIcons.Share
				}) : mithril_default(IconButton, {
					click: () => {
						copyToClipboard(link).then(() => {
							infoMessage = "giftCardCopied_msg";
						}).catch(() => {
							infoMessage = "copyLinkError_msg";
						});
					},
					title: "copyToClipboard_action",
					icon: Icons.Clipboard
				}),
				!isApp() ? mithril_default(IconButton, {
					click: () => {
						infoMessage = "emptyString_msg";
						window.print();
					},
					title: "print_action",
					icon: Icons.Print
				}) : null
			]),
			mithril_default(".flex-center", mithril_default("small.noprint", lang.getTranslationText(infoMessage)))
		] }).addShortcut({
			key: Keys.ESC,
			exec: () => dialog.close(),
			help: "close_alt"
		}).show();
	});
}
const giftCardSVGGetter = new class GiftCardSVGGetter {
	static giftCardSvg = null;
	static giftCardNoQrSvg = null;
	getWithQr() {
		if (GiftCardSVGGetter.giftCardSvg == null) {
			GiftCardSVGGetter.downloadSVG("gift-card", (rawSVG) => {
				GiftCardSVGGetter.giftCardSvg = rawSVG;
				mithril_default.redraw();
			});
			return GiftCardSVGGetter.getPlaceHolder("<rect id='qr-code' width='80' height='80' x='0' y='70'></rect>");
		}
		return GiftCardSVGGetter.giftCardSvg;
	}
	getNoQr() {
		if (GiftCardSVGGetter.giftCardNoQrSvg == null) {
			GiftCardSVGGetter.downloadSVG("gift-card-no-qr", (rawSVG) => {
				GiftCardSVGGetter.giftCardNoQrSvg = rawSVG;
				mithril_default.redraw();
			});
			return GiftCardSVGGetter.getPlaceHolder();
		}
		return GiftCardSVGGetter.giftCardNoQrSvg;
	}
	static downloadSVG(fileName, onComplete) {
		fetch(`${window.tutao.appState.prefixWithoutFile}/images/${fileName}.svg`).then(async (res) => {
			onComplete(await res.text());
		}, () => {});
	}
	static getPlaceHolder(extraElements = "") {
		return `
			<svg width='480' height='600'>
				<text id='card-label' x='0' y='20'></text>
				<text id='message' x='0' y='40' fill='#fff'></text>
				<text id='price' x='0' y='60'></text>
				${extraElements}
			</svg>`;
	}
}();
function renderGiftCardSvg(price, link, message) {
	const svg = link == null ? giftCardSVGGetter.getNoQr() : giftCardSVGGetter.getWithQr();
	const svgDocument = new DOMParser().parseFromString(svg, "image/svg+xml");
	if (link != null) {
		const qrCodeElement = getGiftCardElement(svgDocument, "qr-code");
		const qrCodeWidth = getNumberAttribute(qrCodeElement, "width");
		const qrCodeHeight = getNumberAttribute(qrCodeElement, "height");
		const qrCodeXPosition = getNumberAttribute(qrCodeElement, "x");
		const qrCodeYPosition = getNumberAttribute(qrCodeElement, "y");
		qrCodeElement.outerHTML = renderQRCode(qrCodeXPosition, qrCodeYPosition, qrCodeWidth, qrCodeHeight, link);
	}
	const labelElement = getGiftCardElement(svgDocument, "card-label");
	labelElement.textContent = lang.get("giftCard_label").toUpperCase();
	const priceElement = getGiftCardElement(svgDocument, "price");
	priceElement.textContent = formatPrice(price, false).replace(/\s+/g, "") + "€";
	const messageElement = getGiftCardElement(svgDocument, "message");
	const messageColor = getAttribute(messageElement, "fill");
	messageElement.outerHTML = renderMessage(19, 61, 108, 70, messageColor, message);
	return mithril_default.trust(svgDocument.documentElement.outerHTML);
}
function getNumberAttribute(element, attributeName) {
	const raw = element.getAttribute(attributeName);
	if (raw == null) throw new Error(`Error while rendering gift card: missing attribute ${attributeName} from ${element.id}`);
	return Number(raw);
}
function getAttribute(element, attributeName) {
	const raw = element.getAttribute(attributeName);
	if (raw == null) throw new Error(`Error while rendering gift card: missing attribute ${attributeName} from ${element.id}`);
	return raw;
}
function getGiftCardElement(svgDocument, id) {
	const element = svgDocument.getElementById(id);
	if (element == null) throw new Error(`Error while rendering gift card: missing element ${id}`);
	return element;
}
/**
* Renders a text with word wrapping in an SVG element. (0,0) is the top left.
* @param x The position of the element on the X Axis.
* @param y The position of the element on the Y Axis.
* @param width The width of the text element.
* @param height The height of the text element.
* @param color The fill colour of the text element.
* @param message The text to be displayed in the element.
*/
function renderMessage(x, y, width, height, color, message) {
	const cleanMessage = htmlSanitizer.sanitizeHTML(urlEncodeHtmlTags(message)).html;
	const lineBreaks = cleanMessage.split(/\r\n|\r|\n/).length;
	const charLength = cleanMessage.length;
	const fontSizePx = lineBreaks > 4 || charLength > 80 ? "6px" : "7px";
	return `
		<foreignObject x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}">
			<p xmlns="http://www.w3.org/1999/xhtml"
			   class="text-preline text-break color-adjust-exact monospace"
			   style="font-size: ${fontSizePx}; color: ${color}; margin: auto 0 0 0">
				${cleanMessage}
			</p>
		</foreignObject>`;
}
/**
* Generates a black-on-white QR Code in SVG form
* @param x The position on the X Axis of the QR Code. 0 is the far left.
* @param y The position on the Y Axis of the QR Code. 0 is the top.
* @param link The link that the generated QR code will lead to when scanned
* @param height The height in pixels of the resulting QR code
* @param width The width in pixels of the resulting QR code
* @return the SVG element of the generated QR code as a `string`
*/
function renderQRCode(x, y, width, height, link) {
	const svg = new import_qrcode.default({
		height,
		width,
		content: link,
		background: "#ffffff",
		color: "#000000",
		xmlDeclaration: false,
		container: "none",
		padding: 0,
		join: true,
		pretty: false
	}).svg();
	const qrCode = htmlSanitizer.sanitizeSVG(svg).html;
	return `<svg x="${x}" y="${y}" width="${width}" height="${height}">${qrCode}</svg>`;
}
function renderAcceptGiftCardTermsCheckbox(checked, onChecked, classes) {
	return mithril_default(Checkbox, {
		checked,
		onChecked,
		class: classes,
		label: () => [lang.get("termsAndConditions_label"), mithril_default("div", renderTermsAndConditionsButton(TermsSection.GiftCards, CURRENT_GIFT_CARD_TERMS_VERSION))]
	});
}

//#endregion
//#region src/common/subscription/giftcards/GiftCardMessageEditorField.ts
const GIFT_CARD_MESSAGE_COLS = 26;
const GIFT_CARD_MESSAGE_HEIGHT = 5;
var GiftCardMessageEditorField = class {
	textAreaDom = null;
	isActive = false;
	view(vnode) {
		const a = vnode.attrs;
		return mithril_default("label.small.mt-form.i.flex-center.flex-column", [lang.get("yourMessage_label"), mithril_default("textarea.monospace.normal-font-size.overflow-hidden.resize-none" + (this.isActive ? ".editor-border-active" : ".editor-border"), {
			wrap: "hard",
			cols: a.cols || GIFT_CARD_MESSAGE_COLS,
			rows: a.rows || GIFT_CARD_MESSAGE_HEIGHT,
			oncreate: (vnode$1) => {
				this.textAreaDom = vnode$1.dom;
				this.textAreaDom.value = a.message;
			},
			onfocus: () => {
				this.isActive = true;
			},
			onblur: () => {
				this.isActive = false;
			},
			oninput: () => {
				const textAreaDom = assertNotNull(this.textAreaDom);
				const origStart = textAreaDom.selectionStart;
				const origEnd = textAreaDom.selectionEnd;
				while (textAreaDom.clientHeight < textAreaDom.scrollHeight) textAreaDom.value = textAreaDom.value.substring(0, textAreaDom.value.length - 1);
				a.onMessageChanged(textAreaDom.value);
				if (textAreaDom.selectionStart - origStart > 1) {
					textAreaDom.selectionStart = origStart;
					textAreaDom.selectionEnd = origEnd;
				}
			}
		})]);
	}
};

//#endregion
//#region src/common/subscription/giftcards/PurchaseGiftCardDialog.ts
var PurchaseGiftCardModel = class {
	message = lang.get("defaultGiftCardMessage_msg");
	confirmed = false;
	constructor(config) {
		this.config = config;
	}
	get availablePackages() {
		return this.config.availablePackages;
	}
	get purchaseLimit() {
		return this.config.purchaseLimit;
	}
	get purchasePeriodMonths() {
		return this.config.purchasePeriodMonths;
	}
	get selectedPackage() {
		return this.config.selectedPackage;
	}
	set selectedPackage(selection) {
		this.config.selectedPackage = selection;
	}
	get revolutionaryPrice() {
		return this.config.revolutionaryPrice;
	}
	async purchaseGiftCard() {
		if (!this.confirmed) throw new UserError("termsAcceptedNeutral_msg");
		return locator.giftCardFacade.generateGiftCard(this.message, this.availablePackages[this.selectedPackage].value).then((createdGiftCardId) => locator.entityClient.load(GiftCardTypeRef, createdGiftCardId)).catch((e) => this.handlePurchaseError(e));
	}
	handlePurchaseError(e) {
		if (e instanceof PreconditionFailedError) {
			const message = e.data;
			switch (message) {
				case "giftcard.limitreached": throw new UserError(lang.getTranslation("tooManyGiftCards_msg", {
					"{amount}": `${this.purchaseLimit}`,
					"{period}": `${this.purchasePeriodMonths} months`
				}));
				case "giftcard.noaccountinginfo": throw new UserError("providePaymentDetails_msg");
				case "giftcard.invalidpaymentmethod": throw new UserError("invalidGiftCardPaymentMethod_msg");
				default: throw new UserError(getPreconditionFailedPaymentMsg(e.data));
			}
		} else if (e instanceof BadGatewayError) throw new UserError("paymentProviderNotAvailableError_msg");
else throw e;
	}
};
var GiftCardPurchaseView = class {
	view(vnode) {
		const { model, onGiftCardPurchased } = vnode.attrs;
		return [mithril_default(".flex.center-horizontally.wrap.pt-ml", { style: { "column-gap": px(BOX_MARGIN) } }, model.availablePackages.map((option, index) => {
			const value = parseFloat(option.value);
			return mithril_default(BuyOptionBox, {
				heading: mithril_default(".flex-center", Array(Math.pow(2, index)).fill(mithril_default(Icon, {
					icon: Icons.Gift,
					size: IconSize.Medium
				}))),
				actionButton: () => mithril_default(LoginButton, {
					label: "pricing.select_action",
					onclick: () => {
						model.selectedPackage = index;
					}
				}),
				price: formatPrice(value, true),
				helpLabel: this.getGiftCardHelpText(model.revolutionaryPrice, value),
				width: 230,
				height: 250,
				selectedPaymentInterval: null,
				accountPaymentInterval: null,
				highlighted: model.selectedPackage === index,
				mobile: false,
				bonusMonths: 0
			});
		})), mithril_default(".flex-column.flex-center.center-h.width-min-content", [
			mithril_default(GiftCardMessageEditorField, {
				message: model.message,
				onMessageChanged: (message) => model.message = message
			}),
			renderAcceptGiftCardTermsCheckbox(model.confirmed, (checked) => model.confirmed = checked, "pt-l"),
			mithril_default(LoginButton, {
				label: "buy_action",
				class: "mt-l mb-l",
				onclick: () => this.onBuyButtonPressed(model, onGiftCardPurchased).catch(ofClass(UserError, showUserError))
			})
		])];
	}
	async onBuyButtonPressed(model, onPurchaseSuccess) {
		const giftCard = await showProgressDialog("loading_msg", model.purchaseGiftCard());
		onPurchaseSuccess(giftCard);
	}
	getGiftCardHelpText(upgradePrice, giftCardValue) {
		let helpTextId;
		if (giftCardValue < upgradePrice) helpTextId = "giftCardOptionTextC_msg";
else if (giftCardValue == upgradePrice) helpTextId = "giftCardOptionTextD_msg";
else helpTextId = "giftCardOptionTextE_msg";
		return lang.getTranslation(helpTextId, {
			"{remainingCredit}": formatPrice(giftCardValue - upgradePrice, true),
			"{fullCredit}": formatPrice(giftCardValue, true)
		});
	}
};
async function showPurchaseGiftCardDialog() {
	if (isIOSApp()) return Dialog.message("notAvailableInApp_msg");
	const model = await showProgressDialog("loading_msg", loadGiftCardModel()).catch(ofClass(UserError, (e) => {
		showUserError(e);
		return null;
	}));
	if (model == null) return;
	let dialog;
	const header = {
		left: [{
			label: "close_alt",
			type: ButtonType.Secondary,
			click: () => dialog.close()
		}],
		middle: "buyGiftCard_label"
	};
	const content = { view: () => mithril_default(GiftCardPurchaseView, {
		model,
		onGiftCardPurchased: (giftCard) => {
			dialog.close();
			showGiftCardToShare(giftCard);
		}
	}) };
	dialog = Dialog.largeDialog(header, content).addShortcut({
		key: Keys.ESC,
		exec: () => dialog.close(),
		help: "close_alt"
	});
	if (client.isMobileDevice()) dialog.setFocusOnLoadFunction(noOp);
	dialog.show();
}
async function loadGiftCardModel() {
	const accountingInfo = await locator.logins.getUserController().loadAccountingInfo();
	if (!accountingInfo || accountingInfo.paymentMethod === PaymentMethodType.Invoice || accountingInfo.paymentMethod === PaymentMethodType.AccountBalance) throw new UserError("invalidGiftCardPaymentMethod_msg");
	const [giftCardInfo, customerInfo] = await Promise.all([locator.serviceExecutor.get(GiftCardService, null), locator.logins.getUserController().loadCustomerInfo()]);
	const existingGiftCards = customerInfo.giftCards ? await locator.entityClient.loadAll(GiftCardTypeRef, customerInfo.giftCards.items) : [];
	const sixMonthsAgo = new Date();
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - parseInt(giftCardInfo.period));
	const numPurchasedGiftCards = count(existingGiftCards, (giftCard) => giftCard.orderDate > sixMonthsAgo);
	if (numPurchasedGiftCards >= parseInt(giftCardInfo.maxPerPeriod)) throw new UserError(lang.getTranslation("tooManyGiftCards_msg", {
		"{amount}": giftCardInfo.maxPerPeriod,
		"{period}": `${giftCardInfo.period} months`
	}));
	const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null);
	return new PurchaseGiftCardModel({
		purchaseLimit: filterInt(giftCardInfo.maxPerPeriod),
		purchasePeriodMonths: filterInt(giftCardInfo.period),
		availablePackages: giftCardInfo.options,
		selectedPackage: Math.floor(giftCardInfo.options.length / 2),
		revolutionaryPrice: priceDataProvider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Revolutionary, UpgradePriceType.PlanActualPrice)
	});
}

//#endregion
export { BOX_MARGIN, BuyOptionBox, BuyOptionDetails, CURRENT_GIFT_CARD_TERMS_VERSION, CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION, GiftCardMessageEditorField, GiftCardStatus, TermsSection, getActiveSubscriptionActionButtonReplacement, getTokenFromUrl, loadGiftCards, renderAcceptGiftCardTermsCheckbox, renderGiftCardSvg, renderTermsAndConditionsButton, require_qrcode, showGiftCardToShare, showPurchaseGiftCardDialog };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHVyY2hhc2VHaWZ0Q2FyZERpYWxvZy1jaHVuay5qcyIsIm5hbWVzIjpbInZub2RlOiBWbm9kZTxCdXlPcHRpb25EZXRhaWxzQXR0cj4iLCJvbGQ6IFZub2RlRE9NPEJ1eU9wdGlvbkRldGFpbHNBdHRyPiIsImZjOiBCdXlPcHRpb25EZXRhaWxzQXR0cltcImNhdGVnb3JpZXNcIl1bMF0iLCJyZW5kZXJDYXRlZ29yeVRpdGxlOiBib29sZWFuIiwidm5vZGU6IFZub2RlPEJ1eU9wdGlvbkJveEF0dHI+IiwicHJpY2U6IHN0cmluZyIsInN0cmlrZXRocm91Z2hQcmljZT86IHN0cmluZyIsImJvbnVzTW9udGhzOiBudW1iZXIiLCJ0ZXh0OiBzdHJpbmciLCJwYXltZW50SW50ZXJ2YWw6IFN0cmVhbTxQYXltZW50SW50ZXJ2YWw+IHwgbnVsbCIsInNob3VsZEFwcGx5Q3liZXJNb25kYXk6IGJvb2xlYW4iLCJ2OiBQYXltZW50SW50ZXJ2YWwiLCJoZWFkaW5nOiBzdHJpbmciLCJwYXRoOiBzdHJpbmciLCJkb21haW5Db25maWc6IERvbWFpbkNvbmZpZyIsInRlcm1zOiBUZXJtc1NlY3Rpb24iLCJ2ZXJzaW9uOiBzdHJpbmciLCJlOiBNb3VzZUV2ZW50Iiwic2VjdGlvbjogVGVybXNTZWN0aW9uIiwidmlzaWJsZUxhbmc6IFwiZW5cIiB8IFwiZGVcIiIsImRpYWxvZzogRGlhbG9nIiwic2FuaXRpemVkVGVybXM6IHN0cmluZyIsImhlYWRlckJhckF0dHJzOiBEaWFsb2dIZWFkZXJCYXJBdHRycyIsImkiLCJjb3VudCIsIlFSQ29kZSIsImVjbCIsImNvbnRlbnQiLCJ0eXBlIiwibW9kdWxlIiwicHgiLCJ1cmw6IHN0cmluZyIsImN1c3RvbWVySWQ6IElkIiwiY3VzdG9tZXJJbmZvOiBDdXN0b21lckluZm8iLCJnaWZ0Q2FyZDogR2lmdENhcmQiLCJpbmZvTWVzc2FnZTogTWF5YmVUcmFuc2xhdGlvbiIsImRpYWxvZzogRGlhbG9nIiwiZmlsZU5hbWU6IHN0cmluZyIsIm9uQ29tcGxldGU6IChyYXdTVkc6IHN0cmluZykgPT4gdm9pZCIsImV4dHJhRWxlbWVudHM6IHN0cmluZyIsInByaWNlOiBudW1iZXIiLCJsaW5rOiBzdHJpbmcgfCBudWxsIiwibWVzc2FnZTogc3RyaW5nIiwic3ZnRG9jdW1lbnQ6IERvY3VtZW50IiwiZWxlbWVudDogRWxlbWVudCIsImF0dHJpYnV0ZU5hbWU6IHN0cmluZyIsImlkOiBcInByaWNlXCIgfCBcInFyLWNvZGVcIiB8IFwibWVzc2FnZVwiIHwgXCJjYXJkLWxhYmVsXCIiLCJ4OiBudW1iZXIiLCJ5OiBudW1iZXIiLCJ3aWR0aDogbnVtYmVyIiwiaGVpZ2h0OiBudW1iZXIiLCJjb2xvcjogc3RyaW5nIiwiY2xlYW5NZXNzYWdlOiBzdHJpbmciLCJsaW5rOiBzdHJpbmciLCJRUkNvZGUiLCJjaGVja2VkOiBib29sZWFuIiwib25DaGVja2VkOiAoY2hlY2tlZDogYm9vbGVhbikgPT4gdm9pZCIsImNsYXNzZXM/OiBzdHJpbmciLCJ2bm9kZTogVm5vZGU8R2lmdENhcmRNZXNzYWdlRWRpdG9yRmllbGRBdHRycz4iLCJ2bm9kZSIsImNvbmZpZzoge1xuXHRcdFx0cHVyY2hhc2VMaW1pdDogbnVtYmVyXG5cdFx0XHRwdXJjaGFzZVBlcmlvZE1vbnRoczogbnVtYmVyXG5cdFx0XHRhdmFpbGFibGVQYWNrYWdlczogQXJyYXk8R2lmdENhcmRPcHRpb24+XG5cdFx0XHRzZWxlY3RlZFBhY2thZ2U6IG51bWJlclxuXHRcdFx0cmV2b2x1dGlvbmFyeVByaWNlOiBudW1iZXJcblx0XHR9Iiwic2VsZWN0aW9uOiBudW1iZXIiLCJlOiBFcnJvciIsInZub2RlOiBWbm9kZTxHaWZ0Q2FyZFB1cmNoYXNlVmlld0F0dHJzPiIsIm1vZGVsOiBQdXJjaGFzZUdpZnRDYXJkTW9kZWwiLCJvblB1cmNoYXNlU3VjY2VzczogKGdpZnRDYXJkOiBHaWZ0Q2FyZCkgPT4gdm9pZCIsInVwZ3JhZGVQcmljZTogbnVtYmVyIiwiZ2lmdENhcmRWYWx1ZTogbnVtYmVyIiwiaGVscFRleHRJZDogVHJhbnNsYXRpb25LZXlUeXBlIiwiZGlhbG9nOiBEaWFsb2ciLCJoZWFkZXI6IERpYWxvZ0hlYWRlckJhckF0dHJzIl0sInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1vbi9zdWJzY3JpcHRpb24vQnV5T3B0aW9uQm94LnRzIiwiLi4vc3JjL2NvbW1vbi9taXNjL1dlYnNpdGUudHMiLCIuLi9zcmMvY29tbW9uL3N1YnNjcmlwdGlvbi9UZXJtc0FuZENvbmRpdGlvbnMudHMiLCIuLi9saWJzL3FyY29kZS5qcyIsIi4uL3NyYy9jb21tb24vc3Vic2NyaXB0aW9uL2dpZnRjYXJkcy9HaWZ0Q2FyZFV0aWxzLnRzIiwiLi4vc3JjL2NvbW1vbi9zdWJzY3JpcHRpb24vZ2lmdGNhcmRzL0dpZnRDYXJkTWVzc2FnZUVkaXRvckZpZWxkLnRzIiwiLi4vc3JjL2NvbW1vbi9zdWJzY3JpcHRpb24vZ2lmdGNhcmRzL1B1cmNoYXNlR2lmdENhcmREaWFsb2cudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG0sIHsgQ2hpbGQsIENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlLCBWbm9kZURPTSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IHB4LCBzaXplIH0gZnJvbSBcIi4uL2d1aS9zaXplXCJcbmltcG9ydCB0eXBlIHsgVHJhbnNsYXRpb25LZXksIE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHR5cGUgeyBsYXp5IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBJY29uIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0ljb25cIlxuaW1wb3J0IHsgU2VnbWVudENvbnRyb2wgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvU2VnbWVudENvbnRyb2xcIlxuaW1wb3J0IHsgQXZhaWxhYmxlUGxhblR5cGUsIENvbnN0LCBQbGFuVHlwZSB9IGZyb20gXCIuLi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IFBheW1lbnRJbnRlcnZhbCB9IGZyb20gXCIuL1ByaWNlVXRpbHNcIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvaWNvbnMvSWNvbnNcIlxuaW1wb3J0IHsgQm9vdEljb25zIH0gZnJvbSBcIi4uL2d1aS9iYXNlL2ljb25zL0Jvb3RJY29uc1wiXG5pbXBvcnQgeyBJbmZvSWNvbiB9IGZyb20gXCIuLi9ndWkvYmFzZS9JbmZvSWNvbi5qc1wiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi9ndWkvdGhlbWUuanNcIlxuaW1wb3J0IHsgaXNSZWZlcmVuY2VEYXRlV2l0aGluQ3liZXJNb25kYXlDYW1wYWlnbiB9IGZyb20gXCIuLi9taXNjL0N5YmVyTW9uZGF5VXRpbHMuanNcIlxuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSBcIi4uL21pc2MvQ2xpZW50RGV0ZWN0b3JcIlxuaW1wb3J0IHsgaXNJT1NBcHAgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9FbnZcIlxuXG5leHBvcnQgdHlwZSBCdXlPcHRpb25Cb3hBdHRyID0ge1xuXHRoZWFkaW5nOiBzdHJpbmcgfCBDaGlsZHJlblxuXHQvLyBsYXp5PEJ1dHRvbkF0dHJzPiBiZWNhdXNlIHlvdSBjYW4ndCBkbyBhY3Rpb25CdXR0b24gaW5zdGFuY2VvZiBCdXR0b25BdHRycyBzaW5jZSBCdXR0b25BdHRycyBkb2Vzbid0IGV4aXN0IGluIHRoZSBqYXZhc2NyaXB0IHNpZGVcblx0Ly8gdGhlcmUgaXMgYSBzdHJhbmdlIGludGVyYWN0aW9uIGJldHdlZW4gdGhlIEhUTUxFZGl0b3IgaW4gSFRNTCBtb2RlIGFuZCB0aGUgQnV0dG9uTiB3aGVuIHlvdSBwYXNzIHRoZSBCdXR0b25OIGluIHZpYSBhIGNvbXBvbmVudFxuXHQvLyB0aGF0IGRvZXNuJ3Qgb2NjdXIgd2hlbiB5b3UgcGFzcyBpbiB0aGUgYXR0cnNcblx0YWN0aW9uQnV0dG9uPzogbGF6eTxDaGlsZHJlbj5cblx0cHJpY2U6IHN0cmluZ1xuXHQvKipcblx0ICogTnVsbCB3aGVuIHdlIGRvIG5vdCB3YW50IHRvIHNob3cgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBhY3R1YWwgcHJpY2UgYW5kIHJlZmVyZW5jZSBwcmljZS5cblx0ICovXG5cdHJlZmVyZW5jZVByaWNlPzogc3RyaW5nXG5cdHByaWNlSGludD86IE1heWJlVHJhbnNsYXRpb25cblx0aGVscExhYmVsOiBNYXliZVRyYW5zbGF0aW9uXG5cdHdpZHRoOiBudW1iZXJcblx0aGVpZ2h0OiBudW1iZXJcblx0LyoqXG5cdCAqIGNhbiBiZSBudWxsIGlmIHRoZSBzdWJzY3JpcHRpb24gaXMgZnJlZSwgb3IgaXQncyBub3QgYW4gaW5pdGlhbCB1cGdyYWRlIGJveFxuXHQgKi9cblx0c2VsZWN0ZWRQYXltZW50SW50ZXJ2YWw6IFN0cmVhbTxQYXltZW50SW50ZXJ2YWw+IHwgbnVsbFxuXHRhY2NvdW50UGF5bWVudEludGVydmFsOiBQYXltZW50SW50ZXJ2YWwgfCBudWxsXG5cdGhpZ2hsaWdodGVkPzogYm9vbGVhblxuXHRtb2JpbGU6IGJvb2xlYW5cblx0Ym9udXNNb250aHM6IG51bWJlclxuXHQvKipcblx0ICogTnVsbGFibGUgYmVjYXVzZSBvZiB0aGUgZ2lmdCBjYXJkIGNvbXBvbmVudCBjb21wYXRpYmlsaXR5XG5cdCAqL1xuXHR0YXJnZXRTdWJzY3JpcHRpb24/OiBBdmFpbGFibGVQbGFuVHlwZVxufVxuXG5leHBvcnQgdHlwZSBCdXlPcHRpb25EZXRhaWxzQXR0ciA9IHtcblx0Y2F0ZWdvcmllczogQXJyYXk8e1xuXHRcdHRpdGxlOiBzdHJpbmcgfCBudWxsXG5cdFx0a2V5OiBzdHJpbmdcblx0XHRmZWF0dXJlQ291bnQ6IHsgbWF4OiBudW1iZXIgfVxuXHRcdGZlYXR1cmVzOiBBcnJheTx7IHRleHQ6IHN0cmluZzsgdG9vbFRpcD86IENoaWxkOyBrZXk6IHN0cmluZzsgYW50aUZlYXR1cmU/OiBib29sZWFuOyBvbWl0OiBib29sZWFuOyBoZWFydDogYm9vbGVhbiB9PlxuXHR9PlxuXHRmZWF0dXJlc0V4cGFuZGVkPzogYm9vbGVhblxuXHRyZW5kZXJDYXRlZ29yeVRpdGxlOiBib29sZWFuXG5cdGljb25TdHlsZT86IFJlY29yZDxzdHJpbmcsIGFueT5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZVN1YnNjcmlwdGlvbkFjdGlvbkJ1dHRvblJlcGxhY2VtZW50KCk6ICgpID0+IENoaWxkcmVuIHtcblx0cmV0dXJuICgpID0+XG5cdFx0bShcblx0XHRcdFwiLmJ1eU9wdGlvbkJveC5jb250ZW50LWFjY2VudC1mZy5jZW50ZXItdmVydGljYWxseS50ZXh0LWNlbnRlclwiLFxuXHRcdFx0e1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBweChzaXplLmJvcmRlcl9yYWRpdXNfc21hbGwpLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdGxhbmcuZ2V0KFwicHJpY2luZy5jdXJyZW50UGxhbl9sYWJlbFwiKSxcblx0XHQpXG59XG5cbmV4cG9ydCBjb25zdCBCT1hfTUFSR0lOID0gMTBcblxuZXhwb3J0IGNsYXNzIEJ1eU9wdGlvbkRldGFpbHMgaW1wbGVtZW50cyBDb21wb25lbnQ8QnV5T3B0aW9uRGV0YWlsc0F0dHI+IHtcblx0cHJpdmF0ZSBmZWF0dXJlc0V4cGFuZGVkOiBib29sZWFuID0gZmFsc2Vcblx0cHJpdmF0ZSBmZWF0dXJlTGlzdEl0ZW1TZWxlY3Rvcjogc3RyaW5nID0gXCIuZmxleFwiXG5cblx0b25iZWZvcmV1cGRhdGUodm5vZGU6IFZub2RlPEJ1eU9wdGlvbkRldGFpbHNBdHRyPiwgb2xkOiBWbm9kZURPTTxCdXlPcHRpb25EZXRhaWxzQXR0cj4pIHtcblx0XHQvLyB0aGUgZXhwYW5kIGNzcyBjbGFzcyByZW5kZXJzIGFuIGFuaW1hdGlvbiB3aGljaCBpcyB1c2VkIHdoZW4gdGhlIGZlYXR1cmUgbGlzdCBpcyBleHBhbmRlZFxuXHRcdC8vIHRoZSBhbmltYXRpb24gc2hvdWxkIG9ubHkgYmUgc2hvd24gd2hlbiB0aGUgdXNlciBjbGlja2VkIG9uIHRoZSBmZWF0dXJlIGV4cGFuc2lvbiBidXR0b24gd2hpY2ggY2hhbmdlcyB0aGUgZXhwYW5kZWQgc3RhdGVcblx0XHQvLyB0aHVzIHRvIGNoZWNrIHdoZXRoZXIgdGhlIGJ1dHRvbiB3YXMgcHJlc3NlZCwgdGhlIEJ1eU9wdGlvbkJveCBiZWZvcmUgdXBkYXRlIG11c3Qgbm90IGJlIGV4cGFuZGVkIGJ1dCB0aGUgQnV5T3B0aW9uQm94IGFmdGVyIHVwZGF0ZSBpc1xuXHRcdC8vIG90aGVyd2lzZSBtaXRocmlsIHNvbWV0aW1lcyB1cGRhdGVzIHRoZSB2aWV3IGFuZCByZW5kZXJzIHRoZSBhbmltYXRpb24gZXZlbiB0aG91Z2ggbm90aGluZyBjaGFuZ2VkXG5cdFx0aWYgKHZub2RlLmF0dHJzLmZlYXR1cmVzRXhwYW5kZWQgJiYgIW9sZC5hdHRycy5mZWF0dXJlc0V4cGFuZGVkKSB7XG5cdFx0XHR0aGlzLmZlYXR1cmVMaXN0SXRlbVNlbGVjdG9yID0gXCIuZmxleC5leHBhbmRcIlxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmZlYXR1cmVMaXN0SXRlbVNlbGVjdG9yID0gXCIuZmxleFwiXG5cdFx0fVxuXHR9XG5cblx0dmlldyh2bm9kZTogVm5vZGU8QnV5T3B0aW9uRGV0YWlsc0F0dHI+KSB7XG5cdFx0Y29uc3QgeyBhdHRycyB9ID0gdm5vZGVcblx0XHR0aGlzLmZlYXR1cmVzRXhwYW5kZWQgPSBhdHRycy5mZWF0dXJlc0V4cGFuZGVkIHx8IGZhbHNlXG5cblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLm10LnBsXCIsXG5cdFx0XHRhdHRycy5jYXRlZ29yaWVzLm1hcCgoZmMpID0+IHtcblx0XHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0XHR0aGlzLnJlbmRlckNhdGVnb3J5VGl0bGUoZmMsIGF0dHJzLnJlbmRlckNhdGVnb3J5VGl0bGUpLFxuXHRcdFx0XHRcdGZjLmZlYXR1cmVzXG5cdFx0XHRcdFx0XHQuZmlsdGVyKChmKSA9PiAhZi5vbWl0IHx8IHRoaXMuZmVhdHVyZXNFeHBhbmRlZClcblx0XHRcdFx0XHRcdC5tYXAoKGYpID0+XG5cdFx0XHRcdFx0XHRcdG0odGhpcy5mZWF0dXJlTGlzdEl0ZW1TZWxlY3RvciwgeyBrZXk6IGYua2V5IH0sIFtcblx0XHRcdFx0XHRcdFx0XHRmLmhlYXJ0XG5cdFx0XHRcdFx0XHRcdFx0XHQ/IG0oSWNvbiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGljb246IEJvb3RJY29ucy5IZWFydCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzdHlsZTogYXR0cnMuaWNvblN0eWxlLFxuXHRcdFx0XHRcdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdFx0XHRcdFx0OiBtKEljb24sIHsgaWNvbjogZi5hbnRpRmVhdHVyZSA/IEljb25zLkNhbmNlbCA6IEljb25zLkNoZWNrbWFyaywgc3R5bGU6IGF0dHJzLmljb25TdHlsZSB9KSxcblx0XHRcdFx0XHRcdFx0XHRtKFwiLnNtYWxsLnRleHQtbGVmdC5hbGlnbi1zZWxmLWNlbnRlci5wbC1zLmJ1dHRvbi1oZWlnaHQuZmxleC1ncm93Lm1pbi13aWR0aC0wLmJyZWFrLXdvcmRcIiwgW20oXCJzcGFuXCIsIGYudGV4dCldKSxcblx0XHRcdFx0XHRcdFx0XHRmLnRvb2xUaXAgPyBtKEluZm9JY29uLCB7IHRleHQ6IGYudG9vbFRpcCB9KSA6IG51bGwsXG5cdFx0XHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHR0aGlzLnJlbmRlclBsYWNlaG9sZGVycyhmYyksXG5cdFx0XHRcdF1cblx0XHRcdH0pLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQ2F0ZWdvcnlUaXRsZShmYzogQnV5T3B0aW9uRGV0YWlsc0F0dHJbXCJjYXRlZ29yaWVzXCJdWzBdLCByZW5kZXJDYXRlZ29yeVRpdGxlOiBib29sZWFuKTogQ2hpbGRyZW4ge1xuXHRcdGlmIChmYy50aXRsZSAmJiB0aGlzLmZlYXR1cmVzRXhwYW5kZWQpIHtcblx0XHRcdHJldHVybiBbXG5cdFx0XHRcdG0oXCIuYi50ZXh0LWxlZnQuYWxpZ24tc2VsZi1jZW50ZXIucGwtcy5idXR0b24taGVpZ2h0LmZsZXgtZ3Jvdy5taW4td2lkdGgtMC5icmVhay13b3JkXCIsIFwiXCIpLFxuXHRcdFx0XHRtKFwiLmIudGV4dC1sZWZ0LmFsaWduLXNlbGYtY2VudGVyLnBsLXMuYnV0dG9uLWhlaWdodC5mbGV4LWdyb3cubWluLXdpZHRoLTAuYnJlYWstd29yZFwiLCByZW5kZXJDYXRlZ29yeVRpdGxlID8gZmMudGl0bGUgOiBcIlwiKSxcblx0XHRcdF1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFtdXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJQbGFjZWhvbGRlcnMoZmM6IEJ1eU9wdGlvbkRldGFpbHNBdHRyW1wiY2F0ZWdvcmllc1wiXVswXSk6IENoaWxkcmVuIHtcblx0XHRpZiAoIXRoaXMuZmVhdHVyZXNFeHBhbmRlZCkge1xuXHRcdFx0cmV0dXJuIFtdXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IHBsYWNlaG9sZGVyQ291bnQgPSBmYy5mZWF0dXJlQ291bnQubWF4IC0gZmMuZmVhdHVyZXMubGVuZ3RoXG5cdFx0XHRyZXR1cm4gWy4uLkFycmF5KHBsYWNlaG9sZGVyQ291bnQpXS5tYXAoKCkgPT4gbShcIi5idXR0b24taGVpZ2h0XCIsIFwiXCIpKVxuXHRcdH1cblx0fVxufVxuXG5leHBvcnQgY2xhc3MgQnV5T3B0aW9uQm94IGltcGxlbWVudHMgQ29tcG9uZW50PEJ1eU9wdGlvbkJveEF0dHI+IHtcblx0dmlldyh2bm9kZTogVm5vZGU8QnV5T3B0aW9uQm94QXR0cj4pIHtcblx0XHRjb25zdCB7IGF0dHJzIH0gPSB2bm9kZVxuXG5cdFx0Y29uc3QgaXNDeWJlck1vbmRheSA9IGlzUmVmZXJlbmNlRGF0ZVdpdGhpbkN5YmVyTW9uZGF5Q2FtcGFpZ24oQ29uc3QuQ1VSUkVOVF9EQVRFID8/IG5ldyBEYXRlKCkpXG5cdFx0Y29uc3QgaXNMZWdlbmRQbGFuID0gYXR0cnMudGFyZ2V0U3Vic2NyaXB0aW9uID09PSBQbGFuVHlwZS5MZWdlbmRcblx0XHRjb25zdCBpc1llYXJseSA9IChhdHRycy5zZWxlY3RlZFBheW1lbnRJbnRlcnZhbCA9PSBudWxsID8gYXR0cnMuYWNjb3VudFBheW1lbnRJbnRlcnZhbCA6IGF0dHJzLnNlbGVjdGVkUGF5bWVudEludGVydmFsKCkpID09PSBQYXltZW50SW50ZXJ2YWwuWWVhcmx5XG5cdFx0Y29uc3Qgc2hvdWxkQXBwbHlDeWJlck1vbmRheURlc2lnbiA9IGlzTGVnZW5kUGxhbiAmJiBpc0N5YmVyTW9uZGF5ICYmIGlzWWVhcmx5XG5cblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmZnLWJsYWNrXCIsXG5cdFx0XHR7XG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0d2lkdGg6IHB4KGF0dHJzLndpZHRoKSxcblx0XHRcdFx0XHRwYWRkaW5nOiBcIjEwcHhcIixcblx0XHRcdFx0XHRoZWlnaHQ6IFwiMTAwJVwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdFtcblx0XHRcdFx0bShcblx0XHRcdFx0XHRcIi5idXlPcHRpb25Cb3hcIiArIChhdHRycy5oaWdobGlnaHRlZCA/IChzaG91bGRBcHBseUN5YmVyTW9uZGF5RGVzaWduID8gXCIuaGlnaGxpZ2h0ZWQuY3liZXJNb25kYXlcIiA6IFwiLmhpZ2hsaWdodGVkXCIpIDogXCJcIiksXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0ZGlzcGxheTogXCJmbGV4XCIsXG5cdFx0XHRcdFx0XHRcdFwiZmxleC1kaXJlY3Rpb25cIjogXCJjb2x1bW5cIixcblx0XHRcdFx0XHRcdFx0XCJtaW4taGVpZ2h0XCI6IHB4KGF0dHJzLmhlaWdodCksXG5cdFx0XHRcdFx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBcIjNweFwiLFxuXHRcdFx0XHRcdFx0XHRoZWlnaHQ6IFwiMTAwJVwiLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFtcblx0XHRcdFx0XHRcdHNob3VsZEFwcGx5Q3liZXJNb25kYXlEZXNpZ24gPyB0aGlzLnJlbmRlckN5YmVyTW9uZGF5UmliYm9uKCkgOiB0aGlzLnJlbmRlckJvbnVzTW9udGhzUmliYm9uKGF0dHJzLmJvbnVzTW9udGhzKSxcblx0XHRcdFx0XHRcdHR5cGVvZiBhdHRycy5oZWFkaW5nID09PSBcInN0cmluZ1wiID8gdGhpcy5yZW5kZXJIZWFkaW5nKGF0dHJzLmhlYWRpbmcpIDogYXR0cnMuaGVhZGluZyxcblx0XHRcdFx0XHRcdHRoaXMucmVuZGVyUHJpY2UoYXR0cnMucHJpY2UsIGlzWWVhcmx5ID8gYXR0cnMucmVmZXJlbmNlUHJpY2UgOiB1bmRlZmluZWQpLFxuXHRcdFx0XHRcdFx0bShcIi5zbWFsbC50ZXh0LWNlbnRlclwiLCBhdHRycy5wcmljZUhpbnQgPyBsYW5nLmdldFRyYW5zbGF0aW9uVGV4dChhdHRycy5wcmljZUhpbnQpIDogbGFuZy5nZXQoXCJlbXB0eVN0cmluZ19tc2dcIikpLFxuXHRcdFx0XHRcdFx0bShcIi5zbWFsbC50ZXh0LWNlbnRlci5wYi1tbFwiLCBsYW5nLmdldFRyYW5zbGF0aW9uVGV4dChhdHRycy5oZWxwTGFiZWwpKSxcblx0XHRcdFx0XHRcdHRoaXMucmVuZGVyUGF5bWVudEludGVydmFsQ29udHJvbChhdHRycy5zZWxlY3RlZFBheW1lbnRJbnRlcnZhbCwgc2hvdWxkQXBwbHlDeWJlck1vbmRheURlc2lnbiksXG5cdFx0XHRcdFx0XHRhdHRycy5hY3Rpb25CdXR0b25cblx0XHRcdFx0XHRcdFx0PyBtKFxuXHRcdFx0XHRcdFx0XHRcdFx0XCIuYnV0dG9uLW1pbi1oZWlnaHRcIixcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcIm1hcmdpbi10b3BcIjogXCJhdXRvXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0YXR0cnMuYWN0aW9uQnV0dG9uKCksXG5cdFx0XHRcdFx0XHRcdCAgKVxuXHRcdFx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0KSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJQcmljZShwcmljZTogc3RyaW5nLCBzdHJpa2V0aHJvdWdoUHJpY2U/OiBzdHJpbmcpIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLnB0LW1sLnRleHQtY2VudGVyXCIsXG5cdFx0XHR7IHN0eWxlOiB7IGRpc3BsYXk6IFwiZ3JpZFwiLCBcImdyaWQtdGVtcGxhdGUtY29sdW1uc1wiOiBcIjFmciBhdXRvIDFmclwiLCBcImFsaWduLWl0ZW1zXCI6IFwiY2VudGVyXCIgfSB9LFxuXHRcdFx0c3RyaWtldGhyb3VnaFByaWNlICE9IG51bGwgJiYgc3RyaWtldGhyb3VnaFByaWNlLnRyaW0oKSAhPT0gXCJcIlxuXHRcdFx0XHQ/IG0oXG5cdFx0XHRcdFx0XHRcIi5zcGFuLnN0cmlrZVwiLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X2J1dHRvbixcblx0XHRcdFx0XHRcdFx0XHRmb250U2l6ZTogcHgoc2l6ZS5mb250X3NpemVfYmFzZSksXG5cdFx0XHRcdFx0XHRcdFx0anVzdGlmeVNlbGY6IFwiZW5kXCIsXG5cdFx0XHRcdFx0XHRcdFx0bWFyZ2luOiBcImF1dG8gMC40ZW0gMCAwXCIsXG5cdFx0XHRcdFx0XHRcdFx0cGFkZGluZzogXCIwLjRlbSAwXCIsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0c3RyaWtldGhyb3VnaFByaWNlLFxuXHRcdFx0XHQgIClcblx0XHRcdFx0OiBtKFwiXCIpLFxuXHRcdFx0bShcIi5oMVwiLCBwcmljZSksXG5cdFx0XHRtKFwiXCIpLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQm9udXNNb250aHNSaWJib24oYm9udXNNb250aHM6IG51bWJlcik6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gYm9udXNNb250aHMgPiAwID8gdGhpcy5yZW5kZXJSaWJib24oYCske2JvbnVzTW9udGhzfSAke2xhbmcuZ2V0KFwicHJpY2luZy5tb250aHNfbGFiZWxcIil9YCkgOiBudWxsXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclJpYmJvbih0ZXh0OiBzdHJpbmcpIHtcblx0XHRyZXR1cm4gbShcIi5yaWJib24taG9yaXpvbnRhbFwiLCBtKFwiLnRleHQtY2VudGVyLmJcIiwgeyBzdHlsZTogeyBwYWRkaW5nOiBweCgzKSB9IH0sIHRleHQpKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJDeWJlck1vbmRheVJpYmJvbigpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgdGV4dCA9IGlzSU9TQXBwKCkgPyBcIkRFQUxcIiA6IGxhbmcuZ2V0KFwicHJpY2luZy5jeWJlck1vbmRheV9sYWJlbFwiKVxuXHRcdHJldHVybiBtKFwiLnJpYmJvbi1ob3Jpem9udGFsLnJpYmJvbi1ob3Jpem9udGFsLWN5YmVyLW1vbmRheVwiLCBtKFwiLnRleHQtY2VudGVyLmJcIiwgeyBzdHlsZTogeyBwYWRkaW5nOiBweCgzKSB9IH0sIHRleHQpKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJQYXltZW50SW50ZXJ2YWxDb250cm9sKHBheW1lbnRJbnRlcnZhbDogU3RyZWFtPFBheW1lbnRJbnRlcnZhbD4gfCBudWxsLCBzaG91bGRBcHBseUN5YmVyTW9uZGF5OiBib29sZWFuKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHBheW1lbnRJbnRlcnZhbEl0ZW1zID0gW1xuXHRcdFx0eyBuYW1lOiBsYW5nLmdldChcInByaWNpbmcueWVhcmx5X2xhYmVsXCIpLCB2YWx1ZTogUGF5bWVudEludGVydmFsLlllYXJseSB9LFxuXHRcdFx0eyBuYW1lOiBsYW5nLmdldChcInByaWNpbmcubW9udGhseV9sYWJlbFwiKSwgdmFsdWU6IFBheW1lbnRJbnRlcnZhbC5Nb250aGx5IH0sXG5cdFx0XVxuXHRcdHJldHVybiBwYXltZW50SW50ZXJ2YWxcblx0XHRcdD8gbShTZWdtZW50Q29udHJvbCwge1xuXHRcdFx0XHRcdHNlbGVjdGVkVmFsdWU6IHBheW1lbnRJbnRlcnZhbCgpLFxuXHRcdFx0XHRcdGl0ZW1zOiBwYXltZW50SW50ZXJ2YWxJdGVtcyxcblx0XHRcdFx0XHRvblZhbHVlU2VsZWN0ZWQ6ICh2OiBQYXltZW50SW50ZXJ2YWwpID0+IHtcblx0XHRcdFx0XHRcdHBheW1lbnRJbnRlcnZhbD8uKHYpXG5cdFx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRzaG91bGRBcHBseUN5YmVyTW9uZGF5LFxuXHRcdFx0ICB9KVxuXHRcdFx0OiBudWxsXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckhlYWRpbmcoaGVhZGluZzogc3RyaW5nKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFxuXHRcdFx0Ly8gd2UgbmVlZCBzb21lIG1hcmdpbiBmb3IgdGhlIGRpc2NvdW50IGJhbm5lciBmb3IgbG9uZ2VyIHRyYW5zbGF0aW9ucyBzaG93biBvbiB0aGUgd2Vic2l0ZVxuXHRcdFx0YC5oNC50ZXh0LWNlbnRlci5tYi1zbWFsbC1saW5lLWhlaWdodC5mbGV4LmNvbC5jZW50ZXItaG9yaXpvbnRhbGx5Lm1sci1sLmRpYWxvZy1oZWFkZXJgLFxuXHRcdFx0e1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFwiZm9udC1zaXplXCI6IGhlYWRpbmcubGVuZ3RoID4gMjAgPyBcInNtYWxsZXJcIiA6IHVuZGVmaW5lZCxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRoZWFkaW5nLFxuXHRcdClcblx0fVxufVxuIiwiZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlcXVlc3RGcm9tV2Vic2l0ZShwYXRoOiBzdHJpbmcsIGRvbWFpbkNvbmZpZzogRG9tYWluQ29uZmlnKTogUHJvbWlzZTxSZXNwb25zZT4ge1xuXHRjb25zdCB1cmwgPSBuZXcgVVJMKHBhdGgsIGRvbWFpbkNvbmZpZy53ZWJzaXRlQmFzZVVybClcblx0cmV0dXJuIGZldGNoKHVybC5ocmVmKVxufVxuIiwiLyoqXG4gKiBUaGUgbW9zdCByZWNlbnRseSBwdWJsaXNoZWQgdmVyc2lvbiBvZiB0aGUgdGVybXMgYW5kIGNvbmRpdGlvbnNcbiAqL1xuaW1wb3J0IG0sIHsgQ2hpbGRyZW4gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBJbmZvTGluaywgbGFuZyB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IGlzQXBwIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IHJlcXVlc3RGcm9tV2Vic2l0ZSB9IGZyb20gXCIuLi9taXNjL1dlYnNpdGVcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0RpYWxvZ1wiXG5pbXBvcnQgeyBodG1sU2FuaXRpemVyIH0gZnJvbSBcIi4uL21pc2MvSHRtbFNhbml0aXplclwiXG5pbXBvcnQgeyBEaWFsb2dIZWFkZXJCYXJBdHRycyB9IGZyb20gXCIuLi9ndWkvYmFzZS9EaWFsb2dIZWFkZXJCYXJcIlxuaW1wb3J0IHsgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yLmpzXCJcblxuLyoqXG4gKiBUaGUgbW9zdCB1cC10by1kYXRlIHZlcnNpb25zIG9mIHRoZSB0ZXJtcyBhbmQgY29uZGl0aW9ucywgcHJpdmFjeSBzdGF0ZW1lbnQsIGFuZCBnaWZ0IGNhcmQgdGVybXNcbiAqIG11c3QgYmUgaW4gc3luYyB3aXRoIHRoZSB3ZWJzaXRlXG4gKi9cbmV4cG9ydCBjb25zdCBDVVJSRU5UX1RFUk1TX1ZFUlNJT04gPSBcIjMuMlwiIGFzIGNvbnN0XG5leHBvcnQgY29uc3QgQ1VSUkVOVF9QUklWQUNZX1ZFUlNJT04gPSBcIjMuMVwiIGFzIGNvbnN0XG5leHBvcnQgY29uc3QgQ1VSUkVOVF9HSUZUX0NBUkRfVEVSTVNfVkVSU0lPTiA9IFwiMS4wXCIgYXMgY29uc3RcblxuLyoqXG4gKiBTaG93IGEgbGluayB0byB0aGUgdGVybXMgYW5kIGNvbmRpdGlvbnMgcGFnZSBvbiB0aGUgd2Vic2l0ZS5cbiAqIEluIHRoZSBtb2JpbGUgYXBwcywgaXQgd2lsbCBpbnN0ZWFkIG9wZW4gYSBkaWFsb2cgY29udGFpbmluZyB0aGUgdGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVGVybXNBbmRDb25kaXRpb25zQnV0dG9uKHRlcm1zOiBUZXJtc1NlY3Rpb24sIHZlcnNpb246IHN0cmluZyk6IENoaWxkcmVuIHtcblx0bGV0IGxhYmVsXG5cdGxldCBsaW5rXG5cdHN3aXRjaCAodGVybXMpIHtcblx0XHRjYXNlIFRlcm1zU2VjdGlvbi5HaWZ0Q2FyZHM6XG5cdFx0XHRsYWJlbCA9IGxhbmcuZ2V0KFwiZ2lmdENhcmRUZXJtc19sYWJlbFwiKVxuXHRcdFx0bGluayA9IEluZm9MaW5rLkdpZnRDYXJkc1Rlcm1zXG5cdFx0XHRicmVha1xuXHRcdGNhc2UgVGVybXNTZWN0aW9uLlRlcm1zOlxuXHRcdFx0bGFiZWwgPSBsYW5nLmdldChcInRlcm1zQW5kQ29uZGl0aW9uc0xpbmtfbGFiZWxcIilcblx0XHRcdGxpbmsgPSBJbmZvTGluay5UZXJtc1xuXHRcdFx0YnJlYWtcblx0XHRjYXNlIFRlcm1zU2VjdGlvbi5Qcml2YWN5OlxuXHRcdFx0bGFiZWwgPSBsYW5nLmdldChcInByaXZhY3lMaW5rX2xhYmVsXCIpXG5cdFx0XHRsaW5rID0gSW5mb0xpbmsuUHJpdmFjeVxuXHRcdFx0YnJlYWtcblx0fVxuXHRyZXR1cm4gbShcblx0XHRgYVtocmVmPSR7bGlua31dW3RhcmdldD1fYmxhbmtdYCxcblx0XHR7XG5cdFx0XHRvbmNsaWNrOiAoZTogTW91c2VFdmVudCkgPT4ge1xuXHRcdFx0XHRpZiAoaXNBcHAoKSkge1xuXHRcdFx0XHRcdHNob3dTZXJ2aWNlVGVybXModGVybXMsIHZlcnNpb24pXG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0fSxcblx0XHRsYWJlbCxcblx0KVxufVxuXG4vKipcbiAqIEFuIGVudW0gZGVub3RpbmcgYSBzZWN0aW9uIG9mIHRoZSB0dXRhbm90YSB0ZXJtcyB0byByZXF1ZXN0LlxuICogVGhlIHZhbHVlIG9mIHRoZSBlbnVtIGlzIHRoZSBwYXRoIHRoYXQgaXMgdXNlZCBpbiB0aGUgcmVxdWVzdCB0byB0aGUgd2Vic2l0ZVxuICovXG5leHBvcnQgY29uc3QgZW51bSBUZXJtc1NlY3Rpb24ge1xuXHRUZXJtcyA9IFwidGVybXMtZW50cmllc1wiLFxuXHRQcml2YWN5ID0gXCJwcml2YWN5LXBvbGljeS1lbnRyaWVzXCIsXG5cdEdpZnRDYXJkcyA9IFwiZ2lmdENhcmRzVGVybXMtZW50cmllc1wiLFxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2hvd1NlcnZpY2VUZXJtcyhzZWN0aW9uOiBUZXJtc1NlY3Rpb24sIHZlcnNpb246IHN0cmluZykge1xuXHRjb25zdCBwYXRoID0gYC8ke3NlY3Rpb259LyR7dmVyc2lvbn0uanNvbmBcblx0Y29uc3QgdGVybXNGcm9tV2Vic2l0ZSA9IGF3YWl0IHJlcXVlc3RGcm9tV2Vic2l0ZShwYXRoLCBsb2NhdG9yLmRvbWFpbkNvbmZpZ1Byb3ZpZGVyKCkuZ2V0Q3VycmVudERvbWFpbkNvbmZpZygpKS50aGVuKChyZXMpID0+IHJlcy5qc29uKCkpXG5cdGxldCB2aXNpYmxlTGFuZzogXCJlblwiIHwgXCJkZVwiID0gbGFuZy5jb2RlLnN0YXJ0c1dpdGgoXCJkZVwiKSA/IFwiZGVcIiA6IFwiZW5cIlxuXHRsZXQgZGlhbG9nOiBEaWFsb2dcblx0bGV0IHNhbml0aXplZFRlcm1zOiBzdHJpbmdcblxuXHRmdW5jdGlvbiBnZXRTZWN0aW9uKCk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIGh0bWxTYW5pdGl6ZXIuc2FuaXRpemVIVE1MKHRlcm1zRnJvbVdlYnNpdGVbdmlzaWJsZUxhbmddLCB7XG5cdFx0XHRibG9ja0V4dGVybmFsQ29udGVudDogZmFsc2UsXG5cdFx0fSkuaHRtbFxuXHR9XG5cblx0bGV0IGhlYWRlckJhckF0dHJzOiBEaWFsb2dIZWFkZXJCYXJBdHRycyA9IHtcblx0XHRsZWZ0OiBbXG5cdFx0XHR7XG5cdFx0XHRcdGxhYmVsOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcImxhbmdfdG9nZ2xlXCIsIFwiRU4vREVcIiksXG5cdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0dmlzaWJsZUxhbmcgPSB2aXNpYmxlTGFuZyA9PT0gXCJkZVwiID8gXCJlblwiIDogXCJkZVwiXG5cdFx0XHRcdFx0c2FuaXRpemVkVGVybXMgPSBnZXRTZWN0aW9uKClcblx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0fSxcblx0XHRdLFxuXHRcdHJpZ2h0OiBbXG5cdFx0XHR7XG5cdFx0XHRcdGxhYmVsOiBcIm9rX2FjdGlvblwiLFxuXHRcdFx0XHRjbGljazogKCkgPT4gZGlhbG9nLmNsb3NlKCksXG5cdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuUHJpbWFyeSxcblx0XHRcdH0sXG5cdFx0XSxcblx0fVxuXHRzYW5pdGl6ZWRUZXJtcyA9IGdldFNlY3Rpb24oKVxuXHRkaWFsb2cgPSBEaWFsb2cubGFyZ2VEaWFsb2coaGVhZGVyQmFyQXR0cnMsIHtcblx0XHR2aWV3OiAoKSA9PiBtKFwiLnRleHQtYnJlYWtcIiwgbS50cnVzdChzYW5pdGl6ZWRUZXJtcykpLFxuXHR9KS5zaG93KClcbn1cbiIsIi8qKlxuICogQGZpbGVvdmVydmlld1xuICogLSBtb2RpZmllZCBkYXZpZHNoaW1qcy9xcmNvZGVqcyBsaWJyYXJ5IGZvciB1c2UgaW4gbm9kZS5qc1xuICogLSBVc2luZyB0aGUgJ1FSQ29kZSBmb3IgSmF2YXNjcmlwdCBsaWJyYXJ5J1xuICogLSBGaXhlZCBkYXRhc2V0IG9mICdRUkNvZGUgZm9yIEphdmFzY3JpcHQgbGlicmFyeScgZm9yIHN1cHBvcnQgZnVsbC1zcGVjLlxuICogLSB0aGlzIGxpYnJhcnkgaGFzIG5vIGRlcGVuZGVuY2llcy5cbiAqXG4gKiBAdmVyc2lvbiAwLjkuMSAoMjAxNi0wMi0xMilcbiAqIEBhdXRob3IgZGF2aWRzaGltanMsIHBhcG5rdWtuXG4gKiBAc2VlIDxhIGhyZWY9XCJodHRwOi8vd3d3LmQtcHJvamVjdC5jb20vXCIgdGFyZ2V0PVwiX2JsYW5rXCI+aHR0cDovL3d3dy5kLXByb2plY3QuY29tLzwvYT5cbiAqIEBzZWUgPGEgaHJlZj1cImh0dHA6Ly9qZXJvbWVldGllbm5lLmdpdGh1Yi5jb20vanF1ZXJ5LXFyY29kZS9cIiB0YXJnZXQ9XCJfYmxhbmtcIj5odHRwOi8vamVyb21lZXRpZW5uZS5naXRodWIuY29tL2pxdWVyeS1xcmNvZGUvPC9hPlxuICogQHNlZSA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL2Rhdmlkc2hpbWpzL3FyY29kZWpzXCIgdGFyZ2V0PVwiX2JsYW5rXCI+aHR0cHM6Ly9naXRodWIuY29tL2Rhdmlkc2hpbWpzL3FyY29kZWpzPC9hPlxuICovXG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBRUkNvZGUgZm9yIEphdmFTY3JpcHRcbi8vXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgS2F6dWhpa28gQXJhc2Vcbi8vXG4vLyBVUkw6IGh0dHA6Ly93d3cuZC1wcm9qZWN0LmNvbS9cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2U6XG4vLyAgIGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXG4vL1xuLy8gVGhlIHdvcmQgXCJRUiBDb2RlXCIgaXMgcmVnaXN0ZXJlZCB0cmFkZW1hcmsgb2YgXG4vLyBERU5TTyBXQVZFIElOQ09SUE9SQVRFRFxuLy8gICBodHRwOi8vd3d3LmRlbnNvLXdhdmUuY29tL3FyY29kZS9mYXFwYXRlbnQtZS5odG1sXG4vL1xuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmZ1bmN0aW9uIFFSOGJpdEJ5dGUoZGF0YSkge1xuICB0aGlzLm1vZGUgPSBRUk1vZGUuTU9ERV84QklUX0JZVEU7XG4gIHRoaXMuZGF0YSA9IGRhdGE7XG4gIHRoaXMucGFyc2VkRGF0YSA9IFtdO1xuXG4gIC8vIEFkZGVkIHRvIHN1cHBvcnQgVVRGLTggQ2hhcmFjdGVyc1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuZGF0YS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB2YXIgYnl0ZUFycmF5ID0gW107XG4gICAgdmFyIGNvZGUgPSB0aGlzLmRhdGEuY2hhckNvZGVBdChpKTtcblxuICAgIGlmIChjb2RlID4gMHgxMDAwMCkge1xuICAgICAgYnl0ZUFycmF5WzBdID0gMHhGMCB8ICgoY29kZSAmIDB4MUMwMDAwKSA+Pj4gMTgpO1xuICAgICAgYnl0ZUFycmF5WzFdID0gMHg4MCB8ICgoY29kZSAmIDB4M0YwMDApID4+PiAxMik7XG4gICAgICBieXRlQXJyYXlbMl0gPSAweDgwIHwgKChjb2RlICYgMHhGQzApID4+PiA2KTtcbiAgICAgIGJ5dGVBcnJheVszXSA9IDB4ODAgfCAoY29kZSAmIDB4M0YpO1xuICAgIH0gZWxzZSBpZiAoY29kZSA+IDB4ODAwKSB7XG4gICAgICBieXRlQXJyYXlbMF0gPSAweEUwIHwgKChjb2RlICYgMHhGMDAwKSA+Pj4gMTIpO1xuICAgICAgYnl0ZUFycmF5WzFdID0gMHg4MCB8ICgoY29kZSAmIDB4RkMwKSA+Pj4gNik7XG4gICAgICBieXRlQXJyYXlbMl0gPSAweDgwIHwgKGNvZGUgJiAweDNGKTtcbiAgICB9IGVsc2UgaWYgKGNvZGUgPiAweDgwKSB7XG4gICAgICBieXRlQXJyYXlbMF0gPSAweEMwIHwgKChjb2RlICYgMHg3QzApID4+PiA2KTtcbiAgICAgIGJ5dGVBcnJheVsxXSA9IDB4ODAgfCAoY29kZSAmIDB4M0YpO1xuICAgIH0gZWxzZSB7XG4gICAgICBieXRlQXJyYXlbMF0gPSBjb2RlO1xuICAgIH1cblxuICAgIHRoaXMucGFyc2VkRGF0YS5wdXNoKGJ5dGVBcnJheSk7XG4gIH1cblxuICB0aGlzLnBhcnNlZERhdGEgPSBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCB0aGlzLnBhcnNlZERhdGEpO1xuXG4gIGlmICh0aGlzLnBhcnNlZERhdGEubGVuZ3RoICE9IHRoaXMuZGF0YS5sZW5ndGgpIHtcbiAgICB0aGlzLnBhcnNlZERhdGEudW5zaGlmdCgxOTEpO1xuICAgIHRoaXMucGFyc2VkRGF0YS51bnNoaWZ0KDE4Nyk7XG4gICAgdGhpcy5wYXJzZWREYXRhLnVuc2hpZnQoMjM5KTtcbiAgfVxufVxuXG5RUjhiaXRCeXRlLnByb3RvdHlwZSA9IHtcbiAgZ2V0TGVuZ3RoOiBmdW5jdGlvbiAoYnVmZmVyKSB7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VkRGF0YS5sZW5ndGg7XG4gIH0sXG4gIHdyaXRlOiBmdW5jdGlvbiAoYnVmZmVyKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLnBhcnNlZERhdGEubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBidWZmZXIucHV0KHRoaXMucGFyc2VkRGF0YVtpXSwgOCk7XG4gICAgfVxuICB9XG59O1xuXG5mdW5jdGlvbiBRUkNvZGVNb2RlbCh0eXBlTnVtYmVyLCBlcnJvckNvcnJlY3RMZXZlbCkge1xuICB0aGlzLnR5cGVOdW1iZXIgPSB0eXBlTnVtYmVyO1xuICB0aGlzLmVycm9yQ29ycmVjdExldmVsID0gZXJyb3JDb3JyZWN0TGV2ZWw7XG4gIHRoaXMubW9kdWxlcyA9IG51bGw7XG4gIHRoaXMubW9kdWxlQ291bnQgPSAwO1xuICB0aGlzLmRhdGFDYWNoZSA9IG51bGw7XG4gIHRoaXMuZGF0YUxpc3QgPSBbXTtcbn1cblxuUVJDb2RlTW9kZWwucHJvdG90eXBlPXthZGREYXRhOmZ1bmN0aW9uKGRhdGEpe3ZhciBuZXdEYXRhPW5ldyBRUjhiaXRCeXRlKGRhdGEpO3RoaXMuZGF0YUxpc3QucHVzaChuZXdEYXRhKTt0aGlzLmRhdGFDYWNoZT1udWxsO30saXNEYXJrOmZ1bmN0aW9uKHJvdyxjb2wpe2lmKHJvdzwwfHx0aGlzLm1vZHVsZUNvdW50PD1yb3d8fGNvbDwwfHx0aGlzLm1vZHVsZUNvdW50PD1jb2wpe3Rocm93IG5ldyBFcnJvcihyb3crXCIsXCIrY29sKTt9XG5yZXR1cm4gdGhpcy5tb2R1bGVzW3Jvd11bY29sXTt9LGdldE1vZHVsZUNvdW50OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMubW9kdWxlQ291bnQ7fSxtYWtlOmZ1bmN0aW9uKCl7dGhpcy5tYWtlSW1wbChmYWxzZSx0aGlzLmdldEJlc3RNYXNrUGF0dGVybigpKTt9LG1ha2VJbXBsOmZ1bmN0aW9uKHRlc3QsbWFza1BhdHRlcm4pe3RoaXMubW9kdWxlQ291bnQ9dGhpcy50eXBlTnVtYmVyKjQrMTc7dGhpcy5tb2R1bGVzPW5ldyBBcnJheSh0aGlzLm1vZHVsZUNvdW50KTtmb3IodmFyIHJvdz0wO3Jvdzx0aGlzLm1vZHVsZUNvdW50O3JvdysrKXt0aGlzLm1vZHVsZXNbcm93XT1uZXcgQXJyYXkodGhpcy5tb2R1bGVDb3VudCk7Zm9yKHZhciBjb2w9MDtjb2w8dGhpcy5tb2R1bGVDb3VudDtjb2wrKyl7dGhpcy5tb2R1bGVzW3Jvd11bY29sXT1udWxsO319XG50aGlzLnNldHVwUG9zaXRpb25Qcm9iZVBhdHRlcm4oMCwwKTt0aGlzLnNldHVwUG9zaXRpb25Qcm9iZVBhdHRlcm4odGhpcy5tb2R1bGVDb3VudC03LDApO3RoaXMuc2V0dXBQb3NpdGlvblByb2JlUGF0dGVybigwLHRoaXMubW9kdWxlQ291bnQtNyk7dGhpcy5zZXR1cFBvc2l0aW9uQWRqdXN0UGF0dGVybigpO3RoaXMuc2V0dXBUaW1pbmdQYXR0ZXJuKCk7dGhpcy5zZXR1cFR5cGVJbmZvKHRlc3QsbWFza1BhdHRlcm4pO2lmKHRoaXMudHlwZU51bWJlcj49Nyl7dGhpcy5zZXR1cFR5cGVOdW1iZXIodGVzdCk7fVxuaWYodGhpcy5kYXRhQ2FjaGU9PW51bGwpe3RoaXMuZGF0YUNhY2hlPVFSQ29kZU1vZGVsLmNyZWF0ZURhdGEodGhpcy50eXBlTnVtYmVyLHRoaXMuZXJyb3JDb3JyZWN0TGV2ZWwsdGhpcy5kYXRhTGlzdCk7fVxudGhpcy5tYXBEYXRhKHRoaXMuZGF0YUNhY2hlLG1hc2tQYXR0ZXJuKTt9LHNldHVwUG9zaXRpb25Qcm9iZVBhdHRlcm46ZnVuY3Rpb24ocm93LGNvbCl7Zm9yKHZhciByPS0xO3I8PTc7cisrKXtpZihyb3crcjw9LTF8fHRoaXMubW9kdWxlQ291bnQ8PXJvdytyKWNvbnRpbnVlO2Zvcih2YXIgYz0tMTtjPD03O2MrKyl7aWYoY29sK2M8PS0xfHx0aGlzLm1vZHVsZUNvdW50PD1jb2wrYyljb250aW51ZTtpZigoMDw9ciYmcjw9NiYmKGM9PTB8fGM9PTYpKXx8KDA8PWMmJmM8PTYmJihyPT0wfHxyPT02KSl8fCgyPD1yJiZyPD00JiYyPD1jJiZjPD00KSl7dGhpcy5tb2R1bGVzW3JvdytyXVtjb2wrY109dHJ1ZTt9ZWxzZSB7dGhpcy5tb2R1bGVzW3JvdytyXVtjb2wrY109ZmFsc2U7fX19fSxnZXRCZXN0TWFza1BhdHRlcm46ZnVuY3Rpb24oKXt2YXIgbWluTG9zdFBvaW50PTA7dmFyIHBhdHRlcm49MDtmb3IodmFyIGk9MDtpPDg7aSsrKXt0aGlzLm1ha2VJbXBsKHRydWUsaSk7dmFyIGxvc3RQb2ludD1RUlV0aWwuZ2V0TG9zdFBvaW50KHRoaXMpO2lmKGk9PTB8fG1pbkxvc3RQb2ludD5sb3N0UG9pbnQpe21pbkxvc3RQb2ludD1sb3N0UG9pbnQ7cGF0dGVybj1pO319XG5yZXR1cm4gcGF0dGVybjt9LGNyZWF0ZU1vdmllQ2xpcDpmdW5jdGlvbih0YXJnZXRfbWMsaW5zdGFuY2VfbmFtZSxkZXB0aCl7dmFyIHFyX21jPXRhcmdldF9tYy5jcmVhdGVFbXB0eU1vdmllQ2xpcChpbnN0YW5jZV9uYW1lLGRlcHRoKTt2YXIgY3M9MTt0aGlzLm1ha2UoKTtmb3IodmFyIHJvdz0wO3Jvdzx0aGlzLm1vZHVsZXMubGVuZ3RoO3JvdysrKXt2YXIgeT1yb3cqY3M7Zm9yKHZhciBjb2w9MDtjb2w8dGhpcy5tb2R1bGVzW3Jvd10ubGVuZ3RoO2NvbCsrKXt2YXIgeD1jb2wqY3M7dmFyIGRhcms9dGhpcy5tb2R1bGVzW3Jvd11bY29sXTtpZihkYXJrKXtxcl9tYy5iZWdpbkZpbGwoMCwxMDApO3FyX21jLm1vdmVUbyh4LHkpO3FyX21jLmxpbmVUbyh4K2NzLHkpO3FyX21jLmxpbmVUbyh4K2NzLHkrY3MpO3FyX21jLmxpbmVUbyh4LHkrY3MpO3FyX21jLmVuZEZpbGwoKTt9fX1cbnJldHVybiBxcl9tYzt9LHNldHVwVGltaW5nUGF0dGVybjpmdW5jdGlvbigpe2Zvcih2YXIgcj04O3I8dGhpcy5tb2R1bGVDb3VudC04O3IrKyl7aWYodGhpcy5tb2R1bGVzW3JdWzZdIT1udWxsKXtjb250aW51ZTt9XG50aGlzLm1vZHVsZXNbcl1bNl09KHIlMj09MCk7fVxuZm9yKHZhciBjPTg7Yzx0aGlzLm1vZHVsZUNvdW50LTg7YysrKXtpZih0aGlzLm1vZHVsZXNbNl1bY10hPW51bGwpe2NvbnRpbnVlO31cbnRoaXMubW9kdWxlc1s2XVtjXT0oYyUyPT0wKTt9fSxzZXR1cFBvc2l0aW9uQWRqdXN0UGF0dGVybjpmdW5jdGlvbigpe3ZhciBwb3M9UVJVdGlsLmdldFBhdHRlcm5Qb3NpdGlvbih0aGlzLnR5cGVOdW1iZXIpO2Zvcih2YXIgaT0wO2k8cG9zLmxlbmd0aDtpKyspe2Zvcih2YXIgaj0wO2o8cG9zLmxlbmd0aDtqKyspe3ZhciByb3c9cG9zW2ldO3ZhciBjb2w9cG9zW2pdO2lmKHRoaXMubW9kdWxlc1tyb3ddW2NvbF0hPW51bGwpe2NvbnRpbnVlO31cbmZvcih2YXIgcj0tMjtyPD0yO3IrKyl7Zm9yKHZhciBjPS0yO2M8PTI7YysrKXtpZihyPT0tMnx8cj09Mnx8Yz09LTJ8fGM9PTJ8fChyPT0wJiZjPT0wKSl7dGhpcy5tb2R1bGVzW3JvdytyXVtjb2wrY109dHJ1ZTt9ZWxzZSB7dGhpcy5tb2R1bGVzW3JvdytyXVtjb2wrY109ZmFsc2U7fX19fX19LHNldHVwVHlwZU51bWJlcjpmdW5jdGlvbih0ZXN0KXt2YXIgYml0cz1RUlV0aWwuZ2V0QkNIVHlwZU51bWJlcih0aGlzLnR5cGVOdW1iZXIpO2Zvcih2YXIgaT0wO2k8MTg7aSsrKXt2YXIgbW9kPSghdGVzdCYmKChiaXRzPj5pKSYxKT09MSk7dGhpcy5tb2R1bGVzW01hdGguZmxvb3IoaS8zKV1baSUzK3RoaXMubW9kdWxlQ291bnQtOC0zXT1tb2Q7fVxuZm9yKHZhciBpPTA7aTwxODtpKyspe3ZhciBtb2Q9KCF0ZXN0JiYoKGJpdHM+PmkpJjEpPT0xKTt0aGlzLm1vZHVsZXNbaSUzK3RoaXMubW9kdWxlQ291bnQtOC0zXVtNYXRoLmZsb29yKGkvMyldPW1vZDt9fSxzZXR1cFR5cGVJbmZvOmZ1bmN0aW9uKHRlc3QsbWFza1BhdHRlcm4pe3ZhciBkYXRhPSh0aGlzLmVycm9yQ29ycmVjdExldmVsPDwzKXxtYXNrUGF0dGVybjt2YXIgYml0cz1RUlV0aWwuZ2V0QkNIVHlwZUluZm8oZGF0YSk7Zm9yKHZhciBpPTA7aTwxNTtpKyspe3ZhciBtb2Q9KCF0ZXN0JiYoKGJpdHM+PmkpJjEpPT0xKTtpZihpPDYpe3RoaXMubW9kdWxlc1tpXVs4XT1tb2Q7fWVsc2UgaWYoaTw4KXt0aGlzLm1vZHVsZXNbaSsxXVs4XT1tb2Q7fWVsc2Uge3RoaXMubW9kdWxlc1t0aGlzLm1vZHVsZUNvdW50LTE1K2ldWzhdPW1vZDt9fVxuZm9yKHZhciBpPTA7aTwxNTtpKyspe3ZhciBtb2Q9KCF0ZXN0JiYoKGJpdHM+PmkpJjEpPT0xKTtpZihpPDgpe3RoaXMubW9kdWxlc1s4XVt0aGlzLm1vZHVsZUNvdW50LWktMV09bW9kO31lbHNlIGlmKGk8OSl7dGhpcy5tb2R1bGVzWzhdWzE1LWktMSsxXT1tb2Q7fWVsc2Uge3RoaXMubW9kdWxlc1s4XVsxNS1pLTFdPW1vZDt9fVxudGhpcy5tb2R1bGVzW3RoaXMubW9kdWxlQ291bnQtOF1bOF09KCF0ZXN0KTt9LG1hcERhdGE6ZnVuY3Rpb24oZGF0YSxtYXNrUGF0dGVybil7dmFyIGluYz0tMTt2YXIgcm93PXRoaXMubW9kdWxlQ291bnQtMTt2YXIgYml0SW5kZXg9Nzt2YXIgYnl0ZUluZGV4PTA7Zm9yKHZhciBjb2w9dGhpcy5tb2R1bGVDb3VudC0xO2NvbD4wO2NvbC09Mil7aWYoY29sPT02KWNvbC0tO3doaWxlKHRydWUpe2Zvcih2YXIgYz0wO2M8MjtjKyspe2lmKHRoaXMubW9kdWxlc1tyb3ddW2NvbC1jXT09bnVsbCl7dmFyIGRhcms9ZmFsc2U7aWYoYnl0ZUluZGV4PGRhdGEubGVuZ3RoKXtkYXJrPSgoKGRhdGFbYnl0ZUluZGV4XT4+PmJpdEluZGV4KSYxKT09MSk7fVxudmFyIG1hc2s9UVJVdGlsLmdldE1hc2sobWFza1BhdHRlcm4scm93LGNvbC1jKTtpZihtYXNrKXtkYXJrPSFkYXJrO31cbnRoaXMubW9kdWxlc1tyb3ddW2NvbC1jXT1kYXJrO2JpdEluZGV4LS07aWYoYml0SW5kZXg9PS0xKXtieXRlSW5kZXgrKztiaXRJbmRleD03O319fVxucm93Kz1pbmM7aWYocm93PDB8fHRoaXMubW9kdWxlQ291bnQ8PXJvdyl7cm93LT1pbmM7aW5jPS1pbmM7YnJlYWs7fX19fX07UVJDb2RlTW9kZWwuUEFEMD0weEVDO1FSQ29kZU1vZGVsLlBBRDE9MHgxMTtRUkNvZGVNb2RlbC5jcmVhdGVEYXRhPWZ1bmN0aW9uKHR5cGVOdW1iZXIsZXJyb3JDb3JyZWN0TGV2ZWwsZGF0YUxpc3Qpe3ZhciByc0Jsb2Nrcz1RUlJTQmxvY2suZ2V0UlNCbG9ja3ModHlwZU51bWJlcixlcnJvckNvcnJlY3RMZXZlbCk7dmFyIGJ1ZmZlcj1uZXcgUVJCaXRCdWZmZXIoKTtmb3IodmFyIGk9MDtpPGRhdGFMaXN0Lmxlbmd0aDtpKyspe3ZhciBkYXRhPWRhdGFMaXN0W2ldO2J1ZmZlci5wdXQoZGF0YS5tb2RlLDQpO2J1ZmZlci5wdXQoZGF0YS5nZXRMZW5ndGgoKSxRUlV0aWwuZ2V0TGVuZ3RoSW5CaXRzKGRhdGEubW9kZSx0eXBlTnVtYmVyKSk7ZGF0YS53cml0ZShidWZmZXIpO31cbnZhciB0b3RhbERhdGFDb3VudD0wO2Zvcih2YXIgaT0wO2k8cnNCbG9ja3MubGVuZ3RoO2krKyl7dG90YWxEYXRhQ291bnQrPXJzQmxvY2tzW2ldLmRhdGFDb3VudDt9XG5pZihidWZmZXIuZ2V0TGVuZ3RoSW5CaXRzKCk+dG90YWxEYXRhQ291bnQqOCl7dGhyb3cgbmV3IEVycm9yKFwiY29kZSBsZW5ndGggb3ZlcmZsb3cuIChcIlxuK2J1ZmZlci5nZXRMZW5ndGhJbkJpdHMoKVxuK1wiPlwiXG4rdG90YWxEYXRhQ291bnQqOFxuK1wiKVwiKTt9XG5pZihidWZmZXIuZ2V0TGVuZ3RoSW5CaXRzKCkrNDw9dG90YWxEYXRhQ291bnQqOCl7YnVmZmVyLnB1dCgwLDQpO31cbndoaWxlKGJ1ZmZlci5nZXRMZW5ndGhJbkJpdHMoKSU4IT0wKXtidWZmZXIucHV0Qml0KGZhbHNlKTt9XG53aGlsZSh0cnVlKXtpZihidWZmZXIuZ2V0TGVuZ3RoSW5CaXRzKCk+PXRvdGFsRGF0YUNvdW50Kjgpe2JyZWFrO31cbmJ1ZmZlci5wdXQoUVJDb2RlTW9kZWwuUEFEMCw4KTtpZihidWZmZXIuZ2V0TGVuZ3RoSW5CaXRzKCk+PXRvdGFsRGF0YUNvdW50Kjgpe2JyZWFrO31cbmJ1ZmZlci5wdXQoUVJDb2RlTW9kZWwuUEFEMSw4KTt9XG5yZXR1cm4gUVJDb2RlTW9kZWwuY3JlYXRlQnl0ZXMoYnVmZmVyLHJzQmxvY2tzKTt9O1FSQ29kZU1vZGVsLmNyZWF0ZUJ5dGVzPWZ1bmN0aW9uKGJ1ZmZlcixyc0Jsb2Nrcyl7dmFyIG9mZnNldD0wO3ZhciBtYXhEY0NvdW50PTA7dmFyIG1heEVjQ291bnQ9MDt2YXIgZGNkYXRhPW5ldyBBcnJheShyc0Jsb2Nrcy5sZW5ndGgpO3ZhciBlY2RhdGE9bmV3IEFycmF5KHJzQmxvY2tzLmxlbmd0aCk7Zm9yKHZhciByPTA7cjxyc0Jsb2Nrcy5sZW5ndGg7cisrKXt2YXIgZGNDb3VudD1yc0Jsb2Nrc1tyXS5kYXRhQ291bnQ7dmFyIGVjQ291bnQ9cnNCbG9ja3Nbcl0udG90YWxDb3VudC1kY0NvdW50O21heERjQ291bnQ9TWF0aC5tYXgobWF4RGNDb3VudCxkY0NvdW50KTttYXhFY0NvdW50PU1hdGgubWF4KG1heEVjQ291bnQsZWNDb3VudCk7ZGNkYXRhW3JdPW5ldyBBcnJheShkY0NvdW50KTtmb3IodmFyIGk9MDtpPGRjZGF0YVtyXS5sZW5ndGg7aSsrKXtkY2RhdGFbcl1baV09MHhmZiZidWZmZXIuYnVmZmVyW2krb2Zmc2V0XTt9XG5vZmZzZXQrPWRjQ291bnQ7dmFyIHJzUG9seT1RUlV0aWwuZ2V0RXJyb3JDb3JyZWN0UG9seW5vbWlhbChlY0NvdW50KTt2YXIgcmF3UG9seT1uZXcgUVJQb2x5bm9taWFsKGRjZGF0YVtyXSxyc1BvbHkuZ2V0TGVuZ3RoKCktMSk7dmFyIG1vZFBvbHk9cmF3UG9seS5tb2QocnNQb2x5KTtlY2RhdGFbcl09bmV3IEFycmF5KHJzUG9seS5nZXRMZW5ndGgoKS0xKTtmb3IodmFyIGk9MDtpPGVjZGF0YVtyXS5sZW5ndGg7aSsrKXt2YXIgbW9kSW5kZXg9aSttb2RQb2x5LmdldExlbmd0aCgpLWVjZGF0YVtyXS5sZW5ndGg7ZWNkYXRhW3JdW2ldPShtb2RJbmRleD49MCk/bW9kUG9seS5nZXQobW9kSW5kZXgpOjA7fX1cbnZhciB0b3RhbENvZGVDb3VudD0wO2Zvcih2YXIgaT0wO2k8cnNCbG9ja3MubGVuZ3RoO2krKyl7dG90YWxDb2RlQ291bnQrPXJzQmxvY2tzW2ldLnRvdGFsQ291bnQ7fVxudmFyIGRhdGE9bmV3IEFycmF5KHRvdGFsQ29kZUNvdW50KTt2YXIgaW5kZXg9MDtmb3IodmFyIGk9MDtpPG1heERjQ291bnQ7aSsrKXtmb3IodmFyIHI9MDtyPHJzQmxvY2tzLmxlbmd0aDtyKyspe2lmKGk8ZGNkYXRhW3JdLmxlbmd0aCl7ZGF0YVtpbmRleCsrXT1kY2RhdGFbcl1baV07fX19XG5mb3IodmFyIGk9MDtpPG1heEVjQ291bnQ7aSsrKXtmb3IodmFyIHI9MDtyPHJzQmxvY2tzLmxlbmd0aDtyKyspe2lmKGk8ZWNkYXRhW3JdLmxlbmd0aCl7ZGF0YVtpbmRleCsrXT1lY2RhdGFbcl1baV07fX19XG5yZXR1cm4gZGF0YTt9O3ZhciBRUk1vZGU9e01PREVfTlVNQkVSOjE8PDAsTU9ERV9BTFBIQV9OVU06MTw8MSxNT0RFXzhCSVRfQllURToxPDwyLE1PREVfS0FOSkk6MTw8M307dmFyIFFSRXJyb3JDb3JyZWN0TGV2ZWw9e0w6MSxNOjAsUTozLEg6Mn07dmFyIFFSTWFza1BhdHRlcm49e1BBVFRFUk4wMDA6MCxQQVRURVJOMDAxOjEsUEFUVEVSTjAxMDoyLFBBVFRFUk4wMTE6MyxQQVRURVJOMTAwOjQsUEFUVEVSTjEwMTo1LFBBVFRFUk4xMTA6NixQQVRURVJOMTExOjd9O3ZhciBRUlV0aWw9e1BBVFRFUk5fUE9TSVRJT05fVEFCTEU6W1tdLFs2LDE4XSxbNiwyMl0sWzYsMjZdLFs2LDMwXSxbNiwzNF0sWzYsMjIsMzhdLFs2LDI0LDQyXSxbNiwyNiw0Nl0sWzYsMjgsNTBdLFs2LDMwLDU0XSxbNiwzMiw1OF0sWzYsMzQsNjJdLFs2LDI2LDQ2LDY2XSxbNiwyNiw0OCw3MF0sWzYsMjYsNTAsNzRdLFs2LDMwLDU0LDc4XSxbNiwzMCw1Niw4Ml0sWzYsMzAsNTgsODZdLFs2LDM0LDYyLDkwXSxbNiwyOCw1MCw3Miw5NF0sWzYsMjYsNTAsNzQsOThdLFs2LDMwLDU0LDc4LDEwMl0sWzYsMjgsNTQsODAsMTA2XSxbNiwzMiw1OCw4NCwxMTBdLFs2LDMwLDU4LDg2LDExNF0sWzYsMzQsNjIsOTAsMTE4XSxbNiwyNiw1MCw3NCw5OCwxMjJdLFs2LDMwLDU0LDc4LDEwMiwxMjZdLFs2LDI2LDUyLDc4LDEwNCwxMzBdLFs2LDMwLDU2LDgyLDEwOCwxMzRdLFs2LDM0LDYwLDg2LDExMiwxMzhdLFs2LDMwLDU4LDg2LDExNCwxNDJdLFs2LDM0LDYyLDkwLDExOCwxNDZdLFs2LDMwLDU0LDc4LDEwMiwxMjYsMTUwXSxbNiwyNCw1MCw3NiwxMDIsMTI4LDE1NF0sWzYsMjgsNTQsODAsMTA2LDEzMiwxNThdLFs2LDMyLDU4LDg0LDExMCwxMzYsMTYyXSxbNiwyNiw1NCw4MiwxMTAsMTM4LDE2Nl0sWzYsMzAsNTgsODYsMTE0LDE0MiwxNzBdXSxHMTU6KDE8PDEwKXwoMTw8OCl8KDE8PDUpfCgxPDw0KXwoMTw8Mil8KDE8PDEpfCgxPDwwKSxHMTg6KDE8PDEyKXwoMTw8MTEpfCgxPDwxMCl8KDE8PDkpfCgxPDw4KXwoMTw8NSl8KDE8PDIpfCgxPDwwKSxHMTVfTUFTSzooMTw8MTQpfCgxPDwxMil8KDE8PDEwKXwoMTw8NCl8KDE8PDEpLGdldEJDSFR5cGVJbmZvOmZ1bmN0aW9uKGRhdGEpe3ZhciBkPWRhdGE8PDEwO3doaWxlKFFSVXRpbC5nZXRCQ0hEaWdpdChkKS1RUlV0aWwuZ2V0QkNIRGlnaXQoUVJVdGlsLkcxNSk+PTApe2RePShRUlV0aWwuRzE1PDwoUVJVdGlsLmdldEJDSERpZ2l0KGQpLVFSVXRpbC5nZXRCQ0hEaWdpdChRUlV0aWwuRzE1KSkpO31cbnJldHVybiAoKGRhdGE8PDEwKXxkKV5RUlV0aWwuRzE1X01BU0s7fSxnZXRCQ0hUeXBlTnVtYmVyOmZ1bmN0aW9uKGRhdGEpe3ZhciBkPWRhdGE8PDEyO3doaWxlKFFSVXRpbC5nZXRCQ0hEaWdpdChkKS1RUlV0aWwuZ2V0QkNIRGlnaXQoUVJVdGlsLkcxOCk+PTApe2RePShRUlV0aWwuRzE4PDwoUVJVdGlsLmdldEJDSERpZ2l0KGQpLVFSVXRpbC5nZXRCQ0hEaWdpdChRUlV0aWwuRzE4KSkpO31cbnJldHVybiAoZGF0YTw8MTIpfGQ7fSxnZXRCQ0hEaWdpdDpmdW5jdGlvbihkYXRhKXt2YXIgZGlnaXQ9MDt3aGlsZShkYXRhIT0wKXtkaWdpdCsrO2RhdGE+Pj49MTt9XG5yZXR1cm4gZGlnaXQ7fSxnZXRQYXR0ZXJuUG9zaXRpb246ZnVuY3Rpb24odHlwZU51bWJlcil7cmV0dXJuIFFSVXRpbC5QQVRURVJOX1BPU0lUSU9OX1RBQkxFW3R5cGVOdW1iZXItMV07fSxnZXRNYXNrOmZ1bmN0aW9uKG1hc2tQYXR0ZXJuLGksail7c3dpdGNoKG1hc2tQYXR0ZXJuKXtjYXNlIFFSTWFza1BhdHRlcm4uUEFUVEVSTjAwMDpyZXR1cm4gKGkraiklMj09MDtjYXNlIFFSTWFza1BhdHRlcm4uUEFUVEVSTjAwMTpyZXR1cm4gaSUyPT0wO2Nhc2UgUVJNYXNrUGF0dGVybi5QQVRURVJOMDEwOnJldHVybiBqJTM9PTA7Y2FzZSBRUk1hc2tQYXR0ZXJuLlBBVFRFUk4wMTE6cmV0dXJuIChpK2opJTM9PTA7Y2FzZSBRUk1hc2tQYXR0ZXJuLlBBVFRFUk4xMDA6cmV0dXJuIChNYXRoLmZsb29yKGkvMikrTWF0aC5mbG9vcihqLzMpKSUyPT0wO2Nhc2UgUVJNYXNrUGF0dGVybi5QQVRURVJOMTAxOnJldHVybiAoaSpqKSUyKyhpKmopJTM9PTA7Y2FzZSBRUk1hc2tQYXR0ZXJuLlBBVFRFUk4xMTA6cmV0dXJuICgoaSpqKSUyKyhpKmopJTMpJTI9PTA7Y2FzZSBRUk1hc2tQYXR0ZXJuLlBBVFRFUk4xMTE6cmV0dXJuICgoaSpqKSUzKyhpK2opJTIpJTI9PTA7ZGVmYXVsdDp0aHJvdyBuZXcgRXJyb3IoXCJiYWQgbWFza1BhdHRlcm46XCIrbWFza1BhdHRlcm4pO319LGdldEVycm9yQ29ycmVjdFBvbHlub21pYWw6ZnVuY3Rpb24oZXJyb3JDb3JyZWN0TGVuZ3RoKXt2YXIgYT1uZXcgUVJQb2x5bm9taWFsKFsxXSwwKTtmb3IodmFyIGk9MDtpPGVycm9yQ29ycmVjdExlbmd0aDtpKyspe2E9YS5tdWx0aXBseShuZXcgUVJQb2x5bm9taWFsKFsxLFFSTWF0aC5nZXhwKGkpXSwwKSk7fVxucmV0dXJuIGE7fSxnZXRMZW5ndGhJbkJpdHM6ZnVuY3Rpb24obW9kZSx0eXBlKXtpZigxPD10eXBlJiZ0eXBlPDEwKXtzd2l0Y2gobW9kZSl7Y2FzZSBRUk1vZGUuTU9ERV9OVU1CRVI6cmV0dXJuIDEwO2Nhc2UgUVJNb2RlLk1PREVfQUxQSEFfTlVNOnJldHVybiA5O2Nhc2UgUVJNb2RlLk1PREVfOEJJVF9CWVRFOnJldHVybiA4O2Nhc2UgUVJNb2RlLk1PREVfS0FOSkk6cmV0dXJuIDg7ZGVmYXVsdDp0aHJvdyBuZXcgRXJyb3IoXCJtb2RlOlwiK21vZGUpO319ZWxzZSBpZih0eXBlPDI3KXtzd2l0Y2gobW9kZSl7Y2FzZSBRUk1vZGUuTU9ERV9OVU1CRVI6cmV0dXJuIDEyO2Nhc2UgUVJNb2RlLk1PREVfQUxQSEFfTlVNOnJldHVybiAxMTtjYXNlIFFSTW9kZS5NT0RFXzhCSVRfQllURTpyZXR1cm4gMTY7Y2FzZSBRUk1vZGUuTU9ERV9LQU5KSTpyZXR1cm4gMTA7ZGVmYXVsdDp0aHJvdyBuZXcgRXJyb3IoXCJtb2RlOlwiK21vZGUpO319ZWxzZSBpZih0eXBlPDQxKXtzd2l0Y2gobW9kZSl7Y2FzZSBRUk1vZGUuTU9ERV9OVU1CRVI6cmV0dXJuIDE0O2Nhc2UgUVJNb2RlLk1PREVfQUxQSEFfTlVNOnJldHVybiAxMztjYXNlIFFSTW9kZS5NT0RFXzhCSVRfQllURTpyZXR1cm4gMTY7Y2FzZSBRUk1vZGUuTU9ERV9LQU5KSTpyZXR1cm4gMTI7ZGVmYXVsdDp0aHJvdyBuZXcgRXJyb3IoXCJtb2RlOlwiK21vZGUpO319ZWxzZSB7dGhyb3cgbmV3IEVycm9yKFwidHlwZTpcIit0eXBlKTt9fSxnZXRMb3N0UG9pbnQ6ZnVuY3Rpb24ocXJDb2RlKXt2YXIgbW9kdWxlQ291bnQ9cXJDb2RlLmdldE1vZHVsZUNvdW50KCk7dmFyIGxvc3RQb2ludD0wO2Zvcih2YXIgcm93PTA7cm93PG1vZHVsZUNvdW50O3JvdysrKXtmb3IodmFyIGNvbD0wO2NvbDxtb2R1bGVDb3VudDtjb2wrKyl7dmFyIHNhbWVDb3VudD0wO3ZhciBkYXJrPXFyQ29kZS5pc0Rhcmsocm93LGNvbCk7Zm9yKHZhciByPS0xO3I8PTE7cisrKXtpZihyb3crcjwwfHxtb2R1bGVDb3VudDw9cm93K3Ipe2NvbnRpbnVlO31cbmZvcih2YXIgYz0tMTtjPD0xO2MrKyl7aWYoY29sK2M8MHx8bW9kdWxlQ291bnQ8PWNvbCtjKXtjb250aW51ZTt9XG5pZihyPT0wJiZjPT0wKXtjb250aW51ZTt9XG5pZihkYXJrPT1xckNvZGUuaXNEYXJrKHJvdytyLGNvbCtjKSl7c2FtZUNvdW50Kys7fX19XG5pZihzYW1lQ291bnQ+NSl7bG9zdFBvaW50Kz0oMytzYW1lQ291bnQtNSk7fX19XG5mb3IodmFyIHJvdz0wO3Jvdzxtb2R1bGVDb3VudC0xO3JvdysrKXtmb3IodmFyIGNvbD0wO2NvbDxtb2R1bGVDb3VudC0xO2NvbCsrKXt2YXIgY291bnQ9MDtpZihxckNvZGUuaXNEYXJrKHJvdyxjb2wpKWNvdW50Kys7aWYocXJDb2RlLmlzRGFyayhyb3crMSxjb2wpKWNvdW50Kys7aWYocXJDb2RlLmlzRGFyayhyb3csY29sKzEpKWNvdW50Kys7aWYocXJDb2RlLmlzRGFyayhyb3crMSxjb2wrMSkpY291bnQrKztpZihjb3VudD09MHx8Y291bnQ9PTQpe2xvc3RQb2ludCs9Mzt9fX1cbmZvcih2YXIgcm93PTA7cm93PG1vZHVsZUNvdW50O3JvdysrKXtmb3IodmFyIGNvbD0wO2NvbDxtb2R1bGVDb3VudC02O2NvbCsrKXtpZihxckNvZGUuaXNEYXJrKHJvdyxjb2wpJiYhcXJDb2RlLmlzRGFyayhyb3csY29sKzEpJiZxckNvZGUuaXNEYXJrKHJvdyxjb2wrMikmJnFyQ29kZS5pc0Rhcmsocm93LGNvbCszKSYmcXJDb2RlLmlzRGFyayhyb3csY29sKzQpJiYhcXJDb2RlLmlzRGFyayhyb3csY29sKzUpJiZxckNvZGUuaXNEYXJrKHJvdyxjb2wrNikpe2xvc3RQb2ludCs9NDA7fX19XG5mb3IodmFyIGNvbD0wO2NvbDxtb2R1bGVDb3VudDtjb2wrKyl7Zm9yKHZhciByb3c9MDtyb3c8bW9kdWxlQ291bnQtNjtyb3crKyl7aWYocXJDb2RlLmlzRGFyayhyb3csY29sKSYmIXFyQ29kZS5pc0Rhcmsocm93KzEsY29sKSYmcXJDb2RlLmlzRGFyayhyb3crMixjb2wpJiZxckNvZGUuaXNEYXJrKHJvdyszLGNvbCkmJnFyQ29kZS5pc0Rhcmsocm93KzQsY29sKSYmIXFyQ29kZS5pc0Rhcmsocm93KzUsY29sKSYmcXJDb2RlLmlzRGFyayhyb3crNixjb2wpKXtsb3N0UG9pbnQrPTQwO319fVxudmFyIGRhcmtDb3VudD0wO2Zvcih2YXIgY29sPTA7Y29sPG1vZHVsZUNvdW50O2NvbCsrKXtmb3IodmFyIHJvdz0wO3Jvdzxtb2R1bGVDb3VudDtyb3crKyl7aWYocXJDb2RlLmlzRGFyayhyb3csY29sKSl7ZGFya0NvdW50Kys7fX19XG52YXIgcmF0aW89TWF0aC5hYnMoMTAwKmRhcmtDb3VudC9tb2R1bGVDb3VudC9tb2R1bGVDb3VudC01MCkvNTtsb3N0UG9pbnQrPXJhdGlvKjEwO3JldHVybiBsb3N0UG9pbnQ7fX07dmFyIFFSTWF0aD17Z2xvZzpmdW5jdGlvbihuKXtpZihuPDEpe3Rocm93IG5ldyBFcnJvcihcImdsb2coXCIrbitcIilcIik7fVxucmV0dXJuIFFSTWF0aC5MT0dfVEFCTEVbbl07fSxnZXhwOmZ1bmN0aW9uKG4pe3doaWxlKG48MCl7bis9MjU1O31cbndoaWxlKG4+PTI1Nil7bi09MjU1O31cbnJldHVybiBRUk1hdGguRVhQX1RBQkxFW25dO30sRVhQX1RBQkxFOm5ldyBBcnJheSgyNTYpLExPR19UQUJMRTpuZXcgQXJyYXkoMjU2KX07Zm9yKHZhciBpPTA7aTw4O2krKyl7UVJNYXRoLkVYUF9UQUJMRVtpXT0xPDxpO31cbmZvcih2YXIgaT04O2k8MjU2O2krKyl7UVJNYXRoLkVYUF9UQUJMRVtpXT1RUk1hdGguRVhQX1RBQkxFW2ktNF1eUVJNYXRoLkVYUF9UQUJMRVtpLTVdXlFSTWF0aC5FWFBfVEFCTEVbaS02XV5RUk1hdGguRVhQX1RBQkxFW2ktOF07fVxuZm9yKHZhciBpPTA7aTwyNTU7aSsrKXtRUk1hdGguTE9HX1RBQkxFW1FSTWF0aC5FWFBfVEFCTEVbaV1dPWk7fVxuZnVuY3Rpb24gUVJQb2x5bm9taWFsKG51bSxzaGlmdCl7aWYobnVtLmxlbmd0aD09dW5kZWZpbmVkKXt0aHJvdyBuZXcgRXJyb3IobnVtLmxlbmd0aCtcIi9cIitzaGlmdCk7fVxudmFyIG9mZnNldD0wO3doaWxlKG9mZnNldDxudW0ubGVuZ3RoJiZudW1bb2Zmc2V0XT09MCl7b2Zmc2V0Kys7fVxudGhpcy5udW09bmV3IEFycmF5KG51bS5sZW5ndGgtb2Zmc2V0K3NoaWZ0KTtmb3IodmFyIGk9MDtpPG51bS5sZW5ndGgtb2Zmc2V0O2krKyl7dGhpcy5udW1baV09bnVtW2krb2Zmc2V0XTt9fVxuUVJQb2x5bm9taWFsLnByb3RvdHlwZT17Z2V0OmZ1bmN0aW9uKGluZGV4KXtyZXR1cm4gdGhpcy5udW1baW5kZXhdO30sZ2V0TGVuZ3RoOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMubnVtLmxlbmd0aDt9LG11bHRpcGx5OmZ1bmN0aW9uKGUpe3ZhciBudW09bmV3IEFycmF5KHRoaXMuZ2V0TGVuZ3RoKCkrZS5nZXRMZW5ndGgoKS0xKTtmb3IodmFyIGk9MDtpPHRoaXMuZ2V0TGVuZ3RoKCk7aSsrKXtmb3IodmFyIGo9MDtqPGUuZ2V0TGVuZ3RoKCk7aisrKXtudW1baStqXV49UVJNYXRoLmdleHAoUVJNYXRoLmdsb2codGhpcy5nZXQoaSkpK1FSTWF0aC5nbG9nKGUuZ2V0KGopKSk7fX1cbnJldHVybiBuZXcgUVJQb2x5bm9taWFsKG51bSwwKTt9LG1vZDpmdW5jdGlvbihlKXtpZih0aGlzLmdldExlbmd0aCgpLWUuZ2V0TGVuZ3RoKCk8MCl7cmV0dXJuIHRoaXM7fVxudmFyIHJhdGlvPVFSTWF0aC5nbG9nKHRoaXMuZ2V0KDApKS1RUk1hdGguZ2xvZyhlLmdldCgwKSk7dmFyIG51bT1uZXcgQXJyYXkodGhpcy5nZXRMZW5ndGgoKSk7Zm9yKHZhciBpPTA7aTx0aGlzLmdldExlbmd0aCgpO2krKyl7bnVtW2ldPXRoaXMuZ2V0KGkpO31cbmZvcih2YXIgaT0wO2k8ZS5nZXRMZW5ndGgoKTtpKyspe251bVtpXV49UVJNYXRoLmdleHAoUVJNYXRoLmdsb2coZS5nZXQoaSkpK3JhdGlvKTt9XG5yZXR1cm4gbmV3IFFSUG9seW5vbWlhbChudW0sMCkubW9kKGUpO319O2Z1bmN0aW9uIFFSUlNCbG9jayh0b3RhbENvdW50LGRhdGFDb3VudCl7dGhpcy50b3RhbENvdW50PXRvdGFsQ291bnQ7dGhpcy5kYXRhQ291bnQ9ZGF0YUNvdW50O31cblFSUlNCbG9jay5SU19CTE9DS19UQUJMRT1bWzEsMjYsMTldLFsxLDI2LDE2XSxbMSwyNiwxM10sWzEsMjYsOV0sWzEsNDQsMzRdLFsxLDQ0LDI4XSxbMSw0NCwyMl0sWzEsNDQsMTZdLFsxLDcwLDU1XSxbMSw3MCw0NF0sWzIsMzUsMTddLFsyLDM1LDEzXSxbMSwxMDAsODBdLFsyLDUwLDMyXSxbMiw1MCwyNF0sWzQsMjUsOV0sWzEsMTM0LDEwOF0sWzIsNjcsNDNdLFsyLDMzLDE1LDIsMzQsMTZdLFsyLDMzLDExLDIsMzQsMTJdLFsyLDg2LDY4XSxbNCw0MywyN10sWzQsNDMsMTldLFs0LDQzLDE1XSxbMiw5OCw3OF0sWzQsNDksMzFdLFsyLDMyLDE0LDQsMzMsMTVdLFs0LDM5LDEzLDEsNDAsMTRdLFsyLDEyMSw5N10sWzIsNjAsMzgsMiw2MSwzOV0sWzQsNDAsMTgsMiw0MSwxOV0sWzQsNDAsMTQsMiw0MSwxNV0sWzIsMTQ2LDExNl0sWzMsNTgsMzYsMiw1OSwzN10sWzQsMzYsMTYsNCwzNywxN10sWzQsMzYsMTIsNCwzNywxM10sWzIsODYsNjgsMiw4Nyw2OV0sWzQsNjksNDMsMSw3MCw0NF0sWzYsNDMsMTksMiw0NCwyMF0sWzYsNDMsMTUsMiw0NCwxNl0sWzQsMTAxLDgxXSxbMSw4MCw1MCw0LDgxLDUxXSxbNCw1MCwyMiw0LDUxLDIzXSxbMywzNiwxMiw4LDM3LDEzXSxbMiwxMTYsOTIsMiwxMTcsOTNdLFs2LDU4LDM2LDIsNTksMzddLFs0LDQ2LDIwLDYsNDcsMjFdLFs3LDQyLDE0LDQsNDMsMTVdLFs0LDEzMywxMDddLFs4LDU5LDM3LDEsNjAsMzhdLFs4LDQ0LDIwLDQsNDUsMjFdLFsxMiwzMywxMSw0LDM0LDEyXSxbMywxNDUsMTE1LDEsMTQ2LDExNl0sWzQsNjQsNDAsNSw2NSw0MV0sWzExLDM2LDE2LDUsMzcsMTddLFsxMSwzNiwxMiw1LDM3LDEzXSxbNSwxMDksODcsMSwxMTAsODhdLFs1LDY1LDQxLDUsNjYsNDJdLFs1LDU0LDI0LDcsNTUsMjVdLFsxMSwzNiwxMl0sWzUsMTIyLDk4LDEsMTIzLDk5XSxbNyw3Myw0NSwzLDc0LDQ2XSxbMTUsNDMsMTksMiw0NCwyMF0sWzMsNDUsMTUsMTMsNDYsMTZdLFsxLDEzNSwxMDcsNSwxMzYsMTA4XSxbMTAsNzQsNDYsMSw3NSw0N10sWzEsNTAsMjIsMTUsNTEsMjNdLFsyLDQyLDE0LDE3LDQzLDE1XSxbNSwxNTAsMTIwLDEsMTUxLDEyMV0sWzksNjksNDMsNCw3MCw0NF0sWzE3LDUwLDIyLDEsNTEsMjNdLFsyLDQyLDE0LDE5LDQzLDE1XSxbMywxNDEsMTEzLDQsMTQyLDExNF0sWzMsNzAsNDQsMTEsNzEsNDVdLFsxNyw0NywyMSw0LDQ4LDIyXSxbOSwzOSwxMywxNiw0MCwxNF0sWzMsMTM1LDEwNyw1LDEzNiwxMDhdLFszLDY3LDQxLDEzLDY4LDQyXSxbMTUsNTQsMjQsNSw1NSwyNV0sWzE1LDQzLDE1LDEwLDQ0LDE2XSxbNCwxNDQsMTE2LDQsMTQ1LDExN10sWzE3LDY4LDQyXSxbMTcsNTAsMjIsNiw1MSwyM10sWzE5LDQ2LDE2LDYsNDcsMTddLFsyLDEzOSwxMTEsNywxNDAsMTEyXSxbMTcsNzQsNDZdLFs3LDU0LDI0LDE2LDU1LDI1XSxbMzQsMzcsMTNdLFs0LDE1MSwxMjEsNSwxNTIsMTIyXSxbNCw3NSw0NywxNCw3Niw0OF0sWzExLDU0LDI0LDE0LDU1LDI1XSxbMTYsNDUsMTUsMTQsNDYsMTZdLFs2LDE0NywxMTcsNCwxNDgsMTE4XSxbNiw3Myw0NSwxNCw3NCw0Nl0sWzExLDU0LDI0LDE2LDU1LDI1XSxbMzAsNDYsMTYsMiw0NywxN10sWzgsMTMyLDEwNiw0LDEzMywxMDddLFs4LDc1LDQ3LDEzLDc2LDQ4XSxbNyw1NCwyNCwyMiw1NSwyNV0sWzIyLDQ1LDE1LDEzLDQ2LDE2XSxbMTAsMTQyLDExNCwyLDE0MywxMTVdLFsxOSw3NCw0Niw0LDc1LDQ3XSxbMjgsNTAsMjIsNiw1MSwyM10sWzMzLDQ2LDE2LDQsNDcsMTddLFs4LDE1MiwxMjIsNCwxNTMsMTIzXSxbMjIsNzMsNDUsMyw3NCw0Nl0sWzgsNTMsMjMsMjYsNTQsMjRdLFsxMiw0NSwxNSwyOCw0NiwxNl0sWzMsMTQ3LDExNywxMCwxNDgsMTE4XSxbMyw3Myw0NSwyMyw3NCw0Nl0sWzQsNTQsMjQsMzEsNTUsMjVdLFsxMSw0NSwxNSwzMSw0NiwxNl0sWzcsMTQ2LDExNiw3LDE0NywxMTddLFsyMSw3Myw0NSw3LDc0LDQ2XSxbMSw1MywyMywzNyw1NCwyNF0sWzE5LDQ1LDE1LDI2LDQ2LDE2XSxbNSwxNDUsMTE1LDEwLDE0NiwxMTZdLFsxOSw3NSw0NywxMCw3Niw0OF0sWzE1LDU0LDI0LDI1LDU1LDI1XSxbMjMsNDUsMTUsMjUsNDYsMTZdLFsxMywxNDUsMTE1LDMsMTQ2LDExNl0sWzIsNzQsNDYsMjksNzUsNDddLFs0Miw1NCwyNCwxLDU1LDI1XSxbMjMsNDUsMTUsMjgsNDYsMTZdLFsxNywxNDUsMTE1XSxbMTAsNzQsNDYsMjMsNzUsNDddLFsxMCw1NCwyNCwzNSw1NSwyNV0sWzE5LDQ1LDE1LDM1LDQ2LDE2XSxbMTcsMTQ1LDExNSwxLDE0NiwxMTZdLFsxNCw3NCw0NiwyMSw3NSw0N10sWzI5LDU0LDI0LDE5LDU1LDI1XSxbMTEsNDUsMTUsNDYsNDYsMTZdLFsxMywxNDUsMTE1LDYsMTQ2LDExNl0sWzE0LDc0LDQ2LDIzLDc1LDQ3XSxbNDQsNTQsMjQsNyw1NSwyNV0sWzU5LDQ2LDE2LDEsNDcsMTddLFsxMiwxNTEsMTIxLDcsMTUyLDEyMl0sWzEyLDc1LDQ3LDI2LDc2LDQ4XSxbMzksNTQsMjQsMTQsNTUsMjVdLFsyMiw0NSwxNSw0MSw0NiwxNl0sWzYsMTUxLDEyMSwxNCwxNTIsMTIyXSxbNiw3NSw0NywzNCw3Niw0OF0sWzQ2LDU0LDI0LDEwLDU1LDI1XSxbMiw0NSwxNSw2NCw0NiwxNl0sWzE3LDE1MiwxMjIsNCwxNTMsMTIzXSxbMjksNzQsNDYsMTQsNzUsNDddLFs0OSw1NCwyNCwxMCw1NSwyNV0sWzI0LDQ1LDE1LDQ2LDQ2LDE2XSxbNCwxNTIsMTIyLDE4LDE1MywxMjNdLFsxMyw3NCw0NiwzMiw3NSw0N10sWzQ4LDU0LDI0LDE0LDU1LDI1XSxbNDIsNDUsMTUsMzIsNDYsMTZdLFsyMCwxNDcsMTE3LDQsMTQ4LDExOF0sWzQwLDc1LDQ3LDcsNzYsNDhdLFs0Myw1NCwyNCwyMiw1NSwyNV0sWzEwLDQ1LDE1LDY3LDQ2LDE2XSxbMTksMTQ4LDExOCw2LDE0OSwxMTldLFsxOCw3NSw0NywzMSw3Niw0OF0sWzM0LDU0LDI0LDM0LDU1LDI1XSxbMjAsNDUsMTUsNjEsNDYsMTZdXTtRUlJTQmxvY2suZ2V0UlNCbG9ja3M9ZnVuY3Rpb24odHlwZU51bWJlcixlcnJvckNvcnJlY3RMZXZlbCl7dmFyIHJzQmxvY2s9UVJSU0Jsb2NrLmdldFJzQmxvY2tUYWJsZSh0eXBlTnVtYmVyLGVycm9yQ29ycmVjdExldmVsKTtpZihyc0Jsb2NrPT11bmRlZmluZWQpe3Rocm93IG5ldyBFcnJvcihcImJhZCBycyBibG9jayBAIHR5cGVOdW1iZXI6XCIrdHlwZU51bWJlcitcIi9lcnJvckNvcnJlY3RMZXZlbDpcIitlcnJvckNvcnJlY3RMZXZlbCk7fVxudmFyIGxlbmd0aD1yc0Jsb2NrLmxlbmd0aC8zO3ZhciBsaXN0PVtdO2Zvcih2YXIgaT0wO2k8bGVuZ3RoO2krKyl7dmFyIGNvdW50PXJzQmxvY2tbaSozKzBdO3ZhciB0b3RhbENvdW50PXJzQmxvY2tbaSozKzFdO3ZhciBkYXRhQ291bnQ9cnNCbG9ja1tpKjMrMl07Zm9yKHZhciBqPTA7ajxjb3VudDtqKyspe2xpc3QucHVzaChuZXcgUVJSU0Jsb2NrKHRvdGFsQ291bnQsZGF0YUNvdW50KSk7fX1cbnJldHVybiBsaXN0O307UVJSU0Jsb2NrLmdldFJzQmxvY2tUYWJsZT1mdW5jdGlvbih0eXBlTnVtYmVyLGVycm9yQ29ycmVjdExldmVsKXtzd2l0Y2goZXJyb3JDb3JyZWN0TGV2ZWwpe2Nhc2UgUVJFcnJvckNvcnJlY3RMZXZlbC5MOnJldHVybiBRUlJTQmxvY2suUlNfQkxPQ0tfVEFCTEVbKHR5cGVOdW1iZXItMSkqNCswXTtjYXNlIFFSRXJyb3JDb3JyZWN0TGV2ZWwuTTpyZXR1cm4gUVJSU0Jsb2NrLlJTX0JMT0NLX1RBQkxFWyh0eXBlTnVtYmVyLTEpKjQrMV07Y2FzZSBRUkVycm9yQ29ycmVjdExldmVsLlE6cmV0dXJuIFFSUlNCbG9jay5SU19CTE9DS19UQUJMRVsodHlwZU51bWJlci0xKSo0KzJdO2Nhc2UgUVJFcnJvckNvcnJlY3RMZXZlbC5IOnJldHVybiBRUlJTQmxvY2suUlNfQkxPQ0tfVEFCTEVbKHR5cGVOdW1iZXItMSkqNCszXTtkZWZhdWx0OnJldHVybiB1bmRlZmluZWQ7fX07ZnVuY3Rpb24gUVJCaXRCdWZmZXIoKXt0aGlzLmJ1ZmZlcj1bXTt0aGlzLmxlbmd0aD0wO31cblFSQml0QnVmZmVyLnByb3RvdHlwZT17Z2V0OmZ1bmN0aW9uKGluZGV4KXt2YXIgYnVmSW5kZXg9TWF0aC5mbG9vcihpbmRleC84KTtyZXR1cm4gKCh0aGlzLmJ1ZmZlcltidWZJbmRleF0+Pj4oNy1pbmRleCU4KSkmMSk9PTE7fSxwdXQ6ZnVuY3Rpb24obnVtLGxlbmd0aCl7Zm9yKHZhciBpPTA7aTxsZW5ndGg7aSsrKXt0aGlzLnB1dEJpdCgoKG51bT4+PihsZW5ndGgtaS0xKSkmMSk9PTEpO319LGdldExlbmd0aEluQml0czpmdW5jdGlvbigpe3JldHVybiB0aGlzLmxlbmd0aDt9LHB1dEJpdDpmdW5jdGlvbihiaXQpe3ZhciBidWZJbmRleD1NYXRoLmZsb29yKHRoaXMubGVuZ3RoLzgpO2lmKHRoaXMuYnVmZmVyLmxlbmd0aDw9YnVmSW5kZXgpe3RoaXMuYnVmZmVyLnB1c2goMCk7fVxuaWYoYml0KXt0aGlzLmJ1ZmZlcltidWZJbmRleF18PSgweDgwPj4+KHRoaXMubGVuZ3RoJTgpKTt9XG50aGlzLmxlbmd0aCsrO319O3ZhciBRUkNvZGVMaW1pdExlbmd0aD1bWzE3LDE0LDExLDddLFszMiwyNiwyMCwxNF0sWzUzLDQyLDMyLDI0XSxbNzgsNjIsNDYsMzRdLFsxMDYsODQsNjAsNDRdLFsxMzQsMTA2LDc0LDU4XSxbMTU0LDEyMiw4Niw2NF0sWzE5MiwxNTIsMTA4LDg0XSxbMjMwLDE4MCwxMzAsOThdLFsyNzEsMjEzLDE1MSwxMTldLFszMjEsMjUxLDE3NywxMzddLFszNjcsMjg3LDIwMywxNTVdLFs0MjUsMzMxLDI0MSwxNzddLFs0NTgsMzYyLDI1OCwxOTRdLFs1MjAsNDEyLDI5MiwyMjBdLFs1ODYsNDUwLDMyMiwyNTBdLFs2NDQsNTA0LDM2NCwyODBdLFs3MTgsNTYwLDM5NCwzMTBdLFs3OTIsNjI0LDQ0MiwzMzhdLFs4NTgsNjY2LDQ4MiwzODJdLFs5MjksNzExLDUwOSw0MDNdLFsxMDAzLDc3OSw1NjUsNDM5XSxbMTA5MSw4NTcsNjExLDQ2MV0sWzExNzEsOTExLDY2MSw1MTFdLFsxMjczLDk5Nyw3MTUsNTM1XSxbMTM2NywxMDU5LDc1MSw1OTNdLFsxNDY1LDExMjUsODA1LDYyNV0sWzE1MjgsMTE5MCw4NjgsNjU4XSxbMTYyOCwxMjY0LDkwOCw2OThdLFsxNzMyLDEzNzAsOTgyLDc0Ml0sWzE4NDAsMTQ1MiwxMDMwLDc5MF0sWzE5NTIsMTUzOCwxMTEyLDg0Ml0sWzIwNjgsMTYyOCwxMTY4LDg5OF0sWzIxODgsMTcyMiwxMjI4LDk1OF0sWzIzMDMsMTgwOSwxMjgzLDk4M10sWzI0MzEsMTkxMSwxMzUxLDEwNTFdLFsyNTYzLDE5ODksMTQyMywxMDkzXSxbMjY5OSwyMDk5LDE0OTksMTEzOV0sWzI4MDksMjIxMywxNTc5LDEyMTldLFsyOTUzLDIzMzEsMTY2MywxMjczXV07XG5cblxuLyoqIENvbnN0cnVjdG9yICovXG5mdW5jdGlvbiBRUkNvZGUob3B0aW9ucykge1xuICBcbiAgLy9EZWZhdWx0IG9wdGlvbnNcbiAgdGhpcy5vcHRpb25zID0ge1xuICAgIHBhZGRpbmc6IDQsXG4gICAgd2lkdGg6IDI1NiwgXG4gICAgaGVpZ2h0OiAyNTYsXG4gICAgdHlwZU51bWJlcjogNCxcbiAgICBjb2xvcjogXCIjMDAwMDAwXCIsXG4gICAgYmFja2dyb3VuZDogXCIjZmZmZmZmXCIsXG4gICAgZWNsOiBcIk1cIlxuICB9O1xuICBcbiAgLy9JbiBjYXNlIHRoZSBvcHRpb25zIGlzIHN0cmluZ1xuICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnKSB7XG4gICAgb3B0aW9ucyA9IHtcbiAgICAgIGNvbnRlbnQ6IG9wdGlvbnNcbiAgICB9O1xuICB9XG4gIFxuICAvL01lcmdlIG9wdGlvbnNcbiAgaWYgKG9wdGlvbnMpIHtcbiAgICBmb3IgKHZhciBpIGluIG9wdGlvbnMpIHtcbiAgICAgIHRoaXMub3B0aW9uc1tpXSA9IG9wdGlvbnNbaV07XG4gICAgfVxuICB9XG4gIFxuICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5jb250ZW50ICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGVkICdjb250ZW50JyBhcyBzdHJpbmchXCIpO1xuICB9XG4gIFxuICBpZiAodGhpcy5vcHRpb25zLmNvbnRlbnQubGVuZ3RoID09PSAwIC8qIHx8IHRoaXMub3B0aW9ucy5jb250ZW50Lmxlbmd0aCA+IDcwODkgKi8pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCAnY29udGVudCcgdG8gYmUgbm9uLWVtcHR5IVwiKTtcbiAgfVxuICBcbiAgaWYgKCEodGhpcy5vcHRpb25zLnBhZGRpbmcgPj0gMCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCAncGFkZGluZycgdmFsdWUgdG8gYmUgbm9uLW5lZ2F0aXZlIVwiKTtcbiAgfVxuICBcbiAgaWYgKCEodGhpcy5vcHRpb25zLndpZHRoID4gMCkgfHwgISh0aGlzLm9wdGlvbnMuaGVpZ2h0ID4gMCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCAnd2lkdGgnIG9yICdoZWlnaHQnIHZhbHVlIHRvIGJlIGhpZ2hlciB0aGFuIHplcm8hXCIpO1xuICB9XG4gIFxuICAvL0dldHMgdGhlIGVycm9yIGNvcnJlY3Rpb24gbGV2ZWxcbiAgZnVuY3Rpb24gX2dldEVycm9yQ29ycmVjdExldmVsKGVjbCkge1xuICAgIHN3aXRjaCAoZWNsKSB7XG4gICAgICAgIGNhc2UgXCJMXCI6XG4gICAgICAgICAgcmV0dXJuIFFSRXJyb3JDb3JyZWN0TGV2ZWwuTDtcbiAgICAgICAgICBcbiAgICAgICAgY2FzZSBcIk1cIjpcbiAgICAgICAgICByZXR1cm4gUVJFcnJvckNvcnJlY3RMZXZlbC5NO1xuICAgICAgICAgIFxuICAgICAgICBjYXNlIFwiUVwiOlxuICAgICAgICAgIHJldHVybiBRUkVycm9yQ29ycmVjdExldmVsLlE7XG4gICAgICAgICAgXG4gICAgICAgIGNhc2UgXCJIXCI6XG4gICAgICAgICAgcmV0dXJuIFFSRXJyb3JDb3JyZWN0TGV2ZWwuSDtcbiAgICAgICAgICBcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtud29uIGVycm9yIGNvcnJlY3Rpb24gbGV2ZWw6IFwiICsgZWNsKTtcbiAgICAgIH1cbiAgfVxuICBcbiAgLy9HZXQgdHlwZSBudW1iZXJcbiAgZnVuY3Rpb24gX2dldFR5cGVOdW1iZXIoY29udGVudCwgZWNsKSB7ICAgICAgXG4gICAgdmFyIGxlbmd0aCA9IF9nZXRVVEY4TGVuZ3RoKGNvbnRlbnQpO1xuICAgIFxuICAgIHZhciB0eXBlID0gMTtcbiAgICB2YXIgbGltaXQgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBRUkNvZGVMaW1pdExlbmd0aC5sZW5ndGg7IGkgPD0gbGVuOyBpKyspIHtcbiAgICAgIHZhciB0YWJsZSA9IFFSQ29kZUxpbWl0TGVuZ3RoW2ldO1xuICAgICAgaWYgKCF0YWJsZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb250ZW50IHRvbyBsb25nOiBleHBlY3RlZCBcIiArIGxpbWl0ICsgXCIgYnV0IGdvdCBcIiArIGxlbmd0aCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHN3aXRjaCAoZWNsKSB7XG4gICAgICAgIGNhc2UgXCJMXCI6XG4gICAgICAgICAgbGltaXQgPSB0YWJsZVswXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgICBcbiAgICAgICAgY2FzZSBcIk1cIjpcbiAgICAgICAgICBsaW1pdCA9IHRhYmxlWzFdO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIFxuICAgICAgICBjYXNlIFwiUVwiOlxuICAgICAgICAgIGxpbWl0ID0gdGFibGVbMl07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgXG4gICAgICAgIGNhc2UgXCJIXCI6XG4gICAgICAgICAgbGltaXQgPSB0YWJsZVszXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgICBcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtud29uIGVycm9yIGNvcnJlY3Rpb24gbGV2ZWw6IFwiICsgZWNsKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYgKGxlbmd0aCA8PSBsaW1pdCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIFxuICAgICAgdHlwZSsrO1xuICAgIH1cbiAgICBcbiAgICBpZiAodHlwZSA+IFFSQ29kZUxpbWl0TGVuZ3RoLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29udGVudCB0b28gbG9uZ1wiKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR5cGU7XG4gIH1cblxuICAvL0dldHMgdGV4dCBsZW5ndGhcbiAgZnVuY3Rpb24gX2dldFVURjhMZW5ndGgoY29udGVudCkge1xuICAgIHZhciByZXN1bHQgPSBlbmNvZGVVUkkoY29udGVudCkudG9TdHJpbmcoKS5yZXBsYWNlKC9cXCVbMC05YS1mQS1GXXsyfS9nLCAnYScpO1xuICAgIHJldHVybiByZXN1bHQubGVuZ3RoICsgKHJlc3VsdC5sZW5ndGggIT0gY29udGVudCA/IDMgOiAwKTtcbiAgfVxuICBcbiAgLy9HZW5lcmF0ZSBRUiBDb2RlIG1hdHJpeFxuICB2YXIgY29udGVudCA9IHRoaXMub3B0aW9ucy5jb250ZW50O1xuICB2YXIgdHlwZSA9IF9nZXRUeXBlTnVtYmVyKGNvbnRlbnQsIHRoaXMub3B0aW9ucy5lY2wpO1xuICB2YXIgZWNsID0gX2dldEVycm9yQ29ycmVjdExldmVsKHRoaXMub3B0aW9ucy5lY2wpO1xuICB0aGlzLnFyY29kZSA9IG5ldyBRUkNvZGVNb2RlbCh0eXBlLCBlY2wpO1xuICB0aGlzLnFyY29kZS5hZGREYXRhKGNvbnRlbnQpO1xuICB0aGlzLnFyY29kZS5tYWtlKCk7XG59XG5cbi8qKiBHZW5lcmF0ZXMgUVIgQ29kZSBhcyBTVkcgaW1hZ2UgKi9cblFSQ29kZS5wcm90b3R5cGUuc3ZnID0gZnVuY3Rpb24ob3B0KSB7XG4gIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zIHx8IHsgfTtcbiAgdmFyIG1vZHVsZXMgPSB0aGlzLnFyY29kZS5tb2R1bGVzO1xuICBcbiAgaWYgKHR5cGVvZiBvcHQgPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIG9wdCA9IHsgY29udGFpbmVyOiBvcHRpb25zLmNvbnRhaW5lciB8fCBcInN2Z1wiIH07XG4gIH1cbiAgXG4gIC8vQXBwbHkgbmV3IGxpbmVzIGFuZCBpbmRlbnRzIGluIFNWRz9cbiAgdmFyIHByZXR0eSA9IHR5cGVvZiBvcHRpb25zLnByZXR0eSAhPSBcInVuZGVmaW5lZFwiID8gISFvcHRpb25zLnByZXR0eSA6IHRydWU7XG4gIFxuICB2YXIgaW5kZW50ID0gcHJldHR5ID8gJyAgJyA6ICcnO1xuICB2YXIgRU9MID0gcHJldHR5ID8gJ1xcclxcbicgOiAnJztcbiAgdmFyIHdpZHRoID0gb3B0aW9ucy53aWR0aDtcbiAgdmFyIGhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0O1xuICB2YXIgbGVuZ3RoID0gbW9kdWxlcy5sZW5ndGg7XG4gIHZhciB4c2l6ZSA9IHdpZHRoIC8gKGxlbmd0aCArIDIgKiBvcHRpb25zLnBhZGRpbmcpO1xuICB2YXIgeXNpemUgPSBoZWlnaHQgLyAobGVuZ3RoICsgMiAqIG9wdGlvbnMucGFkZGluZyk7XG4gIFxuICAvL0pvaW4gKHVuaW9uLCBtZXJnZSkgcmVjdGFuZ2xlcyBpbnRvIG9uZSBzaGFwZT9cbiAgdmFyIGpvaW4gPSB0eXBlb2Ygb3B0aW9ucy5qb2luICE9IFwidW5kZWZpbmVkXCIgPyAhIW9wdGlvbnMuam9pbiA6IGZhbHNlO1xuICBcbiAgLy9Td2FwIHRoZSBYIGFuZCBZIG1vZHVsZXMsIHB1bGwgcmVxdWVzdCAjMlxuICB2YXIgc3dhcCA9IHR5cGVvZiBvcHRpb25zLnN3YXAgIT0gXCJ1bmRlZmluZWRcIiA/ICEhb3B0aW9ucy5zd2FwIDogZmFsc2U7XG4gIFxuICAvL0FwcGx5IDw/eG1sLi4uPz4gZGVjbGFyYXRpb24gaW4gU1ZHP1xuICB2YXIgeG1sRGVjbGFyYXRpb24gPSB0eXBlb2Ygb3B0aW9ucy54bWxEZWNsYXJhdGlvbiAhPSBcInVuZGVmaW5lZFwiID8gISFvcHRpb25zLnhtbERlY2xhcmF0aW9uIDogdHJ1ZTtcbiAgXG4gIC8vUG9wdWxhdGUgd2l0aCBwcmVkZWZpbmVkIHNoYXBlIGluc3RlYWQgb2YgXCJyZWN0XCIgZWxlbWVudHMsIHRoYW5rcyB0byBAa2tvY2Rrb1xuICB2YXIgcHJlZGVmaW5lZCA9IHR5cGVvZiBvcHRpb25zLnByZWRlZmluZWQgIT0gXCJ1bmRlZmluZWRcIiA/ICEhb3B0aW9ucy5wcmVkZWZpbmVkIDogZmFsc2U7XG4gIHZhciBkZWZzID0gcHJlZGVmaW5lZCA/IGluZGVudCArICc8ZGVmcz48cGF0aCBpZD1cInFybW9kdWxlXCIgZD1cIk0wIDAgaCcgKyB5c2l6ZSArICcgdicgKyB4c2l6ZSArICcgSDAgelwiIHN0eWxlPVwiZmlsbDonICsgb3B0aW9ucy5jb2xvciArICc7c2hhcGUtcmVuZGVyaW5nOmNyaXNwRWRnZXM7XCIgLz48L2RlZnM+JyArIEVPTCA6ICcnO1xuICBcbiAgLy9CYWNrZ3JvdW5kIHJlY3RhbmdsZVxuICB2YXIgYmdyZWN0ID0gaW5kZW50ICsgJzxyZWN0IHg9XCIwXCIgeT1cIjBcIiB3aWR0aD1cIicgKyB3aWR0aCArICdcIiBoZWlnaHQ9XCInICsgaGVpZ2h0ICsgJ1wiIHN0eWxlPVwiZmlsbDonICsgb3B0aW9ucy5iYWNrZ3JvdW5kICsgJztzaGFwZS1yZW5kZXJpbmc6Y3Jpc3BFZGdlcztcIi8+JyArIEVPTDtcbiAgXG4gIC8vUmVjdGFuZ2xlcyByZXByZXNlbnRpbmcgbW9kdWxlc1xuICB2YXIgbW9kcmVjdCA9ICcnO1xuICB2YXIgcGF0aGRhdGEgPSAnJztcblxuICBmb3IgKHZhciB5ID0gMDsgeSA8IGxlbmd0aDsgeSsrKSB7XG4gICAgZm9yICh2YXIgeCA9IDA7IHggPCBsZW5ndGg7IHgrKykge1xuICAgICAgdmFyIG1vZHVsZSA9IG1vZHVsZXNbeF1beV07XG4gICAgICBpZiAobW9kdWxlKSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgcHggPSAoeCAqIHhzaXplICsgb3B0aW9ucy5wYWRkaW5nICogeHNpemUpO1xuICAgICAgICB2YXIgcHkgPSAoeSAqIHlzaXplICsgb3B0aW9ucy5wYWRkaW5nICogeXNpemUpO1xuICAgICAgICBcbiAgICAgICAgLy9Tb21lIHVzZXJzIGhhdmUgaGFkIGlzc3VlcyB3aXRoIHRoZSBRUiBDb2RlLCB0aGFua3MgdG8gQGRhbmlvc28gZm9yIHRoZSBzb2x1dGlvblxuICAgICAgICBpZiAoc3dhcCkge1xuICAgICAgICAgIHZhciB0ID0gcHg7XG4gICAgICAgICAgcHggPSBweTtcbiAgICAgICAgICBweSA9IHQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChqb2luKSB7XG4gICAgICAgICAgLy9Nb2R1bGUgYXMgYSBwYXJ0IG9mIHN2ZyBwYXRoIGRhdGEsIHRoYW5rcyB0byBAZGFuaW9zb1xuICAgICAgICAgIHZhciB3ID0geHNpemUgKyBweDtcbiAgICAgICAgICB2YXIgaCA9IHlzaXplICsgcHk7XG5cbiAgICAgICAgICBweCA9IChOdW1iZXIuaXNJbnRlZ2VyKHB4KSk/IE51bWJlcihweCk6IHB4LnRvRml4ZWQoMik7XG4gICAgICAgICAgcHkgPSAoTnVtYmVyLmlzSW50ZWdlcihweSkpPyBOdW1iZXIocHkpOiBweS50b0ZpeGVkKDIpO1xuICAgICAgICAgIHcgPSAoTnVtYmVyLmlzSW50ZWdlcih3KSk/IE51bWJlcih3KTogdy50b0ZpeGVkKDIpO1xuICAgICAgICAgIGggPSAoTnVtYmVyLmlzSW50ZWdlcihoKSk/IE51bWJlcihoKTogaC50b0ZpeGVkKDIpO1xuXG4gICAgICAgICAgcGF0aGRhdGEgKz0gKCdNJyArIHB4ICsgJywnICsgcHkgKyAnIFYnICsgaCArICcgSCcgKyB3ICsgJyBWJyArIHB5ICsgJyBIJyArIHB4ICsgJyBaICcpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHByZWRlZmluZWQpIHtcbiAgICAgICAgICAvL01vZHVsZSBhcyBhIHByZWRlZmluZWQgc2hhcGUsIHRoYW5rcyB0byBAa2tvY2Rrb1xuICAgICAgICAgIG1vZHJlY3QgKz0gaW5kZW50ICsgJzx1c2UgeD1cIicgKyBweC50b1N0cmluZygpICsgJ1wiIHk9XCInICsgcHkudG9TdHJpbmcoKSArICdcIiBocmVmPVwiI3FybW9kdWxlXCIgLz4nICsgRU9MO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIC8vTW9kdWxlIGFzIHJlY3RhbmdsZSBlbGVtZW50XG4gICAgICAgICAgbW9kcmVjdCArPSBpbmRlbnQgKyAnPHJlY3QgeD1cIicgKyBweC50b1N0cmluZygpICsgJ1wiIHk9XCInICsgcHkudG9TdHJpbmcoKSArICdcIiB3aWR0aD1cIicgKyB4c2l6ZSArICdcIiBoZWlnaHQ9XCInICsgeXNpemUgKyAnXCIgc3R5bGU9XCJmaWxsOicgKyBvcHRpb25zLmNvbG9yICsgJztzaGFwZS1yZW5kZXJpbmc6Y3Jpc3BFZGdlcztcIi8+JyArIEVPTDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBcbiAgaWYgKGpvaW4pIHtcbiAgICBtb2RyZWN0ID0gaW5kZW50ICsgJzxwYXRoIHg9XCIwXCIgeT1cIjBcIiBzdHlsZT1cImZpbGw6JyArIG9wdGlvbnMuY29sb3IgKyAnO3NoYXBlLXJlbmRlcmluZzpjcmlzcEVkZ2VzO1wiIGQ9XCInICsgcGF0aGRhdGEgKyAnXCIgLz4nO1xuICB9XG5cbiAgdmFyIHN2ZyA9IFwiXCI7XG4gIHN3aXRjaCAob3B0LmNvbnRhaW5lcikge1xuICAgIC8vV3JhcHBlZCBpbiBTVkcgZG9jdW1lbnRcbiAgICBjYXNlIFwic3ZnXCI6XG4gICAgICBpZiAoeG1sRGVjbGFyYXRpb24pIHtcbiAgICAgICAgc3ZnICs9ICc8P3htbCB2ZXJzaW9uPVwiMS4wXCIgc3RhbmRhbG9uZT1cInllc1wiPz4nICsgRU9MO1xuICAgICAgfVxuICAgICAgc3ZnICs9ICc8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2ZXJzaW9uPVwiMS4xXCIgd2lkdGg9XCInICsgd2lkdGggKyAnXCIgaGVpZ2h0PVwiJyArIGhlaWdodCArICdcIj4nICsgRU9MO1xuICAgICAgc3ZnICs9IGRlZnMgKyBiZ3JlY3QgKyBtb2RyZWN0O1xuICAgICAgc3ZnICs9ICc8L3N2Zz4nO1xuICAgICAgYnJlYWs7XG4gICAgICBcbiAgICAvL1ZpZXdib3ggZm9yIHJlc3BvbnNpdmUgdXNlIGluIGEgYnJvd3NlciwgdGhhbmtzIHRvIEBkYW5pb3NvXG4gICAgY2FzZSBcInN2Zy12aWV3Ym94XCI6XG4gICAgICBpZiAoeG1sRGVjbGFyYXRpb24pIHtcbiAgICAgICAgc3ZnICs9ICc8P3htbCB2ZXJzaW9uPVwiMS4wXCIgc3RhbmRhbG9uZT1cInllc1wiPz4nICsgRU9MO1xuICAgICAgfVxuICAgICAgc3ZnICs9ICc8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2ZXJzaW9uPVwiMS4xXCIgdmlld0JveD1cIjAgMCAnICsgd2lkdGggKyAnICcgKyBoZWlnaHQgKyAnXCI+JyArIEVPTDtcbiAgICAgIHN2ZyArPSBkZWZzICsgYmdyZWN0ICsgbW9kcmVjdDtcbiAgICAgIHN2ZyArPSAnPC9zdmc+JztcbiAgICAgIGJyZWFrO1xuICAgICAgXG4gICAgXG4gICAgLy9XcmFwcGVkIGluIGdyb3VwIGVsZW1lbnQgICAgXG4gICAgY2FzZSBcImdcIjpcbiAgICAgIHN2ZyArPSAnPGcgd2lkdGg9XCInICsgd2lkdGggKyAnXCIgaGVpZ2h0PVwiJyArIGhlaWdodCArICdcIj4nICsgRU9MO1xuICAgICAgc3ZnICs9IGRlZnMgKyBiZ3JlY3QgKyBtb2RyZWN0O1xuICAgICAgc3ZnICs9ICc8L2c+JztcbiAgICAgIGJyZWFrO1xuICAgICAgXG4gICAgLy9XaXRob3V0IGEgY29udGFpbmVyXG4gICAgZGVmYXVsdDpcbiAgICAgIHN2ZyArPSAoZGVmcyArIGJncmVjdCArIG1vZHJlY3QpLnJlcGxhY2UoL15cXHMrLywgXCJcIik7IC8vQ2xlYXIgaW5kZW50cyBvbiBlYWNoIGxpbmVcbiAgICAgIGJyZWFrO1xuICB9XG4gIFxuICByZXR1cm4gc3ZnO1xufTtcblxuLyoqIFdyaXRlcyBRUiBDb2RlIGltYWdlIHRvIGEgZmlsZSAqL1xuUVJDb2RlLnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24oZmlsZSwgY2FsbGJhY2spIHtcbiAgdmFyIGRhdGEgPSB0aGlzLnN2ZygpO1xuICBpZiAodHlwZW9mIGNhbGxiYWNrICE9IFwiZnVuY3Rpb25cIikge1xuICAgIGNhbGxiYWNrID0gZnVuY3Rpb24oZXJyb3IsIHJlc3VsdCkgeyB9O1xuICB9XG4gIHRyeSB7XG4gICAgLy9QYWNrYWdlICdmcycgaXMgYXZhaWxhYmxlIGluIG5vZGUuanMgYnV0IG5vdCBpbiBhIHdlYiBicm93c2VyXG4gICAgdmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcbiAgICBmcy53cml0ZUZpbGUoZmlsZSwgZGF0YSwgY2FsbGJhY2spO1xuICB9XG4gIGNhdGNoIChlKSB7XG4gICAgLy9Tb3JyeSwgJ2ZzJyBpcyBub3QgYXZhaWxhYmxlXG4gICAgY2FsbGJhY2soZSk7XG4gIH1cbn07XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBRUkNvZGU7XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IEljb25zIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL2ljb25zL0ljb25zXCJcbmltcG9ydCB0eXBlIHsgQ3VzdG9tZXJJbmZvLCBHaWZ0Q2FyZCB9IGZyb20gXCIuLi8uLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IEN1c3RvbWVySW5mb1R5cGVSZWYsIEN1c3RvbWVyVHlwZVJlZiwgR2lmdENhcmRUeXBlUmVmIH0gZnJvbSBcIi4uLy4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCB7IGxhbmcsIE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vYXBpL21haW4vVXNlckVycm9yXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi8uLi9ndWkvYmFzZS9EaWFsb2dcIlxuaW1wb3J0IHsgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi8uLi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgRGVmYXVsdEFuaW1hdGlvblRpbWUgfSBmcm9tIFwiLi4vLi4vZ3VpL2FuaW1hdGlvbi9BbmltYXRpb25zXCJcbmltcG9ydCB7IGNvcHlUb0NsaXBib2FyZCB9IGZyb20gXCIuLi8uLi9taXNjL0NsaXBib2FyZFV0aWxzXCJcbmltcG9ydCB7IEJvb3RJY29ucyB9IGZyb20gXCIuLi8uLi9ndWkvYmFzZS9pY29ucy9Cb290SWNvbnNcIlxuaW1wb3J0IHsgaXNBbmRyb2lkQXBwLCBpc0FwcCB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBDaGVja2JveCB9IGZyb20gXCIuLi8uLi9ndWkvYmFzZS9DaGVja2JveC5qc1wiXG5pbXBvcnQgeyBLZXlzIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgQ1VSUkVOVF9HSUZUX0NBUkRfVEVSTVNfVkVSU0lPTiwgcmVuZGVyVGVybXNBbmRDb25kaXRpb25zQnV0dG9uLCBUZXJtc1NlY3Rpb24gfSBmcm9tIFwiLi4vVGVybXNBbmRDb25kaXRpb25zXCJcbmltcG9ydCB7IEljb25CdXR0b24gfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvSWNvbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBmb3JtYXRQcmljZSB9IGZyb20gXCIuLi9QcmljZVV0aWxzLmpzXCJcbmltcG9ydCB7IGh0bWxTYW5pdGl6ZXIgfSBmcm9tIFwiLi4vLi4vbWlzYy9IdG1sU2FuaXRpemVyLmpzXCJcbmltcG9ydCB7IHVybEVuY29kZUh0bWxUYWdzIH0gZnJvbSBcIi4uLy4uL21pc2MvRm9ybWF0dGVyLmpzXCJcbmltcG9ydCBRUkNvZGUgZnJvbSBcInFyY29kZS1zdmdcIlxuXG5leHBvcnQgY29uc3QgZW51bSBHaWZ0Q2FyZFN0YXR1cyB7XG5cdERlYWN0aXZhdGVkID0gXCIwXCIsXG5cdFVzYWJsZSA9IFwiMVwiLFxuXHRSZWRlZW1lZCA9IFwiMlwiLFxuXHRSZWZ1bmRlZCA9IFwiM1wiLFxuXHREaXNwdXRlZCA9IFwiNFwiLFxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0VG9rZW5Gcm9tVXJsKHVybDogc3RyaW5nKTogUHJvbWlzZTx7IGlkOiBJZDsga2V5OiBzdHJpbmcgfT4ge1xuXHRjb25zdCB0b2tlbiA9IHVybC5zdWJzdHJpbmcodXJsLmluZGV4T2YoXCIjXCIpICsgMSlcblxuXHR0cnkge1xuXHRcdGlmICghdG9rZW4pIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcigpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGF3YWl0IGxvY2F0b3IuZ2lmdENhcmRGYWNhZGUuZGVjb2RlR2lmdENhcmRUb2tlbih0b2tlbilcblx0fSBjYXRjaCAoZSkge1xuXHRcdHRocm93IG5ldyBVc2VyRXJyb3IoXCJpbnZhbGlkR2lmdENhcmRfbXNnXCIpXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRHaWZ0Q2FyZHMoY3VzdG9tZXJJZDogSWQpOiBQcm9taXNlPEdpZnRDYXJkW10+IHtcblx0Y29uc3QgZW50aXR5Q2xpZW50ID0gbG9jYXRvci5lbnRpdHlDbGllbnRcblx0cmV0dXJuIGVudGl0eUNsaWVudFxuXHRcdC5sb2FkKEN1c3RvbWVyVHlwZVJlZiwgY3VzdG9tZXJJZClcblx0XHQudGhlbigoY3VzdG9tZXIpID0+IGVudGl0eUNsaWVudC5sb2FkKEN1c3RvbWVySW5mb1R5cGVSZWYsIGN1c3RvbWVyLmN1c3RvbWVySW5mbykpXG5cdFx0LnRoZW4oKGN1c3RvbWVySW5mbzogQ3VzdG9tZXJJbmZvKSA9PiB7XG5cdFx0XHRpZiAoY3VzdG9tZXJJbmZvLmdpZnRDYXJkcykge1xuXHRcdFx0XHRyZXR1cm4gZW50aXR5Q2xpZW50LmxvYWRBbGwoR2lmdENhcmRUeXBlUmVmLCBjdXN0b21lckluZm8uZ2lmdENhcmRzLml0ZW1zKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSlcblx0XHRcdH1cblx0XHR9KVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVHaWZ0Q2FyZExpbmsoZ2lmdENhcmQ6IEdpZnRDYXJkKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0Y29uc3QgdG9rZW4gPSBhd2FpdCBsb2NhdG9yLmdpZnRDYXJkRmFjYWRlLmVuY29kZUdpZnRDYXJkVG9rZW4oZ2lmdENhcmQpXG5cdGNvbnN0IGdpZnRDYXJkQmFzZVVybCA9IGxvY2F0b3IuZG9tYWluQ29uZmlnUHJvdmlkZXIoKS5nZXRDdXJyZW50RG9tYWluQ29uZmlnKCkuZ2lmdENhcmRCYXNlVXJsXG5cdGNvbnN0IGdpZnRDYXJkVXJsID0gbmV3IFVSTChnaWZ0Q2FyZEJhc2VVcmwpXG5cdGdpZnRDYXJkVXJsLmhhc2ggPSB0b2tlblxuXHRyZXR1cm4gZ2lmdENhcmRVcmwuaHJlZlxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0dpZnRDYXJkVG9TaGFyZShnaWZ0Q2FyZDogR2lmdENhcmQpIHtcblx0Z2VuZXJhdGVHaWZ0Q2FyZExpbmsoZ2lmdENhcmQpLnRoZW4oKGxpbmspID0+IHtcblx0XHRsZXQgaW5mb01lc3NhZ2U6IE1heWJlVHJhbnNsYXRpb24gPSBcImVtcHR5U3RyaW5nX21zZ1wiXG5cdFx0Y29uc3QgZGlhbG9nOiBEaWFsb2cgPSBEaWFsb2cubGFyZ2VEaWFsb2coXG5cdFx0XHR7XG5cdFx0XHRcdHJpZ2h0OiBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHRcdFx0XHRsYWJlbDogXCJjbG9zZV9hbHRcIixcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBkaWFsb2cuY2xvc2UoKSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRtaWRkbGU6IFwiZ2lmdENhcmRfbGFiZWxcIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHZpZXc6ICgpID0+IFtcblx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XCIuZmxleC1jZW50ZXIuZnVsbC13aWR0aC5wdC5wYlwiLFxuXHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XCIucHQtbFwiLCAvLyBOZWVkZWQgdG8gY2VudGVyIFNWR1xuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRcdHdpZHRoOiBcIjQ4MHB4XCIsXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0cmVuZGVyR2lmdENhcmRTdmcocGFyc2VGbG9hdChnaWZ0Q2FyZC52YWx1ZSksIGxpbmssIGdpZnRDYXJkLm1lc3NhZ2UpLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdG0oXCIuZmxleC1jZW50ZXJcIiwgW1xuXHRcdFx0XHRcdFx0bShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0ZGlhbG9nLmNsb3NlKClcblx0XHRcdFx0XHRcdFx0XHRzZXRUaW1lb3V0KFxuXHRcdFx0XHRcdFx0XHRcdFx0KCkgPT4gaW1wb3J0KFwiLi4vLi4vLi4vbWFpbC1hcHAvbWFpbC9lZGl0b3IvTWFpbEVkaXRvclwiKS50aGVuKChlZGl0b3IpID0+IGVkaXRvci53cml0ZUdpZnRDYXJkTWFpbChsaW5rKSksXG5cdFx0XHRcdFx0XHRcdFx0XHREZWZhdWx0QW5pbWF0aW9uVGltZSxcblx0XHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdHRpdGxlOiBcInNoYXJlVmlhRW1haWxfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdGljb246IEJvb3RJY29ucy5NYWlsLFxuXHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRpc0FuZHJvaWRBcHAoKVxuXHRcdFx0XHRcdFx0XHQ/IG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0bG9jYXRvci5zeXN0ZW1GYWNhZGUuc2hhcmVUZXh0KFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxhbmcuZ2V0KFwibmF0aXZlU2hhcmVHaWZ0Q2FyZF9tc2dcIiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJ7bGlua31cIjogbGluayxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsYW5nLmdldChcIm5hdGl2ZVNoYXJlR2lmdENhcmRfbGFiZWxcIiksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHR0aXRsZTogXCJzaGFyZV9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0XHRcdGljb246IEJvb3RJY29ucy5TaGFyZSxcblx0XHRcdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdFx0XHQ6IG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y29weVRvQ2xpcGJvYXJkKGxpbmspXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0LnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aW5mb01lc3NhZ2UgPSBcImdpZnRDYXJkQ29waWVkX21zZ1wiXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQuY2F0Y2goKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aW5mb01lc3NhZ2UgPSBcImNvcHlMaW5rRXJyb3JfbXNnXCJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdHRpdGxlOiBcImNvcHlUb0NsaXBib2FyZF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0XHRcdGljb246IEljb25zLkNsaXBib2FyZCxcblx0XHRcdFx0XHRcdFx0ICB9KSxcblx0XHRcdFx0XHRcdCFpc0FwcCgpXG5cdFx0XHRcdFx0XHRcdD8gbShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpbmZvTWVzc2FnZSA9IFwiZW1wdHlTdHJpbmdfbXNnXCJcblx0XHRcdFx0XHRcdFx0XHRcdFx0d2luZG93LnByaW50KClcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHR0aXRsZTogXCJwcmludF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0XHRcdGljb246IEljb25zLlByaW50LFxuXHRcdFx0XHRcdFx0XHQgIH0pXG5cdFx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XHRtKFwiLmZsZXgtY2VudGVyXCIsIG0oXCJzbWFsbC5ub3ByaW50XCIsIGxhbmcuZ2V0VHJhbnNsYXRpb25UZXh0KGluZm9NZXNzYWdlKSkpLFxuXHRcdFx0XHRdLFxuXHRcdFx0fSxcblx0XHQpXG5cdFx0XHQuYWRkU2hvcnRjdXQoe1xuXHRcdFx0XHRrZXk6IEtleXMuRVNDLFxuXHRcdFx0XHRleGVjOiAoKSA9PiBkaWFsb2cuY2xvc2UoKSxcblx0XHRcdFx0aGVscDogXCJjbG9zZV9hbHRcIixcblx0XHRcdH0pXG5cdFx0XHQuc2hvdygpXG5cdH0pXG59XG5cbi8vIFVzZWQgdG8gZ2V0IGdpZnQtY2FyZC5zdmcgd2hlbiBgcmVuZGVyR2lmdENhcmRTdmcoKWAgaXMgY2FsbGVkIGFuZCBjYWNoZSBpdC5cbmNvbnN0IGdpZnRDYXJkU1ZHR2V0dGVyID0gbmV3IChjbGFzcyBHaWZ0Q2FyZFNWR0dldHRlciB7XG5cdHByaXZhdGUgc3RhdGljIGdpZnRDYXJkU3ZnOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIHN0YXRpYyBnaWZ0Q2FyZE5vUXJTdmc6IHN0cmluZyB8IG51bGwgPSBudWxsXG5cblx0Ly8gUmV0dXJucyBhIGNhY2hlZCBgZ2lmdC1jYXJkLnN2Z2Agb3IgZG93bmxvYWRzIGl0IGlmIG9ubGluZS4gUmV0dXJucyBhIHBsYWNlaG9sZGVyIGlmIG9mZmxpbmUuXG5cdGdldFdpdGhRcigpOiBzdHJpbmcge1xuXHRcdGlmIChHaWZ0Q2FyZFNWR0dldHRlci5naWZ0Q2FyZFN2ZyA9PSBudWxsKSB7XG5cdFx0XHRHaWZ0Q2FyZFNWR0dldHRlci5kb3dubG9hZFNWRyhcImdpZnQtY2FyZFwiLCAocmF3U1ZHKSA9PiB7XG5cdFx0XHRcdEdpZnRDYXJkU1ZHR2V0dGVyLmdpZnRDYXJkU3ZnID0gcmF3U1ZHXG5cdFx0XHRcdG0ucmVkcmF3KCkgLy8gUmVyZW5kZXIgYW55IGNhbGxpbmcgdmlld3MgdGhhdCB1c2UgdGhlIFNWR1xuXHRcdFx0fSlcblx0XHRcdHJldHVybiBHaWZ0Q2FyZFNWR0dldHRlci5nZXRQbGFjZUhvbGRlcihcIjxyZWN0IGlkPSdxci1jb2RlJyB3aWR0aD0nODAnIGhlaWdodD0nODAnIHg9JzAnIHk9JzcwJz48L3JlY3Q+XCIpXG5cdFx0fVxuXHRcdHJldHVybiBHaWZ0Q2FyZFNWR0dldHRlci5naWZ0Q2FyZFN2Z1xuXHR9XG5cblx0Ly8gUmV0dXJucyBhIGNhY2hlZCBgZ2lmdC1jYXJkLW5vLXFyLnN2Z2Agb3IgZG93bmxvYWRzIGl0IGlmIG9ubGluZS4gUmV0dXJucyBhIHBsYWNlaG9sZGVyIGlmIG9mZmxpbmUuXG5cdGdldE5vUXIoKTogc3RyaW5nIHtcblx0XHRpZiAoR2lmdENhcmRTVkdHZXR0ZXIuZ2lmdENhcmROb1FyU3ZnID09IG51bGwpIHtcblx0XHRcdEdpZnRDYXJkU1ZHR2V0dGVyLmRvd25sb2FkU1ZHKFwiZ2lmdC1jYXJkLW5vLXFyXCIsIChyYXdTVkcpID0+IHtcblx0XHRcdFx0R2lmdENhcmRTVkdHZXR0ZXIuZ2lmdENhcmROb1FyU3ZnID0gcmF3U1ZHXG5cdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdH0pXG5cdFx0XHRyZXR1cm4gR2lmdENhcmRTVkdHZXR0ZXIuZ2V0UGxhY2VIb2xkZXIoKVxuXHRcdH1cblx0XHRyZXR1cm4gR2lmdENhcmRTVkdHZXR0ZXIuZ2lmdENhcmROb1FyU3ZnXG5cdH1cblxuXHQvLyBEb3dubG9hZHMgYW4gU1ZHIGZyb20gdGhlIGltYWdlcyBmb2xkZXIgd2l0aG91dCByZXR1cm5pbmcgYSBwcm9taXNlIHZpYSB1c2luZyBhIGNhbGxiYWNrXG5cdHByaXZhdGUgc3RhdGljIGRvd25sb2FkU1ZHKGZpbGVOYW1lOiBzdHJpbmcsIG9uQ29tcGxldGU6IChyYXdTVkc6IHN0cmluZykgPT4gdm9pZCkge1xuXHRcdGZldGNoKGAke3dpbmRvdy50dXRhby5hcHBTdGF0ZS5wcmVmaXhXaXRob3V0RmlsZX0vaW1hZ2VzLyR7ZmlsZU5hbWV9LnN2Z2ApLnRoZW4oXG5cdFx0XHRhc3luYyAocmVzKSA9PiB7XG5cdFx0XHRcdG9uQ29tcGxldGUoYXdhaXQgcmVzLnRleHQoKSlcblx0XHRcdH0sXG5cdFx0XHQoKSA9PiB7fSxcblx0XHQpXG5cdH1cblxuXHQvLyBSZW5kZXJzIHRoZSBwbGFjZWhvbGRlciBnaWZ0IGNhcmQsIG9wdGlvbmFsbHkgd2l0aCBleHRyYSBIVE1MXG5cdHByaXZhdGUgc3RhdGljIGdldFBsYWNlSG9sZGVyKGV4dHJhRWxlbWVudHM6IHN0cmluZyA9IFwiXCIpOiBzdHJpbmcge1xuXHRcdHJldHVybiBgXG5cdFx0XHQ8c3ZnIHdpZHRoPSc0ODAnIGhlaWdodD0nNjAwJz5cblx0XHRcdFx0PHRleHQgaWQ9J2NhcmQtbGFiZWwnIHg9JzAnIHk9JzIwJz48L3RleHQ+XG5cdFx0XHRcdDx0ZXh0IGlkPSdtZXNzYWdlJyB4PScwJyB5PSc0MCcgZmlsbD0nI2ZmZic+PC90ZXh0PlxuXHRcdFx0XHQ8dGV4dCBpZD0ncHJpY2UnIHg9JzAnIHk9JzYwJz48L3RleHQ+XG5cdFx0XHRcdCR7ZXh0cmFFbGVtZW50c31cblx0XHRcdDwvc3ZnPmBcblx0fVxufSkoKVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyR2lmdENhcmRTdmcocHJpY2U6IG51bWJlciwgbGluazogc3RyaW5nIHwgbnVsbCwgbWVzc2FnZTogc3RyaW5nKTogQ2hpbGRyZW4ge1xuXHRjb25zdCBzdmcgPSBsaW5rID09IG51bGwgPyBnaWZ0Q2FyZFNWR0dldHRlci5nZXROb1FyKCkgOiBnaWZ0Q2FyZFNWR0dldHRlci5nZXRXaXRoUXIoKVxuXHRjb25zdCBzdmdEb2N1bWVudDogRG9jdW1lbnQgPSBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKHN2ZywgXCJpbWFnZS9zdmcreG1sXCIpXG5cblx0Ly8gR2VuZXJhdGUgYW5kIHJlcGxhY2UgdGhlIHFyY29kZSBwbGFjZWhvbGRlciBhIFFSIENvZGUgdG8gdGhlIGxpbmsgaWYgcHJvdmlkZWRcblx0aWYgKGxpbmsgIT0gbnVsbCkge1xuXHRcdGNvbnN0IHFyQ29kZUVsZW1lbnQgPSBnZXRHaWZ0Q2FyZEVsZW1lbnQoc3ZnRG9jdW1lbnQsIFwicXItY29kZVwiKVxuXHRcdGNvbnN0IHFyQ29kZVdpZHRoID0gZ2V0TnVtYmVyQXR0cmlidXRlKHFyQ29kZUVsZW1lbnQsIFwid2lkdGhcIilcblx0XHRjb25zdCBxckNvZGVIZWlnaHQgPSBnZXROdW1iZXJBdHRyaWJ1dGUocXJDb2RlRWxlbWVudCwgXCJoZWlnaHRcIilcblx0XHRjb25zdCBxckNvZGVYUG9zaXRpb24gPSBnZXROdW1iZXJBdHRyaWJ1dGUocXJDb2RlRWxlbWVudCwgXCJ4XCIpXG5cdFx0Y29uc3QgcXJDb2RlWVBvc2l0aW9uID0gZ2V0TnVtYmVyQXR0cmlidXRlKHFyQ29kZUVsZW1lbnQsIFwieVwiKVxuXHRcdHFyQ29kZUVsZW1lbnQub3V0ZXJIVE1MID0gcmVuZGVyUVJDb2RlKHFyQ29kZVhQb3NpdGlvbiwgcXJDb2RlWVBvc2l0aW9uLCBxckNvZGVXaWR0aCwgcXJDb2RlSGVpZ2h0LCBsaW5rKVxuXHR9XG5cblx0Y29uc3QgbGFiZWxFbGVtZW50ID0gZ2V0R2lmdENhcmRFbGVtZW50KHN2Z0RvY3VtZW50LCBcImNhcmQtbGFiZWxcIilcblx0bGFiZWxFbGVtZW50LnRleHRDb250ZW50ID0gbGFuZy5nZXQoXCJnaWZ0Q2FyZF9sYWJlbFwiKS50b1VwcGVyQ2FzZSgpXG5cblx0Y29uc3QgcHJpY2VFbGVtZW50ID0gZ2V0R2lmdENhcmRFbGVtZW50KHN2Z0RvY3VtZW50LCBcInByaWNlXCIpXG5cdHByaWNlRWxlbWVudC50ZXh0Q29udGVudCA9IGZvcm1hdFByaWNlKHByaWNlLCBmYWxzZSkucmVwbGFjZSgvXFxzKy9nLCBcIlwiKSArIFwi4oKsXCJcblx0Ly8gQXBwZW5kIHRoZSDigqwgc3ltYm9sIG1hbnVhbGx5IGJlY2F1c2UgaW4gb25lIHBhcnRpY3VsYXIgbGFuZ3VhZ2UgdGhlIOKCrCBzaWduIGlzIGJlaW5nIHRyYW5zbGF0ZWQgaW50byBcIkVVUlwiIHVzaW5nIGBmb3JtYXRQcmljZWAgbWV0aG9kXG5cblx0Ly8gU1ZHIHRleHQgZWxlbWVudHMgZG8gbm90IGhhdmUgd29yZCB3cmFwLCBzbyB3ZSB1c2UgYW4gSFRNTCBgcGAgZWxlbWVudCB0byBhdm9pZCB3b3JkIHdyYXBwaW5nIHZpYSBKUyBvdXJzZWx2ZXNcblx0Ly8gSXQgd291bGQgYmUgbmljZSB0byBoYXZlIHRoaXMgZGVjb3VwbGVkIGZyb20gdGhlIGN1cnJlbnQgZGVzaWduIG9mIHRoZSBnaWZ0IGNhcmRcblx0Y29uc3QgbWVzc2FnZUVsZW1lbnQgPSBnZXRHaWZ0Q2FyZEVsZW1lbnQoc3ZnRG9jdW1lbnQsIFwibWVzc2FnZVwiKVxuXHRjb25zdCBtZXNzYWdlQ29sb3IgPSBnZXRBdHRyaWJ1dGUobWVzc2FnZUVsZW1lbnQsIFwiZmlsbFwiKVxuXHRtZXNzYWdlRWxlbWVudC5vdXRlckhUTUwgPSByZW5kZXJNZXNzYWdlKDE5LCA2MSwgMTA4LCA3MCwgbWVzc2FnZUNvbG9yLCBtZXNzYWdlKVxuXG5cdHJldHVybiBtLnRydXN0KHN2Z0RvY3VtZW50LmRvY3VtZW50RWxlbWVudC5vdXRlckhUTUwpXG59XG5cbi8vIEdldHMgYW4gYXR0cmlidXRlIG9mIGFuIGVsZW1lbnQgdGhhdCBoYXMgYSB0eXBlIG9mIG51bWJlclxuZnVuY3Rpb24gZ2V0TnVtYmVyQXR0cmlidXRlKGVsZW1lbnQ6IEVsZW1lbnQsIGF0dHJpYnV0ZU5hbWU6IHN0cmluZyk6IG51bWJlciB7XG5cdGNvbnN0IHJhdyA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpXG5cdGlmIChyYXcgPT0gbnVsbCkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgRXJyb3Igd2hpbGUgcmVuZGVyaW5nIGdpZnQgY2FyZDogbWlzc2luZyBhdHRyaWJ1dGUgJHthdHRyaWJ1dGVOYW1lfSBmcm9tICR7ZWxlbWVudC5pZH1gKVxuXHR9XG5cdHJldHVybiBOdW1iZXIocmF3KVxufVxuXG5mdW5jdGlvbiBnZXRBdHRyaWJ1dGUoZWxlbWVudDogRWxlbWVudCwgYXR0cmlidXRlTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcblx0Y29uc3QgcmF3ID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSlcblx0aWYgKHJhdyA9PSBudWxsKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBFcnJvciB3aGlsZSByZW5kZXJpbmcgZ2lmdCBjYXJkOiBtaXNzaW5nIGF0dHJpYnV0ZSAke2F0dHJpYnV0ZU5hbWV9IGZyb20gJHtlbGVtZW50LmlkfWApXG5cdH1cblx0cmV0dXJuIHJhd1xufVxuXG4vLyBHZXRzIG9uZSBvZiB0aGUgc3RhbmRhcmQgZ2lmdCBjYXJkIGVsZW1lbnRzIGZyb20gYW4gU1ZHLlxuZnVuY3Rpb24gZ2V0R2lmdENhcmRFbGVtZW50KHN2Z0RvY3VtZW50OiBEb2N1bWVudCwgaWQ6IFwicHJpY2VcIiB8IFwicXItY29kZVwiIHwgXCJtZXNzYWdlXCIgfCBcImNhcmQtbGFiZWxcIik6IFNWR0VsZW1lbnQge1xuXHRjb25zdCBlbGVtZW50ID0gc3ZnRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpIGFzIFNWR0VsZW1lbnQgfCBudWxsXG5cdGlmIChlbGVtZW50ID09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHdoaWxlIHJlbmRlcmluZyBnaWZ0IGNhcmQ6IG1pc3NpbmcgZWxlbWVudCAke2lkfWApXG5cdH1cblx0cmV0dXJuIGVsZW1lbnRcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgdGV4dCB3aXRoIHdvcmQgd3JhcHBpbmcgaW4gYW4gU1ZHIGVsZW1lbnQuICgwLDApIGlzIHRoZSB0b3AgbGVmdC5cbiAqIEBwYXJhbSB4IFRoZSBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCBvbiB0aGUgWCBBeGlzLlxuICogQHBhcmFtIHkgVGhlIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50IG9uIHRoZSBZIEF4aXMuXG4gKiBAcGFyYW0gd2lkdGggVGhlIHdpZHRoIG9mIHRoZSB0ZXh0IGVsZW1lbnQuXG4gKiBAcGFyYW0gaGVpZ2h0IFRoZSBoZWlnaHQgb2YgdGhlIHRleHQgZWxlbWVudC5cbiAqIEBwYXJhbSBjb2xvciBUaGUgZmlsbCBjb2xvdXIgb2YgdGhlIHRleHQgZWxlbWVudC5cbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSB0ZXh0IHRvIGJlIGRpc3BsYXllZCBpbiB0aGUgZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gcmVuZGVyTWVzc2FnZSh4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGNvbG9yOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG5cdGNvbnN0IGNsZWFuTWVzc2FnZTogc3RyaW5nID0gaHRtbFNhbml0aXplci5zYW5pdGl6ZUhUTUwodXJsRW5jb2RlSHRtbFRhZ3MobWVzc2FnZSkpLmh0bWxcblxuXHRjb25zdCBsaW5lQnJlYWtzID0gY2xlYW5NZXNzYWdlLnNwbGl0KC9cXHJcXG58XFxyfFxcbi8pLmxlbmd0aFxuXHRjb25zdCBjaGFyTGVuZ3RoID0gY2xlYW5NZXNzYWdlLmxlbmd0aFxuXG5cdGNvbnN0IGZvbnRTaXplUHggPSBsaW5lQnJlYWtzID4gNCB8fCBjaGFyTGVuZ3RoID4gODAgPyBcIjZweFwiIDogXCI3cHhcIlxuXG5cdHJldHVybiBgXG5cdFx0PGZvcmVpZ25PYmplY3QgeD1cIiR7eH1cIiB5PVwiJHt5fVwiIHdpZHRoPVwiJHt3aWR0aH1cIiBoZWlnaHQ9XCIke2hlaWdodH1cIiBmaWxsPVwiJHtjb2xvcn1cIj5cblx0XHRcdDxwIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiXG5cdFx0XHQgICBjbGFzcz1cInRleHQtcHJlbGluZSB0ZXh0LWJyZWFrIGNvbG9yLWFkanVzdC1leGFjdCBtb25vc3BhY2VcIlxuXHRcdFx0ICAgc3R5bGU9XCJmb250LXNpemU6ICR7Zm9udFNpemVQeH07IGNvbG9yOiAke2NvbG9yfTsgbWFyZ2luOiBhdXRvIDAgMCAwXCI+XG5cdFx0XHRcdCR7Y2xlYW5NZXNzYWdlfVxuXHRcdFx0PC9wPlxuXHRcdDwvZm9yZWlnbk9iamVjdD5gXG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgYmxhY2stb24td2hpdGUgUVIgQ29kZSBpbiBTVkcgZm9ybVxuICogQHBhcmFtIHggVGhlIHBvc2l0aW9uIG9uIHRoZSBYIEF4aXMgb2YgdGhlIFFSIENvZGUuIDAgaXMgdGhlIGZhciBsZWZ0LlxuICogQHBhcmFtIHkgVGhlIHBvc2l0aW9uIG9uIHRoZSBZIEF4aXMgb2YgdGhlIFFSIENvZGUuIDAgaXMgdGhlIHRvcC5cbiAqIEBwYXJhbSBsaW5rIFRoZSBsaW5rIHRoYXQgdGhlIGdlbmVyYXRlZCBRUiBjb2RlIHdpbGwgbGVhZCB0byB3aGVuIHNjYW5uZWRcbiAqIEBwYXJhbSBoZWlnaHQgVGhlIGhlaWdodCBpbiBwaXhlbHMgb2YgdGhlIHJlc3VsdGluZyBRUiBjb2RlXG4gKiBAcGFyYW0gd2lkdGggVGhlIHdpZHRoIGluIHBpeGVscyBvZiB0aGUgcmVzdWx0aW5nIFFSIGNvZGVcbiAqIEByZXR1cm4gdGhlIFNWRyBlbGVtZW50IG9mIHRoZSBnZW5lcmF0ZWQgUVIgY29kZSBhcyBhIGBzdHJpbmdgXG4gKi9cbmZ1bmN0aW9uIHJlbmRlclFSQ29kZSh4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGxpbms6IHN0cmluZyk6IHN0cmluZyB7XG5cdGNvbnN0IHN2ZyA9IG5ldyBRUkNvZGUoe1xuXHRcdGhlaWdodCxcblx0XHR3aWR0aCxcblx0XHRjb250ZW50OiBsaW5rLFxuXHRcdGJhY2tncm91bmQ6IFwiI2ZmZmZmZlwiLFxuXHRcdGNvbG9yOiBcIiMwMDAwMDBcIixcblx0XHR4bWxEZWNsYXJhdGlvbjogZmFsc2UsXG5cdFx0Y29udGFpbmVyOiBcIm5vbmVcIixcblx0XHRwYWRkaW5nOiAwLFxuXHRcdGpvaW46IHRydWUsXG5cdFx0cHJldHR5OiBmYWxzZSxcblx0fSkuc3ZnKClcblx0Y29uc3QgcXJDb2RlID0gaHRtbFNhbml0aXplci5zYW5pdGl6ZVNWRyhzdmcpLmh0bWxcblxuXHRyZXR1cm4gYDxzdmcgeD1cIiR7eH1cIiB5PVwiJHt5fVwiIHdpZHRoPVwiJHt3aWR0aH1cIiBoZWlnaHQ9XCIke2hlaWdodH1cIj4ke3FyQ29kZX08L3N2Zz5gXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJBY2NlcHRHaWZ0Q2FyZFRlcm1zQ2hlY2tib3goY2hlY2tlZDogYm9vbGVhbiwgb25DaGVja2VkOiAoY2hlY2tlZDogYm9vbGVhbikgPT4gdm9pZCwgY2xhc3Nlcz86IHN0cmluZyk6IENoaWxkcmVuIHtcblx0cmV0dXJuIG0oQ2hlY2tib3gsIHtcblx0XHRjaGVja2VkLFxuXHRcdG9uQ2hlY2tlZCxcblx0XHRjbGFzczogY2xhc3Nlcyxcblx0XHRsYWJlbDogKCkgPT4gW2xhbmcuZ2V0KFwidGVybXNBbmRDb25kaXRpb25zX2xhYmVsXCIpLCBtKFwiZGl2XCIsIHJlbmRlclRlcm1zQW5kQ29uZGl0aW9uc0J1dHRvbihUZXJtc1NlY3Rpb24uR2lmdENhcmRzLCBDVVJSRU5UX0dJRlRfQ0FSRF9URVJNU19WRVJTSU9OKSldLFxuXHR9KVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgcHgsIHNpemUgfSBmcm9tIFwiLi4vLi4vZ3VpL3NpemUuanNcIlxuXG5leHBvcnQgY29uc3QgR0lGVF9DQVJEX01FU1NBR0VfQ09MUyA9IDI2XG5jb25zdCBHSUZUX0NBUkRfTUVTU0FHRV9IRUlHSFQgPSA1XG50eXBlIEdpZnRDYXJkTWVzc2FnZUVkaXRvckZpZWxkQXR0cnMgPSB7XG5cdG1lc3NhZ2U6IHN0cmluZ1xuXHRvbk1lc3NhZ2VDaGFuZ2VkOiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkXG5cdGNvbHM/OiBudW1iZXJcblx0cm93cz86IG51bWJlclxufVxuLyoqXG4gKiBBIHRleHQgYXJlYSB0aGF0IGFsbG93cyB5b3UgdG8gZWRpdCBzb21lIHRleHQgdGhhdCBpcyBsaW1pdGVkIHRvIGZpdCB3aXRoaW4gYSBjZXJ0YWluIHJvd3MvY29sdW1ucyBib3VuZGFyeVxuICovXG5leHBvcnQgY2xhc3MgR2lmdENhcmRNZXNzYWdlRWRpdG9yRmllbGQgaW1wbGVtZW50cyBDb21wb25lbnQ8R2lmdENhcmRNZXNzYWdlRWRpdG9yRmllbGRBdHRycz4ge1xuXHRwcml2YXRlIHRleHRBcmVhRG9tOiBIVE1MVGV4dEFyZWFFbGVtZW50IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBpc0FjdGl2ZTogYm9vbGVhbiA9IGZhbHNlXG5cblx0dmlldyh2bm9kZTogVm5vZGU8R2lmdENhcmRNZXNzYWdlRWRpdG9yRmllbGRBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgYSA9IHZub2RlLmF0dHJzXG5cdFx0cmV0dXJuIG0oXCJsYWJlbC5zbWFsbC5tdC1mb3JtLmkuZmxleC1jZW50ZXIuZmxleC1jb2x1bW5cIiwgW1xuXHRcdFx0Ly8gQ2Fubm90IHdyYXAgdGhlIGxhYmVsIGluIGEgc3BhbiB0byBhcHBseSB0aGUgYHNtYWxsYCBjbGFzcyBhcyBpdCB3aWxsIGJyZWFrIHNjcmVlbiByZWFkZXJzXG5cdFx0XHRsYW5nLmdldChcInlvdXJNZXNzYWdlX2xhYmVsXCIpLFxuXHRcdFx0bShcInRleHRhcmVhLm1vbm9zcGFjZS5ub3JtYWwtZm9udC1zaXplLm92ZXJmbG93LWhpZGRlbi5yZXNpemUtbm9uZVwiICsgKHRoaXMuaXNBY3RpdmUgPyBcIi5lZGl0b3ItYm9yZGVyLWFjdGl2ZVwiIDogXCIuZWRpdG9yLWJvcmRlclwiKSwge1xuXHRcdFx0XHR3cmFwOiBcImhhcmRcIixcblx0XHRcdFx0Y29sczogYS5jb2xzIHx8IEdJRlRfQ0FSRF9NRVNTQUdFX0NPTFMsXG5cdFx0XHRcdHJvd3M6IGEucm93cyB8fCBHSUZUX0NBUkRfTUVTU0FHRV9IRUlHSFQsXG5cdFx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnRleHRBcmVhRG9tID0gdm5vZGUuZG9tIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnRcblx0XHRcdFx0XHR0aGlzLnRleHRBcmVhRG9tLnZhbHVlID0gYS5tZXNzYWdlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uZm9jdXM6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLmlzQWN0aXZlID0gdHJ1ZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbmJsdXI6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLmlzQWN0aXZlID0gZmFsc2Vcblx0XHRcdFx0fSxcblx0XHRcdFx0b25pbnB1dDogKCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHRleHRBcmVhRG9tID0gYXNzZXJ0Tm90TnVsbCh0aGlzLnRleHRBcmVhRG9tKVxuXHRcdFx0XHRcdGNvbnN0IG9yaWdTdGFydCA9IHRleHRBcmVhRG9tLnNlbGVjdGlvblN0YXJ0XG5cdFx0XHRcdFx0Y29uc3Qgb3JpZ0VuZCA9IHRleHRBcmVhRG9tLnNlbGVjdGlvbkVuZFxuXG5cdFx0XHRcdFx0Ly8gcmVtb3ZlIGNoYXJhY3RlcnMgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0d2hpbGUgKHRleHRBcmVhRG9tLmNsaWVudEhlaWdodCA8IHRleHRBcmVhRG9tLnNjcm9sbEhlaWdodCkge1xuXHRcdFx0XHRcdFx0dGV4dEFyZWFEb20udmFsdWUgPSB0ZXh0QXJlYURvbS52YWx1ZS5zdWJzdHJpbmcoMCwgdGV4dEFyZWFEb20udmFsdWUubGVuZ3RoIC0gMSlcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRhLm9uTWVzc2FnZUNoYW5nZWQodGV4dEFyZWFEb20udmFsdWUpXG5cblx0XHRcdFx0XHQvLyB0aGUgY3Vyc29yIGdldHMgcHVzaGVkIHRvIHRoZSBlbmQgd2hlbiB3ZSBjaGV3IHVwIHRhaWxpbmcgY2hhcmFjdGVycywgc28gd2UgcHV0IGl0IGJhY2sgd2hlcmUgaXQgc3RhcnRlZCBpbiB0aGF0IGNhc2Vcblx0XHRcdFx0XHRpZiAodGV4dEFyZWFEb20uc2VsZWN0aW9uU3RhcnQgLSBvcmlnU3RhcnQgPiAxKSB7XG5cdFx0XHRcdFx0XHR0ZXh0QXJlYURvbS5zZWxlY3Rpb25TdGFydCA9IG9yaWdTdGFydFxuXHRcdFx0XHRcdFx0dGV4dEFyZWFEb20uc2VsZWN0aW9uRW5kID0gb3JpZ0VuZFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdH0pLFxuXHRcdF0pXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL0RpYWxvZ1wiXG5pbXBvcnQgdHlwZSB7IEdpZnRDYXJkLCBHaWZ0Q2FyZE9wdGlvbiB9IGZyb20gXCIuLi8uLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IEdpZnRDYXJkVHlwZVJlZiB9IGZyb20gXCIuLi8uLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IHNob3dQcm9ncmVzc0RpYWxvZyB9IGZyb20gXCIuLi8uLi9ndWkvZGlhbG9ncy9Qcm9ncmVzc0RpYWxvZ1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3JcIlxuaW1wb3J0IHsgQk9YX01BUkdJTiwgQnV5T3B0aW9uQm94IH0gZnJvbSBcIi4uL0J1eU9wdGlvbkJveFwiXG5pbXBvcnQgeyBCdXR0b25UeXBlIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL0J1dHRvbi5qc1wiXG5pbXBvcnQgeyBnZXRQcmVjb25kaXRpb25GYWlsZWRQYXltZW50TXNnIH0gZnJvbSBcIi4uL1N1YnNjcmlwdGlvblV0aWxzXCJcbmltcG9ydCB7IHJlbmRlckFjY2VwdEdpZnRDYXJkVGVybXNDaGVja2JveCwgc2hvd0dpZnRDYXJkVG9TaGFyZSB9IGZyb20gXCIuL0dpZnRDYXJkVXRpbHNcIlxuaW1wb3J0IHR5cGUgeyBEaWFsb2dIZWFkZXJCYXJBdHRycyB9IGZyb20gXCIuLi8uLi9ndWkvYmFzZS9EaWFsb2dIZWFkZXJCYXJcIlxuaW1wb3J0IHsgc2hvd1VzZXJFcnJvciB9IGZyb20gXCIuLi8uLi9taXNjL0Vycm9ySGFuZGxlckltcGxcIlxuaW1wb3J0IHsgVXNlckVycm9yIH0gZnJvbSBcIi4uLy4uL2FwaS9tYWluL1VzZXJFcnJvclwiXG5pbXBvcnQgeyBLZXlzLCBQYXltZW50TWV0aG9kVHlwZSwgUGxhblR5cGUgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBsYW5nLCBUcmFuc2xhdGlvbiB9IGZyb20gXCIuLi8uLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IEJhZEdhdGV3YXlFcnJvciwgUHJlY29uZGl0aW9uRmFpbGVkRXJyb3IgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3JcIlxuaW1wb3J0IHsgR2lmdENhcmRNZXNzYWdlRWRpdG9yRmllbGQgfSBmcm9tIFwiLi9HaWZ0Q2FyZE1lc3NhZ2VFZGl0b3JGaWVsZFwiXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tIFwiLi4vLi4vbWlzYy9DbGllbnREZXRlY3RvclwiXG5pbXBvcnQgeyBjb3VudCwgZmlsdGVySW50LCBub09wLCBvZkNsYXNzIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBpc0lPU0FwcCB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBmb3JtYXRQcmljZSwgUGF5bWVudEludGVydmFsLCBQcmljZUFuZENvbmZpZ1Byb3ZpZGVyIH0gZnJvbSBcIi4uL1ByaWNlVXRpbHNcIlxuaW1wb3J0IHsgR2lmdENhcmRTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL2FwaS9lbnRpdGllcy9zeXMvU2VydmljZXNcIlxuaW1wb3J0IHsgVXBncmFkZVByaWNlVHlwZSB9IGZyb20gXCIuLi9GZWF0dXJlTGlzdFByb3ZpZGVyXCJcbmltcG9ydCB7IFRyYW5zbGF0aW9uS2V5VHlwZSB9IGZyb20gXCIuLi8uLi9taXNjL1RyYW5zbGF0aW9uS2V5LmpzXCJcbmltcG9ydCB7IHB4IH0gZnJvbSBcIi4uLy4uL2d1aS9zaXplXCJcbmltcG9ydCB7IEljb24sIEljb25TaXplIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL0ljb25cIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvaWNvbnMvSWNvbnNcIlxuaW1wb3J0IHsgTG9naW5CdXR0b24gfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvYnV0dG9ucy9Mb2dpbkJ1dHRvbi5qc1wiXG5cbmNsYXNzIFB1cmNoYXNlR2lmdENhcmRNb2RlbCB7XG5cdG1lc3NhZ2UgPSBsYW5nLmdldChcImRlZmF1bHRHaWZ0Q2FyZE1lc3NhZ2VfbXNnXCIpXG5cdGNvbmZpcm1lZCA9IGZhbHNlXG5cblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSByZWFkb25seSBjb25maWc6IHtcblx0XHRcdHB1cmNoYXNlTGltaXQ6IG51bWJlclxuXHRcdFx0cHVyY2hhc2VQZXJpb2RNb250aHM6IG51bWJlclxuXHRcdFx0YXZhaWxhYmxlUGFja2FnZXM6IEFycmF5PEdpZnRDYXJkT3B0aW9uPlxuXHRcdFx0c2VsZWN0ZWRQYWNrYWdlOiBudW1iZXJcblx0XHRcdHJldm9sdXRpb25hcnlQcmljZTogbnVtYmVyXG5cdFx0fSxcblx0KSB7fVxuXG5cdGdldCBhdmFpbGFibGVQYWNrYWdlcygpOiBSZWFkb25seUFycmF5PEdpZnRDYXJkT3B0aW9uPiB7XG5cdFx0cmV0dXJuIHRoaXMuY29uZmlnLmF2YWlsYWJsZVBhY2thZ2VzXG5cdH1cblxuXHRnZXQgcHVyY2hhc2VMaW1pdCgpOiBudW1iZXIge1xuXHRcdHJldHVybiB0aGlzLmNvbmZpZy5wdXJjaGFzZUxpbWl0XG5cdH1cblxuXHRnZXQgcHVyY2hhc2VQZXJpb2RNb250aHMoKTogbnVtYmVyIHtcblx0XHRyZXR1cm4gdGhpcy5jb25maWcucHVyY2hhc2VQZXJpb2RNb250aHNcblx0fVxuXG5cdGdldCBzZWxlY3RlZFBhY2thZ2UoKTogbnVtYmVyIHtcblx0XHRyZXR1cm4gdGhpcy5jb25maWcuc2VsZWN0ZWRQYWNrYWdlXG5cdH1cblxuXHRzZXQgc2VsZWN0ZWRQYWNrYWdlKHNlbGVjdGlvbjogbnVtYmVyKSB7XG5cdFx0dGhpcy5jb25maWcuc2VsZWN0ZWRQYWNrYWdlID0gc2VsZWN0aW9uXG5cdH1cblxuXHRnZXQgcmV2b2x1dGlvbmFyeVByaWNlKCk6IG51bWJlciB7XG5cdFx0cmV0dXJuIHRoaXMuY29uZmlnLnJldm9sdXRpb25hcnlQcmljZVxuXHR9XG5cblx0YXN5bmMgcHVyY2hhc2VHaWZ0Q2FyZCgpOiBQcm9taXNlPEdpZnRDYXJkPiB7XG5cdFx0aWYgKCF0aGlzLmNvbmZpcm1lZCkge1xuXHRcdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihcInRlcm1zQWNjZXB0ZWROZXV0cmFsX21zZ1wiKVxuXHRcdH1cblxuXHRcdHJldHVybiBsb2NhdG9yLmdpZnRDYXJkRmFjYWRlXG5cdFx0XHQuZ2VuZXJhdGVHaWZ0Q2FyZCh0aGlzLm1lc3NhZ2UsIHRoaXMuYXZhaWxhYmxlUGFja2FnZXNbdGhpcy5zZWxlY3RlZFBhY2thZ2VdLnZhbHVlKVxuXHRcdFx0LnRoZW4oKGNyZWF0ZWRHaWZ0Q2FyZElkKSA9PiBsb2NhdG9yLmVudGl0eUNsaWVudC5sb2FkKEdpZnRDYXJkVHlwZVJlZiwgY3JlYXRlZEdpZnRDYXJkSWQpKVxuXHRcdFx0LmNhdGNoKChlKSA9PiB0aGlzLmhhbmRsZVB1cmNoYXNlRXJyb3IoZSkpXG5cdH1cblxuXHRwcml2YXRlIGhhbmRsZVB1cmNoYXNlRXJyb3IoZTogRXJyb3IpOiBuZXZlciB7XG5cdFx0aWYgKGUgaW5zdGFuY2VvZiBQcmVjb25kaXRpb25GYWlsZWRFcnJvcikge1xuXHRcdFx0Y29uc3QgbWVzc2FnZSA9IGUuZGF0YVxuXG5cdFx0XHRzd2l0Y2ggKG1lc3NhZ2UpIHtcblx0XHRcdFx0Y2FzZSBcImdpZnRjYXJkLmxpbWl0cmVhY2hlZFwiOlxuXHRcdFx0XHRcdHRocm93IG5ldyBVc2VyRXJyb3IoXG5cdFx0XHRcdFx0XHRsYW5nLmdldFRyYW5zbGF0aW9uKFwidG9vTWFueUdpZnRDYXJkc19tc2dcIiwge1xuXHRcdFx0XHRcdFx0XHRcInthbW91bnR9XCI6IGAke3RoaXMucHVyY2hhc2VMaW1pdH1gLFxuXHRcdFx0XHRcdFx0XHRcIntwZXJpb2R9XCI6IGAke3RoaXMucHVyY2hhc2VQZXJpb2RNb250aHN9IG1vbnRoc2AsXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHQpXG5cblx0XHRcdFx0Y2FzZSBcImdpZnRjYXJkLm5vYWNjb3VudGluZ2luZm9cIjpcblx0XHRcdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwicHJvdmlkZVBheW1lbnREZXRhaWxzX21zZ1wiKVxuXG5cdFx0XHRcdGNhc2UgXCJnaWZ0Y2FyZC5pbnZhbGlkcGF5bWVudG1ldGhvZFwiOlxuXHRcdFx0XHRcdHRocm93IG5ldyBVc2VyRXJyb3IoXCJpbnZhbGlkR2lmdENhcmRQYXltZW50TWV0aG9kX21zZ1wiKVxuXG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihnZXRQcmVjb25kaXRpb25GYWlsZWRQYXltZW50TXNnKGUuZGF0YSkpXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChlIGluc3RhbmNlb2YgQmFkR2F0ZXdheUVycm9yKSB7XG5cdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwicGF5bWVudFByb3ZpZGVyTm90QXZhaWxhYmxlRXJyb3JfbXNnXCIpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IGVcblx0XHR9XG5cdH1cbn1cblxuaW50ZXJmYWNlIEdpZnRDYXJkUHVyY2hhc2VWaWV3QXR0cnMge1xuXHRtb2RlbDogUHVyY2hhc2VHaWZ0Q2FyZE1vZGVsXG5cdG9uR2lmdENhcmRQdXJjaGFzZWQ6IChnaWZ0Q2FyZDogR2lmdENhcmQpID0+IHZvaWRcbn1cblxuY2xhc3MgR2lmdENhcmRQdXJjaGFzZVZpZXcgaW1wbGVtZW50cyBDb21wb25lbnQ8R2lmdENhcmRQdXJjaGFzZVZpZXdBdHRycz4ge1xuXHR2aWV3KHZub2RlOiBWbm9kZTxHaWZ0Q2FyZFB1cmNoYXNlVmlld0F0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IG1vZGVsLCBvbkdpZnRDYXJkUHVyY2hhc2VkIH0gPSB2bm9kZS5hdHRyc1xuXHRcdHJldHVybiBbXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi5mbGV4LmNlbnRlci1ob3Jpem9udGFsbHkud3JhcC5wdC1tbFwiLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFwiY29sdW1uLWdhcFwiOiBweChCT1hfTUFSR0lOKSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRtb2RlbC5hdmFpbGFibGVQYWNrYWdlcy5tYXAoKG9wdGlvbiwgaW5kZXgpID0+IHtcblx0XHRcdFx0XHRjb25zdCB2YWx1ZSA9IHBhcnNlRmxvYXQob3B0aW9uLnZhbHVlKVxuXG5cdFx0XHRcdFx0cmV0dXJuIG0oQnV5T3B0aW9uQm94LCB7XG5cdFx0XHRcdFx0XHRoZWFkaW5nOiBtKFxuXHRcdFx0XHRcdFx0XHRcIi5mbGV4LWNlbnRlclwiLFxuXHRcdFx0XHRcdFx0XHRBcnJheShNYXRoLnBvdygyLCBpbmRleCkpLmZpbGwoXG5cdFx0XHRcdFx0XHRcdFx0bShJY29uLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5HaWZ0LFxuXHRcdFx0XHRcdFx0XHRcdFx0c2l6ZTogSWNvblNpemUuTWVkaXVtLFxuXHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdGFjdGlvbkJ1dHRvbjogKCkgPT5cblx0XHRcdFx0XHRcdFx0bShMb2dpbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcInByaWNpbmcuc2VsZWN0X2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRcdG9uY2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdG1vZGVsLnNlbGVjdGVkUGFja2FnZSA9IGluZGV4XG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRwcmljZTogZm9ybWF0UHJpY2UodmFsdWUsIHRydWUpLFxuXHRcdFx0XHRcdFx0aGVscExhYmVsOiB0aGlzLmdldEdpZnRDYXJkSGVscFRleHQobW9kZWwucmV2b2x1dGlvbmFyeVByaWNlLCB2YWx1ZSksXG5cdFx0XHRcdFx0XHR3aWR0aDogMjMwLFxuXHRcdFx0XHRcdFx0aGVpZ2h0OiAyNTAsXG5cdFx0XHRcdFx0XHRzZWxlY3RlZFBheW1lbnRJbnRlcnZhbDogbnVsbCxcblx0XHRcdFx0XHRcdGFjY291bnRQYXltZW50SW50ZXJ2YWw6IG51bGwsXG5cdFx0XHRcdFx0XHRoaWdobGlnaHRlZDogbW9kZWwuc2VsZWN0ZWRQYWNrYWdlID09PSBpbmRleCxcblx0XHRcdFx0XHRcdG1vYmlsZTogZmFsc2UsXG5cdFx0XHRcdFx0XHRib251c01vbnRoczogMCxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KSxcblx0XHRcdCksXG5cdFx0XHRtKFwiLmZsZXgtY29sdW1uLmZsZXgtY2VudGVyLmNlbnRlci1oLndpZHRoLW1pbi1jb250ZW50XCIsIFtcblx0XHRcdFx0bShHaWZ0Q2FyZE1lc3NhZ2VFZGl0b3JGaWVsZCwge1xuXHRcdFx0XHRcdG1lc3NhZ2U6IG1vZGVsLm1lc3NhZ2UsXG5cdFx0XHRcdFx0b25NZXNzYWdlQ2hhbmdlZDogKG1lc3NhZ2UpID0+IChtb2RlbC5tZXNzYWdlID0gbWVzc2FnZSksXG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRyZW5kZXJBY2NlcHRHaWZ0Q2FyZFRlcm1zQ2hlY2tib3gobW9kZWwuY29uZmlybWVkLCAoY2hlY2tlZCkgPT4gKG1vZGVsLmNvbmZpcm1lZCA9IGNoZWNrZWQpLCBcInB0LWxcIiksXG5cdFx0XHRcdG0oTG9naW5CdXR0b24sIHtcblx0XHRcdFx0XHRsYWJlbDogXCJidXlfYWN0aW9uXCIsXG5cdFx0XHRcdFx0Y2xhc3M6IFwibXQtbCBtYi1sXCIsXG5cdFx0XHRcdFx0b25jbGljazogKCkgPT4gdGhpcy5vbkJ1eUJ1dHRvblByZXNzZWQobW9kZWwsIG9uR2lmdENhcmRQdXJjaGFzZWQpLmNhdGNoKG9mQ2xhc3MoVXNlckVycm9yLCBzaG93VXNlckVycm9yKSksXG5cdFx0XHRcdH0pLFxuXHRcdFx0XSksXG5cdFx0XVxuXHR9XG5cblx0YXN5bmMgb25CdXlCdXR0b25QcmVzc2VkKG1vZGVsOiBQdXJjaGFzZUdpZnRDYXJkTW9kZWwsIG9uUHVyY2hhc2VTdWNjZXNzOiAoZ2lmdENhcmQ6IEdpZnRDYXJkKSA9PiB2b2lkKSB7XG5cdFx0Y29uc3QgZ2lmdENhcmQgPSBhd2FpdCBzaG93UHJvZ3Jlc3NEaWFsb2coXCJsb2FkaW5nX21zZ1wiLCBtb2RlbC5wdXJjaGFzZUdpZnRDYXJkKCkpXG5cdFx0b25QdXJjaGFzZVN1Y2Nlc3MoZ2lmdENhcmQpXG5cdH1cblxuXHRwcml2YXRlIGdldEdpZnRDYXJkSGVscFRleHQodXBncmFkZVByaWNlOiBudW1iZXIsIGdpZnRDYXJkVmFsdWU6IG51bWJlcik6IFRyYW5zbGF0aW9uIHtcblx0XHRsZXQgaGVscFRleHRJZDogVHJhbnNsYXRpb25LZXlUeXBlXG5cdFx0aWYgKGdpZnRDYXJkVmFsdWUgPCB1cGdyYWRlUHJpY2UpIHtcblx0XHRcdGhlbHBUZXh0SWQgPSBcImdpZnRDYXJkT3B0aW9uVGV4dENfbXNnXCJcblx0XHR9IGVsc2UgaWYgKGdpZnRDYXJkVmFsdWUgPT0gdXBncmFkZVByaWNlKSB7XG5cdFx0XHRoZWxwVGV4dElkID0gXCJnaWZ0Q2FyZE9wdGlvblRleHREX21zZ1wiXG5cdFx0fSBlbHNlIHtcblx0XHRcdGhlbHBUZXh0SWQgPSBcImdpZnRDYXJkT3B0aW9uVGV4dEVfbXNnXCJcblx0XHR9XG5cdFx0cmV0dXJuIGxhbmcuZ2V0VHJhbnNsYXRpb24oaGVscFRleHRJZCwge1xuXHRcdFx0XCJ7cmVtYWluaW5nQ3JlZGl0fVwiOiBmb3JtYXRQcmljZShnaWZ0Q2FyZFZhbHVlIC0gdXBncmFkZVByaWNlLCB0cnVlKSxcblx0XHRcdFwie2Z1bGxDcmVkaXR9XCI6IGZvcm1hdFByaWNlKGdpZnRDYXJkVmFsdWUsIHRydWUpLFxuXHRcdH0pXG5cdH1cbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBkaWFsb2cgdG8gYnV5IGEgZ2lmdGNhcmQgb3Igc2hvdyBlcnJvciBpZiB0aGUgdXNlciBjYW5ub3QgZG8gc29cbiAqIEByZXR1cm5zIHtQcm9taXNlPHVua25vd24+fFByb21pc2U8dm9pZD58UHJvbWlzZTxQcm9taXNlPHZvaWQ+Pn1cbiAqL1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2hvd1B1cmNoYXNlR2lmdENhcmREaWFsb2coKSB7XG5cdGlmIChpc0lPU0FwcCgpKSB7XG5cdFx0cmV0dXJuIERpYWxvZy5tZXNzYWdlKFwibm90QXZhaWxhYmxlSW5BcHBfbXNnXCIpXG5cdH1cblxuXHRjb25zdCBtb2RlbCA9IGF3YWl0IHNob3dQcm9ncmVzc0RpYWxvZyhcImxvYWRpbmdfbXNnXCIsIGxvYWRHaWZ0Q2FyZE1vZGVsKCkpLmNhdGNoKFxuXHRcdG9mQ2xhc3MoVXNlckVycm9yLCAoZSkgPT4ge1xuXHRcdFx0c2hvd1VzZXJFcnJvcihlKVxuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9KSxcblx0KVxuXG5cdGlmIChtb2RlbCA9PSBudWxsKSB7XG5cdFx0cmV0dXJuXG5cdH1cblxuXHRsZXQgZGlhbG9nOiBEaWFsb2dcblxuXHRjb25zdCBoZWFkZXI6IERpYWxvZ0hlYWRlckJhckF0dHJzID0ge1xuXHRcdGxlZnQ6IFtcblx0XHRcdHtcblx0XHRcdFx0bGFiZWw6IFwiY2xvc2VfYWx0XCIsXG5cdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHRjbGljazogKCkgPT4gZGlhbG9nLmNsb3NlKCksXG5cdFx0XHR9LFxuXHRcdF0sXG5cdFx0bWlkZGxlOiBcImJ1eUdpZnRDYXJkX2xhYmVsXCIsXG5cdH1cblxuXHRjb25zdCBjb250ZW50ID0ge1xuXHRcdHZpZXc6ICgpID0+XG5cdFx0XHRtKEdpZnRDYXJkUHVyY2hhc2VWaWV3LCB7XG5cdFx0XHRcdG1vZGVsLFxuXHRcdFx0XHRvbkdpZnRDYXJkUHVyY2hhc2VkOiAoZ2lmdENhcmQpID0+IHtcblx0XHRcdFx0XHRkaWFsb2cuY2xvc2UoKVxuXHRcdFx0XHRcdHNob3dHaWZ0Q2FyZFRvU2hhcmUoZ2lmdENhcmQpXG5cdFx0XHRcdH0sXG5cdFx0XHR9KSxcblx0fVxuXG5cdGRpYWxvZyA9IERpYWxvZy5sYXJnZURpYWxvZyhoZWFkZXIsIGNvbnRlbnQpLmFkZFNob3J0Y3V0KHtcblx0XHRrZXk6IEtleXMuRVNDLFxuXHRcdGV4ZWM6ICgpID0+IGRpYWxvZy5jbG9zZSgpLFxuXHRcdGhlbHA6IFwiY2xvc2VfYWx0XCIsXG5cdH0pXG5cblx0aWYgKGNsaWVudC5pc01vYmlsZURldmljZSgpKSB7XG5cdFx0Ly8gUHJldmVudCBmb2N1c2luZyB0ZXh0IGZpZWxkIGF1dG9tYXRpY2FsbHkgb24gbW9iaWxlLiBJdCBvcGVucyBrZXlib2FyZCBhbmQgeW91IGRvbid0IHNlZSBhbGwgZGV0YWlscy5cblx0XHRkaWFsb2cuc2V0Rm9jdXNPbkxvYWRGdW5jdGlvbihub09wKVxuXHR9XG5cblx0ZGlhbG9nLnNob3coKVxufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkR2lmdENhcmRNb2RlbCgpOiBQcm9taXNlPFB1cmNoYXNlR2lmdENhcmRNb2RlbD4ge1xuXHRjb25zdCBhY2NvdW50aW5nSW5mbyA9IGF3YWl0IGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkubG9hZEFjY291bnRpbmdJbmZvKClcblxuXHQvLyBPbmx5IGFsbG93IHB1cmNoYXNlIHdpdGggc3VwcG9ydGVkIHBheW1lbnQgbWV0aG9kc1xuXHRpZiAoIWFjY291bnRpbmdJbmZvIHx8IGFjY291bnRpbmdJbmZvLnBheW1lbnRNZXRob2QgPT09IFBheW1lbnRNZXRob2RUeXBlLkludm9pY2UgfHwgYWNjb3VudGluZ0luZm8ucGF5bWVudE1ldGhvZCA9PT0gUGF5bWVudE1ldGhvZFR5cGUuQWNjb3VudEJhbGFuY2UpIHtcblx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwiaW52YWxpZEdpZnRDYXJkUGF5bWVudE1ldGhvZF9tc2dcIilcblx0fVxuXG5cdGNvbnN0IFtnaWZ0Q2FyZEluZm8sIGN1c3RvbWVySW5mb10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG5cdFx0bG9jYXRvci5zZXJ2aWNlRXhlY3V0b3IuZ2V0KEdpZnRDYXJkU2VydmljZSwgbnVsbCksXG5cdFx0bG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5sb2FkQ3VzdG9tZXJJbmZvKCksXG5cdF0pXG5cblx0Ly8gVXNlciBjYW4ndCBidXkgdG9vIG1hbnkgZ2lmdCBjYXJkcyBzbyB3ZSBoYXZlIHRvIGxvYWQgdGhlaXIgZ2lmdGNhcmRzIGluIG9yZGVyIHRvIGNoZWNrIGhvdyBtYW55IHRoZXkgb3JkZXJlZFxuXHRjb25zdCBleGlzdGluZ0dpZnRDYXJkcyA9IGN1c3RvbWVySW5mby5naWZ0Q2FyZHMgPyBhd2FpdCBsb2NhdG9yLmVudGl0eUNsaWVudC5sb2FkQWxsKEdpZnRDYXJkVHlwZVJlZiwgY3VzdG9tZXJJbmZvLmdpZnRDYXJkcy5pdGVtcykgOiBbXVxuXG5cdGNvbnN0IHNpeE1vbnRoc0FnbyA9IG5ldyBEYXRlKClcblx0c2l4TW9udGhzQWdvLnNldE1vbnRoKHNpeE1vbnRoc0Fnby5nZXRNb250aCgpIC0gcGFyc2VJbnQoZ2lmdENhcmRJbmZvLnBlcmlvZCkpXG5cdGNvbnN0IG51bVB1cmNoYXNlZEdpZnRDYXJkcyA9IGNvdW50KGV4aXN0aW5nR2lmdENhcmRzLCAoZ2lmdENhcmQpID0+IGdpZnRDYXJkLm9yZGVyRGF0ZSA+IHNpeE1vbnRoc0FnbylcblxuXHRpZiAobnVtUHVyY2hhc2VkR2lmdENhcmRzID49IHBhcnNlSW50KGdpZnRDYXJkSW5mby5tYXhQZXJQZXJpb2QpKSB7XG5cdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihcblx0XHRcdGxhbmcuZ2V0VHJhbnNsYXRpb24oXCJ0b29NYW55R2lmdENhcmRzX21zZ1wiLCB7XG5cdFx0XHRcdFwie2Ftb3VudH1cIjogZ2lmdENhcmRJbmZvLm1heFBlclBlcmlvZCxcblx0XHRcdFx0XCJ7cGVyaW9kfVwiOiBgJHtnaWZ0Q2FyZEluZm8ucGVyaW9kfSBtb250aHNgLFxuXHRcdFx0fSksXG5cdFx0KVxuXHR9XG5cblx0Y29uc3QgcHJpY2VEYXRhUHJvdmlkZXIgPSBhd2FpdCBQcmljZUFuZENvbmZpZ1Byb3ZpZGVyLmdldEluaXRpYWxpemVkSW5zdGFuY2UobnVsbCwgbG9jYXRvci5zZXJ2aWNlRXhlY3V0b3IsIG51bGwpXG5cdHJldHVybiBuZXcgUHVyY2hhc2VHaWZ0Q2FyZE1vZGVsKHtcblx0XHRwdXJjaGFzZUxpbWl0OiBmaWx0ZXJJbnQoZ2lmdENhcmRJbmZvLm1heFBlclBlcmlvZCksXG5cdFx0cHVyY2hhc2VQZXJpb2RNb250aHM6IGZpbHRlckludChnaWZ0Q2FyZEluZm8ucGVyaW9kKSxcblx0XHRhdmFpbGFibGVQYWNrYWdlczogZ2lmdENhcmRJbmZvLm9wdGlvbnMsXG5cdFx0c2VsZWN0ZWRQYWNrYWdlOiBNYXRoLmZsb29yKGdpZnRDYXJkSW5mby5vcHRpb25zLmxlbmd0aCAvIDIpLFxuXHRcdHJldm9sdXRpb25hcnlQcmljZTogcHJpY2VEYXRhUHJvdmlkZXIuZ2V0U3Vic2NyaXB0aW9uUHJpY2UoUGF5bWVudEludGVydmFsLlllYXJseSwgUGxhblR5cGUuUmV2b2x1dGlvbmFyeSwgVXBncmFkZVByaWNlVHlwZS5QbGFuQWN0dWFsUHJpY2UpLFxuXHR9KVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyRE8sU0FBUywrQ0FBK0Q7QUFDOUUsUUFBTyxNQUNOLGdCQUNDLGlF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R0FBQztJQUFDO0lBQUU7SUFBRztJQUFHO0lBQUc7R0FBRztHQUFDO0lBQUM7SUFBRTtJQUFHO0lBQUc7SUFBRztHQUFJO0dBQUM7SUFBQztJQUFFO0lBQUc7SUFBRztJQUFHO0dBQUk7R0FBQztJQUFDO0lBQUU7SUFBRztJQUFHO0lBQUc7R0FBSTtHQUFDO0lBQUM7SUFBRTtJQUFHO0lBQUc7SUFBRztHQUFJO0dBQUM7SUFBQztJQUFFO0lBQUc7SUFBRztJQUFHO0dBQUk7R0FBQztJQUFDO0lBQUU7SUFBRztJQUFHO0lBQUc7SUFBRztHQUFJO0dBQUM7SUFBQztJQUFFO0lBQUc7SUFBRztJQUFHO0lBQUk7R0FBSTtHQUFDO0lBQUM7SUFBRTtJQUFHO0lBQUc7SUFBRztJQUFJO0dBQUk7R0FBQztJQUFDO0lBQUU7SUFBRztJQUFHO0lBQUc7SUFBSTtHQUFJO0dBQUM7SUFBQztJQUFFO0lBQUc7SUFBRztJQUFHO0lBQUk7R0FBSTtHQUFDO0lBQUM7SUFBRTtJQUFHO0lBQUc7SUFBRztJQUFJO0dBQUk7R0FBQztJQUFDO0lBQUU7SUFBRztJQUFHO0lBQUc7SUFBSTtHQUFJO0dBQUM7SUFBQztJQUFFO0lBQUc7SUFBRztJQUFHO0lBQUk7SUFBSTtHQUFJO0dBQUM7SUFBQztJQUFFO0lBQUc7SUFBRztJQUFHO0lBQUk7SUFBSTtHQUFJO0dBQUM7SUFBQztJQUFFO0lBQUc7SUFBRztJQUFHO0lBQUk7SUFBSTtHQUFJO0dBQUM7SUFBQztJQUFFO0lBQUc7SUFBRztJQUFHO0lBQUk7SUFBSTtHQUFJO0dBQUM7SUFBQztJQUFFO0lBQUc7SUFBRztJQUFHO0lBQUk7SUFBSTtHQUFJO0dBQUM7SUFBQztJQUFFO0lBQUc7SUFBRztJQUFHO0lBQUk7SUFBSTtHQUFJO0VBQUM7RUFBQyxLQUFJO0VBQWtELEtBQUk7RUFBMkQsVUFBUztFQUFzQyxnQkFBZSxTQUFTLE1BQUs7R0FBQyxJQUFJLElBQUUsUUFBTTtBQUFHLFVBQU0sT0FBTyxZQUFZLEVBQUUsR0FBQyxPQUFPLFlBQVksT0FBTyxJQUFJLElBQUUsRUFBRyxNQUFJLE9BQU8sT0FBTSxPQUFPLFlBQVksRUFBRSxHQUFDLE9BQU8sWUFBWSxPQUFPLElBQUk7QUFDeHVDLFdBQVMsUUFBTSxLQUFJLEtBQUcsT0FBTztFQUFVO0VBQUMsa0JBQWlCLFNBQVMsTUFBSztHQUFDLElBQUksSUFBRSxRQUFNO0FBQUcsVUFBTSxPQUFPLFlBQVksRUFBRSxHQUFDLE9BQU8sWUFBWSxPQUFPLElBQUksSUFBRSxFQUFHLE1BQUksT0FBTyxPQUFNLE9BQU8sWUFBWSxFQUFFLEdBQUMsT0FBTyxZQUFZLE9BQU8sSUFBSTtBQUMzTixVQUFRLFFBQU0sS0FBSTtFQUFHO0VBQUMsYUFBWSxTQUFTLE1BQUs7R0FBQyxJQUFJLFFBQU07QUFBRSxVQUFNLFFBQU0sR0FBRTtBQUFDO0FBQVEsY0FBUTtHQUFHO0FBQy9GLFVBQU87RUFBTztFQUFDLG9CQUFtQixTQUFTLFlBQVc7QUFBQyxVQUFPLE9BQU8sdUJBQXVCLGFBQVc7RUFBSTtFQUFDLFNBQVEsU0FBUyxhQUFZQSxLQUFFLEdBQUU7QUFBQyxXQUFPLGFBQVA7QUFBb0IsU0FBSyxjQUFjLFdBQVcsU0FBUUEsTUFBRSxLQUFHLEtBQUc7QUFBRSxTQUFLLGNBQWMsV0FBVyxRQUFPQSxNQUFFLEtBQUc7QUFBRSxTQUFLLGNBQWMsV0FBVyxRQUFPLElBQUUsS0FBRztBQUFFLFNBQUssY0FBYyxXQUFXLFNBQVFBLE1BQUUsS0FBRyxLQUFHO0FBQUUsU0FBSyxjQUFjLFdBQVcsU0FBUSxLQUFLLE1BQU1BLE1BQUUsRUFBRSxHQUFDLEtBQUssTUFBTSxJQUFFLEVBQUUsSUFBRSxLQUFHO0FBQUUsU0FBSyxjQUFjLFdBQVcsUUFBUUEsTUFBRSxJQUFHLElBQUdBLE1BQUUsSUFBRyxLQUFHO0FBQUUsU0FBSyxjQUFjLFdBQVcsU0FBU0EsTUFBRSxJQUFHLElBQUdBLE1BQUUsSUFBRyxLQUFHLEtBQUc7QUFBRSxTQUFLLGNBQWMsV0FBVyxTQUFTQSxNQUFFLElBQUcsS0FBR0EsTUFBRSxLQUFHLEtBQUcsS0FBRztBQUFFLFlBQVEsT0FBTSxJQUFJLE1BQU0scUJBQW1CO0dBQWM7RUFBQztFQUFDLDJCQUEwQixTQUFTLG9CQUFtQjtHQUFDLElBQUksSUFBRSxJQUFJLGFBQWEsQ0FBQyxDQUFFLEdBQUM7QUFBRyxRQUFJLElBQUlBLE1BQUUsR0FBRUEsTUFBRSxvQkFBbUJBLE1BQUssS0FBRSxFQUFFLFNBQVMsSUFBSSxhQUFhLENBQUMsR0FBRSxPQUFPLEtBQUtBLElBQUUsQUFBQyxHQUFDLEdBQUc7QUFDaDBCLFVBQU87RUFBRztFQUFDLGlCQUFnQixTQUFTLE1BQUssTUFBSztBQUFDLE9BQUcsS0FBRyxRQUFNLE9BQUssR0FBSSxTQUFPLE1BQVA7QUFBYSxTQUFLLE9BQU8sWUFBWSxRQUFPO0FBQUcsU0FBSyxPQUFPLGVBQWUsUUFBTztBQUFFLFNBQUssT0FBTyxlQUFlLFFBQU87QUFBRSxTQUFLLE9BQU8sV0FBVyxRQUFPO0FBQUUsWUFBUSxPQUFNLElBQUksTUFBTSxVQUFRO0dBQU87U0FBUyxPQUFLLEdBQUksU0FBTyxNQUFQO0FBQWEsU0FBSyxPQUFPLFlBQVksUUFBTztBQUFHLFNBQUssT0FBTyxlQUFlLFFBQU87QUFBRyxTQUFLLE9BQU8sZUFBZSxRQUFPO0FBQUcsU0FBSyxPQUFPLFdBQVcsUUFBTztBQUFHLFlBQVEsT0FBTSxJQUFJLE1BQU0sVUFBUTtHQUFPO1NBQVMsT0FBSyxHQUFJLFNBQU8sTUFBUDtBQUFhLFNBQUssT0FBTyxZQUFZLFFBQU87QUFBRyxTQUFLLE9BQU8sZUFBZSxRQUFPO0FBQUcsU0FBSyxPQUFPLGVBQWUsUUFBTztBQUFHLFNBQUssT0FBTyxXQUFXLFFBQU87QUFBRyxZQUFRLE9BQU0sSUFBSSxNQUFNLFVBQVE7R0FBTztJQUFPLE9BQU0sSUFBSSxNQUFNLFVBQVE7RUFBUTtFQUFDLGNBQWEsU0FBUyxRQUFPO0dBQUMsSUFBSSxjQUFZLE9BQU8sZ0JBQWdCO0dBQUMsSUFBSSxZQUFVO0FBQUUsUUFBSSxJQUFJLE1BQUksR0FBRSxNQUFJLGFBQVksTUFBTyxNQUFJLElBQUksTUFBSSxHQUFFLE1BQUksYUFBWSxPQUFNO0lBQUMsSUFBSSxZQUFVO0lBQUUsSUFBSSxPQUFLLE9BQU8sT0FBTyxLQUFJLElBQUk7QUFBQyxTQUFJLElBQUksSUFBRSxJQUFHLEtBQUcsR0FBRSxLQUFJO0FBQUMsU0FBRyxNQUFJLElBQUUsS0FBRyxlQUFhLE1BQUksRUFBRztBQUN2OUIsVUFBSSxJQUFJLElBQUUsSUFBRyxLQUFHLEdBQUUsS0FBSTtBQUFDLFVBQUcsTUFBSSxJQUFFLEtBQUcsZUFBYSxNQUFJLEVBQUc7QUFDdkQsVUFBRyxLQUFHLEtBQUcsS0FBRyxFQUFHO0FBQ2YsVUFBRyxRQUFNLE9BQU8sT0FBTyxNQUFJLEdBQUUsTUFBSSxFQUFFLENBQUU7S0FBYztJQUFDO0FBQ3BELFFBQUcsWUFBVSxFQUFHLGNBQVksSUFBRSxZQUFVO0dBQUs7QUFDN0MsUUFBSSxJQUFJLE1BQUksR0FBRSxNQUFJLGNBQVksR0FBRSxNQUFPLE1BQUksSUFBSSxNQUFJLEdBQUUsTUFBSSxjQUFZLEdBQUUsT0FBTTtJQUFDLElBQUlDLFVBQU07QUFBRSxRQUFHLE9BQU8sT0FBTyxLQUFJLElBQUksQ0FBQztBQUFRLFFBQUcsT0FBTyxPQUFPLE1BQUksR0FBRSxJQUFJLENBQUM7QUFBUSxRQUFHLE9BQU8sT0FBTyxLQUFJLE1BQUksRUFBRSxDQUFDO0FBQVEsUUFBRyxPQUFPLE9BQU8sTUFBSSxHQUFFLE1BQUksRUFBRSxDQUFDO0FBQVEsUUFBR0EsV0FBTyxLQUFHQSxXQUFPLEVBQUcsY0FBVztHQUFJO0FBQ2hSLFFBQUksSUFBSSxNQUFJLEdBQUUsTUFBSSxhQUFZLE1BQU8sTUFBSSxJQUFJLE1BQUksR0FBRSxNQUFJLGNBQVksR0FBRSxNQUFPLEtBQUcsT0FBTyxPQUFPLEtBQUksSUFBSSxLQUFHLE9BQU8sT0FBTyxLQUFJLE1BQUksRUFBRSxJQUFFLE9BQU8sT0FBTyxLQUFJLE1BQUksRUFBRSxJQUFFLE9BQU8sT0FBTyxLQUFJLE1BQUksRUFBRSxJQUFFLE9BQU8sT0FBTyxLQUFJLE1BQUksRUFBRSxLQUFHLE9BQU8sT0FBTyxLQUFJLE1BQUksRUFBRSxJQUFFLE9BQU8sT0FBTyxLQUFJLE1BQUksRUFBRSxDQUFFLGNBQVc7QUFDaFIsUUFBSSxJQUFJLE1BQUksR0FBRSxNQUFJLGFBQVksTUFBTyxNQUFJLElBQUksTUFBSSxHQUFFLE1BQUksY0FBWSxHQUFFLE1BQU8sS0FBRyxPQUFPLE9BQU8sS0FBSSxJQUFJLEtBQUcsT0FBTyxPQUFPLE1BQUksR0FBRSxJQUFJLElBQUUsT0FBTyxPQUFPLE1BQUksR0FBRSxJQUFJLElBQUUsT0FBTyxPQUFPLE1BQUksR0FBRSxJQUFJLElBQUUsT0FBTyxPQUFPLE1BQUksR0FBRSxJQUFJLEtBQUcsT0FBTyxPQUFPLE1BQUksR0FBRSxJQUFJLElBQUUsT0FBTyxPQUFPLE1BQUksR0FBRSxJQUFJLENBQUUsY0FBVztHQUNoUixJQUFJLFlBQVU7QUFBRSxRQUFJLElBQUksTUFBSSxHQUFFLE1BQUksYUFBWSxNQUFPLE1BQUksSUFBSSxNQUFJLEdBQUUsTUFBSSxhQUFZLE1BQU8sS0FBRyxPQUFPLE9BQU8sS0FBSSxJQUFJLENBQUU7R0FDckgsSUFBSSxRQUFNLEtBQUssSUFBSSxNQUFJLFlBQVUsY0FBWSxjQUFZLEdBQUcsR0FBQztBQUFFLGdCQUFXLFFBQU07QUFBRyxVQUFPO0VBQVc7Q0FBQztDQUFDLElBQUksU0FBTztFQUFDLE1BQUssU0FBUyxHQUFFO0FBQUMsT0FBRyxJQUFFLEVBQUcsT0FBTSxJQUFJLE1BQU0sVUFBUSxJQUFFO0FBQ3RLLFVBQU8sT0FBTyxVQUFVO0VBQUk7RUFBQyxNQUFLLFNBQVMsR0FBRTtBQUFDLFVBQU0sSUFBRSxFQUFHLE1BQUc7QUFDNUQsVUFBTSxLQUFHLElBQUssTUFBRztBQUNqQixVQUFPLE9BQU8sVUFBVTtFQUFJO0VBQUMsV0FBVSxJQUFJLE1BQU07RUFBSyxXQUFVLElBQUksTUFBTTtDQUFLO0FBQUMsTUFBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEdBQUUsSUFBSyxRQUFPLFVBQVUsS0FBRyxLQUFHO0FBQzVILE1BQUksSUFBSSxJQUFFLEdBQUUsSUFBRSxLQUFJLElBQUssUUFBTyxVQUFVLEtBQUcsT0FBTyxVQUFVLElBQUUsS0FBRyxPQUFPLFVBQVUsSUFBRSxLQUFHLE9BQU8sVUFBVSxJQUFFLEtBQUcsT0FBTyxVQUFVLElBQUU7QUFDaEksTUFBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEtBQUksSUFBSyxRQUFPLFVBQVUsT0FBTyxVQUFVLE1BQUk7Q0FDN0QsU0FBUyxhQUFhLEtBQUksT0FBTTtBQUFDLE1BQUcsSUFBSSxVQUFRLFVBQVcsT0FBTSxJQUFJLE1BQU0sSUFBSSxTQUFPLE1BQUk7RUFDMUYsSUFBSSxTQUFPO0FBQUUsU0FBTSxTQUFPLElBQUksVUFBUSxJQUFJLFdBQVMsRUFBRztBQUN0RCxPQUFLLE1BQUksSUFBSSxNQUFNLElBQUksU0FBTyxTQUFPO0FBQU8sT0FBSSxJQUFJRCxNQUFFLEdBQUVBLE1BQUUsSUFBSSxTQUFPLFFBQU9BLE1BQUssTUFBSyxJQUFJQSxPQUFHLElBQUlBLE1BQUU7Q0FBVTtBQUM3RyxjQUFhLFlBQVU7RUFBQyxLQUFJLFNBQVMsT0FBTTtBQUFDLFVBQU8sS0FBSyxJQUFJO0VBQVE7RUFBQyxXQUFVLFdBQVU7QUFBQyxVQUFPLEtBQUssSUFBSTtFQUFRO0VBQUMsVUFBUyxTQUFTLEdBQUU7R0FBQyxJQUFJLE1BQUksSUFBSSxNQUFNLEtBQUssV0FBVyxHQUFDLEVBQUUsV0FBVyxHQUFDO0FBQUcsUUFBSSxJQUFJQSxNQUFFLEdBQUVBLE1BQUUsS0FBSyxXQUFXLEVBQUNBLE1BQUssTUFBSSxJQUFJLElBQUUsR0FBRSxJQUFFLEVBQUUsV0FBVyxFQUFDLElBQUssS0FBSUEsTUFBRSxNQUFJLE9BQU8sS0FBSyxPQUFPLEtBQUssS0FBSyxJQUFJQSxJQUFFLENBQUMsR0FBQyxPQUFPLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQ3RVLFVBQU8sSUFBSSxhQUFhLEtBQUk7RUFBSTtFQUFDLEtBQUksU0FBUyxHQUFFO0FBQUMsT0FBRyxLQUFLLFdBQVcsR0FBQyxFQUFFLFdBQVcsR0FBQyxFQUFHLFFBQU87R0FDN0YsSUFBSSxRQUFNLE9BQU8sS0FBSyxLQUFLLElBQUksRUFBRSxDQUFDLEdBQUMsT0FBTyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7R0FBQyxJQUFJLE1BQUksSUFBSSxNQUFNLEtBQUssV0FBVztBQUFFLFFBQUksSUFBSUEsTUFBRSxHQUFFQSxNQUFFLEtBQUssV0FBVyxFQUFDQSxNQUFLLEtBQUlBLE9BQUcsS0FBSyxJQUFJQSxJQUFFO0FBQ25KLFFBQUksSUFBSUEsTUFBRSxHQUFFQSxNQUFFLEVBQUUsV0FBVyxFQUFDQSxNQUFLLEtBQUlBLFFBQUksT0FBTyxLQUFLLE9BQU8sS0FBSyxFQUFFLElBQUlBLElBQUUsQ0FBQyxHQUFDLE1BQU07QUFDakYsVUFBTyxJQUFJLGFBQWEsS0FBSSxHQUFHLElBQUksRUFBRTtFQUFFO0NBQUM7Q0FBQyxTQUFTLFVBQVUsWUFBVyxXQUFVO0FBQUMsT0FBSyxhQUFXO0FBQVcsT0FBSyxZQUFVO0NBQVc7QUFDdkksV0FBVSxpQkFBZTtFQUFDO0dBQUM7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0VBQUU7RUFBQztHQUFDO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFJO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0VBQUU7RUFBQztHQUFDO0dBQUU7R0FBSTtFQUFJO0VBQUM7R0FBQztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztHQUFHO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBSTtFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztHQUFHO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUk7RUFBSTtFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztHQUFHO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztHQUFHO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBSTtFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztHQUFHO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUk7R0FBRztHQUFFO0dBQUk7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztHQUFHO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFJO0VBQUk7RUFBQztHQUFDO0dBQUU7R0FBRztHQUFHO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBSTtHQUFJO0dBQUU7R0FBSTtFQUFJO0VBQUM7R0FBQztHQUFFO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUk7R0FBRztHQUFFO0dBQUk7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztHQUFHO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFJO0dBQUc7R0FBRTtHQUFJO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztHQUFHO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBSTtHQUFJO0dBQUU7R0FBSTtFQUFJO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUk7R0FBSTtHQUFFO0dBQUk7RUFBSTtFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFJO0dBQUk7R0FBRTtHQUFJO0VBQUk7RUFBQztHQUFDO0dBQUU7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBSTtHQUFJO0dBQUU7R0FBSTtFQUFJO0VBQUM7R0FBQztHQUFFO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUk7R0FBSTtHQUFFO0dBQUk7RUFBSTtFQUFDO0dBQUM7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFJO0dBQUk7R0FBRTtHQUFJO0VBQUk7RUFBQztHQUFDO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBSTtHQUFJO0dBQUU7R0FBSTtFQUFJO0VBQUM7R0FBQztHQUFFO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUk7R0FBSTtHQUFFO0dBQUk7RUFBSTtFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFJO0dBQUk7R0FBRTtHQUFJO0VBQUk7RUFBQztHQUFDO0dBQUU7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBSTtHQUFJO0dBQUU7R0FBSTtFQUFJO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUU7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUk7R0FBSTtHQUFFO0dBQUk7RUFBSTtFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFJO0dBQUk7R0FBRztHQUFJO0VBQUk7RUFBQztHQUFDO0dBQUU7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBSTtHQUFJO0dBQUU7R0FBSTtFQUFJO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUk7R0FBSTtHQUFHO0dBQUk7RUFBSTtFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFJO0dBQUk7R0FBRTtHQUFJO0VBQUk7RUFBQztHQUFDO0dBQUU7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBSTtFQUFJO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFHO0dBQUk7R0FBSTtHQUFFO0dBQUk7RUFBSTtFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFJO0dBQUk7R0FBRTtHQUFJO0VBQUk7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFFO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBSTtHQUFJO0dBQUU7R0FBSTtFQUFJO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUk7R0FBSTtHQUFHO0dBQUk7RUFBSTtFQUFDO0dBQUM7R0FBRTtHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFFO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFJO0dBQUk7R0FBRTtHQUFJO0VBQUk7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUU7R0FBSTtHQUFJO0dBQUc7R0FBSTtFQUFJO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRztHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFHO0dBQUk7R0FBSTtHQUFFO0dBQUk7RUFBSTtFQUFDO0dBQUM7R0FBRztHQUFHO0dBQUc7R0FBRTtHQUFHO0VBQUc7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFBRztFQUFDO0dBQUM7R0FBRztHQUFJO0dBQUk7R0FBRTtHQUFJO0VBQUk7RUFBQztHQUFDO0dBQUc7R0FBRztHQUFHO0dBQUc7R0FBRztFQUFHO0VBQUM7R0FBQztHQUFHO0dBQUc7R0FBRztHQUFHO0dBQUc7RUFB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