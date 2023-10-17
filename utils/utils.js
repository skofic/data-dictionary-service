'use strict';

//
// Import frameworks.
//
const _ = require('lodash');                            // Lodash library.
const aql = require('@arangodb').aql;					// AQL queries.
const crypto = require('@arangodb/crypto')              // Cryptographic utilities.
const errors = require('@arangodb').errors;             // ArangoDB errors.
const status = require('statuses');                     // Status codes.

//
// Import resources.
//
const K = require( './constants' );					    // Application constants.

//
// Terms cache.
//
const TermCache = require('./TermCache')
const Cache = new TermCache()


/******************************************************************************/
/* UTILITY FUNCTIONS                                                           /*
/******************************************************************************/

/**
 * Check if document exists.
 * The function will return true if the provided handle is valid.
 * @param theHandle {String}: The document handle.
 * @param theReport {ValidationReport}: If provided and error, the error will be set.
 * @returns {boolean}: true if found, or false if not found.
 */
function checkDocument(theHandle,theReport = false)
{
    //
    // Init local storage.
    //
    const terms = `${K.collection.term.name}/`

    //
    // Handle terms.
    //
    if(theHandle.startsWith(terms)) {
        return Cache.checkTerm(theHandle)                                       // ==>
    }

    //
    // Check if document handle is valid.
    //
    try {
        if(K.db._exists(theHandle)) {
            return true                                                         // ==>
        }
    }

    //
    // Handle errors.
    //
    catch (error) {
        if(theReport !== false) {
            theReport["error"] = error
        }
    }

    return false                                                                // ==>

} // checkDocument()

/**
 * Check if term exists.
 * The function will return true if the provided value is a term.
 * @param theKey {String}: The term key.
 * @param theReport {ValidationReport}: If provided and error, the error will be set.
 * @returns {boolean}: The object if found, or false if not found.
 */
function checkTerm(theKey, theReport = false)
{
    //
    // Check cache.
    //
    const result = Cache.checkTerm(theKey)
    if(result === true) {
        return true                                                             // ==>
    }

    //
    // Set status.
    //
    if(theReport !== false) {
        theReport.status = K.error.kMSG_TERM_NOT_FOUND
    }

    return false                                                                // ==>

    // //
    // // Check if term exists.
    // //
    // try {
    //     if(K.db._collection(K.collection.term.name).exists(theKey)) {
    //         return true                                                         // ==>
    //     }
    // }
    //
    // //
    // // Handle errors.
    // //
    // catch (error) {
    //     if(theReport !== false) {
    //         theReport.status = K.error.kMSG_TERM_NOT_FOUND
    //         theReport["error"] = error
    //     }
    // }
    //
    // return false                                                                // ==>

} // checkTerm()

/**
 * Check if enumeration exists.
 * The function will return true if the provided value is an enumeration term.
 * @param theKey {String}: The term key.
 * @param theReport {ValidationReport}: If provided and error, the error will be set.
 * @returns {boolean}: The object if found, or false if not found.
 */
function checkEnum(theKey, theReport = false)
{
    //
    // Init local storage.
    //
    const edges = K.db._collection(K.collection.schema.name)
    const terms = K.db._collection(K.collection.term.name).name()
    const id = terms + '/' + theKey

    //
    // Query schema.
    //
    const result =
        K.db._query( aql`
            FOR edge IN ${edges}
                FILTER edge._from == ${id}
                FILTER edge._predicate == "_predicate_enum-of"
            LIMIT 1
            RETURN edge._from
        `).toArray()

    //
    // Handle found.
    //
    if(result.length > 0) {
        return true                                                             // ==>
    }

    //
    // Handle errors.
    //
    if(theReport !== false) {
        theReport.status = K.error.kMSG_ENUM_NOT_FOUND
        theReport.status["value"] = theKey
    }

    return false                                                                // ==>

} // checkEnum()

/**
 * Check if descriptor exists.
 * The function will return true if the provided value is an descriptor term.
 * @param theKey {String}: The term key.
 * @param theReport {ValidationReport}: If provided and error, the error will be set.
 * @returns {boolean}: The object if found, or false if not found.
 */
