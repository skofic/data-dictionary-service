'use strict';

//
// Imports.
//
const dd = require('dedent');
const joi = require('joi');
const aql = require('@arangodb').aql
const status = require('statuses')
const errors = require('@arangodb').errors

//
// Error codes.
//
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

//
// Application constants.
//
const K = require('../utils/constants')
const Session = require('../utils/sessions')
const Dictionary = require("../utils/dictionary");

//
// Models.
//
const Models = require('../models/generic_models')
const ErrorModel = require("../models/error_generic")
const ArrayIdentifierFields = joi.string()
    .valid(
         module.context.configuration.localIdentifier,
        module.context.configuration.globalIdentifier,
        module.context.configuration.officialIdentifiers,
        module.context.configuration.providerIdentifiers,
        module.context.configuration.namespaceIdentifier
    )
    .required()

//
// Collections.
//
const view_object = K.db._view(K.view.term.name)
const collection_edge = K.db._collection(K.collection.schema.name)
const collection_term = K.db._collection(K.collection.term.name)
const view_reference = {
    isArangoCollection: true,
    name: () => view_object.name()
}


//
// Instantiate router.
//
const createRouter = require('@arangodb/foxx/router');
const router = createRouter();
module.exports = router;
router.tag('Enumerated types');


//
// LIST SERVICES
//

/**
 * Return all enumeration keys by path.
 * The service will return all the enumeration keys corresponding to the provided path
 * provided as a term global identifier.
 * No hierarchy is maintained and only valid enumeration elements are selected.
 */
