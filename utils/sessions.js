'use strict'

//
// Application constants.
//
const K = require('./constants')

//
// Session.
//
const sessionsMiddleware = require("@arangodb/foxx/sessions")
const sessions = sessionsMiddleware({
	storage: K.db._collection(K.collection.session.name),
	transport: "cookie"
})

module.exports = sessions
