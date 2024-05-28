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


module.exports = messages
