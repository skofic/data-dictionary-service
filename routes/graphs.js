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

//
// Models.
//
const Models = require('../models/generic_models')
const ErrorModel = require("../models/error_generic");
const SaveModel = joi.boolean().default(true).description(
	`If *set*, the edges will be created, updated or deleted; if *not set*, \
	the service will return the inserted, updated or deleted edges.
	`
)

//
// Collections.
//
const view_object = K.db._view(module.context.configuration.viewTerm)
const collection_edge = K.db._collection(module.context.configuration.collectionEdge)
const collection_link = K.db._collection(module.context.configuration.collectionLink)
const collection_term = K.db._collection(module.context.configuration.collectionTerm)
const view_reference = {
	isArangoCollection: true,
	name: () => view_object.name()
}


//
// Instantiate router.
//
const createRouter = require('@arangodb/foxx/router');
const TermValidation = require("../models/validation_parameters.");
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
			doAddEnums(
				request,
				response,
				module.context.configuration.predicateEnumeration,
				true
			)
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
	.queryParam('save', SaveModel)
	.body(Models.AddDelEdges, dd
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
	.response(200, Models.AddEdgesResponse, dd
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
 * Delete enumerations.
 */
router.post(
	'del/enum',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doDelEnums(
				request,
				response,
				module.context.configuration.predicateEnumeration,
				true
			)
		}
	},
	'graph-del-enum'
)
	.summary('Delete enumerations')
	.description(dd
		`
            **Delete enumerations**
            
            ***In order to use this service, the current user must have the \`dict\` role.***
            
            This service can be used to remove a set of child enumerations from a parent \
            node in a specific graph path.
            
            Enumerations are controlled vocabularies that can have several nested levels.
            
            The service expects the graph root global identifier, the \
            parent global identifier and its children global identifiers in the request body. \
            The *child* elements will be considered *valid enumeration options* of the \
            *parent* node within the *root* graph.
        `
	)
	.queryParam('save', SaveModel)
	.body(Models.AddDelEdges, dd
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
	.response(200, Models.DelEdgesResponse, dd
		`
            **Operations count**
            
            The service will return an object containing the following properties:
            - deleted: The number of deleted edges.
            - updated: The number of existing edges in which the root was removed from their path.
            - ignored: The number of edges that were not found.
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
			doAddEnums(
				request,
				response,
				module.context.configuration.predicateField,
				true
			)
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
	.body(Models.AddDelEdges, dd
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
	.response(200, Models.AddEdgesResponse, dd
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
 * Delete fields.
 */
router.post(
	'del/field',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doDelEnums(
				request,
				response,
				module.context.configuration.predicateField,
				true
			)
		}
	},
	'graph-del-field'
)
	.summary('Delete fields')
	.description(dd
		`
            **Delete fields**
            
            ***In order to use this service, the current user must have the \`dict\` role.***
            
            This service can be used to remove a set of child fields from a parent \
            node in a specific graph path.
            
            A graph of fields represents a form in which you may have sections containing \
            a set of descriptors representing data input fields.
            
            The service expects the graph root global identifier, the \
            parent global identifier and its children global identifiers in the request body. \
            The *child* elements will be considered *fields* of the \
            *parent* node within the *root* graph.
        `
	)
	.body(Models.AddDelEdges, dd
		`
            **Root, parent and elements**
            
            The request body should hold an object containing the following elements:
            - \`root\`: The global identifier of the term that represents the \
              form.
            - \`parent\`: The global identifier of the term that represents \
              the parent of the items.
            - \`items\`: A set of term global identifiers, each representing a field.
            
            The *root* represents the type or name of the graph.
            The *parent* represents a node in the graph, at any level, to which the provided \
            enumeration options belong.
            The *items* represent the identifiers of the terms that represent fields \
            of the *parent* node.
        `
	)
	.response(200, Models.DelEdgesResponse, dd
		`
            **Operations count**
            
            The service will return an object containing the following properties:
            - deleted: The number of deleted edges.
            - updated: The number of existing edges in which the root was removed from their path.
            - ignored: The number of edges that were not found.
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
 * Add sections.
 */
router.post(
	'add/section',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doAddEnums(
				request,
				response,
				module.context.configuration.predicateSection,
				true
			)
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
	.body(Models.AddDelEdges, dd
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
	.response(200, Models.AddEdgesResponse, dd
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
            
            The service will return this code if the provided request is invalid:
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
 * Delete sections.
 */
router.post(
	'del/section',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doDelEnums(
				request,
				response,
				module.context.configuration.predicateSection,
				true
			)
		}
	},
	'graph-del-section'
)
	.summary('Delete sections')
	.description(dd
		`
            **Delete sections**
            
            ***In order to use this service, the current user must have the \`dict\` role.***
            
            This service can be used to remove a set of child sections from a parent \
            node in a specific graph path.
            
            *Sections* are used to create *non-functional groups of elements* that \
            can be used as subdivisions for display purposes, such as sections in a \
            list of child enumeration elements, or sections in a form.
            
            The service expects the graph root global identifier, the \
            parent global identifier and its children global identifiers in the request body. \
            The *child* elements will be considered *sections* of the \
            *parent* node within the *root* graph.
        `
	)
	.body(Models.AddDelEdges, dd
		`
            **Root, parent and elements**
            
            The request body should hold an object containing the following elements:
            - \`root\`: The global identifier of the term that represents the \
              form.
            - \`parent\`: The global identifier of the term that represents \
              the parent of the items.
            - \`items\`: A set of term global identifiers, each representing a field.
            
            The *root* represents the type or name of the graph.
            The *parent* represents a node in the graph, at any level, to which the provided \
            enumeration options belong.
            The *items* represent the identifiers of the terms that represent sections \
            of the *parent* node.
        `
	)
	.response(200, Models.DelEdgesResponse, dd
		`
            **Operations count**
            
            The service will return an object containing the following properties:
            - deleted: The number of deleted edges.
            - updated: The number of existing edges in which the root was removed from their path.
            - ignored: The number of edges that were not found.
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
 * Add bridges.
 */
router.post(
	'add/bridge',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doAddEnums(
				request,
				response,
				module.context.configuration.predicateBridge,
				true
			)
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
	.body(Models.AddDelEdges, dd
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
	.response(200, Models.AddEdgesResponse, dd
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
            
            The service will return this code if the provided request is invalid:
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
			doAddLinks(
				request,
				response,
				module.context.configuration.predicateProperty,
				true,
				true
			)
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
            and constraints the structure should obey. This term represents the object type.
            The graph is a one level tree where the children are all the properties that the \
            object type parent might feature. This list is only indicative, it should be used \
            as a suggestion of which properties to set in the object.
            The constraints will be listed in the rule (_rule) section of the object type \
            term. Note that, by design, an object type can only have one level, which means \
            that if an object contains another object, there must be a type at both levels.
            
            The service expects the global identifier of the object type term, and the list of \
            descriptor global identifiers representing the object's properties.
        `
	)
	.body(Models.AddDelLinks, dd
		`
            **Object type and properties**
            
            The request body should hold an object containing the following elements:
            - \`parent\`: The parent node: the global identifier of the object.
            - \`items\`: A set of descriptor term global identifiers representing \
              the object's properties.
            
            The edges will contain a relationship from the children to the parent.
        `
	)
	.response(200, Models.AddLinksResponse, dd
		`
            **Operations count**
            
            The service will return an object containing the following properties:
            - inserted: The number of inserted edges.
            - existing: The number of existing edges that include subject, object and predicate.
        `
	)
	.response(400, joi.object(), dd
		`
            **Invalid parameter**
            
            The service will return this code if the provided request is invalid:
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
 * Remove properties.
 */
router.post(
	'del/property',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doDelLinks(
				request,
				response,
				module.context.configuration.predicateProperty,
				true,
			)
		}
	},
	'graph-del-property'
)
	.summary('Remove properties')
	.description(dd
		`
            **Remove properties**
            
            ***In order to use this service, the current user must have the \`dict\` role.***
            
            This service can be used to remove a set of properties from an object structure type.
            
            Object structures are represented by a term that holds the list of restrictions \
            and constraints the structure should obey. This term represents the object type.
            The graph is a one level tree where the children are all the properties that the \
            object type parent might feature. This list is only indicative, it should be used \
            as a suggestion of which properties to set in the object.
            The constraints will be listed in the rule (_rule) section of the object type \
            term. Note that, by design, an object type can only have one level, which means \
            that if an object contains another object, there must be a type at both levels.
            
            The service expects the global identifier of the object type term, and the list of \
            descriptor global identifiers representing the object's properties.
        `
	)
	.body(Models.AddDelLinks, dd
		`
            **Object type and properties**
            
            The request body should hold an object containing the following elements:
            - \`parent\`: The parent node: the global identifier of the object.
            - \`items\`: A set of descriptor term global identifiers representing \
              the object's properties.
            
            The edges will contain a relationship from the children to the parent.
        `
	)
	.response(200, Models.DelLinksResponse, dd
		`
            **Operations count**
            
            The service will return an object containing the following properties:
            - removed: The number of removed edges.
            - ignored: The number of ignored edges.
        `
	)
	.response(400, joi.object(), dd
		`
            **Invalid parameter**
            
            The service will return this code if the provided request is invalid:
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
 * Add indicators.
 */
router.post(
	'add/indicator',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doAddLinks(
				request,
				response,
				module.context.configuration.predicateRequiredIndicator,
				false,
				true
			)
		}
	},
	'graph-add-indicator'
)
	.summary('Add required indicators')
	.description(dd
		`
            **Add required indicators**
            
            ***In order to use this service, the current user must have the \`dict\` role.***
            
            This service can be used to add a set of required indicator references \
            to an existing descriptor.
            
            There are cases in which a particular descriptor requires a set of other \
            indicators to give meaning to its data in a dataset. For instance we could \
            link date to temperature, so that whenever we include temperature in a dataset \
            we also make sure to add the date in which the temperature was recorded. \
            This feature is useful when building data submission templates or \
            aggregating datasets.
            
            The service expects the global identifier of the object type term, and the list of \
            descriptor global identifiers representing the object's properties.
        `
	)
	.body(Models.AddDelLinks, dd
		`
            **Descriptor and its required indicators**
            
            The request body should hold an object containing the following elements:
            - \`parent\`: The descriptor global identifier.
            - \`items\`: A set of descriptor term global identifiers representing \
              the required indicators.
            
            The edges will contain a relationship from the parents to the children.
        `
	)
	.response(200, Models.AddEdgesResponse, dd
		`
            **Operations count**
            
            The service will return an object containing the following properties:
            - inserted: The number of inserted edges.
            - existing: The number of existing edges that include subject, object and predicate.
        `
	)
	.response(400, joi.object(), dd
		`
            **Invalid parameter**
            
            The service will return this code if the provided request is invalid:
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
 * Remove properties.
 */
router.post(
	'del/indicator',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doDelLinks(
				request,
				response,
				module.context.configuration.predicateRequiredIndicator,
				false
			)
		}
	},
	'graph-del-indicator'
)
	.summary('Remove required indicators')
	.description(dd
		`
            **Remove required indicators**
            
            ***In order to use this service, the current user must have the \`dict\` role.***
            
            This service can be used to remove a set of required indicators from a \
            descriptor term.
            
            There are cases in which a particular descriptor requires a set of other \
            indicators to give meaning to its data in a dataset. For instance we could \
            link date to temperature, so that whenever we include temperature in a dataset \
            we also make sure to add the date in which the temperature was recorded. \
            This feature is useful when building data submission templates or \
            aggregating datasets.
            
            The service expects the global identifier of the object type term, and the list of \
            descriptor global identifiers representing the object's properties.
        `
	)
	.body(Models.AddDelLinks, dd
		`
            **Object type and properties**
            
            The request body should hold an object containing the following elements:
            - \`parent\`: The parent node: the global identifier of the object.
            - \`items\`: A set of descriptor term global identifiers representing \
              the object's properties.
            
            The edges will contain a relationship from the children to the parent.
        `
	)
	.response(200, Models.DelLinksResponse, dd
		`
            **Operations count**
            
            The service will return an object containing the following properties:
            - removed: The number of removed edges.
            - ignored: The number of ignored edges.
        `
	)
	.response(400, joi.object(), dd
		`
            **Invalid parameter**
            
            The service will return this code if the provided request is invalid:
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
 * Add metadata.
 */
router.post(
	'add/metadata',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doAddLinks(
				request,
				response,
				module.context.configuration.predicateRequiredMetadata,
				false,
				true
			)
		}
	},
	'graph-add-metadata'
)
	.summary('Add required metadata')
	.description(dd
		`
            **Add required metadata**
            
            ***In order to use this service, the current user must have the \`dict\` role.***
            
            This service can be used to add a set of required metadata references \
            to an existing descriptor.
            
            There are cases in which a particular descriptor requires a set of metadata \
            indicators to give meaning to its data in a dataset. The metadata indicators \
            are descriptors that contain data *related to the parent descriptor*: this \
            means that the parent and its metadata indicators form a single block. \
            Required indicators are added and shared in the dataset, while metadata \
            indicators are added to the parent descriptor.
            
            The service expects the global identifier of the object type term, and the list of \
            descriptor global identifiers representing the object's metadata indicators.
        `
	)
	.body(Models.AddDelLinks, dd
		`
            **Descriptor and its required metadata indicators**
            
            The request body should hold an object containing the following elements:
            - \`parent\`: The descriptor global identifier.
            - \`items\`: A set of descriptor term global identifiers representing \
              the required metadata indicators.
            
            The edges will contain a relationship from the parents to the children.
        `
	)
	.response(200, Models.AddEdgesResponse, dd
		`
            **Operations count**
            
            The service will return an object containing the following properties:
            - inserted: The number of inserted edges.
            - existing: The number of existing edges that include subject, object and predicate.
        `
	)
	.response(400, joi.object(), dd
		`
            **Invalid parameter**
            
            The service will return this code if the provided request is invalid:
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
 * Remove metadata.
 */
router.post(
	'del/metadata',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doDelLinks(
				request,
				response,
				module.context.configuration.predicateRequiredMetadata,
				false
			)
		}
	},
	'graph-del-metadata'
)
	.summary('Remove required indicators')
	.description(dd
		`
            **Remove required metadata indicators**
            
            ***In order to use this service, the current user must have the \`dict\` role.***
            
            This service can be used to remove a set of required metadata indicators from a \
            descriptor term.
            
            There are cases in which a particular descriptor requires a set of metadata \
            indicators to give meaning to its data in a dataset. The metadata indicators \
            are descriptors that contain data *related to the parent descriptor*: this \
            means that the parent and its metadata indicators form a single block. \
            Required indicators are added and shared in the dataset, while metadata \
            indicators are added to the parent descriptor.
            
            The service expects the global identifier of the object type term, and the list of \
            descriptor global identifiers representing the object's metadata indicators.
        `
	)
	.body(Models.AddDelLinks, dd
		`
            **Object type and properties**
            
            The request body should hold an object containing the following elements:
            - \`parent\`: The descriptor global identifier.
            - \`items\`: A set of descriptor term global identifiers representing \
              the required metadata indicators.
            
            The edges will contain a relationship from the children to the parent.
        `
	)
	.response(200, Models.DelLinksResponse, dd
		`
            **Operations count**
            
            The service will return an object containing the following properties:
            - removed: The number of removed edges.
            - ignored: The number of ignored edges.
        `
	)
	.response(400, joi.object(), dd
		`
            **Invalid parameter**
            
            The service will return this code if the provided request is invalid:
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
 * Adds edges based on the provided parameters.
 *
 * @param theRequest {Object}: The request object.
 * @param theResponse {Object}: The response object.
 * @param thePredicate {String}: The predicate for the edges.
 * @param theDirection {Boolean}: `true` many to one; `false` one to many.
 *
 * @return {void}
 */
function doAddEnums(
	theRequest,
	theResponse,
	thePredicate,
	theDirection
){
	//
	// Init local storage.
	//
	const data = theRequest.body
	
	//
	// Check for missing terms.
	//
	const missing = getEdgeMissingKeys(data)
	if(missing.length > 0) {
		
		const message =
			K.error.kMSG_ERROR_MISSING_TERM_REFS.message[module.context.configuration.language]
				.replace('@@@', missing.join(", "))
		
		theResponse.throw(400, message)
		return                                                          // ==>
	}
	
	//
	// Create list of expected edges.
	//
	const edges = []
	const inserted = []
	const updated = []
	const existing = []
	const result = {inserted: 0, updated: 0, existing: 0}
	const path = module.context.configuration.sectionPath
	const pred = module.context.configuration.predicate
	data.items.forEach(item =>
	{
		//
		// Init local identifiers.
		//
		const root = `${module.context.configuration.collectionTerm}/${data.root}`
		const src = (theDirection)
			? `${module.context.configuration.collectionTerm}/${item}`
			: `${module.context.configuration.collectionTerm}/${data.parent}`
		const dst = (theDirection)
			? `${module.context.configuration.collectionTerm}/${data.parent}`
			: `${module.context.configuration.collectionTerm}/${item}`
		const key = Utils.getEdgeKey(src, thePredicate, dst)
		
		//
		// Check if it exists.
		//
		try
		{
			///
			// Get edge.
			///
			const found = collection_edge.document(key)
			
			///
			// Handle existing.
			//
			if(found[path].includes(root))
			{
				result.existing += 1
				existing.push(found)
			}
				
			///
			// Add root.
			///
			else
			{
				result.updated += 1
				updated.push({
					_key: key,
					_from: src,
					_to: dst,
					[pred]: thePredicate,
					[path]: found[path].concat([root])
				})
			}
		}
			
		///
		// New edge.
		///
		catch (error)
		{
			//
			// Handle unexpected errors.
			//
			if((!error.isArangoError) || (error.errorNum !== ARANGO_NOT_FOUND)) {
				response.throw(500, error.message)
				return                                                  // ==>
			}
			
			//
			// Insert edge.
			//
			result.inserted += 1
			inserted.push({
				_key: key,
				_from: src,
				_to: dst,
				[pred]: thePredicate,
				[path]: [ root ]
			})
		}
	})
	
	///
	// Handle connection from root to parent.
	///
	
	
	///
	// Insert edges.
	///
	if(theRequest.queryParams.save)
	{
		//
		// Insert new edges.
		//
		K.db._query( aql`
			FOR item in ${inserted}
			    INSERT item
			    INTO ${collection_edge}
			    OPTIONS { overwriteMode: "update", keepNull: false }
		`)
		
		//
		// Update existing edges.
		//
		K.db._query( aql`
			FOR item in ${updated}
			    UPDATE {
			        "_key": item._key,
			        ${path}: item,${path}
			    }
			    IN ${collection_edge}
			    OPTIONS { keepNull: false, mergeObjects: false }
		`)
		
		theResponse.send(result)
		return                                                          // ==>
	}
	
	//
	// Return information.
	//
	theResponse.send({
		stats: result,
		inserted,
		updated,
		existing
	})
	
} // doAddEdges()

/**
 * Removes edges based on the provided parameters.
 *
 * @param theRequest {Object}: The request object.
 * @param theResponse {Object}: The response object.
 * @param thePredicate {String}: The predicate for the edges.
 * @param theDirection {Boolean}: `true` many to one; `false` one to many.
 *
 * @return {void}
 */
function doDelEnums(
	theRequest,
	theResponse,
	thePredicate,
	theDirection
){
	//
	// Init local storage.
	//
	const edges = {}
	const remove = []
	const update = []
	const ignore = []
	
	const data = theRequest.body
	const result = {deleted: 0, updated: 0, ignored: 0}
	
	const pred = module.context.configuration.predicate
	const path = module.context.configuration.sectionPath
	const pred_bridge = module.context.configuration.predicateBridge
	const root = `${module.context.configuration.collectionTerm}/${data.root}`
	
	//
	// Iterate child nodes.
	//
	data.items.forEach(child =>
	{
		//
		// Init local identifiers.
		//
		const src = (theDirection)
			? `${module.context.configuration.collectionTerm}/${child}`
			: `${module.context.configuration.collectionTerm}/${data.parent}`
		const dst = (theDirection)
			? `${module.context.configuration.collectionTerm}/${data.parent}`
			: `${module.context.configuration.collectionTerm}/${child}`
		
		///
		// Get all edges between the parent and the current child and
		// all edges stemming from child to the leaf nodes having the
		// requested root.
		///
		const items = K.db._query( aql`
			WITH ${collection_term}
			
			LET branch = FLATTEN(
			  FOR vertex, edge, path IN 0..100
			    INBOUND ${dst}
			    ${collection_edge}
			    
			    PRUNE edge._from == ${src} AND
			          edge.${pred} IN [ ${thePredicate}, ${pred_bridge} ] AND
			          ${root} IN edge.${path}
			
			    OPTIONS {
			      "order": "bfs",
			      "uniqueVertices": "path"
			    }
			
			    FILTER edge._from == ${src} AND
			           edge.${pred} IN [ ${thePredicate}, ${pred_bridge} ] AND
			           ${root} IN edge.${path}
			
			  RETURN path.edges[*]._key
			)
			
			LET leaves = FLATTEN(
			  FOR vertex, edge, path IN 0..100
			      INBOUND ${src}
			      ${collection_edge}
			      
			      PRUNE ${root} NOT IN edge.${path}
			  
			      OPTIONS {
			        "order": "dfs",
			        "uniqueVertices": "path"
			      }
			  
			      FILTER ${root} IN edge.${path}
			      
			  RETURN path.edges[*]._key
			)
			
			FOR key IN UNIQUE( APPEND( branch, leaves ) )
			  FOR edge in edges
			    FILTER edge._key == key
			  RETURN edge
	    `).toArray()
		
		///
		// Add edges to edge set.
		///
		items.forEach( (item) => {
			edges[item._key] = item
		})
	})
	
	///
	// Iterate found edges.
	// For each edge:
	// if the root is not in the path, discard element;
	// if the root is in the path remove it from the path and
	// if the path becomes empty,  add to delete elements,
	// if the path does not become empty, add to update elements.
	///
	// Iterate edges.
	Object.values(edges).forEach( (edge) => {
		// Check if edge path contains root.
		if(edge[path].includes(root)) {
			// Remove root from edge path.
			const elements = edge[path].filter(x => x !== root)
			// Other paths are left.
			if(elements.length > 0) {
				// Add updated edge.
				result.updated += 1
				update.push({
					_key: edge._key,
					[path]: elements
				})
			}
			// No paths are left.
			else {
				// Add deleted edge.
				result.deleted += 1
				remove.push(edge._key)
			}
		} else {
			result.ignored += 1
			ignore.push(edge)
		}
	})
	
	///
	// Persist edges.
	///
	if(theRequest.queryParams.save)
	{
		//
		// Perform updates.
		//
		K.db._query( aql`
			FOR item in ${update}
			UPDATE item IN ${collection_edge}
			OPTIONS { keepNull: false, mergeObjects: false }
		`)
		
		//
		// Perform removals.
		//
		K.db._query( aql`
	        FOR item in ${remove}
	        REMOVE item IN ${collection_edge}
	    `)
		
		theResponse.send(result)
		return                                                          // ==>
	}
	
	///
	// Show information.
	///
	theResponse.send({
		stats: result,
		deleted: remove.map( (item) => {
			return edges[item]
		}),
		updated: update.map( (item) => {
			return {
				...edges[item._key],
				[path]: item[path]
			}
		}),
		ignored: ignore
	})
	
} // doDelEnums()

/**
 * Adds links based on the provided parameters.
 *
 * @param theRequest {Object}: The request object.
 * @param theResponse {Object}: The response object.
 * @param thePredicate {String}: The predicate for the links.
 * @param theDirection {Boolean}: `true` many to one; `false` one to many.
 * @param allLinksDescriptors {Boolean}: Assert all links are descriptors.
 *
 * @return {void}
 */
function doAddLinks(
	theRequest,
	theResponse,
	thePredicate,
	theDirection,
	allLinksDescriptors = false
){
	//
	// Init local storage.
	//
	const data = theRequest.body
	const terms = []
	
	//
	// Check for missing terms.
	//
	const missing = getLinksMissingKeys(data, terms)
	if(missing.length > 0) {
		
		const message =
			K.error.kMSG_ERROR_MISSING_TERM_REFS.message[module.context.configuration.language]
				.replace('@@@', missing.join(", "))
		
		theResponse.throw(400, message)
		return                                                          // ==>
	}
	
	//
	// Ensure all terms are descriptors.
	//
	if(allLinksDescriptors) {
		
		const found = getNotDescriptorKeys(terms)
		if(found.length > 0) {
			const message =
				K.error.kMSG_NOT_DESCRIPTORS.message[module.context.configuration.language]
					.replace('@@@', found.join(", "))
			
			theResponse.throw(400, message)
			return                                                      // ==>
		}
	}
	
	//
	// Create list of expected edges.
	//
	const edges = []
	const result = {inserted: 0, existing: 0}
	data.items.forEach(item =>
	{
		//
		// Init local identifiers.
		//
		const src = (theDirection)
			? `${module.context.configuration.collectionTerm}/${item}`
			: `${module.context.configuration.collectionTerm}/${data.parent}`
		const dst = (theDirection)
			? `${module.context.configuration.collectionTerm}/${data.parent}`
			: `${module.context.configuration.collectionTerm}/${item}`
		const key = Utils.getEdgeKey(src, thePredicate, dst)
		
		//
		// Check if it does not exist.
		//
		if(collection_link.exists(key) === false)
		{
			//
			// Add edge to list.
			//
			result.inserted += 1
			edges.push({
				_key: key,
				_from: src,
				_to: dst,
				_predicate: thePredicate
			})
			
		} else {
			result.existing += 1
		}
	})
	
	//
	// Perform query.
	//
	K.db._query( aql`
        FOR item in ${edges}
            INSERT item
            INTO ${collection_link}
            OPTIONS { overwriteMode: "update", keepNull: false, mergeObjects: false }
    `)
	
	theResponse.send(result)
	
} // doAddDescriptorLinks()

/**
 * Removes links based on the provided parameters.
 *
 * @param theRequest {Object}: The request object.
 * @param theResponse {Object}: The response object.
 * @param thePredicate {String}: The predicate for the links.
 * @param theDirection {Boolean}: `true` many to one; `false` one to many.
 *
 * @return {void}
 */
function doDelLinks(
	theRequest,
	theResponse,
	thePredicate,
	theDirection
){
	//
	// Init local storage.
	//
	const remove = {}
	const data = theRequest.body
	const result = {deleted: 0, ignored: 0}
	
	//
	// Iterate child nodes.
	//
	data.items.forEach(child =>
	{
		//
		// Init local identifiers.
		//
		const pred = module.context.configuration.predicate
		const src = (theDirection)
			? `${module.context.configuration.collectionTerm}/${child}`
			: `${module.context.configuration.collectionTerm}/${data.parent}`
		const dst = (theDirection)
			? `${module.context.configuration.collectionTerm}/${data.parent}`
			: `${module.context.configuration.collectionTerm}/${child}`
		const key = Utils.getEdgeKey(src, thePredicate, dst)
		
		///
		// Collect edge key.
		///
		if(collection_link.exists(key) === false) {
			result.ignored += 1
		} else {
			result.deleted += 1
			remove[key] = key
		}
	})
	
	//
	// Perform removals.
	//
	K.db._query( aql`
        FOR item in ${Object.values(remove)}
        REMOVE item IN ${collection_link}
    `)
	
	theResponse.send(result)
	
} // doDelLinks()


//
// Utils.
//

/**
 * Assert edgem request keys exist.
 * This function will return the list of keys that are missing from terms collection.
 * @param theData {Object}: Object containing `root`, `parent` and `items` term keys.
 * @return {Array<String>}: List of missing keys
 */
function getEdgeMissingKeys(theData)
{
	//
	// Ensure items are a set.
	//
	theData.items = [... new Set(theData.items)]
	
	//
	// Collect keys.
	//
	const terms = Array.from(new Set(theData.items.concat([theData.root, theData.parent])))
	
	//
	// Assert all terms exist.
	//
	const found =
		K.db._query( aql`
            LET terms = DOCUMENT(${collection_term}, ${terms})
            FOR term IN terms
            RETURN term._key
        `).toArray()
	
	return terms.filter(x => !found.includes(x))                        // ==>
	
} // getEdgeMissingKeys()

/**
 * Assert links request keys exist.
 * This function will return the list of keys that are missing from terms collection.
 * @param theData {Object}: Object containing subject and object terms.
 * @param terms {String[]}: Receives list of term global identifiers.
 *
 * @return {String[]}: List of missing keys
 */
function getLinksMissingKeys(theData, terms)
{
	//
	// Ensure items are a set.
	//
	theData.items = [... new Set(theData.items)]
	
	//
	// Collect keys.
	//
	terms = [theData.parent].concat(theData.items)
	
	//
	// Assert all terms exist.
	//
	const found =
		K.db._query( aql`
            LET terms = DOCUMENT(${collection_term}, ${terms})
            FOR term IN terms
            RETURN term._key
        `).toArray()
	
	return terms.filter(x => !found.includes(x))                // ==>
	
} // getLinksMissingKeys()

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
            FOR edge IN ${collection_edge}
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
			FOR term IN ${K.db._collection(module.context.configuration.collectionTerm)}
			    FILTER term._key IN ${theKeys}
			    FILTER NOT HAS(term, ${module.context.configuration.sectionData})
			RETURN term._key
        `).toArray()

	return result                                                               // ==>

} // getNotDescriptorKeys()
