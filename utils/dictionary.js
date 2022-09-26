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
 * Return the list of enumeration keys given their root.
 * This function expects a string representing an enumeration root,
 * and will return the list of all term documents that comprise the controlled vocabulary.
 * @param theRoot {String}: The global identifier of the enumeration root.
 * @return {Array}: The list of terms that comprise the controlled vocabulary.
 */
function getAllEnumerationKeys(theRoot)
{
    //
    // Init local storage.
    //
    const edges = K.db._collection(K.collection.schema.name)
    const path = K.collection.term.name + '/' + theRoot;

    //
    // Query schema.
    //
    const result =
        K.db._query( aql`
            FOR edge IN ${edges}
                FILTER ${path} IN edge._path
                FILTER edge._predicate == "_predicate_enum-of"
            RETURN DOCUMENT(edge._from)._key
        `).toArray();

    return result;                                                              // ==>

} // getAllEnumerations()

/**
 * Return the list of property names given their parent.
 * This function expects a string representing a data structure descriptor global identifier,
 * and will return the list of all property names that follow the path of the provided descriptor.
 * @param theRoot {String}: The global identifier of the structure root.
 * @return {Array}: The list of property names that comprise the provided structure.
 */
function getAllPropertyNames(theRoot)
{
    //
    // Init local storage.
    //
    const edges = K.db._collection(K.collection.schema.name)
    const path = K.collection.term.name + '/' + theRoot;

    //
    // Query schema.
    //
    const result =
        K.db._query( aql`
            FOR edge IN ${edges}
                FILTER ${path} IN edge._path
                FILTER edge._predicate == "_predicate_property-of"
            RETURN DOCUMENT(edge._from)._key
        `).toArray();

    return result;                                                              // ==>

} // getAllPropertyNames()

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
    // Init local storage.
    //
    const edges = K.db._collection(K.collection.schema.name)
    const path = K.collection.term.name + '/' + theRoot;

    //
    // Query schema.
    //
    const result =
        K.db._query( aql`
            FOR edge IN ${edges}
                FILTER ${path} IN edge._path
                FILTER edge._predicate == "_predicate_enum-of"
            RETURN DOCUMENT(edge._from)
        `).toArray();

    return result;                                                              // ==>

} // getAllEnumerations()

/**
 * Return the list of terms matching the provided global identifier code
 * in the enumeration identified by the provided root term global identifier.
 * @param thePath {String}: Global identifier of enumeration root term.
 * @param theTerm {String}: Global identifier of term to match.
 * @return {Array}: List of matched terms.
 */
function matchEnumerationTerm(thePath, theTerm)
{
    //
    // Init local storage.
    //
    const terms = K.db._collection(K.collection.term.name)
    const edges = K.db._collection(K.collection.schema.name)
    const path = K.collection.term.name + '/' + thePath
    const target = K.collection.term.name + '/' + theTerm
    const predicate = K.term.predicateEnum

    //
    // Query database.
    //
    const result = K.db._query( aql`
            WITH ${terms}
            FOR vertex, edge, path IN 1..10
                INBOUND ${path}
                ${edges}
                PRUNE ${path} IN edge._path AND
                      edge._predicate == ${predicate} AND
                      (edge._to == ${target} OR
                       edge._from == ${target})
                OPTIONS {
                    "uniqueVertices": "path"
                }
                FILTER ${path} IN edge._path AND
                       edge._predicate == ${predicate} AND
                       (edge._to == ${target} OR
                        edge._from == ${target})
            RETURN vertex
        `).toArray()

    return result;                                                              // ==>

} // matchEnumerationTerm()

/**
 * Return the list of term global identifiers matching the provided global identifier code
 * in the enumeration identified by the provided root term global identifier.
 * @param thePath {String}: Global identifier of enumeration root term.
 * @param theTerm {String}: Global identifier of term to match.
 * @return {Array}: List of matched terms.
 */
function matchEnumerationTermKey(thePath, theTerm)
{
    //
    // Init local storage.
    //
    const terms = K.db._collection(K.collection.term.name)
    const edges = K.db._collection(K.collection.schema.name)
    const path = K.collection.term.name + '/' + thePath
    const target = K.collection.term.name + '/' + theTerm
    const predicate = K.term.predicateEnum

    //
    // Query database.
    //
    const result = K.db._query( aql`
            WITH ${terms}
            FOR vertex, edge, path IN 1..10
                INBOUND ${path}
                ${edges}
                PRUNE ${path} IN edge._path AND
                      edge._predicate == ${predicate} AND
                      (edge._to == ${target} OR
                       edge._from == ${target})
                OPTIONS {
                    "uniqueVertices": "path"
                }
                FILTER ${path} IN edge._path AND
                       edge._predicate == ${predicate} AND
                       (edge._to == ${target} OR
                        edge._from == ${target})
            RETURN vertex._key
        `).toArray()

    return result;                                                              // ==>

} // matchEnumerationTermKey()

