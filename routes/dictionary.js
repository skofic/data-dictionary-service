'use strict';

//
// Imports.
//
const dd = require('dedent');
const joi = require('joi');
const aql = require('@arangodb').aql;					// AQL queries.
const createRouter = require('@arangodb/foxx/router');

//
// Functions.
//
const dictionary = require("../utils/dictionary");

//
// Constants.
//
const enumSchema = joi.string().required()
const enumKeyList = joi.array().items(joi.string())
const enumTermList = joi.array().items(joi.object({
    _key: joi.string(),
    _code: joi.object(),
    _info: joi.object()
}))
const enumPath = joi.array().items(joi.object({
    edges: joi.array().items(joi.object()),
    vertices: joi.array().items(joi.object())
}))

//
// Application.
//
const K = require( '../utils/constants' )

//
// Instantiate router.
//
const router = createRouter();
module.exports = router;

//
// Set router tags.
//
router.tag('dictionary');


//
// LIST SERVICES
//

/**
 * Return all enumeration keys by path.
 * The service will return all the enumeration keys corresponding to the provided path
 * provided as a term global identifier.
 * No hierarchy is maintained and only valid enumeration elements are selected.
 */
router.get('enum/all/keys/:path', getAllEnumerationKeys, 'all-enum-keys')
    .pathParam('path', enumSchema, "Enumeration root global identifier")
    .response(enumKeyList, dd
        `
            **List of enumeration global identifiers**
            
            The service will return the list of all the enumeration elements belonging to the \
            indicated path. The elements are represented by their global identifiers.
            
            Note that no hierarchy or order is maintained, it is a flat list of term global identifiers. \
            Also, only items representing active elements of the enumeration will be selected: this means \
            that terms used as sections or bridges will not be considered.
        `
    )
    .summary('Return flattened list of all enumeration keys')
    .description(dd
        `
            **Get all enumeration element global identifiers**
            
            Enumerations are graphs used as controlled vocabularies whose elements are terms. \
            At the root of the graph is a term that represents the type or definition of this \
            controlled vocabulary, this term represents the enumeration graph.
            
            The service expects the global identifier of that term as a path parameter, and will \
            return the flattened list of all enumeration elements belonging to that controlled \
            vocabulary. These elements will be returned as the global identifiers of the terms.
            
            You can try providing \`_type\`: this will return the list of data type identifiers.
        `
    )

/**
 * Return all enumerations.
 * The service will return all the enumeration elements of an enumeration type:
 * provide the enumeration type root and the service will return the array of terms.
 * No hierarchy is maintained and only valid enumeration elements are selected.
 */
router.get('enum/all/terms/:path', getAllEnumerations, 'all-enum-terms')
    .pathParam('path', enumSchema, "Enumeration root global identifier")
    .response(enumTermList, dd
        `
            **List of enumeration terms**
            
            The service will return the list of all the enumeration elements belonging to the \
            indicated path. The elements are represented by their term objects.
            
            Note that no hierarchy or order is maintained, it is a flat list of terms. \
            Also, only items representing active elements of the enumeration will be selected: this means \
            that terms used as sections or bridges will not be considered.
        `
    )
    .summary('Return flattened list of all enumeration terms')
    .description(dd
        `
            **Get all enumeration terms**
            
            Enumerations are graphs used as controlled vocabularies whose elements are terms. \
            At the root of the graph is a term that represents the type or definition of this \
            controlled vocabulary, this term represents the enumeration graph.
            
            The service expects the global identifier of that term as a path parameter, and will \
            return the flattened list of all enumeration elements belonging to that controlled \
            vocabulary. These elements will be returned as term objects.
            
            You can try providing \`_type\`: this will return the list of data type terms.
        `
    )


//
// MATCH SERVICES
//

/**
 * Return first term matching the provided code in provided path.
 * The service will return the first term that matches the provided code in the enumeration
 * corresponding to the provided path.
 */
router.get('enum/code/terms/:path/:code', matchEnumerationCode, 'match-enum-code')
    .pathParam('path', enumSchema, "Enumeration root global identifier")
    .pathParam('code', enumSchema, "Target enumeration identifier or code")
    .response(enumTermList, dd
        `
            **List of matched terms**
            
            If there are terms, in the enumeration defined by the \`path\` parameter, \
            that match the identifier provided in the \`code\` parameter, \
            the service will return the term objects in the array result.
            
            If no term matches the identifier provided in the \`code\` parameter, \
            the service will return an empty array.
        `
    )
    .summary('Return enumeration term by code')
    .description(dd
        `
            **Get enumeration term by identifier**
            
            Enumerations are graphs used as controlled vocabularies whose elements are terms. \
            At the root of the graph is a term that represents the type or definition of this \
            controlled vocabulary, this term represents the enumeration graph.
            
            This service can be used to retrieve the terms matching a specific identifier \
            in a specific enumeration graph. Provided the \`path\` parameter, which represents \
            the enumeration root element or enumeration type, and the \`code\` parameter, which \
            represents a term identifier you are trying to match, the service will traverse \
            the enumeration graph until it finds a term whose identifiers list (\`_aid\` property) \
            contains the provided identifier. The result will be the array of terms matching the \
            provided code.
            
            You can try providing \`_type\` as the \`path\` and \`string\` as the code: this should \
            return the string data type term belonging to the data types controlled vocabulary.
            
            Note that this service will honour preferred enumerations, this means that if a term \
            is matched that has a preferred alternative, the latter will be returned, regardless \
            if the preferred term does not belong to the provided path.
            
            You can try providing \`iso_639_1\` as the \`path\` and \`en\` as the code: this should \
            return the preferred term for the English language which is \`iso_639_3_eng\`, this term \
            is the preferred choice for the actual match, which is \`iso_639_1_en\`.
        `
    )

