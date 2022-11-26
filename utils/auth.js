'use strict'

//
// Application.
//
const K = require("./constants")
const App = require('./application')
const createAuth = require("@arangodb/foxx/auth")

//
// Creare authentication.
//
const Module = createAuth({
	method: module.context.configuration.method,
	saltLength: module.context.configuration.saltLength,
	workFactor: 1
})

/**
 * Get authentication settings
 *
 * This method will return the administrator and user settings, and the cookie secret.
 *
 * @returns {Object}: The authentication settings.
 */
function getSettings()
{
	//
	// Init local storage.
	//
	const collection = K.db._collection(K.collection.settings.name)

	//
	// Get authentication record.
	//
	try {
		const auth = collection.document(K.environment.auth)
		return {
			admin: auth.admin,
			user: auth.user,
			cookie: auth.cookie
		}                                                                       // ==>
	} catch {
		App.createAuthSettings()
		const auth = collection.document(K.environment.auth)
		return {
			admin: auth.admin,
			user: auth.user,
			cookie: auth.cookie
		}                                                                       // ==>
	}

}	// getSettings()


module.exports = {
	Module,
	getSettings
}