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
const router = createRouter();
module.exports = router;
router.tag('Graphs');


//
// CREATION SERVICES
//

/**
 * Add enumerations.
 */
router.post(
	'add/enum',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doAddEdges(request, response, K.term.predicateEnum)
		}
	},
	'graph-add-enum'
)
	.summary('Add enumerations')
	.description(dd
		`
            **Add enumerations**
             
            ***In order to use this service, the current user must have the \`dict\` role.***
             
            This service can be used to add a set of child enumerations to a parent \
            node in a specific graph path.
            
            Enumerations are controlled vocabularies that can have several nested levels.
            
            The service expects the graph root global identifier, the \
            parent global identifier and its children global identifiers in the request body. \
            The *child* elements will be considered *valid enumeration options* of the \
            *parent* node within the *root* graph.
        `
	)
	.body(Models.AddChildren, dd
		`
            **Root, parent and elements**
            
            The request body should hold an object containing the following elements:
            - \`root\`: The global identifier of the term that represents the \
              enumeration type, root or path.
            - \`parent\`: The global identifier of the term that represents \
              the parent of the enumeration elements.
            - \`items\`: A set of term global identifiers, each representing an enumeration.
            
            The *root* represents the type or name of the graph.
            The *parent* represents a node in the graph, at any level, to which the provided \
            enumeration options belong.
            The *items* represent the identifiers of the terms that represent valid enumeration \
            options for the *parent* node.
        `
	)
	.response(200, Models.AddChildrenResponse, dd
		`
            **Operations count**
            
            The service will return an object containign the following properties:
            - inserted: The number of inserted edges.
            - updated: The number of existing edges to which the root has been added to their path.
            - existing: The number of already existing edges that include subject, object predicate and path.
        `
	)
	.response(400, joi.object(), dd
		`
            **Invalid reference**

            The service will return this code any of the provided term references are invalid.
        `
	)
	.response(401, ErrorModel, dd
		`
            **No current user**
            
            The service will return this code if no user is currently logged in.
        `
	)
	.response(403, ErrorModel, dd
		`
            **Unauthorised user**
            
            The service will return this code if the current user is not a dictionary user.
        `
	)

/**
 * Add fields.
 */
router.post(
	'add/field',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doAddFields(request, response)
		}
	},
	'graph-add-field'
)
	.summary('Add fields')
	.description(dd
		`
            **Add fields**
             
            ***In order to use this service, the current user must have the \`dict\` role.***
             
            This service can be used to add a set of child fields to a parent \
            node in a specific graph path.
            
            A graph of fields represents a form in which you may have sections containing \
            a set of descriptors representing data input fields.
            
            The service expects the form global identifier, the global identifier of the parent node, \
            and the list of child descriptor global identifiers representing data input fields.
        `
	)
	.body(Models.AddChildren, dd
		`
            **Root, parent and elements**
            
            The request body should hold an object containing the following elements:
            - \`root\`: The global identifier of the term that represents the *form*.
            - \`parent\`: The global identifier of the term that represents either the form \
              itself, or the container section for the list of fields.
            - \`items\`: A set of term global identifiers, *each representing a descriptor*, \
              that represent the data input fields.
        `
	)
	.response(200, Models.AddChildrenResponse, dd
		`
            **Operations count**
            
            The service will return an object containign the following properties:
            - inserted: The number of inserted edges.
            - updated: The number of existing edges to which the root has been added to their path.
            - existing: The number of existing edges that include subject, object predicate and path.
        `
	)
	.response(400, joi.object(), dd
		`
            **Invalid reference**

            The service will return this code any of the provided term references are invalid.
        `
	)
	.response(401, ErrorModel, dd
		`
            **No current user**
            
            The service will return this code if no user is currently logged in.
        `
	)
	.response(403, ErrorModel, dd
		`
            **Unauthorised user**
            
            The service will return this code if the current user is not a dictionary user.
        `
	)

/**
 * Add properties.
 */
