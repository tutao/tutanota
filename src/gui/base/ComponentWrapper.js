//@flow

export function component(view: () => Children): Component {
	return {view}
}