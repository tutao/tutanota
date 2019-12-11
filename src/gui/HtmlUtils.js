//@flow

export function applySafeAreaInsetMarginLR(element: HTMLElement){
	element.style.marginRight = 'env(safe-area-inset-right)'
	element.style.marginLeft = 'env(safe-area-inset-left)'
}

export function getSafeAreaInsetLeft(){
	return window.orientation === 90 ? 'env(safe-area-inset-left)' : ""
}

export function getSafeAreaInsetRight(){
	return window.orientation === -90 ? 'env(safe-area-inset-right)' : ""
}