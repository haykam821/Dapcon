const debug = require("debug");

module.exports.http = debug("dapcon:http");
module.exports.ldap = debug("dapcon:ldap");
module.exports.config = debug("dapcon:config");