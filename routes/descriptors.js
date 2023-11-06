'use strict';

//
// Imports.
//
const dd = require('dedent');
const joi = require('joi');
const aql = require('@arangodb').aql
const status = require('statuses')
const httpError = require('http-errors')
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
const createRouter = require('@arangodb/foxx/router');
const {db} = require("../utils/constants");
const router = createRouter();
module.exports = router;
router.tag('Descriptors');


//
// LIST SERVICES
//

/**
 * Return descriptor enumerations.
 *
 * The service will return the flattened list of enumeration term global identifiers
 * belonging to the provided descriptor global identifier.
 *
 * the returned list represents the flattened enumeration structure without hierarchy.
 */
router.get(
	'enum/key/:key',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			getDescriptorEnumKeys(request, response)
		}
	},
	'kind'
)
	.summary('Return descriptor enumerations')
	.description(dd
		`
            **Get descriptor enumeration keys**
            
            ***To use this service, the current user must have the \`read\` role.***
            
            The service expects the *global identifier* of an enumeration descriptor in the \
            \`key\` path parameter, and will return the descriptor's  controlled vocabulary. \
            The vocabulary elements will be the term global identifiers.
            
            If the term does not exist, or if the term is not a descriptor, the service will fail.
            The descriptor's data shape must be scalar, array or set, and its scalar data type \
            must be an enumeration. If that is not the case, the service will return an empty array.
            
            You can try providing \`_type\`: this will return the flattened elements of its controlled vocabulary.
        `
	)
	.pathParam('key', Models.StringModel, "Descriptor global identifier")
	.response(200, Models.StringArrayModel, dd
		`
            **Controlled vocabulary element global identifiers**
            
            The service will return the *list* of elements comprising the descriptor's associated \
            controlled vocabulary as global identifiers.
        `
	)
	.response(204, Models.ArrayModel, dd
		`
            **The descriptor is not an enumeration**
            
            The service will return this status when the provided descriptor does not \
            resolve as a controlled vocabulary. In this case the returned value will be \
            an empty array.
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
	.response(404, ErrorModel, dd
		`
            **Not found**
            
            Either the descriptor was not found, or it was not a descriptor.
        `
	)

/**
 * Return descriptor enumeration tree.
 *
 * This service expects the global identifier of an enumeration descriptor, it will
 * return the tree structures comprising the controlled vocabulary of the descriptor.
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
 * The service will only accept scalar, array or set descriptors of enumeration
 * scalar data type.
 */
router.get(
	'enum/tree/:key/:levels',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			getDescriptorEnumTrees(request, response)
		}
	},
	'tree-enum-keys'
)
	.summary('Return descriptor enumeration tree')
	.description(dd
		`
            **Get descriptor enumeration tree**
            
            ***To use this service, the current user must have the \`read\` role.***
            
            Enumerations are a graph of connected enumeration terms, this service allows \
            you to traverse the enumeration graph and retrieve the list of single tree branches \
            traversing the desired number of graph levels.
            
            The service expects the global identifier of an enumeration descriptor, \
            and the number of levels to traverse. 
            
            If the term does not exist, or if the term is not a descriptor, the service will fail.
            The descriptor's data shape must be scalar, array or set, and its scalar data type \
            must be an enumeration. If that is not the case, the service will return an empty array.
            
            You can try providing \`_type\`, this will return the *tree* of *data type \
            identifiers*.
            
            *Note: Currently there is a single predicate that represents a bridge to another \
            enumeration or structure, also, a term can be both a structure and an enumeration: \
            this means that, to date, it is not possible to discriminate bridged terms \
            being enumerations or structures, do please consider this service as in progress.*
        `
	)
	.pathParam('key', Models.StringModel, "Descriptor global identifier")
	.pathParam('levels', Models.LevelsModel, "Maximum tree depth level")
	.response(200, Models.TreeModel, dd
		`
            **Controlled vocabulary tree.**
            
            The service will return a structure whose properties represent the enumeration \
            tree roots of the enumeration descriptor, traversing the provided number of levels. \
            Each sub-structure is as follows:
            
            - Root: Vertex element.
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
	.response(204, Models.ArrayModel, dd
		`
            **The descriptor is not an enumeration**
            
            The service will return this status when the provided descriptor does not \
            resolve as a controlled vocabulary. In this case the returned value will be \
            an empty array.
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
	.response(404, ErrorModel, dd
		`
            **Not found**
            
            Either the descriptor was not found, or it was not a descriptor.
        `
	)


//
// Functions.
//

/**
 * Get descriptor enumeration keys.
 * @param request: API request.
 * @param response: API response.
 */
function getDescriptorEnumKeys(request, response)
{
	//
	// Get descriptor.
	//
	const descriptor = request.pathParams.key

	//
	// Get term.
	//
	try {
		const term = db._document(K.collection.term.name + '/' + descriptor)
		if(term.hasOwnProperty(K.term.dataBlock)) {
			const kind = Dictionary.getDescriptorEnumKind(term._data)
			if(kind.length > 0) {
				response.send(Dictionary.getAllKindEnumerationKeys(kind))                                           // ==>
			} else {
				response.status(204)
				response.send([])
			}
		} else {
			throw httpError(HTTP_NOT_FOUND, `Term ${descriptor} is not a descriptor`)  // ==>
		}
	} catch (error) {
		if(error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, `Term ${descriptor} not found`)            // ==>
		}
		throw error
	}

} // getDescriptorEnumKeys()

/**
 * Get descriptor enumeration trees.
 * @param request: API request.
 * @param response: API response.
 */
function getDescriptorEnumTrees(request, response)
{
	//
	// Get term.
	//
	const descriptor = request.pathParams.key
	const levels = request.pathParams.levels

	//
	// Get term.
	//
	try {
		const term = db._document(K.collection.term.name + '/' + descriptor)
		if(term.hasOwnProperty(K.term.dataBlock)) {
			const kind = Dictionary.getDescriptorEnumKind(term._data)
			if(kind.length > 0) {
				response.send(Dictionary.getEnumerationDescriptorTrees(kind, levels))                                           // ==>
			}
		} else {
			throw httpError(HTTP_NOT_FOUND, `Term ${descriptor} is not a descriptor`)  // ==>
		}
	} catch (error) {
		if(error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, `Term ${descriptor} not found`)            // ==>
		}
		throw error
	}

} // getDescriptorEnumTrees()