/**
 * Return the path from the emumeration root element to the target node
 * matching the provided global identifier.
 * @param thePath {String}: Global identifier of enumeration root term.
 * @param theTerm {String}: Global identifier of term to match.
 * @return {Array}: Path from root to target.
 */
function matchEnumerationTermPath(thePath, theTerm)
{
    //
    // Init local storage.
    //
    const terms = K.db._collection(K.collection.term.name)
    const edges = K.db._collection(K.collection.schema.name)
    const path = K.collection.term.name + '/' + thePath
    const target = K.collection.term.name + '/' + theTerm
    const predicate = K.term.predicateEnum

    //
    // Query database.
    //
    const result = K.db._query( aql`
            WITH ${terms}
            FOR vertex, edge, path IN 1..10
                INBOUND ${path}
                ${edges}
                PRUNE ${path} IN edge._path AND
                      edge._predicate == ${predicate} AND
                      (edge._to == ${target} OR
                       edge._from == ${target})
                OPTIONS {
                    "uniqueVertices": "path"
                }
                FILTER ${path} IN edge._path AND
                       edge._predicate == ${predicate} AND
                       (edge._to == ${target} OR
                        edge._from == ${target})
            RETURN path
        `).toArray()

    return result;                                                              // ==>

} // matchEnumerationTermPath()

/**
 * Return the list of term keys whose identifiers match the provided code
 * in the enumeration identified by the provided root term global identifier.
 * @param thePath {String}: Global identifier of enumeration root term.
 * @param theCode {String}: Identifier or code to match in _aid list.
 * @return {Array}: List of matched term global identifiers.
 */
function matchEnumerationCodeKey(thePath, theCode)
{
    //
    // Init local storage.
    //
    const path = K.collection.term.name + '/' + thePath
    const terms = K.db._collection(K.collection.term.name)
    const edges = K.db._collection(K.collection.schema.name)
    const predicate = K.term.predicateEnum

    //
    // Query database.
    //
    const result = K.db._query( aql`
            WITH ${terms}
            FOR vertex, edge, path IN 1..10
                INBOUND ${path}
                ${edges}
                PRUNE ${path} IN edge._path AND
                      edge._predicate == ${predicate} AND
                      ${theCode} IN vertex._code._aid
                OPTIONS {
                    "uniqueVertices": "path"
                }
                FILTER ${path} IN edge._path AND
                       edge._predicate == ${predicate} AND
                       ${theCode} IN vertex._code._aid
            RETURN vertex._key
        `).toArray()

    return result;                                                              // ==>

} // matchEnumerationCodeKey()

/**
 * Return the list of terms whose identifiers match the provided code
 * in the enumeration identified by the provided root term global identifier.
 * @param thePath {String}: Global identifier of enumeration root term.
 * @param theCode {String}: Identifier or code to match in _aid list.
 * @return {Array}: List of matched terms.
 */
function matchEnumerationCodeTerm(thePath, theCode)
{
    //
    // Init local storage.
    //
    const path = K.collection.term.name + '/' + thePath
    const terms = K.db._collection(K.collection.term.name)
    const edges = K.db._collection(K.collection.schema.name)
    const predicate = K.term.predicateEnum

    //
    // Query database.
    //
    const result = K.db._query( aql`
            WITH ${terms}
            FOR vertex, edge, path IN 1..10
                INBOUND ${path}
                ${edges}
                PRUNE ${path} IN edge._path AND
                      edge._predicate == ${predicate} AND
                      ${theCode} IN vertex._code._aid
                OPTIONS {
                    "uniqueVertices": "path"
                }
                FILTER ${path} IN edge._path AND
                       edge._predicate == ${predicate} AND
                       ${theCode} IN vertex._code._aid
            RETURN vertex
        `).toArray()

    return result;                                                              // ==>

} // matchEnumerationCodeTerm()

/**
 * Return the path from the emumeration root element to the target node
 * matching the provided code (_aid).
 * @param thePath {String}: Global identifier of enumeration root term.
 * @param theCode {String}: Identifier or code to match in _aid list.
 * @return {Array}: List of matched terms.
 */