/**
 * Return first term matching the provided local identifier in provided path.
 * The service will return the first term that matches the provided local identifier in the enumeration
 * corresponding to the provided path.
 */
router.get('enum/lid/terms/:path/:code', matchEnumerationIdentifier, 'match-enum-lid')
    .pathParam('path', enumSchema, "Enumeration root global identifier")
    .pathParam('code', enumSchema, "Target enumeration local identifier")
    .response(enumTermList, dd
        `
            **List of matched terms**
            
            If there is a term, in the enumeration defined by the \`path\` parameter, \
            that matches the local identifier provided in the \`code\` parameter, \
            the service will return the term object in the array result.
            
            If no term matches the local identifier provided in the \`code\` parameter, \
            the service will return an empty array.
            
            Note that controlled vocabularies represent a unique set of identifiers, so \
            the result of the service should contain at most one match.
        `
    )
    .summary('Return enumeration term by local identifier')
    .description(dd
        `
            **Get enumeration term by local identifier**
            
            Enumerations are graphs used as controlled vocabularies whose elements are terms. \
            At the root of the graph is a term that represents the type or definition of this \
            controlled vocabulary, this term represents the enumeration graph.
            
            This service can be used to retrieve the term matching a specific local identifier \
            in a specific enumeration graph. Provided the \`path\` parameter, which represents \
            the enumeration root element or enumeration type, and the \`code\` parameter, which \
            represents a term local identifier you are trying to match, the service will traverse \
            the enumeration graph until it finds a term whose local identifier (\`_lid\` property) \
            matches the provided code. The result will be the array of terms matching the \
            provided code; this should be at most one element.
            
            You can try providing \`_type\` as the \`path\` and \`string\` as the code: this should \
            return the string data type term belonging to the data types controlled vocabulary.
            
            Note that this service will honour preferred enumerations, this means that if a term \
            has a preferred alternative, the provided code should match the preferred term.
            
            You can try providing \`iso_639_1\` as the \`path\` and \`eng\` as the code: this should \
            return the preferred term for the English language which is \`iso_639_3_eng\`. Note that \
            the actual match is \`iso_639_1_en\`, but this term points to a preferred alternative \
            which is the returned result: this means that the \`en\` local identifier will not be \
            matched, this service expects only preferred local identifiers.
        `
    )

/**
 * Return first term matching the provided local identifier in provided path.
 * The service will return the first term that matches the provided local identifier in the enumeration
 * corresponding to the provided path.
 */
router.get('enum/gid/terms/:path/:code', matchEnumerationGlobalIdentifier, 'match-enum-gid-terms')
    .pathParam('path', enumSchema, "Enumeration root global identifier")
    .pathParam('code', enumSchema, "Target enumeration global identifier")
    .response(enumTermList, dd
        `
            **List of matched terms**
            
            If there is a term, in the enumeration defined by the \`path\` parameter, \
            that matches the global identifier provided in the \`code\` parameter, \
            the service will return the term object in the array result.
            
            If no term matches the global identifier provided in the \`code\` parameter, \
            the service will return an empty array.
            
            Note that controlled vocabularies represent a unique set of identifiers, so \
            the result of the service should contain at most one match.
        `
    )
    .summary('Return enumeration term by global identifier')
    .description(dd
        `
            **Get enumeration term by global identifier**
            
            Enumerations are graphs used as controlled vocabularies whose elements are terms. \
            At the root of the graph is a term that represents the type or definition of this \
            controlled vocabulary, this term represents the enumeration graph.
            
            This service can be used to retrieve the term matching a specific global identifier \
            in a specific enumeration graph. Provided the \`path\` parameter, which represents \
            the enumeration root element or enumeration type, and the \`code\` parameter, which \
            represents a term global identifier you are trying to match, the service will traverse \
            the enumeration graph until it finds a term whose global identifier (\`_gid\` property) \
            matches the provided code. The result will be the array of terms matching the \
            provided code; this should be at most one element.
            
            You can try providing \`_type\` as the \`path\` and \`_type_string\` as the code: this should \
            return the string data type term belonging to the data types controlled vocabulary.
            
            Note that this service will honour preferred enumerations, this means that if a term \
            is matched that has a preferred alternative, the latter will be returned, regardless \
            if the preferred term does not belong to the provided path.
            
            You can try providing \`iso_639_1\` as the \`path\` and \`iso_639_1_en\` as the code: this should \
            return the preferred term for the English language which is \`iso_639_3_eng\`, this term \
            is the preferred choice for the actual match, which is \`iso_639_1_en\`.
        `
    )


