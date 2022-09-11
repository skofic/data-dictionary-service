'use strict';

//
// Imports.
//
const db = require('@arangodb').db;

//
// Application.
//
const K = require( '../utils/constants' )    // Application constants.

//
// Local storage.
//
let dropped = []

//
// Remove collections.
//
for(const info of Object.keys(K.collection)) {
  if(db._collection(info.name)) {
    db._drop(info.name)
    dropped.push(info.name)
  } else {
    console.debug(`Collection ${collection} missing.`)
  }
}

module.exports = (dropped.length) ? `Dropped the following collections: ${dropped}.`
                                  : `No collections were dropped.`
