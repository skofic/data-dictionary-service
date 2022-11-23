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
const errors = require('@arangodb').errors  // Database errors.
const crypto = require('@arangodb/crypto')  // Cryptographic functions.

//
// Application.
//
const K = require( './constants' )          // Application constants.
const Auth = require('./auth')      		// Authentication functions.

//
// Database constants.
//
const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code


/**
 * Initialise directories
 *
 * This method will initialise root level directories.
 *
 * @return {Array<String>}: List of directories parsed.
 */
function createDirectories()
{
    //
    // Init local storage.
    //
    let messages = []

    //
    // Iterate directories.
    //
    for(const item of K.directory) {
        const path = module.context.basePath + fs.pathSeparator + item
        if( ! fs.isDirectory( path ) ) {
            fs.makeDirectory( path )
            messages.push(`Directory ${item} created.`)
        } else {
            messages.push(`Directory ${item} exists.`)
        }
    }

    return messages                                                             // ==>

}	// createDirectories()

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
    for (const key of Object.keys(K.collection)) {

        //
        // Handle missing collection.
        //
        const name = K.collection[key].name
        const type = K.collection[key].type

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

    return messages                                                             // ==>

}	// createCollections()

/**
 * Initialise users
 *
 * This method will create the admin and user users.
 * The default password can be found in the manifest file
 * in the configurations section.
 *
 * Users are composed as follows:
 * - _key_: Username or code.
 * - auth:  Authentication record containing method used to generate the hash,
 * random salt used to generate the hash and the hash string.
 *
 * @return {Array<String>}: List of users parsed.
 */
function createUsers()
{
    let messages = []
    const users = db._collection(K.collection.user.name)

    //
    // Create administrator user.
    //
    if (!users.firstExample({username: module.context.configuration.adminCode})) {
        users.save({
            username: module.context.configuration.adminCode,
            role: [
                K.environment.role.admin,
                K.environment.role.dict,
                K.environment.role.read
            ],
            auth: Auth.create(module.context.configuration.adminPass)
        })
        messages.push(`Created ${module.context.configuration.adminCode} user.`)
    } else {
        messages.push(`User ${module.context.configuration.adminCode} exists.`)
    }

    //
    // Create manager user.
    //
    if (!users.firstExample({username: module.context.configuration.managerCode})) {
        users.save({
            username: module.context.configuration.managerCode,
            role: [
                K.environment.role.dict,
                K.environment.role.read
            ],
            auth: Auth.create(module.context.configuration.managerPass)
        })
        messages.push(`Created ${module.context.configuration.managerCode} user.`)
    } else {
        messages.push(`User ${module.context.configuration.managerCode} exists.`)
    }

    //
    // Create reader user.
    //
    if (!users.firstExample({username: module.context.configuration.userCode})) {
        users.save({
            username: module.context.configuration.userCode,
            role: [
                K.environment.role.read
            ],
            auth: Auth.create(module.context.configuration.userPass)
        })
        messages.push(`Created ${module.context.configuration.userCode} user.`)
    } else {
        messages.push(`User ${module.context.configuration.userCode} exists.`)
    }

    return messages                                                             // ==>

}	// createUsers()


module.exports = {
    createDirectories,
    createCollections,
    createUsers
}