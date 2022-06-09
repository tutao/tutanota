import o from "ospec"
import type {Theme, ThemeId} from "../../../src/gui/theme.js"
import n from "../nodemocker.js"
import {ThemeController} from "../../../src/gui/ThemeController.js"
import type {ThemeCustomizations} from "../../../src/misc/WhitelabelCustomizations.js"
import {downcast} from "@tutao/tutanota-utils"
import {ThemeFacade} from "../../../src/native/common/generatedipc/ThemeFacade"

o.spec("Theme Controller", function () {
    let themeManager: ThemeController
    let themeFacadeMock
    let htmlSanitizerMock
    o.beforeEach(function () {
        const themeFacade: ThemeFacade = {
            async getSelectedTheme(): Promise<ThemeId | null> {
                return null
            },

            async setSelectedTheme(theme: ThemeId): Promise<void> {},

            async getThemes(): Promise<Array<Theme>> {
                return []
            },

            async setThemes(themes: ReadonlyArray<Theme>): Promise<void> {},
        }
        themeFacadeMock = n.mock("__themeFacade", themeFacade).set()
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
        themeManager = new ThemeController(themeFacadeMock, () => Promise.resolve(htmlSanitizerMock))
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
        const savedTheme = themeFacadeMock.setThemes.args[0][0]
        o(savedTheme.themeId).equals("HelloFancyId")
        o(savedTheme.content_bg).equals("#fffeee")
        o(savedTheme.logo).equals("sanitized")
        o(savedTheme.content_fg).equals(themeManager.getDefaultTheme().content_fg)
        o(themeManager._theme.logo).equals("sanitized")
    })
})