router.post(
	'add/property',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doAddProperties(request, response)
		}
	},
	'graph-add-property'
)
	.summary('Add properties')
	.description(dd
		`
            **Add properties**
             
            ***In order to use this service, the current user must have the \`dict\` role.***
             
            This service can be used to add a set of properties to an object structure type.
            
            Object structures are represented by a term that holds the list of restrictions \
            and constraints the structure should obey. This term represents the object type. \
            The graph is a one level tree where the children are all the properties that the \
            object type parent might feature. This list is only indicative, it should be used \
            as a suggestion of which properties to set in the object. The constraints will be \
            listed in the rule (_rule) section of the object type term. Note that, by design, \
            an object type can only have one level, which means that if an object contains \
            another object, there must be a type at both levels.
            
            The service expects the global identifier of the object type term,  and the list of \
            descriptor global identifiers representing the object's properties.
        `
	)
	.body(Models.AddChildrenProperties, dd
		`
            **Object type and properties**
            
            The request body should hold an object containing the following elements:
            - \`parent\`: The global identifier of the object type.
            - \`items\`: A set of descriptor term global identifiers representing the object's properties.
        `
	)
	.response(200, Models.AddChildrenResponse, dd
		`
            **Operations count**
            
            The service will return an object containign the following properties:
            - inserted: The number of inserted edges.
            - updated: The number of existing edges to which the root has been added to their path.
            - existing: The number of existing edges that include subject, object predicate and path.
        `
	)
	.response(400, joi.object(), dd
		`
            **Invalid parameter**
            
            The service will return this code if the provided term is invalid:
            - Parameter error: if the error is caught at the level of the parameter, \
              the service will return a standard error. Note that all child elements must \
              reference descriptor terms.
            - Validation error: if it is a validation error, the service will return an \
              object with two properties: \`report\` will contain the status report and \
              \`value\` will contain the provided term.
        `
	)
	.response(401, ErrorModel, dd
		`
            **No current user**
            
            The service will return this code if no user is currently logged in.
        `
	)
	.response(403, ErrorModel, dd
		`
            **Unauthorised user**
            
            The service will return this code if the current user is not a dictionary user.
        `
	)

/**
 * Add sections.
 */
router.post(
	'add/section',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doAddEdges(request, response, K.term.predicateSection)
		}
	},
	'graph-add-section'
)
	.summary('Add sections')
	.description(dd
		`
            **Add sections**
             
            ***In order to use this service, the current user must have the \`dict\` role.***
             
            This service can be used to add a set of child sections to a parent \
            node in a specific graph path. *Sections* are used to create \
            *non-functional groups of elements* that can be used as subdivisions \
            for display purposes, such as sections in a list of child enumeration \
			elements, or sections in a form.
			
			*This means that you should not add sections to a data structure*.
            
            The service expects the graph root global identifier, the \
            parent global identifier and its children sections global identifiers. \
            The *child* elements will be considered *sections* of the *parent* node \
            within the *root* graph.
        `
	)
	.body(Models.AddChildren, dd
		`
            **Root, parent and elements**
            
            The request body should hold an object containing the following elements:
            - \`root\`: The global identifier of the term that represents the \
              graph type, root or path.
            - \`parent\`: The global identifier of the term that represents \
              the parent of the section elements.
            - \`items\`: A set of term global identifiers, each representing a section.
            
            The *root* represents the type or name of the graph.
            The *parent* represents a node in the graph, at any level, to which the provided \
            sections belong.
            The *items* represent the identifiers of the terms that represent sections of \
            the *parent* node.
        `
	)
	.response(200, Models.AddChildrenResponse, dd
		`
            **Operations count**
            
            The service will return an object containign the following properties:
            - inserted: The number of inserted edges.
            - updated: The number of existing edges to which the root has been added to their path.
            - existing: The number of existing edges that include subject, object predicate and path.
        `
	)
	.response(400, joi.object(), dd
		`
            **Invalid parameter**
            
            The service will return this code if the provided term is invalid:
            - Parameter error: if the error is caught at the level of the parameter, \
              the service will return a standard error.
            - Validation error: if it is a validation error, the service will return an \
              object with two properties: \`report\` will contain the status report and \
              \`value\` will contain the provided term.
        `
	)
	.response(401, ErrorModel, dd
		`
            **No current user**
            
            The service will return this code if no user is currently logged in.
        `
	)
	.response(403, ErrorModel, dd
		`
            **Unauthorised user**
            
            The service will return this code if the current user is not a dictionary user.
        `
	)

