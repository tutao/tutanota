import { assertMainOrNodeBoot } from "./Env-chunk.js";
import { TabIndex } from "./TutanotaConstants-chunk.js";

//#region src/common/gui/AriaUtils.ts
assertMainOrNodeBoot();
let AriaLandmarks = function(AriaLandmarks$1) {
	AriaLandmarks$1["Banner"] = "banner";
	AriaLandmarks$1["Search"] = "search";
	AriaLandmarks$1["Navigation"] = "navigation";
	AriaLandmarks$1["Main"] = "main";
	AriaLandmarks$1["Complementary"] = "complementary";
	AriaLandmarks$1["Contentinfo"] = "contentinfo";
	AriaLandmarks$1["Region"] = "region";
	return AriaLandmarks$1;
}({});
let AriaLiveRegions = function(AriaLiveRegions$1) {
	AriaLiveRegions$1["Alert"] = "alert";
	AriaLiveRegions$1["Log"] = "log";
	AriaLiveRegions$1["Marquee"] = "Marquee";
	AriaLiveRegions$1["Status"] = "status";
	AriaLiveRegions$1["Timer"] = "timer";
	return AriaLiveRegions$1;
}({});
let AriaWindow = function(AriaWindow$1) {
	AriaWindow$1["AlertDialog"] = "alertdialog";
	AriaWindow$1["Dialog"] = "dialog";
	return AriaWindow$1;
}({});
var AriaLiveData = function(AriaLiveData$1) {
	AriaLiveData$1["Off"] = "off";
	AriaLiveData$1["Polite"] = "polite";
	AriaLiveData$1["Assertive"] = "assertive";
	return AriaLiveData$1;
}(AriaLiveData || {});
function liveDataAttrs() {
	return {
		"aria-live": AriaLiveData.Polite,
		"aria-atomic": "true"
	};
}
let AriaPopupType = function(AriaPopupType$1) {
	AriaPopupType$1["None"] = "false";
	AriaPopupType$1["Menu"] = "menu";
	AriaPopupType$1["ListBox"] = "listbox";
	AriaPopupType$1["Tree"] = "tree";
	AriaPopupType$1["Grid"] = "grid";
	AriaPopupType$1["Dialog"] = "dialog";
	return AriaPopupType$1;
}({});
let AriaRole = function(AriaRole$1) {
	AriaRole$1["Menu"] = "Menu";
	AriaRole$1["MenuItem"] = "menuitem";
	AriaRole$1["Combobox"] = "combobox";
	AriaRole$1["Listbox"] = "listbox";
	AriaRole$1["Option"] = "option";
	AriaRole$1["Switch"] = "switch";
	AriaRole$1["MenuItemCheckbox"] = "menuitemcheckbox";
	AriaRole$1["RadioGroup"] = "radiogroup";
	return AriaRole$1;
}({});
function landmarkAttrs(role, label) {
	return {
		class: "hide-outline",
		role,
		tabindex: TabIndex.Programmatic,
		"aria-label": label
	};
}

