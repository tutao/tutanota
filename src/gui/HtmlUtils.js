export function isDescendant(parent, child) {
	var n = child.parentNode
	while (n != null) {
		if (n === parent) return true
		n = n.parentNode;
	}
	return false;
}