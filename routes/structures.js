'use strict';

//
// Imports.
//
const dd = require('dedent');
const joi = require('joi');
const createRouter = require('@arangodb/foxx/router');

//
// Application constants.
//
const K = require('../utils/constants')
const Utils = require('../utils/utils')
const Session = require('../utils/sessions')
const Dictionary = require("../utils/dictionary");

//
// Models.
//
const Models = require('../models/generic_models')
const ErrorModel = require("../models/error_generic");

//
// Instantiate router.
//
const router = createRouter();
module.exports = router;
router.tag('Structured types');


//
// LIST SERVICES
//

/**
 * Return all object property names by path.
 * The service will return all the property names corresponding
 * to the provided path global identifier.
 * No hierarchy is maintained and only valid properties are selected.
 */
router.get(
    'all/keys',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            getPropertyNames(request, response)
        }
    },
    'all-struct-keys'
)
    .summary('Return object structure rules section')
    .description(dd
        `
            **Get all property names**
            
            ***To use this service, the current user must have the \`read\` role.***
            
            Structure types are used to select which object properties are required, \
            forbidden or recommended, this information is stored in the \`_rule\` section \
            of the term representing the object type. \
            
            The service expects the global identifier of the term representing the \
            object type as a path parameter.
            
            You can try providing \`_scalar\`, which represents a scalar value container.
        `
    )
    .queryParam('path', Models.StringModel, "Object type global identifier")
    .response(200, Models.StringArrayModel, dd
        `
            **List of required, forbidden and recommended property names**
            
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
 * Return all object properties.
 * The service will return all the properties of the provided object descriptor glonal identifier.
 * No hierarchy is maintained and only valid enumeration elements are selected.
 */
router.get(
    'all/terms',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            getProperties(request, response)
        }
    },
    'all-struct-terms'
)
    .summary('Return flattened list of properties')
    .description(dd
        `
            **Get all properties**
            
            ***To use this service, the current user must have the \`read\` role.***
            
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
    .queryParam('path', Models.StringModel, "Object descriptor global identifier")
    .response(200, Models.TermsArrayModel, dd
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
 * Return object property structures.
 *
 * This service will break down the structures dependency of the provided root element,
 * the provided global identifier, traversing the structure up to the provided number of levels.
 *
 * The service will return an object containing a series of properties: each property represents
 * a sub-structure with a property representing a predicate, this predicate contains an array
 * representing the property names belonging to the structure's root property. The predicate
 * can have two values: `_predicate_property-of` indicates a concrete property,
 * `_predicate_bridge-of` represents a bridge to a structure data type. Note that, due to the
 * mechanism of the data dictionary, you may find data types rather data structures in this array.
 *
 * This result was going to be processed by a dedicated function, however, representing a graph
 * using a tree can get complicated and this part was abandoned, for now.
 */
router.get(
    'tree/keys',
    (request, response) => {
        const roles = [K.environment.role.read]
        if(Session.hasPermission(request, response, roles)) {
            getPropertyKeys(request, response)
        }
    },
    'tree-struct-keys'
)
    .summary('Return tree of object property names')
    .description(dd
        `
            **List of property structures**
            
            ***To use this service, the current user must have the \`read\` role.***
            
            Structures are a graph of connected descriptor terms, by convention a structure \
            can have only a single level: this service allows you to traverse the graph and \
            retrieve the list of single level structures traversing the desired number of \
            levels.
            
            The service expects the global identifier of the root property as a path parameter, \
            and the number of levels to traverse.
            
            You can try providing \`_scalar\`, which represents a scalar value container: \
            this will return the list of properties that belong to that descriptor, \
            and that can be used to define a scalar data type.
            
            *Note: Currently there is a single predicate that represents a bridge to another \
            enumeration or structure, also, a term can be both a structure and an enumeration: \
            this means that, to date, it is not possible to discriminate bridged terms \
            being enumerations or structures, do please consider this service as in progress.*
        `
    )
    .queryParam('path', Models.StringModel, "Object descriptor global identifier")
    .queryParam('levels', Models.LevelsModel, "Maximum tree depth level")
    .response(200, Models.TreeModel, dd
        `
            **List of property structures.**
            
            The service will return a structure whose properties represent the property \
            names of the structures that compose the root struture down to the provided \
            number of levels. Each sub-structure is as follows:
            
            - Root: property name.
            - Child (will have a single child property): the predicate.
            - Child value: an array containing the list of child properties.
            
            Predicate \`_predicate_property-of\` will contain the list of sub-structures \
            or leaf nodes belonging to the current root.
            Predicate \`_predicate_bridge-of\` will contain the single global identifier \
            of the term that represents the type of the root. Due to the fact that the \
            bridge predicate is unique for enumerations and structures, and due to the fact \
            that terms can be both enumerations and structures, you might have here elements \
            that are not structures, but enumerations. This is the reason that we consider \
            this service as *in progress*.

            This list includes all properties that are *usually* connected to the parent \
            descriptor, by *usually* we mean the properties that we expect to find in the object.
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
 * Get all property names belonging to provided term.
 * @param request: API request.
 * @param response: API response.
 */
function getPropertyNames(request, response)
{
    //
    // Query database.
    //
    const result = Dictionary.getPropertyNames(request.queryParams.path);

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
    const result = Dictionary.getProperties(request.queryParams.path);

    response.send(result);                                                      // ==>

} // getProperties()

/**
 * Get all property names belonging to provided term.
 * @param request: API request.
 * @param response: API response.
 */
function getPropertyKeys(request, response)
{
    //
    // Query database.
    //
    const result = Dictionary.getPropertyKeys(request.queryParams.path, request.queryParams.levels);
    response.send(result)

} // getPropertyKeys()
