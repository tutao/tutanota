"use strict";

goog.provide('HtmlTestUtils');

/**
 * Compares two dom elements for equality. This is needed because a string
 * comparison is sometimes not sufficient, as some browsers (like firefox) 
 * reorder attributes sometimes.
 * 
 * @see http://stackoverflow.com/questions/10679762/how-to-compare-two-html-elements
 */
HtmlTestUtils.equals = function(elm1, elm2) {
	var attrs1, attrs2, name, node1, node2;
	
	// Compare attributes without order sensitivity
	attrs1 = HtmlTestUtils._getAttributeNames(elm1);
	attrs2 = HtmlTestUtils._getAttributeNames(elm2);
	if (attrs1.join(",") !== attrs2.join(",")) {
		jstestdriver.console.log(attrs1);
		jstestdriver.console.log(attrs2);
		jstestdriver.console.log("Found nodes with different sets of attributes; not equiv");
	    return false;
	}
	
	// ...and values
	// unless you want to compare DOM0 event handlers
	// (onclick="...")
	for (var index = 0; index < attrs1.length; ++index) {
	    name = attrs1[index];
	    if (elm1.getAttribute(name) !== elm2.getAttribute(name)) {
	    	jstestdriver.console.log("Found nodes with mis-matched values for attribute '" + name + "'; not equiv");
	        return false;
	    }
	}
	
	// Walk the children
	for (node1 = elm1.firstChild, node2 = elm2.firstChild;
	    node1 && node2;
	    node1 = node1.nextSibling, node2 = node2.nextSibling) {
	    if (node1.nodeType !== node2.nodeType) {
	        jstestdriver.console.log("Found nodes of different types; not equiv");
	        return false;
	    }
	    if (node1.nodeType === 1) { // Element
	        if (!HtmlTestUtils.equals(node1, node2)) {
	            return false;
	        }
	    } else if (node1.nodeValue !== node2.nodeValue) {
	    	jstestdriver.console.log("Found nodes with mis-matched nodeValues; not equiv");
	        return false;
	    }
	}
	if (node1 || node2) {
	    // One of the elements had more nodes than the other
		jstestdriver.console.log("Found more children of one element than the other; not equivalent");
	    return false;
	}
	
	// Seem the same
	return true;
};

HtmlTestUtils._getAttributeNames = function(node) {
	var index, rv, attrs;
	
	rv = [];
	attrs = node.attributes;
	for (index = 0; index < attrs.length; ++index) {
	    rv.push(attrs[index].nodeName);
	}
	rv.sort();
	return rv;
};