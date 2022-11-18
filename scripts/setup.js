'use strict';

/**
 * Setup script
 * This script will ensure all required collections are there.
 * It will iterate the "collection" constants property and create any missing collection.
 */

//
// Frameworks.
//
const fs = require('fs')					// File system.

//
// Application.
//
const K = require('../utils/constants')		// Application constants.
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
// Create users.
//
messages = messages.concat(App.createUsers())


module.exports = messages