router.get(
    'all/keys',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            getAllEnumerationKeys(request, response)
        }
    },
    'all-enum-keys'
)
    .summary('Return flattened list of all enumeration keys for path')
    .description(dd
        `
            **Get all enumeration element global identifiers**
            
            ***To use this service, the current user must have the \`read\` role.***
            
            Enumerations are *graphs* that represent *controlled vocabularies* whose *elements* are *terms*. \
            At the *root* of the *graph* is a term that represents the *type* or *definition* of this \
            *controlled vocabulary*: the \`path\` parameter is the *global identifier* of this *term*.
            
            The service expects the *global identifier* of that *term* as the \`path\` parameter, and will \
            return the *flattened list* of *all enumeration elements* belonging to that *controlled vocabulary*. \
            These elements will be returned as the *global identifiers* of the *terms*.
            
            You can try providing \`_type\`: this will return the *list* of *data type identifiers*.
        `
    )
    .queryParam('path', Models.StringModel, "Enumeration root global identifier")
    .response(200, Models.StringArrayModel, dd
        `
            **List of enumeration global identifiers**
            
            The service will return the *list* of all the *enumeration elements* belonging to the \
            provided \`path\` parameter. The elements are returned as the term *global identifiers*.
            
            Note that *no hierarchy* or *order* is maintained, it is a *flat list* of term *global identifiers*. \
            Also, only items representing *active elements* of the enumeration will be *selected*: this means \
            that terms used as *sections* or *bridges* will not be returned.
        `
    )
    .response(401, ErrorModel, dd
        `
            **No user registered**
            
            There is no active session.
        `
    )
    .response(403, ErrorModel, dd
        `
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
    )

/**
 * Return all enumeration terms by path.
 * The service will return all the enumeration elements of an enumeration type:
 * provide the enumeration type root, the language and the service will return the array of terms.
 * No hierarchy is maintained and only valid enumeration elements are selected.
 */
router.get(
    'all/terms',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            getAllEnumerations(request, response)
        }
    },
    'all-enum-terms'
)
    .summary('Return flattened list of all enumeration terms')
    .description(dd
        `
            **Get all enumeration term records**
            
            ***To use this service, the current user must have the \`read\` role.***
            
            Enumerations are *graphs* that represent *controlled vocabularies* whose *elements* are *terms*. \
            At the *root* of the *graph* is a term that represents the *type* or *definition* of this \
            *controlled vocabulary*: the \`path\` parameter is the *global identifier* of this *term*.
            
            The service expects the *global identifier* of that *term* as the \`path\` parameter, and will \
            return the *flattened list* of *all enumeration elements* belonging to that *controlled vocabulary*. \
            These elements will be returned as *term records*.
            
            You can try providing \`_type\`: this will return the *list* of *data type identifiers*.
        `
    )
    .queryParam('path', Models.StringModel, "Enumeration root global identifier")
    .queryParam('lang', Models.DefaultLanguageTokenModel, "Language code, @ for all languages")
    .response(200, Models.TermsArrayModel, dd
        `
            **List of enumeration terms**
            
            The service will return the *list* of all the *enumeration elements* belonging to the \
            provided \`path\` parameter. The elements are returned as the term *objects*.
            
            The second path parameter, \`lang\`, indicates in which language you desire the properties \
            of the *_info* block to be. If the provided language code matches an element of the \
            *title*, *definition*, *description*, *examples* and *notes* properties, the property will \
            contain the string corresponding to the provided language code; if no element matches the \
            provided language code, the info property will be returned unchanged.
            
            Note that *no hierarchy* or *order* is maintained, it is a *flat list* of *terms*. \
            Also, only items representing *active elements* of the enumeration will be *selected*: this means \
            that terms used as *sections* or *bridges* will not be returned.
        `
    )
    .response(401, ErrorModel, dd
        `
            **No user registered**
            
            There is no active session.
        `
    )
    .response(403, ErrorModel, dd
        `
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
    )

/**
 * Return enumeration tree.
 *
 * This service will break down the structures dependency of the provided root element,
 * the provided global identifier, traversing the enumeration tree up to the provided number
 * of levels.
 *
 * The service will return an object containing a series of expanded edges, each edge is
 * represented by a structure whose root property is the \`_to\`, which features a child
 * property that is the edge predicate, and the edge predicate value is an array of term
 * global identifiers representing the enumerations pointing to the root term.
 *
 * The predicate can have two values: `_predicate_enum-of` indicates a concrete enumeration,
 * `_predicate_bridge-of` represents a bridge to an enumeration data type. Note that, due to the
 * mechanism of the data dictionary, you may find structure types rather enumerations in this
 * array.
 *
 * This result was going to be processed by a dedicated function, however, representing a graph
 * using a tree can get complicated and this part was abandoned, for now.
 */
router.get(
    'tree/keys',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            getTreeEnumerationKeys(request, response)
        }
    },
    'tree-enum-keys'
)
    .summary('Return enumeration keys tree')
    .description(dd
        `
            **List of enumeration hierarchies**
            
            ***To use this service, the current user must have the \`read\` role.***
            
            Enumerations are a graph of connected enumeration terms, this service allows \
            you to traverse the enumeration graph and retrieve the list of single tree branches \
            traversing the desired number of graph levels.
            
            The service expects the global identifier of the root enumeration as a path \
            parameter, and the number of levels to traverse.
            
            You can try providing \`_type\`, this will return the *tree* of *data type \
            identifiers*.
            
            *Note: Currently there is a single predicate that represents a bridge to another \
            enumeration or structure, also, a term can be both a structure and an enumeration: \
            this means that, to date, it is not possible to discriminate bridged terms \
            being enumerations or structures, do please consider this service as in progress.*
        `
    )
    .queryParam('path', Models.StringModel, "Enumeration root global identifier")
    .queryParam('levels', Models.LevelsModel, "Maximum tree depth level")
    .response(200, Models.TreeModel, dd
        `
            **List of enumeration trees.**
            
            The service will return a structure whose properties represent the enumeration \
            tree roots of the root enumeration, traversing the provided number of levels. \
            Each sub-structure is as follows:
            
            - Root: enumeration name.
            - Child (will have a single child property): the predicate.
            - Child value: an array containing the list of child enumerations.
            
            Predicate \`_predicate_enum-of\` will contain the list of leaf nodes belonging \
            to the current root enumeration.
            Predicate \`_predicate_bridge-of\` will contain the single global identifier \
            of the term that represents the type of the root. Due to the fact that the \
            bridge predicate is unique for enumerations and structures, and due to the fact \
            that terms can be both enumerations and structures, you might have here elements \
            that are not structures, but enumerations. This is the reason that we consider \
            this service as *in progress*.
        `
    )
    .response(401, ErrorModel, dd
        `
            **No user registered**
            
            There is no active session.
        `
    )
    .response(403, ErrorModel, dd
        `
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
    )


//
// MATCH SERVICES
//

/**
 * Get enumeration element global identifier given _code field, value and enumeration type.
 * The service will check if the provided code matches the provided field in terms
 * and if any of the matched terms belong to the provided enumeration root global identifier.
 * The service will return an array of matched enumeration elements.
 */
router.get(
    'match/field/keys',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            doCheckEnumKeysByField(request, response)
        }
    },
    'match-enum-field-keys'
)
    .summary('Get enum key by code, field and type')
    .description(dd
        `
            **Check if provided code matches an enumeration element**
            
            *Use this service if you want to check if a code belonging to a field in the \
            code section of a term resolves into an enumeration element belonging to the \
            graph whose root belongs to the edge path. The service returns the matched \
            global identifier.*
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service expects the *enumeration type term global identifier* as the \`path\` \
            query parameter, the code provided as the \`code\` query parameter and the \
            *name of the field*, belonging to the code section of the term, in which to match \
            the code in the \`field\` query parameter.
            
            You can try providing:
            
            - \`iso_639_1\` as the \`path\` parameter.
            - \`en\` as the \`code\` parameter.
            - \`_aid\` as the \`field\` parameter (list of official codes).
            
            You should get \`iso_639_3_eng\` as the result.
            This means that \`en\` is matched in the list of *official codes*,  \
            \`_aid\`, of the *preferred enumeration element*, \`iso_639_3_eng\` \
            belonging to the \`iso_639_1\` controlled vocabulary.
        `
    )
    .queryParam('path', Models.StringModel, "Enumeration root global identifier")
    .queryParam('code', Models.StringModel, "Target enumeration identifier")
    .queryParam('field', ArrayIdentifierFields, dd`
        Code section field name where the code should be matched:
        - \`_lid\`: Local identifier. Match the local identifier code.
        - \`_gid\`: Global identifier. Match the global identifier code.
        - \`_aid\`: List of official codes. Match the official code.
        - \`_pid\`: List of provider codes. Match the provided code.
        - \`_nid\`: Namespace. Match the namespace code.
    `
    )
    .response(200, joi.array().items(joi.string()), dd
        `
            **Check status**
            
            The service will return an array of global identifiers representing \
            enumeration elements, if there was no match, the array will be empty.
        `
    )
    .response(401, ErrorModel, dd
        `
            **No user registered**
            
            There is no active session.
        `
    )
    .response(403, ErrorModel, dd
        `
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
    )

/**
 * Get enumeration element global identifier given _code field, value and enumeration type.
 * The service will check if the provided code matches the provided field in terms
 * and if any of the matched terms belong to the provided enumeration root global identifier.
 * The service will return an array of matched enumeration elements.
 */
router.get(
    'match/field/terms',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            doCheckEnumTermsByField(request, response)
        }
    },
    'match-enum-field-terms'
)
    .summary('Get enum term by code, field and type')
    .description(dd
        `
            **Check if provided code matches an enumeration element**
            
            *Use this service if you want to check if a code belonging to a field in the \
            code section of a term resolves into an enumeration element belonging to the \
            graph whose root belongs to the edge path. The service returns the matched \
            term.*
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service expects the *enumeration type term global identifier* as the \`path\` \
            query parameter, the code provided as the \`code\` query parameter and the \
            *name of the field*, belonging to the code section of the term, in which to match \
            the code in the \`field\` query parameter.
            
            You can try providing:
            
            - \`iso_639_1\` as the \`path\` parameter.
            - \`en\` as the \`code\` parameter.
            - \`_aid\` as the \`field\` parameter (list of official codes).
            
            You should get \`iso_639_3_eng\` as the result.
            This means that \`en\` is matched in the list of *official codes*,  \
            \`_aid\`, of the *preferred enumeration element*, \`iso_639_3_eng\` \
            belonging to the \`iso_639_1\` controlled vocabulary.
        `
    )
    .queryParam('path', Models.StringModel, "Enumeration root global identifier")
    .queryParam('code', Models.StringModel, "Target enumeration identifier")
    .queryParam('field', ArrayIdentifierFields, dd`
        Code section field name where the code should be matched:
        - \`_lid\`: Local identifier. Match the local identifier code.
        - \`_gid\`: Global identifier. Match the global identifier code.
        - \`_aid\`: List of official codes. Match the official code.
        - \`_pid\`: List of provider codes. Match the provided code.
        - \`_nid\`: Namespace. Match the namespace code.
    `
    )
    .response(200, joi.array().items(joi.object()), dd
        `
            **Check status**
            
            The service will return an array of term records representing \
            enumeration elements, if there was no match, the array will be empty.
        `
    )
    .response(401, ErrorModel, dd
        `
            **No user registered**
            
            There is no active session.
        `
    )
    .response(403, ErrorModel, dd
        `
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
    )


//
// PATH SERVICES
//

/**
 * Return path from enumeration root element to target node.
 * The service will return the path from the enumeration root element,
 * expressed by its global identifier, to the first term element matching
 * the provided code in the provided code section field.
 */
router.get(
    'traverse/field/path',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            traverseFieldPath(request, response)
        }
    },
    'traverse-enum-field-path'
)
    .summary('Return path from enumeration root to target element by code and field')
    .description(dd
        `
            **Get path from root to term matching code**
            
            ***To use this service, the current user must have the \`read\` role.***
            
            Enumerations are graphs used as controlled vocabularies whose elements are terms. \
            At the root of the graph is a term that represents the type or definition of this \
            controlled vocabulary, this term represents the enumeration graph.
            
            This service can be used to retrieve the path between the enumeration root term \
            and a term that matches the provided code in the provided field. The \`path\` \
            parameter represents the global identifier of the enumeration root or type, \
            the \`code\` parameter is the code of a term among the enumeration elements \
            that you want to match, \`field\` is the term code section property name in which \
            the provided code must be found: if matched, the service will return the path from \
            the root of the enumeration to the first term whose \`field\` contains \`code\`. \
            If no match is found, the service will return an empty array.
            
            The \`field\` parameter can take two values: \`_aid\` corresponding to the list of \
            official term identifiers, and \`_pid\` corresponding to the list of provider \
            identifiers.
            
            You can try providing \`_type\` as the \`path\`, \`enum\` as the code and \`_aid\` \
            as \`field\`: this should return the enumeration data type term belonging to the \
            data types controlled vocabulary.
            
            Note that this service will honour preferred enumerations, this means that if a term \
            is matched that has a preferred alternative, the latter will be returned, regardless \
            if the preferred term does not belong to the provided path.
            
            You can try providing \`iso_639_1\` as the \`path\` and \`en\` as the code and \`_aid\` \
            as the \`field\`: this should return the preferred term for the English language \
            which is \`iso_639_3_eng\`, this term is the preferred choice for the actual match, \
            which is \`iso_639_1_en\`.
        `
    )
    .queryParam('path', Models.StringModel, "Enumeration root global identifier")
    .queryParam('code', Models.StringModel, "Target enumeration identifier")
    .queryParam('field', ArrayIdentifierFields, dd`
        Code section field name where the code should be matched:
        - \`_lid\`: Local identifier. Match the local identifier code.
        - \`_gid\`: Global identifier. Match the global identifier code.
        - \`_aid\`: List of official codes. Match the official code.
        - \`_pid\`: List of provider codes. Match the provided code.
        - \`_nid\`: Namespace. Match the namespace code.
    `
    )
    .response(200, Models.GraphPathsModel, dd
        `
            **Path to matched term**
            
            If there are terms, in the enumeration defined by the \`path\` parameter, \
            that match the identifier provided in the \`code\` parameter, \
            the service will return the path starting from the enumeration root element \
            to the terms whose \`_aid\` property contains a match for the identifier \
            provided in the \`code\` parameter; if there is no match, the service will \
            return an empty array.
            
            The result is an array in which each element is an object representing a path \
            constituted by a list of edges and a list of vertices.
        `
    )
    .response(401, ErrorModel, dd
        `
            **No user registered**
            
            There is no active session.
        `
    )
    .response(403, ErrorModel, dd
        `
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
    )

/**
 * Check if list of global identifiers belong to provided enumeration.
 * The service will check the provided list of term keys asserting whether they
 * belong to the provided enumeration. All parameters should be provided as term keys.
 * The service will return a dictionary whose keys are the provided list of ter keys
 * and the values will be the matched preferred enumeration keys or false if unmatched.
 */
router.post(
    'check/keys',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            doCheckEnumsByKeys(request, response)
        }
    },
    'check-enum-list-keys'
)
    .summary('Check if list of term keys belong to enumeration')
    .description(dd
        `
            **Check if list of term keys belong to enumeration**
            
            *Use this service if you want to check if a list of term keys belong to an enumeration.*
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service expects the enumeration type term key as the last element of the path and \
            the list of term keys to match in the POST body.
            
            The service will return a dictionary with as keys the provided list of identifiers \
            and as values the matched enumeration element term keys or false if there was no match.
            
            You can try providing \`iso_639_1\` as the \`path\` and \
            \`["iso_639_1_en", "iso_639_1_fr", "UNKNOWN"]\` as the body.
            The returned dictionary will have as keys the provided document keys and as values \
            the matched enumeration elements. You will notice that the first two elements match \
            a different enumeration, because these elements point to a preferred enumeration, \
            while the last element we assume doesn't exist, and it has the \`false\` value.
        `
    )
    .queryParam('path', Models.StringModel, "Enumeration root global identifier")
    .body(Models.StringArrayModel, dd
        `
            **Service parameters**
            
            Provide an array of strings corresponding to term document keys that should \
            be elements of the enumeration whose root yu provided in the \`path\` parameter.
        `
    )
    .response(200, joi.object(), dd
        `
            **Check status**
            
            The service will return a dictionary whose keys correspond to the provided list of
            identifiers and the values will be the keys of the matched enumerations, or false,
            if there was no match.
        `
    )
    .response(401, ErrorModel, dd
        `
            **No user registered**
            
            There is no active session.
        `
    )
    .response(403, ErrorModel, dd
        `
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
        `
    )

