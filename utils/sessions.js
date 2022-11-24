'use strict'

//
// Application constants.
//
const K = require('./constants')

//
// Includes.
//
const sessionsMiddleware = require("@arangodb/foxx/sessions")
const cookieTransport = require('@arangodb/foxx/sessions/transports/cookie');

//
// Session.
//
const sessions = sessionsMiddleware({
	storage: K.db._collection(K.collection.session.name),
	transport: "cookie"
})

module.exports = sessions