/**
 * Add bridges.
 */
router.post(
	'add/bridge',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doAddEdges(request, response, K.term.predicateBridge)
		}
	},
	'graph-add-bridge'
)
	.summary('Add bridge')
	.description(dd
		`
            **Add bridge**
             
            ***In order to use this service, the current user must have the \`dict\` role.***
             
            This service can be used to add a set of child aliases to a parent \
            node in a specific graph path.
            
            A bridge is a connection between two nodes which does not identify as an \
            enumeration, property, field or other significant predicate. When evaluating \
            bridge predicates, the traversal will skip the element connected by the bridge \
            predicate and resume searching for significant predicates. Such connections are \
            used to connect a new root to the graph of an existing one, or to point to a \
            preferred choice.
            
            The service expects the graph root global identifier, the \
            parent global identifier and its children alias global identifiers. \
            The *child* elements will be considered *aliases* of the *parent* node \
            within the *root* graph.
        `
	)
	.body(Models.AddChildren, dd
		`
            **Root, parent and elements**
            
            The request body should hold an object containing the following elements:
            - \`root\`: The global identifier of the term that represents the \
              graph type, root or path.
            - \`parent\`: The global identifier of the node that represents \
              the parent of the relationdhip.
            - \`items\`: A set of term global identifiers, each representing a bridge node.
            
            The *root* represents the type or path of the graph.
            The *parent* represents the parent node in the relationships.
            The *items* represent the nodes that will be ignored during graph traversals.
        `
	)
	.response(200, Models.AddChildrenResponse, dd
		`
            **Operations count**
            
            The service will return an object containign the following properties:
            - inserted: The number of inserted edges.
            - updated: The number of existing edges to which the root has been added to their path.
            - existing: The number of existing edges that include subject, object predicate and path.
        `
	)
	.response(400, joi.object(), dd
		`
            **Invalid parameter**
            
            The service will return this code if the provided term is invalid:
            - Parameter error: if the error is caught at the level of the parameter, \
              the service will return a standard error.
            - Validation error: if it is a validation error, the service will return an \
              object with two properties: \`report\` will contain the status report and \
              \`value\` will contain the provided term.
        `
	)
	.response(401, ErrorModel, dd
		`
            **No current user**
            
            The service will return this code if no user is currently logged in.
        `
	)
	.response(403, ErrorModel, dd
		`
            **Unauthorised user**
            
            The service will return this code if the current user is not a dictionary user.
        `
	)


//
// Functions.
//

/**
 * Insert enumerations.
 * @param request: API request.
 * @param response: API response.
 * @param predicate: Predicate value.
 */
function doAddEdges(request, response, predicate)
{
	//
	// Init local storage.
	//
	const data = request.body
	const collection_edges = K.db._collection(K.collection.schema.name)

	//
	// Check for missing keys.
	//
	const missing = getMissingKeys(data)
	if(missing.length > 0) {

		const message =
			K.error.kMSG_ERROR_MISSING_TERM_REFS.message[module.context.configuration.language]
				.replace('@@@', missing.join(", "))

		response.throw(400, message)
		return                                                                  // ==>
	}

	//
	// Create list of expected edges.
	//
	const edges = []
	const result = {inserted: 0, updated: 0, existing: 0}
	data.items.forEach(item => {

		//
		// Init local identifiers.
		//
		const root = `${K.collection.term.name}/${data.root}`
		const subject = `${K.collection.term.name}/${item}`
		const object = `${K.collection.term.name}/${data.parent}`
		const key = Utils.getEdgeKey(subject, predicate, object)

		//
		// Check if it exists.
		//
		try {
			const found = collection_edges.document(key)
			if(found._path.includes(root)) {
				result.existing += 1
			} else {
				result.updated += 1
				edges.push({
					_key: key,
					_from: subject,
					_to: object,
					_predicate: predicate,
					_path: found._path.concat([root])
				})
			}
		} catch (error) {

			//
			// Handle unexpected errors.
			//
			if((!error.isArangoError) || (error.errorNum !== ARANGO_NOT_FOUND)) {
				response.throw(500, error.message)
				return                                                          // ==>
			}

			//
			// Insert edge.
			//
			result.inserted += 1
			edges.push({
				_key: key,
				_from: subject,
				_to: object,
				_predicate: predicate,
				_path: [ root ]
			})
		}
	})

	//
	// Perform query.
	//
	K.db._query( aql`
        FOR item in ${edges}
            INSERT item
            INTO ${collection_edges}
            OPTIONS { overwriteMode: "update", keepNull: false, mergeObjects: false }
    `)

	response.send(result)

} // doAddEdges()

