import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Button} from "./Button"
import {Icons} from "./icons/Icons"
import {lazyStringValue} from "@tutao/tutanota-utils"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {ButtonType} from "./ButtonN"
import {createDropDownButton} from "./Dropdown"
import {TextFieldN} from "./TextFieldN"
import type {lazy} from "@tutao/tutanota-utils"
import {assertMainOrNode} from "../../api/common/Env"
import Stream from "mithril/stream";
assertMainOrNode()
export class DropDownSelector<T> {
    view: (...args: Array<any>) => any
    selectedValue: Stream<T>
    _changeHandler: (arg0: T) => unknown
    _items: {
        name: string
        value: T
    }[]
    _selectedValueDisplayValue: string

    constructor(
        labelIdOrLabelTextFunction: TranslationKey | lazy<string>,
        helpLabel: lazy<string> | null,
        items: {
            name: string
            value: T
        }[],
        selectedValue: Stream<T>,
        dropdownWidth?: number,
    ) {
        this.selectedValue = selectedValue
        this._items = items

        this.view = () => {
            const itemChooser = createDropDownButton(
                labelIdOrLabelTextFunction,
                () => Icons.Edit,
                () => {
                    return items.map(item =>
                        new Button(
                            () => item.name,
                            () => {
                                if (this.selectedValue() !== item.value) {
                                    if (this._changeHandler) {
                                        this._changeHandler(item.value)
                                    } else {
                                        this.selectedValue(item.value)
                                        m.redraw()
                                    }
                                }
                            },
                        )
                            .setType(ButtonType.Dropdown)
                            .setSelected(() => this.selectedValue() === item.value),
                    )
                },
                dropdownWidth ? dropdownWidth : undefined,
            )
            this._selectedValueDisplayValue = this.selectedValue.map(value => {
                const selectedItem = items.find(item => item.value === this.selectedValue())

                if (selectedItem) {
                    return selectedItem.name
                } else {
                    console.log(`Dropdown ${lazyStringValue(textFieldAttrs.label)} couldn't find element for value: ${String(value)}`)
                    return ""
                }
            })()
            const textFieldAttrs = {
                label: labelIdOrLabelTextFunction,
                helpLabel: helpLabel,
                disabled: true,
                value: stream(this._selectedValueDisplayValue),
				// @ts-ignore
                injectionsRight: () => [m(itemChooser)],
            }
            return m(TextFieldN, textFieldAttrs)
        }
    }

    /**
     * The handler is invoked with the new selected value. The displayed selected value is not changed automatically,
     * but the handler is responsible for updating this DropDownSelector.
     */
    setSelectionChangedHandler(handler: (arg0: T) => unknown): DropDownSelector<T> {
        this._changeHandler = handler
        return this
    }
}