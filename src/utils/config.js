const { cosmiconfig } = require("cosmiconfig");
const mergeDeep = require("merge-deep");

const { config: log } = require("./debug.js");

const defaultConfig = {
	className: "CommandExecutor",
	host: "localhost",
	httpPort: 1390,
	ldapPort: 1389,
	sendMessage: true,
};

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