/**
 * Insert fields.
 * @param request: API request.
 * @param response: API response.
 */
function doAddFields(request, response)
{
	//
	// Init local storage.
	//
	const data = request.body
	const predicate = K.term.predicateField
	const collection_edges = K.db._collection(K.collection.schema.name)

	//
	// Check for missing keys.
	//
	const missing = getMissingKeys(data)
	if(missing.length > 0) {

		const message =
			K.error.kMSG_ERROR_MISSING_TERM_REFS.message[module.context.configuration.language]
				.replace('@@@', missing.join(", "))

		response.throw(400, message)
		return                                                                  // ==>
	}

	//
	// Ensure children are all descriptors.
	//
	const found = getNotDescriptorKeys(data.items)
	if(found.length > 0) {

		const message =
			K.error.kMSG_NOT_DESCRIPTORS.message[module.context.configuration.language]
				.replace('@@@', found.join(", "))

		response.throw(400, message)
		return                                                                  // ==>
	}

	//
	// Create list of expected edges.
	//
	const edges = []
	const result = {inserted: 0, updated: 0, existing: 0}
	data.items.forEach(item => {

		//
		// Init local identifiers.
		//
		const root = `${K.collection.term.name}/${data.root}`
		const subject = `${K.collection.term.name}/${item}`
		const object = `${K.collection.term.name}/${data.parent}`
		const key = Utils.getEdgeKey(subject, predicate, object)

		//
		// Check if it exists.
		//
		try {
			const found = collection_edges.document(key)
			if(found._path.includes(root)) {
				result.existing += 1
			} else {
				result.updated += 1
				edges.push({
					_key: key,
					_from: subject,
					_to: object,
					_predicate: predicate,
					_path: found._path.concat([root])
				})
			}
		} catch (error) {

			//
			// Handle unexpected errors.
			//
			if((!error.isArangoError) || (error.errorNum !== ARANGO_NOT_FOUND)) {
				response.throw(500, error.message)
				return                                                          // ==>
			}

			//
			// Insert edge.
			//
			result.inserted += 1
			edges.push({
				_key: key,
				_from: subject,
				_to: object,
				_predicate: predicate,
				_path: [ root ]
			})
		}
	})

	//
	// Perform query.
	//
	K.db._query( aql`
        FOR item in ${edges}
            INSERT item
            INTO ${collection_edges}
            OPTIONS {
	            overwriteMode: "update",
	            keepNull: false,
	            mergeObjects: false
            }
    `)

	response.send(result)

} // doAddFields()

/**
 * Insert fields.
 * @param request: API request.
 * @param response: API response.
 */
