'use strict'

//
// Application.
//
const K = require("./constants")
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
 * This method will return the authentication settings.
 * The function will also ensure the settings record is there.
 *
 * @returns {Object}: The authentication settings.
 */
function getSettings()
{
	//
	// Init local storage.
	//
	let auth = {}
	let save = false
	const collection = K.db._collection(K.collection.settings.name)

	//
	// Get authentication record.
	//
	try
	{
		//
		// Get settings from collection.
		//
		auth = collection.document(K.environment.auth)

		return auth                                                             // ==>
	}
	catch
	{
		//
		// Assume record not found.
		//
		save = true
		auth = { _key: K.environment.auth }
	}

	//
	// Handle admin authentication.
	//
	if( ! auth.hasOwnProperty( 'admin' ) )
	{
		save = true
		auth['admin'] = {
			key: crypto.genRandomAlphaNumbers( 16 ),
			code: crypto.genRandomAlphaNumbers( 16 ),
			pass: crypto.genRandomAlphaNumbers( 16 )
		}
	}

	//
	// Handle user authentication.
	//
	if( ! auth.hasOwnProperty( 'user' ) )
	{
		save = true
		auth['user'] = {
			key: crypto.genRandomAlphaNumbers( 16 ),
			code: crypto.genRandomAlphaNumbers( 16 ),
			pass: crypto.genRandomAlphaNumbers( 16 )
		}
	}

	//
	// Handle cookie authentication.
	//
	if( ! auth.hasOwnProperty( 'cookie' ) )
	{
		save = true
		auth.cookie = {
			key: crypto.genRandomAlphaNumbers( 48 )
		}
	}

	//
	// Save settings.
	//
	if(save) {
		collection.save(auth)
		return auth                                                             // ==>
	}

	//
	// Clean settings.
	//
	delete auth._id
	delete auth._key
	delete auth._rev

	return auth                                                                 // ==>

}	// getSettings()


module.exports = {
	Module,
	getSettings
}