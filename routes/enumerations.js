'use strict';

//
// Imports.
//
const dd = require('dedent');
const joi = require('joi');

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

//
// Instantiate router.
//
const createRouter = require('@arangodb/foxx/router');
const ErrorModel = require("../models/error_generic");
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
    'all/keys/:path',
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
            return the *flattened list* of *all enumeration elements* belonging to that *controlled vocabulary*.\
            These elements will be returned as the *global identifiers* of the *terms*.
            
            You can try providing \`_type\`: this will return the *list* of *data type identifiers*.
        `
    )
    .pathParam('path', Models.StringModel, "Enumeration root global identifier")
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
    'all/terms/:path/:lang',
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
            **Get all enumeration terms**
            
            ***To use this service, the current user must have the \`read\` role.***
            
            Enumerations are *graphs* that represent *controlled vocabularies* whose *elements* are *terms*. \
            At the *root* of the *graph* is a term that represents the *type* or *definition* of this \
            *controlled vocabulary*: the \`path\` parameter is the *global identifier* of this *term*.
            
            The service expects the *global identifier* of that *term* as the \`path\` parameter, and will \
            return the *flattened list* of *all enumeration terms* belonging to that *controlled vocabulary*.\
            These elements will be returned as the *term objects*.
            
            You can try providing \`_type\` in the *path* parameter and \`iso_639_3_eng\` \
            in the *lang* parameter: this will return the *list* of *data types* with their descriptions \
            in *English*.
            You can try providing \`iso_639_1\` in the *path* parameter and \`@\` \
            in the *lang* parameter: this will return the *list* of *major languages* with their descriptions \
            in *all available languages*.
        `
    )
    .pathParam('path', Models.StringModel, "Enumeration root global identifier")
    .pathParam('lang', Models.DefaultLanguageTokenModel, "Language global identifier, @ for all")
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


//
// MATCH SERVICES
//

/**
 * Return first term matching the provided code in provided path.
 * The service will return the first term that matches the provided code in the enumeration
 * corresponding to the provided path.
 */
