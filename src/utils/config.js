const { cosmiconfig } = require("cosmiconfig");
const mergeDeep = require("merge-deep");

const { config: log } = require("./debug.js");

/**
 * @typedef {Object} DapconConfig
 * @property {string} className The name of the class to send.
 * @property {string} host The host that the Java codebase can be accessed from.
 * @property {number} httpPort The port that the HTTP server should listen on.
 * @property {number} ldapPort The port that the LDAP server should listen on.
 * @property {boolean} sendMessage Whether a message should be sent instead of an object.
 */

/**
 * @type {DapconConfig}
 */
const defaultConfig = {
	className: "CommandExecutor",
	host: "localhost",
	httpPort: 1390,
	ldapPort: 1389,
	sendMessage: true,
};

/**
 * Loads configuration.
 * @returns {DapconConfig} The config.
 */
async function getConfig() {
	const explorer = cosmiconfig("dapcon", {
		searchPlaces: [
			"package.json",
			"config.json",
			".dapconrc",
			".dapconrc.json",
			".dapconrc.yaml",
			".dapconrc.yml",
			".dapconrc.js",
			".dapconrc.cjs",
			"dapconrc.config.js",
			"dapconrc.config.cjs",
		],
	});

	const result = await explorer.search();
	const config = mergeDeep(defaultConfig, result.config);

	log("loaded configuration from '%s'", result.filepath);
	log("loaded configuration: %O", config);

	return config;
}
module.exports = getConfig;