function doAddProperties(request, response)
{
	//
	// Init local storage.
	//
	const data = request.body
	const predicate = K.term.predicateProperty
	const collection_edges = K.db._collection(K.collection.schema.name)

	//
	// Check for missing keys.
	//
	const missing = getMissingKeys(data)
	if(missing.length > 0) {

		const message =
			K.error.kMSG_ERROR_MISSING_TERM_REFS.message[module.context.configuration.language]
				.replace('@@@', missing.join(", "))

		response.throw(400, message)
		return                                                                  // ==>
	}

	//
	// Ensure children are all descriptors.
	//
	const found = getNotDescriptorKeys(data.items)
	if(found.length > 0) {

		const message =
			K.error.kMSG_NOT_DESCRIPTORS.message[module.context.configuration.language]
				.replace('@@@', found.join(", "))

		response.throw(400, message)
		return                                                                  // ==>
	}

	//
	// Create list of expected edges.
	//
	const edges = []
	const result = {inserted: 0, updated: 0, existing: 0}
	data.items.forEach(item => {

		//
		// Init local identifiers.
		//
		const subject = `${K.collection.term.name}/${item}`
		const object = `${K.collection.term.name}/${data.parent}`
		const key = Utils.getEdgeKey(subject, predicate, object)

		//
		// Check if it exists.
		//
		try {
			const found = collection_edges.document(key)
			if(found._path.includes(object)) {
				result.existing += 1
			} else {
				result.updated += 1
				edges.push({
					_key: key,
					_from: subject,
					_to: object,
					_predicate: predicate,
					_path: found._path.concat([object])
				})
			}
		} catch (error) {

			//
			// Handle unexpected errors.
			//
			if((!error.isArangoError) || (error.errorNum !== ARANGO_NOT_FOUND)) {
				response.throw(500, error.message)
				return                                                          // ==>
			}

			//
			// Insert edge.
			//
			result.inserted += 1
			edges.push({
				_key: key,
				_from: subject,
				_to: object,
				_predicate: predicate,
				_path: [ object ]
			})
		}
	})

	//
	// Perform query.
	//
	K.db._query( aql`
        FOR item in ${edges}
            INSERT item
            INTO ${collection_edges}
            OPTIONS { overwriteMode: "update", keepNull: false, mergeObjects: false }
    `)

	response.send(result)

} // doAddProperties()


//
// Utils.
//

/**
 * Assert enum request keys exist.
 * This function will return the list of keys that are missing from terms collection.
 * @param theData {Object}: Object containing `root`, `parent` and `items` term keys.
 * @return {Array<String>}: List of missing keys
 */
function getMissingKeys(theData)
{
	//
	// Ensure items are a set.
	//
	theData.items = [... new Set(theData.items)]

	//
	// Collect keys.
	//
	const terms = (theData.hasOwnProperty('root'))
				? Array.from(new Set(theData.items.concat([theData.root, theData.parent])))
				: Array.from(new Set(theData.items.concat([theData.parent])))

	//
	// Assert all terms exist.
	//
	const found =
		K.db._query( aql`
            LET terms = DOCUMENT(${K.db._collection(K.collection.term.name)}, ${terms})
            FOR term IN terms
            RETURN term._key
        `).toArray()

	return terms.filter(x => !found.includes(x))                                // ==>

} // getMissingKeys()

/**
 * Return edge matching keys.
 * This function will return the list of edge documents that match the provided list of keys.
 * @param theKeys {Array<String>}: OList of edge keys.
 * @return {Object}: Dictionary with matching keys as key and edge documents as value.
 */
function getMatchingKeys(theKeys)
{
	//
	// Get matching edges.
	//
	const found =
		K.db._query( aql`
            FOR edge IN ${K.db._collection(K.collection.schema.name)}
                FILTER edge._key IN ${theKeys}
            RETURN edge
        `).toArray()

	//
	// Prepare dictionary.
	//
	const result = {}
	found.forEach(edge => {
		delete edge._id
		delete edge._rev

		result[edge._key] = edge
	})

	return result                                                               // ==>

} // getMatchingKeys()

/**
 * Check list of descriptor keys.
 * Provided a list of term keys, this function will return those which are not descriptors.
 * Note that the function expects all keys to match a term.
 * @param theKeys {Array<String>}: OList of edge keys.
 * @return {Array<String>}: List of keys that do not refer to descriptors.
 */
function getNotDescriptorKeys(theKeys)
{
	//
	// Filter terms without data section.
	//
	const result =
		K.db._query( aql`
			FOR term IN ${K.db._collection(K.collection.term.name)}
			    FILTER term._key IN ${theKeys}
			    FILTER NOT HAS(term, ${K.term.dataBlock})
			RETURN term._key
        `).toArray()

	return result                                                               // ==>

} // getNotDescriptorKeys()