function matchEnumerationCodePath(thePath, theCode)
{
    //
    // Init local storage.
    //
    const path = K.collection.term.name + '/' + thePath
    const terms = K.db._collection(K.collection.term.name)
    const edges = K.db._collection(K.collection.schema.name)
    const predicate = K.term.predicateEnum

    //
    // Query database.
    //
    const result = K.db._query( aql`
            WITH ${terms}
            FOR vertex, edge, path IN 0..10
                INBOUND ${path}
                ${edges}
                PRUNE ${path} IN edge._path AND
                      edge._predicate == ${predicate} AND
                      ${theCode} IN vertex._code._aid
                OPTIONS {
                    "uniqueVertices": "path"
                }
                FILTER ${path} IN edge._path AND
                       edge._predicate == ${predicate} AND
                       ${theCode} IN vertex._code._aid
            RETURN path
        `).toArray()

    return result;                                                              // ==>

} // matchEnumerationCodePath()

/**
 * Get term global identifier matching provided local identifier in provided enumeration.
 * @param thePath {String}: Global identifier of enumeration root term.
 * @param theCode {String}: Local identifier to match.
 * @return {Array}: List of matched term global identifiers.
 */
function matchEnumerationIdentifierKey(thePath, theCode)
{
    //
    // Init local storage.
    //
    const path = K.collection.term.name + '/' + thePath
    const terms = K.db._collection(K.collection.term.name)
    const edges = K.db._collection(K.collection.schema.name)
    const predicate = K.term.predicateEnum

    //
    // Query database.
    //
    const result = K.db._query( aql`
            WITH ${terms}
            FOR vertex, edge, path IN 1..10
                INBOUND ${path}
                ${edges}
                PRUNE ${path} IN edge._path AND
                      edge._predicate == ${predicate} AND
                      vertex._code._lid == ${theCode}
                OPTIONS {
                    "uniqueVertices": "path"
                }
                FILTER ${path} IN edge._path AND
                       edge._predicate == ${predicate} AND
                       vertex._code._lid == ${theCode}
            RETURN vertex._key
        `).toArray()

    return result;                                                              // ==>

} // matchEnumerationIdentifierKey()

/**
 * Get terms matching provided local identifier in provided enumeration.
 * @param thePath {String}: Global identifier of enumeration root term.
 * @param theCode {String}: Local identifier to match.
 * @return {Array}: List of matched terms.
 */
function matchEnumerationIdentifierTerm(thePath, theCode)
{
    //
    // Init local storage.
    //
    const path = K.collection.term.name + '/' + thePath
    const terms = K.db._collection(K.collection.term.name)
    const edges = K.db._collection(K.collection.schema.name)
    const predicate = K.term.predicateEnum

    //
    // Query database.
    //
    const result = K.db._query( aql`
            WITH ${terms}
            FOR vertex, edge, path IN 1..10
                INBOUND ${path}
                ${edges}
                PRUNE ${path} IN edge._path AND
                      edge._predicate == ${predicate} AND
                      vertex._code._lid == ${theCode}
                OPTIONS {
                    "uniqueVertices": "path"
                }
                FILTER ${path} IN edge._path AND
                       edge._predicate == ${predicate} AND
                       vertex._code._lid == ${theCode}
            RETURN vertex
        `).toArray()

    return result;                                                              // ==>

} // matchEnumerationIdentifierTerm()

/**
 * Get path from enumeration root to term matching provided local identifier.
 * @param thePath {String}: Global identifier of enumeration root term.
 * @param theCode {String}: Local identifier to match.
 * @return {Array}: List of matched terms.
 */
function matchEnumerationIdentifierPath(thePath, theCode)
{
    //
    // Init local storage.
    //
    const path = K.collection.term.name + '/' + thePath
    const terms = K.db._collection(K.collection.term.name)
    const edges = K.db._collection(K.collection.schema.name)
    const predicate = K.term.predicateEnum

    //
    // Query database.
    //
    const result = K.db._query( aql`
            WITH ${terms}
            FOR vertex, edge, path IN 1..10
                INBOUND ${path}
                ${edges}
                PRUNE ${path} IN edge._path AND
                      edge._predicate == ${predicate} AND
                      vertex._code._lid == ${theCode}
                OPTIONS {
                    "uniqueVertices": "path"
                }
                FILTER ${path} IN edge._path AND
                       edge._predicate == ${predicate} AND
                       vertex._code._lid == ${theCode}
            RETURN path
        `).toArray()

    return result;                                                              // ==>

} // matchEnumerationIdentifierPath()


module.exports = {
    getAllEnumerations,
    getAllEnumerationKeys,
    getAllPropertyNames,

    matchEnumerationTerm,
    matchEnumerationTermKey,
    matchEnumerationTermPath,

    matchEnumerationCodeKey,
    matchEnumerationCodeTerm,
    matchEnumerationCodePath,

    matchEnumerationIdentifierKey,
    matchEnumerationIdentifierTerm,
    matchEnumerationIdentifierPath
}