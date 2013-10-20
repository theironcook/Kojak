// Shim originally written by http://stackoverflow.com/users/1114506/rajesh
// found at http://stackoverflow.com/questions/19196337/string-contains-doesnt-exist-while-working-in-chrome

if(!('contains' in String.prototype)) {
	String.prototype.contains = function(str, startIndex) {
		return -1 !== String.prototype.indexOf.call(this, str, startIndex);
	};
}