router.get(
    'code/terms/:path/:code',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            matchEnumerationCode(request, response)
        }
    },
    'match-enum-code-terms'
)
    .summary('Return enumeration term by code')
    .description(dd
        `
            **Get enumeration term by identifier**
            
            ***To use this service, the current user must have the \`read\` role.***
            
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
    .pathParam('path', Models.StringModel, "Enumeration root global identifier")
    .pathParam('code', Models.StringModel, "Target enumeration identifier or code")
    .response(200, Models.TermsArrayModel, dd
        `
            **List of matched terms**
            
            If there are terms, in the enumeration defined by the \`path\` parameter, \
            that match the identifier provided in the \`code\` parameter, \
            the service will return the term objects in the array result.
            
            If no term matches the identifier provided in the \`code\` parameter, \
            the service will return an empty array.
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
 * Return first term matching the provided local identifier in provided path.
 * The service will return the first term that matches the provided local identifier in the enumeration
 * corresponding to the provided path.
 */
router.get(
    'lid/terms/:path/:code',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            matchEnumerationIdentifier(request, response)
        }
    },
    'match-enum-lid-terms'
)
    .summary('Return enumeration term by local identifier')
    .description(dd
        `
            **Get enumeration term by local identifier**
            
            ***To use this service, the current user must have the \`read\` role.***
            
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
    .pathParam('path', Models.StringModel, "Enumeration root global identifier")
    .pathParam('code', Models.StringModel, "Target enumeration local identifier")
    .response(200, Models.TermsArrayModel, dd
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
 * Return first term matching the provided local identifier in provided path.
 * The service will return the first term that matches the provided local identifier in the enumeration
 * corresponding to the provided path.
 */
router.get(
    'gid/terms/:path/:code',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            matchEnumerationGlobalIdentifier(request, response)
        }
    },
    'match-enum-gid-terms'
)
    .summary('Return enumeration term by global identifier')
    .description(dd
        `
            **Get enumeration term by global identifier**
            
            ***To use this service, the current user must have the \`read\` role.***
            
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
    .pathParam('path', Models.StringModel, "Enumeration root global identifier")
    .pathParam('code', Models.StringModel, "Target enumeration global identifier")
    .response(200, Models.TermsArrayModel, dd
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
 * The service will return the path from the enumeration root element, expressed by its global identifier,
 * to the first term element matching the provided code.
 */
router.get(
    'code/path/:path/:code',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            matchEnumerationCodePath(request, response)
        }
    },
    'match-enum-code-path'
)
    .summary('Return path from enumeration root to target by code')
    .description(dd
        `
            **Get path from enumeration root to term matching code**
            
            ***To use this service, the current user must have the \`read\` role.***
            
            Enumerations are graphs used as controlled vocabularies whose elements are terms. \
            At the root of the graph is a term that represents the type or definition of this \
            controlled vocabulary, this term represents the enumeration graph.
            
            This service can be used to retrieve the path between the enumeration root term \
            and a term that matches the provided code. The \`path\` parameter represents the \
            global identifier of the enumeration root or type, the \`code\` parameter is the code \
            of a term among the enumeration elements that you want to match: if matched, the service \
            will return the path from the root of the enumeration to the first term whose (\`_aid\`) \
            codes match the provided code. If no match is found, the service will return an empty array.
            
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
    .pathParam('path', Models.StringModel, "Enumeration root global identifier")
    .pathParam('code', Models.StringModel, "Target enumeration identifier or code")
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
 * Return path from enumeration root to first term matching provided local identifier.
 * The service will return the path from the root pf the enumeration to the first term
 * that matches the provided local identifier in the enumeration corresponding to the provided path.
 */
router.get(
    'lid/path/:path/:code',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            matchEnumerationIdentifierPath(request, response)
        }
    },
    'match-enum-lid-path'
)
    .summary('Return path from enumeration root to target by local identifier')
    .description(dd
        `
            **Get path from enumeration root to term matching local identifier**
            
            ***To use this service, the current user must have the \`read\` role.***
            
            Enumerations are graphs used as controlled vocabularies whose elements are terms. \
            At the root of the graph is a term that represents the type or definition of this \
            controlled vocabulary, this term represents the enumeration graph.
            
            This service can be used to retrieve the path between the enumeration root term \
            and a term that matches the provided local identifier. The \`path\` parameter represents the \
            global identifier of the enumeration root or type, the \`code\` parameter is the local identifier \
            of a term among the enumeration elements that you want to match: if matched, the service \
            will return the path from the root of the enumeration to the first term whose (\`_lid\`) \
            matches the provided code. If no match is found, the service will return an empty array.
            
            You can try providing \`_type\` as the \`path\` and \`string\` as the code: this should \
            return the string data type term belonging to the data types controlled vocabulary.
            
            Note that this service will honour preferred enumerations, this means that if a term \
            is matched that has a preferred alternative, the latter will be returned, regardless \
            if the preferred term does not belong to the provided path.
            
            You can try providing \`iso_639_1\` as the \`path\` and \`eng\` as the code: this should \
            return the preferred term for the English language which is \`iso_639_3_eng\`. Note that \
            the actual match is \`iso_639_1_en\`, but this term points to a preferred alternative \
            which is the returned result: this means that the \`en\` local identifier will not be \
            matched, this service expects only preferred local identifiers.
        `
    )
    .pathParam('path', Models.StringModel, "Enumeration root global identifier")
    .pathParam('code', Models.StringModel, "Target enumeration local identifier")
    .response(200, Models.GraphPathsModel, dd
        `
            **Path to matched term**
            
            If there are terms, in the enumeration defined by the \`path\` parameter, \
            that match the local identifier provided in the \`code\` parameter, \
            the service will return the path starting from the enumeration root element \
            to the term whose \`_lid\` local identifier property matches the code \
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
 * Return path from enumeration root to first term matching provided local identifier.
 * The service will return the path from the root pf the enumeration to the first term
 * that matches the provided local identifier in the enumeration corresponding to the provided path.
 */
router.get(
    'gid/path/:path/:code',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            matchEnumerationTermPath(request, response)
        }
    },
    'match-enum-gid-path'
)
    .summary('Return path from enumeration root to target by global identifier')
    .description(dd
        `
            **Get path from enumeration root to term matching global identifier**
            
            ***To use this service, the current user must have the \`read\` role.***
            
            Enumerations are graphs used as controlled vocabularies whose elements are terms. \
            At the root of the graph is a term that represents the type or definition of this \
            controlled vocabulary, this term represents the enumeration graph.
            
            This service can be used to retrieve the path between the enumeration root term \
            and a term that matches the provided global identifier. The \`path\` parameter \
            represents the global identifier of the enumeration root or type, the \`code\` \
            parameter is the global identifier of a term among the enumeration elements \
            that you want to match: if matched, the service will return the path from the root \
            of the enumeration to the first term whose (\`_gid\`) matches the provided code. \
            If no match is found, the service will return an empty array.
            
            You can try providing \`_type\` as the \`path\` and \`_type_string\` as the code: this should \
            return the string data type term belonging to the data types controlled vocabulary.
            
            Note that this service will honour preferred enumerations, this means that if a term \
            is matched that has a preferred alternative, the latter will be returned, regardless \
            if the preferred term does not belong to the provided path.
            
            You can try providing \`iso_639_1\` as the \`path\` and \`iso_639_1_en\` as the code: \
            this should return the preferred term for the English language which is \`iso_639_3_eng\`, \
            this term is the preferred choice for the actual match, which is \`iso_639_1_en\`.
        `
    )
    .pathParam('path', Models.StringModel, "Enumeration root global identifier")
    .pathParam('code', Models.StringModel, "Target enumeration global identifier")
    .response(200, Models.GraphPathsModel, dd
        `
            **Path to matched term**
            
            If there are terms, in the enumeration defined by the \`path\` parameter, \
            that match the global identifier provided in the \`code\` parameter, \
            the service will return the path starting from the enumeration root element \
            to the term whose \`_gid\` global identifier property matches the code \
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
    'check/keys/:path',
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
            
            The service expects the enumeration type term key as the last element of the path and
            the list of term keys to match in the POST body.
            
            The service will return a dictionary with as keys the provided list of identifiers
            and as values the matched enumeration element term keys or false if there was no match.
            
            You can try providing \`iso_639_1\` as the \`path\` and 
            \`["iso_639_1_en", "iso_639_1_fr", "UNKNOWN"]\` as the body.
            The returned dictionary will have as keys the provided identifiers and as values the
            matched enumerations, which for the first two elements of the list will be the preferred
            enumeration and for the last element, that we assume doesn't match, \`false\`.
        `
    )
    .body(Models.StringArrayModel, dd
        `
            **Service parameters**
            
            - \`path\`: The last element of the path should be the enumeration type as its _key.
            - \`body\`: The POST body should contain an array with the list of keys to check.
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
    'check/codes/:path',
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
            
            The service expects the enumeration type term key as the last element of the path and \
            the list of local identifiers to match in the POST body.
            
            The service will return a dictionary with as keys the provided list of identifiers \
            and as values the matched enumeration element term keys or false if there was no match.
            
            You can try providing \`iso_639_1\` as the \`path\` and \
            \`["en", "fr", "UNKNOWN"]\` as the body.
            The returned dictionary will have as keys the provided identifiers and as values the \
            matched enumerations, which for the first two elements of the list will be the preferred \
            enumeration and for the last element, that we assume doesn't match, \`false\`.
        `
    )
    .body(Models.StringArrayModel, dd
        `
            **Service parameters**
            
            - \`path\`: The last element of the path should be the enumeration type as its _key.
            - \`body\`: The POST body should contain an array with the list of local identifiers.
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
    const result = Dictionary.getAllEnumerationKeys(request.pathParams.path);

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
    const result =
        Dictionary.getAllEnumerations(
            request.pathParams.path,
            request.pathParams.lang
        )

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
    const result = Dictionary.matchEnumerationCodeTerm(
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
    const result = Dictionary.matchEnumerationIdentifierTerm(
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
    const result = Dictionary.matchEnumerationTerm(
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
    const result = Dictionary.matchEnumerationCodePath(
        request.pathParams.path,
        request.pathParams.code
    )

    response.send(result);                                                      // ==>

} // matchEnumerationCodePath()

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
        request.pathParams.path,
        request.pathParams.code
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
        request.pathParams.path,
        request.pathParams.code
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
        request.pathParams.path
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
        request.body,
        request.pathParams.path
    )

    response.send(result);                                                      // ==>

} // doCheckEnumsByCodes()