//
// PATH SERVICES
//

/**
 * Return path from enumeration root element to target node.
 * The service will return the path from the enumeration root element, expressed by its global identifier,
 * to the first term element matching the provided code.
 */
router.get('enum/code/path/:path/:code', matchEnumerationCodePath, 'match-enum-code-path')
    .pathParam('path', enumSchema, "Enumeration root global identifier")
    .pathParam('code', enumSchema, "Target enumeration identifier or code")
    .response(enumPath, dd
        `
            **Path to matched term**
            
            If there are terms, in the enumeration defined by the \`path\` parameter, \
            that match the identifier provided in the \`code\` parameter, \
            the service will return the term objects in the array result.
            
            If no term matches the identifier provided in the \`code\` parameter, \
            the service will return an empty array.
        `
    )
    .summary('Return enumeration term by code')
    .description(dd
        `
            **Get enumeration term by identifier**
            
            Enumerations are graphs used as controlled vocabularies whose elements are terms. \
            At the root of the graph is a term that represents the type or definition of this \
            controlled vocabulary, this term represents the enumeration graph.
            
            This service can be used to retrieve the terms matching a specific identifier \
            in a specific enumeration graph. Provided the \`path\` parameter, which represents \
            the enumeration root element or enumeration type, and the \`code\` parameter, which \
            represents a term identifier you are trying to match, the service will traverse \
            the enumeration graph until it finds a term whose identifiers list (\`_aid\` property) \
            contains the provided identifier. The result will be the array of terms matching the \
            provided code.
            
            You can try providing \`_type\` as the \`path\` and \`string\` as the code: this should \
            return the string data type term belonging to the data types controlled vocabulary.
            
            Note that this service will honour preferred enumerations, this means that if a term \
            is matched that has a preferred alternative, the latter will be returned, regardless \
            if the preferred term does not belong to the provided path.
            
            You can try providing \`iso_639_1\` as the \`path\` and \`en\` as the code: this should \
            return the preferred term for the English language which is \`iso_639_3_eng\`, this term \
            is the preferred choice for the actual match, which is \`iso_639_1_en\`.
        `
    )

//
// Functions.
//

/**
 * Get all enumeration keys belonging to provided term.
 * @param request: API request.
 * @param response: API response.
 */
function getAllEnumerationKeys(request, response)
{
    //
    // Query database.
    //
    const result = dictionary.getAllEnumerationKeys(request.pathParams.path);

    response.send(result);                                                      // ==>

} // getAllEnumerations()

/**
 * Get all enumerations belonging to provided term.
 * @param request: API request.
 * @param response: API response.
 */
function getAllEnumerations(request, response)
{
    //
    // Query database.
    //
    const result = dictionary.getAllEnumerations(request.pathParams.path);

    response.send(result);                                                      // ==>

} // getAllEnumerations()

/**
 * Get terms matching provided code in provided enumeration.
 * @param request: API request.
 * @param response: API response.
 */
function matchEnumerationCode(request, response)
{
    //
    // Query database.
    //
    const result = dictionary.matchEnumerationCodeTerm(
        request.pathParams.path,
        request.pathParams.code
    )

    response.send(result);                                                      // ==>

} // matchEnumerationCode()

/**
 * Get terms matching provided local identifier in provided enumeration.
 * @param request: API request.
 * @param response: API response.
 */
function matchEnumerationIdentifier(request, response)
{
    //
    // Query database.
    //
    const result = dictionary.matchEnumerationIdentifierTerm(
        request.pathParams.path,
        request.pathParams.code
    )

    response.send(result);                                                      // ==>

} // matchEnumerationIdentifier()

/**
 * Get terms matching provided global identifier in provided enumeration.
 * @param request: API request.
 * @param response: API response.
 */
function matchEnumerationGlobalIdentifier(request, response)
{
    //
    // Query database.
    //
    const result = dictionary.matchEnumerationTerm(
        request.pathParams.path,
        request.pathParams.code
    )

    response.send(result);                                                      // ==>

} // matchEnumerationGlobalIdentifier()

/**
 * Get path from enumeration root to target node by code.
 * @param request: API request.
 * @param response: API response.
 */
function matchEnumerationCodePath(request, response)
{
    //
    // Query database.
    //
    const result = dictionary.matchEnumerationCodePath(
        request.pathParams.path,
        request.pathParams.code
    )

    response.send(result);                                                      // ==>

} // matchEnumerationCodePath()
