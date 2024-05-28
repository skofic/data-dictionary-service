'use strict'

/**
 * application.js
 *
 * This script contains application level functions.
 */

//
// Frameworks.
//
const fs = require('fs')                    // File system.
const db = require('@arangodb').db          // Database.
const aql = require('@arangodb').aql        // Database AQL queries.
const crypto = require('@arangodb/crypto')  // Cryptographic functions.

//
// Application.
//
const K = require( './constants' )  // Application constants.
const Auth = require('./auth')                          // Authentication functions.


/**
 * Initialise collections
 *
 * This method will create collections.
 *
 * @return {Array<String>}: List of collections parsed.
 */
function createCollections()
{
    //
    // Init local storage.
    //
    let messages = []

    //
    // Iterate collections.
    //
    for (const key of Object.keys(K.collection))
    {
        ///
        // Skip authentication collections.
        ///
        switch(key)
        {
            case 'user':
            case 'session':
            case 'settings':
                continue
        }

        //
        // Handle missing collection.
        //
        const name = K.collection[key].name
        const type = K.collection[key].type

        ///
        // Handle missing collections.
        ///
        if (!K.db._collection(name)) {
            if (type === 'D') {
                K.db._createDocumentCollection(name)
            } else if (type === 'E') {
                K.db._createEdgeCollection(name)
            }

            if(K.collection[key].hasOwnProperty('index')) {
                K.collection[key].index.forEach(index => {
                    K.db._collection(name).ensureIndex(index)
                })
            }

            messages.push(`Collection ${name} created.`)
        }

        //
        // Handle existing collection.
        //
        else {
            messages.push(`Collection ${name} already exists. Leaving it untouched.`)
        }
    }

    ///
    // Iterate views.
    ///
    for (const [key, value] of Object.entries(K.view))
    {
        ///
        // Create if not there.
        ///
        if (K.db._view(value.name) === null) {
            db._createView(value.name, value.type, value.properties)

            messages.push(`View ${value.name} created.`)
        }

        //
        // Handle existing collection.
        //
        else {
            messages.push(`View ${value.name} already exists. Leaving it untouched.`)
        }
    }

    return messages                                                             // ==>

}	// createCollections()


module.exports = {
    createCollections
}
