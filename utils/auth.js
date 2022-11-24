'use strict'

const createAuth = require("@arangodb/foxx/auth")
const auth = createAuth({
	method: module.context.configuration.method,
	saltLength: module.context.configuration.saltLength,
	workFactor: 1
})

module.exports = auth
