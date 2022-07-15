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
function getEnumerations(theRoot)
{
    //
    // Query schema.
    //
    const edge = db._collection(module.context.collectionName(K.collection.schema.name))
    const term = db._collection(module.context.collectionName(K.collection.term.name))
    const result =
        db._query( aql`
					FOR item IN ${edge}
						FILTER ${theRoot} IN item._path
						FILTER item._predicate == "_predicate_enum-of"
						RETURN item._from
					`).toArray();

    return term.document(result);
    // return result;

} // getEnumerations()

module.exports = {
    getEnumerations
}