function checkDescriptor(theKey, theReport = false)
{
    //
    // Load term.
    //
    const term = getTerm(theKey, theReport)
    if(term === false) {
        return false                                                            // ==>
    }

    //
    // Check if term has data block.
    //
    if(term.hasOwnProperty(K.term.dataBlock)) {
        return true                                                             // ==>
    }

    theReport.status = K.error.kMSG_DESCRIPTOR_NOT_FOUND

    return false                                                                // ==>

} // checkDescriptor()

/**
 * Get document.
 * The function will return the provided handleìs document or false if not found.
 * @param theHandle {String}: The term handle.
 * @param theReport {ValidationReport}: If provided and error, the error will be set.
 * @returns {Object/false}: The object if found, or false if not found.
 */
function getDocument(theHandle, theReport = false)
{
    //
    // Handle terms.
    //
    if(theHandle.startsWith(`${K.collection.term.name}/`)) {
        return Cache.getTerm(theHandle)                                         // ==>
    }

    //
    // Read database.
    //
    try {
        const result = K.db._document(theHandle)

        return result                                                           // ==>

    }

    //
    // Handle errors.
    //
    catch (error) {
        if(theReport !== false) {
            theReport["error"] = error
        }
    }

    return false                                                                // ==>

} // getDocument()

/**
 * Get term.
 * The function will return the term corresponding to the provided key, or false.
 * @param theKey {String}: The term key.
 * @param theReport {ValidationReport}: If provided and error, the error will be set.
 * @returns {Object/false}: The object if found, or false if not found.
 */
function getTerm(theKey, theReport = false)
{
    //
    // Use cache.
    //
    const term = Cache.getTerm(theKey)
    if(term !== false) {
        return term                                                             // ==>
    }

    //
    // Handle not found.
    //
    if(theReport !== false) {
        theReport.status = K.error.kMSG_TERM_NOT_FOUND
        theReport.status["value"] = theKey
    }

    return false                                                                // ==>

    // //
    // // Set handle.
    // //
    // const handle = `${K.collection.term.name}/${theKey}`
    //
    // //
    // // Read database.
    // //
    // try {
    //     return K.db._document(handle)                                           // ==>
    // }
    //
    // //
    // // Handle errors.
    // //
    // catch (error) {
    //     if(theReport !== false) {
    //         theReport["error"] = error
    //         theReport.status = K.error.kMSG_TERM_NOT_FOUND
    //         theReport.status["value"] = theKey
    //     }
    // }
    //
    // return false                                                                // ==>

} // getTerm()

/**
 * Get descriptor term.
 * The function will return the descriptor corresponding to the provided key, or false.
 * Note that the data block is required, but can be empty.
 * @param theKey {String}: The term key.
 * @param theReport {ValidationReport}: If provided and error, the error will be set.
 * @returns {Object/false}: The object if found, or false if not found.
 */
function getDescriptor(theKey, theReport = false)
{
    //
    // Get term.
    //
    const term = getTerm(theKey, theReport)
    if(term === false) {
        return false                                                            // ==>
    }

    //
    // Check data block.
    //
    if(term.hasOwnProperty(K.term.dataBlock)) {
        return term                                                             // ==>
    }

    //
    // Signal not a descriptor.
    //
    if(theReport !== false) {
        theReport.status = K.error.kMSG_NOT_DESCRIPTOR
    }

    return false                                                                // ==>

} // getDescriptor()

/**
 * Return edge key.
 * This function will return the edge _key using the provided parameters.
 * @param theSubject {String}: The `_from` document handle.
 * @param thePredicate {String}: The predicate global identifier.
 * @param theObject {String}: The `_to` document handle.
 * @return {String}: The edge _key.
 */
function getEdgeKey(theSubject, thePredicate, theObject)
{
    const key =
        crypto.md5(
            theSubject
            + K.token.tok
            + thePredicate
            + K.token.tok
            + theObject
        )

    return key                                                                  // ==>

} // getEdgeKey()

