'use strict';

//
// Import frameworks.
//
const aql = require('@arangodb').aql;					// AQL queries.

//
// Application.
//
const K = require( './constants' );					    // Application constants.
const utils = require('../utils/utils');                // Utility functions.

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
            RETURN PARSE_IDENTIFIER(edge._from).key
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
function getPropertyNames(theRoot)
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
            RETURN PARSE_IDENTIFIER(edge._from).key
        `).toArray();

    return result;                                                              // ==>

} // getPropertyNames()

/**
 * Return the list of enumeration elements given their root.
 * This function expects a string representing an enumeration root,
 * and will return the list of all term documents that comprise the controlled vocabulary.
 * @param theRoot {String}: The global identifier of the enumeration root.
 * @param theLanguage {String}: The language of the _info elements.
 * @return {Array}: The list of terms that comprise the controlled vocabulary.
 */
function getAllEnumerations(theRoot, theLanguage)
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

    //
    // Filter language.
    //
    if(theLanguage !== "@") {
        for(let i = 0; i < result.length; i++) {
            utils.termLanguage(result[i], theLanguage)

        } // Iterating result terms.

    } // Provided language.

    return result;                                                              // ==>

} // getAllEnumerations()

/**
 * Return the list of properties belonging to the provided object descriptor.
 * This function expects a string representing an object descriptor global identifier,
 * and will return the list of all descriptor terms that are connected to the provided descriptor.
 * @param theRoot {String}: The global identifier of the object descriptor.
 * @return {Array}: The list of properties belonging to the provided descriptor.
 */
function getProperties(theRoot)
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
            RETURN DOCUMENT(edge._from)
        `).toArray();

    return result;                                                              // ==>

} // getProperties()

/**
 * Return the list of properties belonging to the provided object descriptor.
 * This function expects a string representing an object descriptor global identifier,
 * and will return the list of all descriptor terms that are connected to the provided descriptor.
 * @param theRoot {String}: The global identifier of the object descriptor.
 * @param theLevels {Number}: Number of levels to traverse.
 * @return {Object}: The list of properties belonging to the provided descriptor.
 */
function getPropertyKeys(theRoot, theLevels)
{
    //
    // Init local storage.
    //
    const terms = K.db._collection(K.collection.term.name)
    const edges = K.db._collection(K.collection.schema.name)
    const path = K.collection.term.name + '/' + theRoot;

    //
    // Query schema.
    //
    const result =
        K.db._query( aql`
            WITH ${terms}
            LET tree = (
                MERGE_RECURSIVE(
                    FOR vertex, edge IN 0..${theLevels}
                        INBOUND ${path}
                        ${edges}
                    
                        OPTIONS {
                            "order": "bfs",
                            "uniqueVertices": "path"
                        }
                        
                        FILTER edge._predicate IN ["_predicate_property-of", "_predicate_bridge-of" ]
                        
                        COLLECT parent = PARSE_IDENTIFIER(edge._to).key, predicate = edge._predicate
                        INTO children
                    
                    RETURN {
                        [parent]: {
                            [predicate]: UNIQUE(children[*].vertex._key)
                        }
                    }
                )
            )
            
            RETURN HAS(tree, ${theRoot}) ? tree : []
        `).toArray();

    return result;                                                              // ==>

} // getPropertyKeys()

/**
 * Return the list of properties belonging to the provided object descriptor.
 * This function expects a string representing an object descriptor global identifier,
 * and will return the list of all descriptor terms that are connected to the provided descriptor.
 * @param theRoot {String}: The global identifier of the object descriptor.
 * @param theLevels {Number}: Number of levels to traverse.
 * @return {Object}: The list of properties belonging to the provided descriptor.
 */
function getEnumerationKeys(theRoot, theLevels)
{
    //
    // Init local storage.
    //
    const terms = K.db._collection(K.collection.term.name)
    const edges = K.db._collection(K.collection.schema.name)
    const path = K.collection.term.name + '/' + theRoot;

    //
    // Query schema.
    //
    const result =
        K.db._query( aql`
            WITH ${terms}
            LET tree = (
                MERGE_RECURSIVE(
                    FOR vertex, edge IN 0..${theLevels}
                        INBOUND ${path}
                        ${edges}
            
                        PRUNE ${path} NOT IN edge._path
                    
                        OPTIONS {
                            "order": "bfs",
                            "uniqueVertices": "path"
                        }
                        
                        FILTER edge._predicate IN ["_predicate_enum-of", "_predicate_bridge-of" ]
                        FILTER ${path} IN edge._path
                        
                        COLLECT parent = PARSE_IDENTIFIER(edge._to).key, predicate = edge._predicate
                        INTO children
                    
                    RETURN {
                        [parent]: {
                            [predicate]: UNIQUE(children[*].vertex._key)
                        }
                    }
                )
            )
            
            RETURN HAS(tree, ${theRoot}) ? tree : []
        `).toArray();

    return result;                                                              // ==>

} // getEnumerationKeys()

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

/**
 * Return valid enumeration keys from provided term keys list.
 * The function will return a dictionary whose keys correspond to the provided
 * term keys and whose values correspond to the preferred enumeration key,
 * or false if there is a mismatch.
 * @param theKeys {Array<String>}: List of term keys to check.
 * @param thePath {String}: Enumeration type key (path).
 * @return {Object}: Dictionary with provided keys as key and matched enumeration
 * as value, or false.
 */
