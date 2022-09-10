'use strict';

//
// Import frameworks.
//
const db = require('@arangodb').db;						// Database object.
const aql = require('@arangodb').aql;					// AQL queries.
const crypto = require('@arangodb/crypto');				// Cryptographic functions.
const httpError = require('http-errors');				// HTTP errors.
const status = require('statuses');						// Don't know what it is.
const errors = require('@arangodb').errors;				// ArangoDB errors.

//
// Application.
//
const K = require( './constants' );					    // Application constants.

/**
 * dictionary.js
 *
 * This file contains all common functions related to the dictionary metadata.
 */

/**
 * Return the list of enumeration elements given their root.
 * This function expects a string representing an enumeration root,
 * and will return the list of all term documents that comprise the controlled vocabulary.
 * @param theRoot {String}: The global identifier of the enumeration root.
 * @return {Array}: The list of terms that comprise the controlled vocabulary.
 */
function getAllEnumerations(theRoot)
{
    //
    // Query schema.
    //
    const edges = db._collection(K.collection.schema.name)
    const terms = db._collection(K.collection.term.name)
    const result =
        db._query( aql`
            FOR edge IN ${edges}
                FILTER ${theRoot} IN edge._path
                FILTER edge._predicate == "_predicate_enum-of"
            RETURN DOCUMENT(edge._from)
        `).toArray();

    return result;

} // getAllEnumerations()

/**
 * Return the list of enumeration keys given their root.
 * This function expects a string representing an enumeration root,
 * and will return the list of all term documents that comprise the controlled vocabulary.
 * @param theRoot {String}: The global identifier of the enumeration root.
 * @return {Array}: The list of terms that comprise the controlled vocabulary.
 */
function getAllEnumerationKeys(theRoot)
{
    //
    // Query schema.
    //
    const edges = db._collection(K.collection.schema.name)
    const terms = db._collection(K.collection.term.name)
    const result =
        db._query( aql`
            FOR edge IN ${edges}
                FILTER ${theRoot} IN edge._path
                FILTER edge._predicate == "_predicate_enum-of"
            RETURN DOCUMENT(edge._from)._key
        `).toArray();

    return result;

} // getAllEnumerations()

module.exports = {
    getAllEnumerations,
    getAllEnumerationKeys
}