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

//
// Application.
//
const K = require( './constants' )          // Application constants.
const Auth = require('./auth')      		// Authentication functions.


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
 * Initialise default users
 *
 * This method will create the admin and user users.
 * The default password can be found in the manifest file
 * in the configurations section.
 *
 * Users are composed as follows:
 * - username: Username or code.
 * - role: An array of roles.
 * - auth:  Authentication record containing method used to generate the hash, random salt used to generate the hash and the hash string.
 * - default: A boolean indicating whether it is a default user.
 *
 * Roles are the following:
 * - admin: Can manage users.
 * - dict: Can manage the data dictionary.
 * - read: Can use the data dictionary.
 *
 * The default property is automatically managed.
 *
 * @return {Array<String>}: List of users parsed.
 */
function createDefaultUsers()
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
            auth: Auth.create(module.context.configuration.adminPass),
            default: true
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
            auth: Auth.create(module.context.configuration.managerPass),
            default: true
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
            auth: Auth.create(module.context.configuration.userPass),
            default: true
        })
        messages.push(`Created ${module.context.configuration.userCode} user.`)
    } else {
        messages.push(`User ${module.context.configuration.userCode} exists.`)
    }

    return messages                                                             // ==>

}	// createDefaultUsers()

/**
 * Delete default users.
 *
 * This function will delete the default users:
 * - admin: Administrator.
 * - manager: Dictionary manager.
 * - user: Dictionary user.
 *
 * As the users are deleted, the function will also delete the corresponding sessions.
 *
 * The actual usernames are stored in the manifest configuration section.
 *
 * @return {Array<String>}: List of users parsed.
 */
function deleteDefaultUsers()
{
    let messages = []

    //
    // Init local storage.
    //
    const usersCollection = K.db._collection(K.collection.user.name)
    const sessionsCollection = K.db._collection(K.collection.session.name)

    //
    // Load default users.
    //
    const defaultUsers =
        K.db._query( aql`
            FOR user IN ${usersCollection}
                FILTER user.default == true
            RETURN user
        `).toArray()

    //
    // Delete users.
    //
    defaultUsers.forEach(user => {
        messages.push(deleteUser(user._key, user.username))
    })

    return messages                                                             // ==>

} // deleteDefaultUsers()

/**
 * Delete created users.
 *
 * This function will delete the created users.
 * Created users are users other than default users.
 *
 * As the users are deleted, the function will also delete the corresponding sessions.
 *
 * @return {Array<String>}: List of users parsed.
 */
function deleteCreatedUsers()
{
    let messages = []

    //
    // Init local storage.
    //
    const usersCollection = K.db._collection(K.collection.user.name)
    const sessionsCollection = K.db._collection(K.collection.session.name)

    //
    // Load default users.
    //
    const defaultUsers =
        K.db._query( aql`
            FOR user IN ${usersCollection}
                FILTER user.default == false
            RETURN user
        `).toArray()

    //
    // Iterate users.
    //
    defaultUsers.forEach(user => {
        messages.push(deleteUser(user._key, user.username))
    })

    return messages                                                             // ==>

} // deleteCreatedUsers()

/**
 * Delete user.
 *
 * This function will delete the user corresponding to the provided key.
 *
 * As the users are deleted, the function will also delete the corresponding sessions.
 *
 * @param theKey {String}: User _key.
 * @param theCode {String}: Username.
 * @return {String}: Deleted username, if existing.
 */
function deleteUser(theKey, theCode = 'anonymous')
{
    //
    // Init local storage.
    //
    const usersCollection = K.db._collection(K.collection.user.name)
    const sessionsCollection = K.db._collection(K.collection.session.name)

    //
    // Delete user.
    //
    K.db._query( aql`
            REMOVE ${theKey} IN ${usersCollection}
        `)

    //
    // Delete open sessions.
    //
    K.db._query( aql`
            FOR session IN ${sessionsCollection}
                FILTER session.uid == ${theKey}
                REMOVE session._key IN ${sessionsCollection}
        `)

    return `Deleted user ${theCode}.`                                           // ==>

} // deleteUser()


module.exports = {
    createDirectories,
    createCollections,
    createDefaultUsers,
    deleteDefaultUsers,
    deleteCreatedUsers,
    deleteUser
}