//#endregion
export { AriaLandmarks, AriaPopupType, AriaRole, AriaWindow, landmarkAttrs, liveDataAttrs };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXJpYVV0aWxzLWNodW5rLmpzIiwibmFtZXMiOlsicm9sZTogQXJpYUxhbmRtYXJrcyIsImxhYmVsPzogc3RyaW5nIl0sInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1vbi9ndWkvQXJpYVV0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGFzc2VydE1haW5Pck5vZGVCb290IH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRW52XCJcbi8qKlxuICogQ29sbGVjdGlvbnMgb2YgdXRpbGl0eSBmdW5jdGlvbnMgdG8gc3VwcG9ydCBBY2Nlc3NpYmxlIFJpY2ggSW50ZXJuZXQgQXBwbGljYXRpb25zIChBUklBKS5cbiAqXG4gKiBodHRwczovL3d3dy53My5vcmcvVFIvd2FpLWFyaWEtcHJhY3RpY2VzL1xuICogaHR0cHM6Ly93d3cudzMub3JnL1RSL3dhaS1hcmlhLTEuMS9cbiAqIGh0dHBzOi8vd2ViYWltLm9yZy90ZWNobmlxdWVzL2FyaWEvXG4gKiBodHRwczovL3d3dy53My5vcmcvVFIvd2FpLWFyaWEtMS4xL1xuICpcbiAqL1xuaW1wb3J0IHsgVGFiSW5kZXggfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBsYW5nLCBNYXliZVRyYW5zbGF0aW9uIH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuXG5hc3NlcnRNYWluT3JOb2RlQm9vdCgpXG5cbi8vIFNlZTogaHR0cHM6Ly93ZWJhaW0ub3JnL3RlY2huaXF1ZXMvYXJpYS8jbGFuZG1hcmtzXG5leHBvcnQgY29uc3QgZW51bSBBcmlhTGFuZG1hcmtzIHtcblx0QmFubmVyID0gXCJiYW5uZXJcIixcblx0U2VhcmNoID0gXCJzZWFyY2hcIixcblx0TmF2aWdhdGlvbiA9IFwibmF2aWdhdGlvblwiLFxuXHRNYWluID0gXCJtYWluXCIsXG5cdENvbXBsZW1lbnRhcnkgPSBcImNvbXBsZW1lbnRhcnlcIixcblx0Q29udGVudGluZm8gPSBcImNvbnRlbnRpbmZvXCIsXG5cdFJlZ2lvbiA9IFwicmVnaW9uXCIsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEFyaWFMaXZlUmVnaW9ucyB7XG5cdEFsZXJ0ID0gXCJhbGVydFwiLFxuXHRMb2cgPSBcImxvZ1wiLFxuXHRNYXJxdWVlID0gXCJNYXJxdWVlXCIsXG5cdFN0YXR1cyA9IFwic3RhdHVzXCIsXG5cdFRpbWVyID0gXCJ0aW1lclwiLFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBBcmlhV2luZG93IHtcblx0QWxlcnREaWFsb2cgPSBcImFsZXJ0ZGlhbG9nXCIsXG5cdERpYWxvZyA9IFwiZGlhbG9nXCIsXG59XG5cbmNvbnN0IGVudW0gQXJpYUxpdmVEYXRhIHtcblx0Ly9kZWZhdWx0XG5cdE9mZiA9IFwib2ZmXCIsXG5cdC8vXHRJbmRpY2F0ZXMgdGhhdCB1cGRhdGVzIHRvIHRoZSByZWdpb24gc2hvdWxkIGJlIHByZXNlbnRlZCBhdCB0aGUgbmV4dCBncmFjZWZ1bCBvcHBvcnR1bml0eVxuXHRQb2xpdGUgPSBcInBvbGl0ZVwiLFxuXHQvL3JlZ2lvbiBoYXMgdGhlIGhpZ2hlc3QgcHJpb3JpdHlcblx0QXNzZXJ0aXZlID0gXCJhc3NlcnRpdmVcIixcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpdmVEYXRhQXR0cnMoKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG5cdHJldHVybiB7XG5cdFx0XCJhcmlhLWxpdmVcIjogQXJpYUxpdmVEYXRhLlBvbGl0ZSxcblx0XHRcImFyaWEtYXRvbWljXCI6IFwidHJ1ZVwiLFxuXHR9XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEFyaWFQb3B1cFR5cGUge1xuXHROb25lID0gXCJmYWxzZVwiLFxuXHRNZW51ID0gXCJtZW51XCIsXG5cdExpc3RCb3ggPSBcImxpc3Rib3hcIixcblx0VHJlZSA9IFwidHJlZVwiLFxuXHRHcmlkID0gXCJncmlkXCIsXG5cdERpYWxvZyA9IFwiZGlhbG9nXCIsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEFyaWFSb2xlIHtcblx0TWVudSA9IFwiTWVudVwiLFxuXHRNZW51SXRlbSA9IFwibWVudWl0ZW1cIixcblx0Q29tYm9ib3ggPSBcImNvbWJvYm94XCIsXG5cdExpc3Rib3ggPSBcImxpc3Rib3hcIixcblx0T3B0aW9uID0gXCJvcHRpb25cIixcblx0U3dpdGNoID0gXCJzd2l0Y2hcIixcblx0TWVudUl0ZW1DaGVja2JveCA9IFwibWVudWl0ZW1jaGVja2JveFwiLFxuXHRSYWRpb0dyb3VwID0gXCJyYWRpb2dyb3VwXCIsXG59XG5cbi8qKlxuICogY29uc3RydWN0IHNwcmVhZGFibGUgbGFuZG1hcmsgYXR0cmlidXRlcyBmb3Igc2NyZWVuIHJlYWRlcnMuXG4gKiByZXR1cm4gdmFsdWUgaW5jbHVkZXMgYSBoaWRlLW91dGxpbmUgY2xhc3MgdGhhdCB3aWxsIGJlIG92ZXJyaWRkZW4gaWYgdGhlIHNlbGVjdG9yXG4gKiB1c2VkIHRvIGNvbnN0cnVjdCB0aGUgZWxlbWVudCBjb250YWlucyBvdGhlciBjbGFzc2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGFuZG1hcmtBdHRycyhyb2xlOiBBcmlhTGFuZG1hcmtzLCBsYWJlbD86IHN0cmluZyk6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuXHRyZXR1cm4ge1xuXHRcdGNsYXNzOiBcImhpZGUtb3V0bGluZVwiLFxuXHRcdHJvbGUsXG5cdFx0dGFiaW5kZXg6IFRhYkluZGV4LlByb2dyYW1tYXRpYyxcblx0XHRcImFyaWEtbGFiZWxcIjogbGFiZWwsXG5cdH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7OztBQWFBLHNCQUFzQjtJQUdKLDBDQUFYO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0E7SUFFaUIsOENBQVg7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBO0lBRWlCLG9DQUFYO0FBQ047QUFDQTs7QUFDQTtBQUVELElBQVcsd0NBQVg7QUFFQztBQUVBO0FBRUE7O0FBQ0EsRUFQVTtBQVNKLFNBQVMsZ0JBQXdDO0FBQ3ZELFFBQU87RUFDTixhQUFhLGFBQWE7RUFDMUIsZUFBZTtDQUNmO0FBQ0Q7SUFFaUIsMENBQVg7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0E7SUFFaUIsZ0NBQVg7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBO0FBT00sU0FBUyxjQUFjQSxNQUFxQkMsT0FBb0Q7QUFDdEcsUUFBTztFQUNOLE9BQU87RUFDUDtFQUNBLFVBQVUsU0FBUztFQUNuQixjQUFjO0NBQ2Q7QUFDRCJ9