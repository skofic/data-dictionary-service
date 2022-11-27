'use strict';

/**
 * Setup script
 * This script will ensure all required collections are there.
 * It will iterate the "collection" constants property and create any missing collection.
 */

//
// Application.
//
const App = require('../utils/application')	// Application functions.

//
// Init local storage.
//
let messages = []

//
// Create collections.
//
messages = messages.concat(App.createCollections())

//
// Create data directories.
//
messages = messages.concat(App.createDirectories())

//
// Create authentication file.
//
messages = messages.concat(App.createAuthSettings())

//
// Create users.
//
messages = messages.concat(App.createDefaultUsers())


module.exports = messages
