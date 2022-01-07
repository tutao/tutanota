import m, {Children, Vnode} from "mithril"
import SquireEditor from "squire-rte"
import type {DeferredObject} from "@tutao/tutanota-utils"
import {defer} from "@tutao/tutanota-utils"
import {px} from "../size"
import {Dialog} from "../base/Dialog"
import {isMailAddress} from "../../misc/FormatValidator"
import type {ImageHandler} from "../../mail/model/MailUtils"
import {TabIndex} from "../../api/common/TutanotaConstants"
import {Keys} from "../../api/common/TutanotaConstants"
import {isKeyPressed} from "../../misc/KeyManager"
type SanitizerFn = (html: string, isPaste: boolean) => DocumentFragment
type Style = "b" | "i" | "u" | "c" | "a"
type Alignment = "left" | "center" | "right" | "justify"
type Listing = "ol" | "ul"
type Styles = {
	[key in Style]: boolean
} & {
	alignment: Alignment
	listing: Listing | null
}
export class Editor implements ImageHandler {
    _squire: Squire
    view: (vnode: Vnode<any>) => Children | Children[]
    onbeforeupdate: (...args: Array<any>) => any
    onremove: (...args: Array<any>) => any
    initialized: DeferredObject<void>
    _domElement: HTMLElement
    _enabled: boolean
    _active: boolean
    _createsLists: boolean
    _minHeight: number | null
    _sanitizer: SanitizerFn
    // _tutanotaProperties: TutanotaProperties;
    _styleActions: Record<Style, Array<(...args: Array<any>) => any>>
    styles: Styles = {
        b: false,
        i: false,
        u: false,
        c: false,
        a: false,
        alignment: "left",
        listing: null,
    }

    constructor(minHeight: number | null, sanitizer: SanitizerFn) {
        this._enabled = true
        this._active = false
        this._minHeight = minHeight
        this._sanitizer = sanitizer
        //this._tutanotaProperties = tutanotaProperties
        this.initialized = defer()

        this.onbeforeupdate = () => !(this._squire != null) // do not update the dom part managed by squire

        this.onremove = () => {
            if (this._squire) {
                this._squire.destroy()

                this._squire = null
                this.initialized = defer()
            }
        }

        this._createsLists = true
        this._styleActions = Object.freeze({
            b: [() => this._squire.bold(), () => this._squire.removeBold(), () => this.styles.b],
            i: [() => this._squire.italic(), () => this._squire.removeItalic(), () => this.styles.i],
            u: [() => this._squire.underline(), () => this._squire.removeUnderline(), () => this.styles.u],
            c: [() => this._squire.setFontFace("monospace"), () => this._squire.setFontFace("sans-serif"), () => this.styles.c],
            a: [() => this.makeLink(), () => this._squire.removeLink(), () => this.styles.a],
        })

        this.view = () => {
            return m(".hide-outline.selectable", {
                role: "textbox",
                "aria-multiline": "true",
                tabindex: TabIndex.Default,
                oncreate: vnode => this.initSquire(vnode.dom as HTMLElement),
                style: this._minHeight
                    ? {
                          "min-height": px(this._minHeight),
                      }
                    : {},
            })
        }
    }

    isEmpty(): boolean {
        return !this._squire || this._squire.getHTML() === "<div><br></div>"
    }

    getValue(): string {
        return this.isEmpty() ? "" : this._squire.getHTML()
    }

    addChangeListener(callback: (...args: Array<any>) => any) {
        this._squire.addEventListener("input", callback)
    }

    setMinHeight(minHeight: number): Editor {
        this._minHeight = minHeight
        return this
    }

    setCreatesLists(createsLists: boolean): Editor {
        this._createsLists = createsLists
        return this
    }

    initSquire(domElement: HTMLElement) {
        let squire = new (SquireEditor as any)(domElement, {
            sanitizeToDOMFragment: this._sanitizer,
            blockAttributes: {
                dir: "auto",
            },
        }).addEventListener("keyup", e => {
            if (this._createsLists && isKeyPressed(e.keyCode, Keys.SPACE)) {
                let blocks = []
                squire.forEachBlock(block => {
                    blocks.push(block)
                })
                createList(blocks, /^1\.\s$/, true) // create an ordered list if a line is started with '1. '

                createList(blocks, /^\*\s$/, false) // create an unordered list if a line is started with '* '
            }
        })
        this._squire = squire

        this._squire.addEventListener("pathChange", () => {
            this.getStylesAtPath()
            m.redraw() // allow richtexttoolbar to redraw elements
        })

        this._domElement = domElement
        // the _editor might have been disabled before the dom element was there
        this.setEnabled(this._enabled)
        this.initialized.resolve()

        function createList(blocks: HTMLElement[], regex: RegExp, ordered: boolean) {
            if (blocks.length === 1 && blocks[0].textContent.match(regex)) {
                squire.modifyBlocks(function (fragment) {
                    if (fragment.firstChild && fragment.firstChild.firstChild) {
                        let textNode = fragment.firstChild.firstChild

                        while (textNode.nodeType !== Node.TEXT_NODE && textNode.firstChild !== null && textNode.nodeName.toLowerCase() !== "li") {
                            textNode = textNode.firstChild
                        }

                        if (textNode.nodeType === Node.TEXT_NODE) {
                            textNode.textContent = textNode.textContent.replace(regex, "")
                        }
                    }

                    return fragment
                })

                if (ordered) {
                    squire.makeOrderedList()
                } else {
                    squire.makeUnorderedList()
                }
            }
        }
    }

