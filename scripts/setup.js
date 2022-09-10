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
let created = []

//
// Iterate collections.
//
for(const info of Object.keys(K.collection)) {
  if(!db._collection(info.name)) {
    if(info.type === 'D') {
      db._createDocumentCollection(info.name)
      created.push(info.name)
    } else if(info.type === 'E') {
      db._createEdgeCollection(info.name)
      created.push(info.name)
    }
  } else {
    console.debug(`collection ${collection} already exists. Leaving it untouched.`)
  }
}

module.exports = (created.length) ? `Created the following collections: ${created}.`
                                  : `All collections already exist.`
