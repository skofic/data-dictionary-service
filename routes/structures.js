'use strict';

//
// Imports.
//
const dd = require('dedent');
const joi = require('joi');
const createRouter = require('@arangodb/foxx/router');

//
// Functions.
//
const dictionary = require("../utils/dictionary");

//
// Constants.
//
const identifierString = joi.string().required()
const arrayString = joi.array().items(joi.string())
const arrayTerms = joi.array().items(joi.object({
    _key: joi.string(),
    _code: joi.object(),
    _info: joi.object()
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
router.tag('structures');


//
// LIST SERVICES
//

/**
 * Return all object property names by path.
 * The service will return all the property names corresponding
 * to the provided path global identifier.
 * No hierarchy is maintained and only valid properties are selected.
 */
router.get('all/keys/:path', getPropertyNames, 'all-struct-keys')
    .pathParam('path', identifierString, "Object descriptor global identifier")
    .response(arrayString, dd
        `
            **List of structure property names**
            
            The service will return the names of all the properties belonging to the \
            indicated path. The properties are represented by the global identifier \
            of the descriptor term that defines the property.
            
            Note that no hierarchy or order is maintained, it is a flat list of term global identifiers. \
            Also, only items representing active elements of the structure will be selected: this means \
            that terms used as sections or bridges will not be considered.
            
            This list includes all properties that are *usually* connected to the parent descriptor, \
            by *usually* we mean the properties that we expect to find in the object.
        `
    )
    .summary('Return flattened list of object property names')
    .description(dd
        `
            **Get all property names**
            
            Structures are tree graphs representing the properties that belong to a specific \
            object descriptor. \
            At the root of the graph is the term that represents the root property descriptor, \
            the descriptor properties that belong to this root are connected through the graph, \
            the service will return all property names connected to the provided root term.
            
            The service expects the global identifier of the root property as a path parameter, \
            and will return the flattened list of all property names belonging to that structure. \
            These elements will be returned as the global identifiers of the descriptor terms.
            
            You can try providing \`_scalar\`, which represents a scalar value container: \
            this will return the list of properties that belong to that descriptor, \
            and that can be used to define a scalar data type.
        `
    )

/**
 * Return all object properties.
 * The service will return all the properties of the provided object descriptor glonal identifier.
 * No hierarchy is maintained and only valid enumeration elements are selected.
 */
router.get('all/terms/:path', getProperties, 'all-struct-terms')
    .pathParam('path', identifierString, "Object descriptor global identifier")
    .response(arrayTerms, dd
        `
            **List of structure properties**
            
            The service will return the descriptor terms of all the properties belonging to the \
            indicated path. The properties are the descriptor term objects.
            
            Note that no hierarchy or order is maintained, it is a flat list of terms. \
            Also, only items representing active elements of the structure will be selected: this means \
            that terms used as sections or bridges will not be considered.
            
            This list includes all properties that are *usually* connected to the parent descriptor, \
            by *usually* we mean the properties that we expect to find in the object.
        `
    )
    .summary('Return flattened list of properties')
    .description(dd
        `
            **Get all properties**
            
            Structures are tree graphs representing the properties that belong to a specific \
            object descriptor. \
            At the root of the graph is the term that represents the root property descriptor, \
            the descriptor properties that belong to this root are connected through the graph, \
            the service will return all descriptor terms connected to the provided root term.
            
            The service expects the global identifier of the root property as a path parameter, \
            and will return the flattened list of all descriptor terms belonging to that structure. \
            These elements will be returned as term objects.
            
            You can try providing \`_scalar\`, which represents a scalar value container: \
            this will return the properties that belong to that descriptor, \
            and that can be used to define a scalar data type.
        `
    )


//
// Functions.
//

/**
 * Get all property names belonging to provided term.
 * @param request: API request.
 * @param response: API response.
 */
function getPropertyNames(request, response)
{
    //
    // Query database.
    //
    const result = dictionary.getPropertyNames(request.pathParams.path);

    response.send(result);                                                      // ==>

} // getPropertyNames()

/**
 * Get properties belonging to provided term.
 * @param request: API request.
 * @param response: API response.
 */
function getProperties(request, response)
{
    //
    // Query database.
    //
    const result = dictionary.getProperties(request.pathParams.path);

    response.send(result);                                                      // ==>

} // getProperties()
