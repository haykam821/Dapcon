const utf8Length = require("utf8-length");

const TC_OBJECT = 0x73;
const TC_CLASSDESC = 0x72;
const TC_STRING = 0x74;

/**
 * Creates a buffer for a string.
 * @param {string} string The string to create a buffer for.
 * @param {number} type The type to prepend to the buffer.
 * @returns {Buffer} The created string buffer.
 */
function createStringBuffer(string, type = TC_STRING) {
	if (typeof string !== "string") {
		throw new TypeError("'string' argument must be a string, found " + typeof string);
	}

	const length = utf8Length(string);

	return Buffer.concat([
		Buffer.from([
			type,
			length >> 8,
			length,
		]),
		Buffer.from(string, "utf8"),
	]);
}

/**
 * Creates a buffer for a message.
 * @param {string} message The message to create a buffer for.
 * @returns {Buffer} The created message buffer.
 */
function createMessageBuffer(message) {
	return Buffer.concat([
		Buffer.from([
			-84,
			-19,
			0,
			5,
		]),
		createStringBuffer(message),
	]);
}
module.exports.createMessageBuffer = createMessageBuffer;

/**
 * Creates a buffer for an object.
 * @param {string} command The command to include in the object.
 * @param {string} className The name of the class.
 * @returns {Buffer} The created object buffer.
 */
function createObjectBuffer(command, className) {
	return Buffer.concat([
		Buffer.from([
			-84, -19, 0, 5, TC_OBJECT,
		]),
		createStringBuffer(className, TC_CLASSDESC),
		Buffer.from([
			113, 18, 29, 97, -23, 34, 0, -78, 2, 0, 1, 76, 0, 7, 99, 111, 109, 109, 97, 110, 100, 116, 0, 18, 76, 106, 97, 118, 97, 47, 108, 97, 110, 103, 47, 83, 116, 114, 105, 110, 103, 59, 120, 112,
		]),
		createStringBuffer(command),
	]);
}
module.exports.createObjectBuffer = createObjectBuffer;
