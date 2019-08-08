//@flow

export function applySafeAreaInsetMarginLR(element: HTMLElement){
	element.style.marginRight = getSafeAreaInsetRight()
	element.style.marginLeft = getSafeAreaInsetLeft()
}

export function getSafeAreaInsetLeft(){
	return window.orientation === 90 ? 'env(safe-area-inset-left)' : ""
}

export function getSafeAreaInsetRight(){
	return window.orientation === 90 ? 'env(safe-area-inset-right)' : ""
}