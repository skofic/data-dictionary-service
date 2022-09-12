'use strict';

//
// Import frameworks.
//
const aql = require('@arangodb').aql;					// AQL queries.

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
    const edges = K.db._collection(K.collection.schema.name)
    const terms = K.db._collection(K.collection.term.name)
    const result =
        K.db._query( aql`
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
    const edges = K.db._collection(K.collection.schema.name)
    const terms = K.db._collection(K.collection.term.name)
    const result =
        K.db._query( aql`
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