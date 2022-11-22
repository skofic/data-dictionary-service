'use strict'

/**
 * sessions.js
 *
 * This file contains the sessions router.
 */

//
// Application.
//
const K = require('../utils/constants')		// Application constants.

const sessionsMiddleware = require("@arangodb/foxx/sessions")

const sessions = sessionsMiddleware(
	{
		storage: K.db._collection(K.collection.session.name),
		transport: "cookie"
	}
)

module.exports = sessions