    setEnabled(enabled: boolean) {
        this._enabled = enabled

        // not working currently
        // text is pasted before the event is triggered
        const pasteSuppressor = (e: Event) => {
            e.preventDefault()
        }

        if (this._domElement) {
            this._domElement.setAttribute("contenteditable", String(enabled))

            if (this._enabled) {
                this._domElement.removeEventListener("paste", pasteSuppressor)
            } else {
                this._domElement.addEventListener("paste", pasteSuppressor)
            }
        }
    }

    isEnabled(): boolean {
        return this._enabled
    }

    setHTML(html: string | null) {
        this._squire.setHTML(html)
    }

    getHTML(): string {
        return this._squire.getHTML()
    }

    setStyle(state: boolean, style: Style) {
        ;(state ? this._styleActions[style][0] : this._styleActions[style][1])()
    }

    hasStyle: (arg0: Style) => boolean = style => (this._squire ? this._styleActions[style][2]() : false)
    getStylesAtPath: () => void = () => {
        if (!this._squire) {
            return
        }

        let pathSegments = this._squire.getPath().split(">")

        // lists
        const ulIndex = pathSegments.lastIndexOf("UL")
        const olIndex = pathSegments.lastIndexOf("OL")

        if (ulIndex === -1) {
            if (olIndex > -1) {
                this.styles.listing = "ol"
            } else {
                this.styles.listing = null
            }
        } else if (olIndex === -1) {
            if (ulIndex > -1) {
                this.styles.listing = "ul"
            } else {
                this.styles.listing = null
            }
        } else if (olIndex > ulIndex) {
            this.styles.listing = "ol"
        } else {
            this.styles.listing = "ul"
        }

        //links
        this.styles.a = pathSegments.includes("A")
        // alignment
        let alignment = pathSegments.find(f => f.includes("align"))

        if (alignment !== undefined) {
            switch (alignment.split(".")[1].substring(6)) {
                case "left":
                    this.styles.alignment = "left"
                    break

                case "right":
                    this.styles.alignment = "right"
                    break

                case "center":
                    this.styles.alignment = "center"
                    break

                default:
                    this.styles.alignment = "justify"
            }
        } else {
            this.styles.alignment = "left"
        }

        // font
        this.styles.c = pathSegments.find(f => f.includes("monospace")) !== undefined
        // decorations
        this.styles.b = this._squire.hasFormat("b")
        this.styles.u = this._squire.hasFormat("u")
        this.styles.i = this._squire.hasFormat("i")
    }

    makeLink() {
        Dialog.showTextInputDialog("makeLink_action", "url_label", null, "", null).then(url => {
            if (isMailAddress(url, false)) {
                url = "mailto:" + url
            } else if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("mailto:") && !url.startsWith("{")) {
                url = "https://" + url
            }

            this._squire.makeLink(url)
        })
    }

    insertImage(srcAttr: string, attrs?: Record<string, string>): HTMLElement {
        return this._squire.insertImage(srcAttr, attrs)
    }

    /**
     * Inserts the given html content at the current cursor position.
     */
    insertHTML(html: string) {
        this._squire.insertHTML(html)
    }

    getDOM(): HTMLElement {
        return this._squire.getRoot()
    }

    getCursorPosition(): ClientRect {
        return this._squire.getCursorPosition()
    }

    focus(): void {
        this._squire.focus()

        this.getStylesAtPath()
    }

    isAttached(): boolean {
        return this._squire != null
    }

    removeAllFormatting(): void {
        // Create a range which contains the whole editor
        const range = document.createRange()
        range.selectNode(this._squire.getRoot())

        this._squire.removeAllFormatting(range)
    }

    getSelectedText(): string {
        return this._squire.getSelectedText()
    }

    addEventListener(type: string, handler: (arg0: Event) => void) {
        this._squire.addEventListener(type, handler)
    }

    setSelection(range: Range) {
        this._squire.setSelection(range)
    }
}