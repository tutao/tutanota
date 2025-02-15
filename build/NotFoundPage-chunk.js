import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import { assertMainOrNode } from "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import "./theme-chunk.js";
import "./TutanotaConstants-chunk.js";
import { px } from "./size-chunk.js";
import { Button, ButtonType } from "./Button-chunk.js";
import { AriaLandmarks, landmarkAttrs } from "./AriaUtils-chunk.js";

//#region src/common/gui/base/NotFoundPage.ts
assertMainOrNode();
var NotFoundPage = class {
	view() {
		return mithril_default(".main-view.flex.items-center.justify-center.mlr", {
			...landmarkAttrs(AriaLandmarks.Main),
			style: { "max-height": px(450) }
		}, mithril_default(".message.center.max-width-l", [mithril_default("h2", "404"), [mithril_default("p", lang.get("notFound404_msg")), mithril_default(Button, {
			label: "back_action",
			click: () => window.history.back(),
			type: ButtonType.Primary
		})]]));
	}
};

//#endregion
export { NotFoundPage };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTm90Rm91bmRQYWdlLWNodW5rLmpzIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vZ3VpL2Jhc2UvTm90Rm91bmRQYWdlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBweCB9IGZyb20gXCIuLi9zaXplXCJcbmltcG9ydCB7IEFyaWFMYW5kbWFya3MsIGxhbmRtYXJrQXR0cnMgfSBmcm9tIFwiLi4vQXJpYVV0aWxzXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IEJ1dHRvbiwgQnV0dG9uVHlwZSB9IGZyb20gXCIuL0J1dHRvbi5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuXG5leHBvcnQgY2xhc3MgTm90Rm91bmRQYWdlIGltcGxlbWVudHMgQ29tcG9uZW50PHZvaWQ+IHtcblx0dmlldygpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5tYWluLXZpZXcuZmxleC5pdGVtcy1jZW50ZXIuanVzdGlmeS1jZW50ZXIubWxyXCIsXG5cdFx0XHR7XG5cdFx0XHRcdC4uLmxhbmRtYXJrQXR0cnMoQXJpYUxhbmRtYXJrcy5NYWluKSxcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcIm1heC1oZWlnaHRcIjogcHgoNDUwKSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRtKFwiLm1lc3NhZ2UuY2VudGVyLm1heC13aWR0aC1sXCIsIFtcblx0XHRcdFx0bShcImgyXCIsIFwiNDA0XCIpLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0bShcInBcIiwgbGFuZy5nZXQoXCJub3RGb3VuZDQwNF9tc2dcIikpLFxuXHRcdFx0XHRcdG0oQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRsYWJlbDogXCJiYWNrX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHdpbmRvdy5oaXN0b3J5LmJhY2soKSxcblx0XHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuUHJpbWFyeSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XSxcblx0XHRcdF0pLFxuXHRcdClcblx0fVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFPQSxrQkFBa0I7SUFFTCxlQUFOLE1BQThDO0NBQ3BELE9BQWlCO0FBQ2hCLFNBQU8sZ0JBQ04sbURBQ0E7R0FDQyxHQUFHLGNBQWMsY0FBYyxLQUFLO0dBQ3BDLE9BQU8sRUFDTixjQUFjLEdBQUcsSUFBSSxDQUNyQjtFQUNELEdBQ0QsZ0JBQUUsK0JBQStCLENBQ2hDLGdCQUFFLE1BQU0sTUFBTSxFQUNkLENBQ0MsZ0JBQUUsS0FBSyxLQUFLLElBQUksa0JBQWtCLENBQUMsRUFDbkMsZ0JBQUUsUUFBUTtHQUNULE9BQU87R0FDUCxPQUFPLE1BQU0sT0FBTyxRQUFRLE1BQU07R0FDbEMsTUFBTSxXQUFXO0VBQ2pCLEVBQUMsQUFDRixDQUNELEVBQUMsQ0FDRjtDQUNEO0FBQ0QifQ==