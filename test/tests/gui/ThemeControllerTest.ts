import o from "ospec"
import type {Theme, ThemeId} from "../../../src/gui/theme.js"
import n from "../nodemocker.js"
import type {ThemeStorage} from "../../../src/gui/ThemeController.js"
import {ThemeController} from "../../../src/gui/ThemeController.js"
import type {ThemeCustomizations} from "../../../src/misc/WhitelabelCustomizations.js"
import {downcast} from "@tutao/tutanota-utils"

o.spec("Theme Controller", function () {
    let themeManager: ThemeController
    let themeStorageMock
    let htmlSanitizerMock
    o.beforeEach(function () {
        const themeStorage: ThemeStorage = {
            async getSelectedTheme(): Promise<ThemeId | null> {
                return null
            },

            async setSelectedTheme(theme: ThemeId): Promise<void> {},

            async getThemes(): Promise<Array<Theme>> {
                return []
            },

            async setThemes(themes: ReadonlyArray<Theme>): Promise<void> {},
        }
        themeStorageMock = n.mock("__themeStorage", themeStorage).set()
        htmlSanitizerMock = n
            .mock("__htmlSanitizer", {
                sanitizeHTML: () => {
                    return {
                        text: "sanitized",
                        externalContent: [],
                        inlineImageCids: [],
                        links: [],
                    }
                },
            })
            .set()
        themeManager = new ThemeController(themeStorageMock, () => Promise.resolve(htmlSanitizerMock))
    })
    o("updateCustomTheme", async function () {
        await themeManager.initialized
        const theme: ThemeCustomizations = downcast({
            themeId: "HelloFancyId",
            content_bg: "#fffeee",
            logo: "unsanitized_logo",
            base: "light",
        })
        await themeManager.updateCustomTheme(theme)
        const savedTheme = themeStorageMock.setThemes.args[0][0]
        o(savedTheme.themeId).equals("HelloFancyId")
        o(savedTheme.content_bg).equals("#fffeee")
        o(savedTheme.logo).equals("sanitized")
        o(savedTheme.content_fg).equals(themeManager.getDefaultTheme().content_fg)
        o(themeManager._theme.logo).equals("sanitized")
    })
})