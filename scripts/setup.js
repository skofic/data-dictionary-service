'use strict';

/**
 * Setup script
 * This script will ensure all required collections are there.
 * It will iterate the "collection" constants property and create any missing collection.
 */

//
// Application.
//
const K = require( '../utils/constants' )    // Application constants.

//
// Local storage.
//
let created = []

//
// Iterate collections.
//
for(const key of Object.keys(K.collection)) {

  //
  // Handle missing collection.
  //
  const name = K.collection[key].name
  const type = K.collection[key].type

  if(K.db._collection(name) === null) {
    if(type === 'D') {
      K.db._createDocumentCollection(name)
    } else if(type === 'E') {
      K.db._createEdgeCollection(name)
    }
    created.push(name)
  }

  //
  // Handle existing collection.
  //
  else {
    console.debug(`collection ${name} already exists. Leaving it untouched.`)
  }
}

// module.exports = `Created ${created.length} collections.`