function checkEnumsByKeys(theKeys, thePath)
{
    //
    // Init local storage.
    //
    const edges = K.db._collection(K.collection.schema.name)
    const targets = theKeys.map(item => `${K.collection.term.name}/${item}`)
    const path = `${K.collection.term.name}/${thePath}`
    const prefix = K.collection.term.name.length + 1

    //
    // Query schema.
    //
    const result =
        K.db._query( aql`
            LET result = (
                FOR term IN ${targets}
                
                    LET selection = (
                        FOR edge IN ${edges}
                            FILTER ( edge._to == term OR
                                     edge._from == term )
                            FILTER edge._predicate == "_predicate_enum-of"
                            FILTER ${path} IN edge._path
                        RETURN
                            edge._from
                    )
                
                RETURN
                    selection[0]
                )
                
            RETURN
                ZIP(${targets}, result)
        `).toArray()

    //
    // Parse handles.
    //
    let dict = {}
    for(const [key, value] of Object.entries(result[0])) {
        dict[key.substring(prefix)] = (value !== null)
            ? value.substring(prefix)
            : false
    }

    return dict                                                                 // ==>

} // checkEnumsByKeys()

/**
 * Return valid enumeration keys from provided local identifiers list.
 * The function will return a dictionary whose keys correspond to the provided
 * identifiers and whose values correspond to the preferred enumeration key,
 * or false if there is a mismatch.
 * @param theCodes {Array<String>}: List of local identifiers to check.
 * @param thePath {String}: Enumeration type key (path).
 * @return {Object}: Dictionary with provided codes as key and matched enumeration
 * as value, or false.
 */
function checkEnumsByCodes(theCodes, thePath)
{
    //
    // Init local storage.
    //
    const terms = K.db._collection(K.collection.term.name)
    const edges = K.db._collection(K.collection.schema.name)
    const path = `${K.collection.term.name}/${thePath}`

    //
    // Query schema.
    //
    const result =
        K.db._query( aql`
            LET result = (
                FOR code IN ${theCodes}
                
                    LET selection = (
                        FOR term IN ${terms}
                            FILTER term._code._lid == code
                
                            FOR edge in ${edges}
                                FILTER ( edge._to == term._id OR
                                         edge._from == term._id )
                                FILTER edge._predicate == "_predicate_enum-of"
                                FILTER ${path} IN edge._path
                            RETURN edge._from )
                
                RETURN
                    selection[0] )
            
            RETURN
                ZIP(${theCodes}, result)
        `).toArray()

    return result[0]                                                            // ==>

} // checkEnumsByCodes()

/**
 * Return required descriptors associated to provided descriptors list.
 * The function will return the list of descriptors
 * required by the provided list of descriptor global identifiers.
 * @param theCodes {Array<String>}: List of descriptor global identifiers.
 * @return {Array<Object>}: List of descriptors required by the provided list of descriptors.
 */
function getRequiredDescriptors(theCodes)
{
    //
    // Init local storage.
    //
    const terms = K.db._collection(K.collection.term.name)
    const links = K.db._collection(K.collection.links.name)
    const list = theCodes.map( item => { return `${K.collection.term.name}/${item}`})

    //
    // Query schema.
    //
    const result =
        K.db._query( aql`
            WITH ${terms}
            LET required = (
                RETURN (
                    UNIQUE(
                        FOR root IN ${list}
                            FOR vertex, edge IN 1..10
                                OUTBOUND root
                                ${links}
                                FILTER edge._predicate == "_predicate_requires"
                            RETURN vertex._id
                    )
                )
            )[0]
            RETURN DOCUMENT(required) 
        `).toArray()[0]

    return result                                                               // ==>

} // getRequiredDescriptors()

/**
 * Return required descriptors associated to provided descriptors list.
 * The function will return the list of descriptor global identifiers
 * required by the provided list of descriptor global identifiers.
 * @param theCodes {Array<String>}: List of descriptor global identifiers.
 * @return {Array<String>}: List of descriptors required by the provided list of descriptors.
 */
function getRequiredDescriptorKeys(theCodes)
{
    //
    // Init local storage.
    //
    const terms = K.db._collection(K.collection.term.name)
    const links = K.db._collection(K.collection.links.name)
    const list = theCodes.map( item => { return `${K.collection.term.name}/${item}`})

    //
    // Query schema.
    //
    const result =
        K.db._query( aql`
            WITH ${terms}
            RETURN (
                UNIQUE(
                    FOR root IN ${list}
                        FOR vertex, edge IN 1..10
                            OUTBOUND root
                            ${links}
                            FILTER edge._predicate == "_predicate_requires"
                        RETURN vertex._key
                )
            )
        `).toArray()[0]

    return result                                                               // ==>

} // getRequiredDescriptorKeys()


module.exports = {
    getAllEnumerations,
    getAllEnumerationKeys,

    getProperties,
    getPropertyKeys,
    getEnumerationKeys,
    getPropertyNames,

    getRequiredDescriptors,
    getRequiredDescriptorKeys,

    matchEnumerationTerm,
    matchEnumerationTermKey,
    matchEnumerationTermPath,

    matchEnumerationCodeKey,
    matchEnumerationCodeTerm,
    matchEnumerationCodePath,

    matchEnumerationIdentifierKey,
    matchEnumerationIdentifierTerm,
    matchEnumerationIdentifierPath,

    checkEnumsByKeys,
    checkEnumsByCodes
}