/**
 * Check if list of local identifiers belong to provided enumeration.
 * The service will check the provided list of local identifiers asserting whether they
 * belong to the provided enumeration, provided as the term global identifier of the enum.
 * The service will return a dictionary whose keys are the provided list of local identifiers
 * and the values will be the matched preferred enumeration keys or false if unmatched.
 */
router.post(
    'check/codes',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            doCheckEnumsByCodes(request, response)
        }
    },
    'check-enum-list-codes'
)
    .summary('Check if list of local identifiers belong to enumeration')
    .description(dd
        `
            **Check if list of local identifiers belong to enumeration**
            
            *Use this service if you want to check if a list of local identifiers belong to an enumeration.*
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service expects the enumeration type term key as the \`path\` query parameter, \
            the code section field name in the \`field\` query parameter and the list of local \
            identifiers to match in the POST body.
            
            The service will return a dictionary with as keys the provided list of identifiers \
            and as values the matched enumeration element term keys or false if there was no match.
            
            You can try providing \`iso_639_1\` as the \`path\`, \`_aid\` as the \`field\` \
            parameter and \`["en", "fr", "UNKNOWN"]\` as the body.
            
            The returned dictionary will have as keys the provided identifiers and as values the \
            matched enumerations, which for the first two elements of the list will be the preferred \
            enumeration and for the last element, that we assume doesn't match, \`false\`.
        `
    )
    .queryParam('path', Models.StringModel, "Enumeration root global identifier")
    .queryParam('field', ArrayIdentifierFields, dd`
        Code section field name where the code should be matched:
        - \`_lid\`: Local identifier. Match the local identifier code.
        - \`_gid\`: Global identifier. Match the global identifier code.
        - \`_aid\`: List of official codes. Match the official code.
        - \`_pid\`: List of provider codes. Match the provided code.
        - \`_nid\`: Namespace. Match the namespace code.
    `
    )
    .body(Models.StringArrayModel, dd
        `
            Provide an array of values to be matched with the contents of the provided field.
        `
    )
    .response(200, joi.object(), dd
        `
            **Check status**
            
            The service will return a dictionary whose keys correspond to the provided list of
            identifiers and the values will be the keys of the matched enumerations, or false,
            if there was no match.
        `
    )
    .response(401, ErrorModel, dd
        `
            **No user registered**
            
            There is no active session.
        `
    )
    .response(403, ErrorModel, dd
        `
            **User unauthorised**
            
            The current user is not authorised to perform the operation.
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
    const result = Dictionary.getAllEnumerationKeys(request.queryParams.path);

    response.send(result);                                                      // ==>

} // getAllEnumerations()

/**
 * Get all property names belonging to provided term.
 * @param request: API request.
 * @param response: API response.
 */
function getTreeEnumerationKeys(request, response)
{
    //
    // Query database.
    //
    const result =
        Dictionary.getEnumerationDescriptorKeys(
            request.queryParams.path,
            request.queryParams.levels
        )

    response.send(result);                                                      // ==>

} // getTreeEnumerationKeys()

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
    const result =
        Dictionary.getAllEnumerations(
            request.queryParams.path,
            request.queryParams.lang
        )

    response.send(result);                                                      // ==>

} // getAllEnumerations()

/**
 * Get term keys matching provided code and field in provided enumeration.
 * @param request: API request.
 * @param response: API response.
 */
function traverseFieldKeys(request, response)
{
    //
    // Query database.
    //
    const result = Dictionary.traverseFieldKeys(
        request.queryParams.path,
        request.queryParams.code,
        request.queryParams.field
    )

    response.send(result);                                                      // ==>

} // traverseFieldKeys()

/**
 * Get term records matching provided code and field in provided enumeration.
 * @param request: API request.
 * @param response: API response.
 */
function traverseFieldTerms(request, response)
{
    //
    // Query database.
    //
    const result = Dictionary.traverseFieldTerms(
        request.queryParams.path,
        request.queryParams.code,
        request.queryParams.field
    )

    response.send(result);                                                      // ==>

} // traverseFieldTerms()

/**
 * Get path from enumeration root to target node by code.
 * @param request: API request.
 * @param response: API response.
 */
function traverseFieldPath(request, response)
{
    //
    // Query database.
    //
    const result = Dictionary.traverseFieldPath(
        request.queryParams.path,
        request.queryParams.code,
        request.queryParams.field
    )

    response.send(result);                                                      // ==>

} // traverseFieldPath()

/**
 * Get path from enumeration root to target node by local identifier.
 * @param request: API request.
 * @param response: API response.
 */
function matchEnumerationIdentifierPath(request, response)
{
    //
    // Query database.
    //
    const result = Dictionary.matchEnumerationIdentifierPath(
        request.queryParams.path,
        request.queryParams.code
    )

    response.send(result);                                                      // ==>

} // matchEnumerationIdentifierPath()

/**
 * Get path from enumeration root to target node by global identifier.
 * @param request: API request.
 * @param response: API response.
 */
function matchEnumerationTermPath(request, response)
{
    //
    // Query database.
    //
    const result = Dictionary.matchEnumerationTermPath(
        request.queryParams.path,
        request.queryParams.code
    )

    response.send(result);                                                      // ==>

} // matchEnumerationTermPath()

/**
 * Check if list of term keys belong to an enumeration.
 * @param request: API request.
 * @param response: API response.
 */
function doCheckEnumsByKeys(request, response)
{
    //
    // Query database.
    //
    const result = Dictionary.checkEnumsByKeys(
        request.body,
        request.queryParams.path
    )

    response.send(result);                                                      // ==>

} // doCheckEnumsByKeys()

/**
 * Check if list of local identifiers belong to an enumeration.
 * @param request: API request.
 * @param response: API response.
 */
function doCheckEnumsByCodes(request, response)
{
    //
    // Query database.
    //
    const result = Dictionary.checkEnumsByCodes(
        request.queryParams.field,
        request.body,
        request.queryParams.path
    )

    response.send(result);                                                      // ==>

} // doCheckEnumsByCodes()

/**
 * Check if code section field and value correspond
 * to an element of the provided enumeration root
 * and return the list of global identifiers.
 * @param request: API request.
 * @param response: API response.
 */
function doCheckEnumKeysByField(request, response)
{
    //
    // Query database.
    //
    const result = Dictionary.doCheckEnumKeysByField(
        request.queryParams.code,
        request.queryParams.field,
        request.queryParams.path
    )

    response.send(result);                                                      // ==>

} // doCheckEnumKeysByField()

/**
 * Check if code section field and value correspond
 * to an element of the provided enumeration root
 * and return the list of term records.
 * @param request: API request.
 * @param response: API response.
 */
function doCheckEnumTermsByField(request, response)
{
    //
    // Query database.
    //
    const result = Dictionary.doCheckEnumTermsByField(
        request.queryParams.code,
        request.queryParams.field,
        request.queryParams.path
    )

    response.send(result);                                                      // ==>

} // doCheckEnumTermsByField()