/**
 * Report resolved enumeration.
 * The function will add the provided descriptor/value pair
 * to the resolved section of the provided report.
 * @param theKey {String}: The descriptor.
 * @param theValue {String}: The original value.
 * @param theReport {ValidationReport}: Host of resolved enums log.
  */
function reportResolved(theKey, theValue, theReport = false)
{
    //
    // Handle existing descriptor.
    //
    if(theReport.resolved.hasOwnProperty(theKey)) {
        if(theReport.resolved[theKey].filter(target => target === theValue).length === 0) {
            theReport.resolved[theKey].push(theValue)
        }
    } else {
        theReport.resolved[theKey] = [theValue]
    }

} // reportResolved()

/**
 * Return term in provided language
 * The function expects a term and a valid language code,
 * it will return the _info properties in the provided language.
 * If an _info element does not have the provided language,
 * the function will return the element as-is.
 * Note that the modifications are performed on the original object.
 * @param theTerm {Object}: The term.
 * @param theLanguage {String}: A valid language code.
 * @return {Object}: The term with info in the provided language.
 */
function termLanguage(theTerm, theLanguage)
{
    //
    // Check if the term has info.
    //
    if(theTerm.hasOwnProperty(K.term.infoBlock)) {
        for(const property of Object.keys(theTerm[K.term.infoBlock])) {
            if(isObject(theTerm[K.term.infoBlock][property])) {
                if(theTerm[K.term.infoBlock][property].hasOwnProperty(theLanguage)) {
                    const element = theTerm[K.term.infoBlock][property][theLanguage]
                    theTerm[K.term.infoBlock][property] = element

                } // Has language element.

            } // Info property is an object.

        } // Iterating info properties.

    } // Term has info block.

} // termLanguage()

/**
 * Preload cache
 * This function will load the cache with the provided list of keys.
 * @param theKeys {Array<String>}: List of keys.
 */
function loadCache(theKeys)
{
    //
    // Check list of keys.
    //
    Cache.checkTerms(theKeys)

} // loadCache()


/******************************************************************************/
/* UTILITY ASSERTIONS                                                          /*
/******************************************************************************/

/**
 * Check if boolean.
 * The function will return true if the provided value is a boolean.
 * @param item {Any}: The value to test.
 * @returns {boolean}: True if boolean.
 */
function isBoolean(item)
{
    return _.isBoolean(item)                                                    // ==>

} // isBoolean()

/**
 * Check if integer.
 * The function will return true if the provided value is an integer.
 * @param item {Any}: The value to test.
 * @returns {boolean}: True if integer.
 */
function isInteger(item)
{
    return _.isInteger(item)                                                    // ==>

} // isInteger()

/**
 * Check if numeric.
 * The function will return true if the provided value is a numeric.
 * @param item {Any}: The value to test.
 * @returns {boolean}: True if numeric.
 */
function isNumber(item)
{
    return _.isNumber(item)                                                     // ==>

} // isNumber()

/**
 * Check if string.
 * The function will return true if the provided value is a string.
 * @param item {Any}: The value to test.
 * @returns {boolean}: True if string.
 */
function isString(item)
{
    return _.isString(item)                                                     // ==>

} // isString()

/**
 * Check if array.
 * The function will return true if the provided value is an array.
 * @param item {Any}: The value to test.
 * @returns {boolean}: True for arrays, false for other types.
 */
function isArray(item)
{
    return Array.isArray(item)                                                  // ==>

} // isArray()

/**
 * Check if object.
 * The function will return true if the provided value is an object.
 * @param item {Any}: The value to test.
 * @returns {boolean}: True for objects, false for other types.
 */
function isObject(item)
{
    return _.isPlainObject(item)                                                // ==>

} // isObject()


module.exports = {
    checkDocument,
    checkTerm,
    checkEnum,
    checkDescriptor,

    getDocument,
    getTerm,
    getDescriptor,
    getEdgeKey,

    reportResolved,

    termLanguage,

    loadCache,

    isBoolean,
    isInteger,
    isNumber,
    isString,
    isArray,
    isObject
}
