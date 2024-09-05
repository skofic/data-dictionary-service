'use strict'

//
// Imports.
//
const _ = require('lodash')
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
const PredicatesModel = joi.string()
	.valid(
		'_predicate_enum-of',
		'_predicate_field-of',
		'_predicate_property-of'
	).required()
	.default("_predicate_enum-of")
	.description(
		"This parameter represents the list of available predicates for edge \
		creation. Edges are documents representing relationships that share \
		several paths. These predicates represent concrete node instances and \
		not connection predicates such as sections and bridges.\n\
		- `_predicate_enum-of`: Valid enumeration element.\n\
		- `_predicate_field-of`: Valid field element.\n\
		- `_predicate_property-of`: Valid property element."
	)
const SaveModel = joi.boolean()
	.default(true)
	.description(
		"If *set*, the edges will be created, updated or deleted; \
		if *not set*, the service will only return information on \
		potential operations."
	)
const InsertedEdgesModel = joi.boolean()
	.default(false)
	.description(
		"If *set*, the the service will return the list of inserted edges, \
		if not set, the service will only return operation statistics."
	)
const DeletedEdgesModel = joi.boolean()
	.default(false)
	.description(
		"If *set*, the the service will return the list of deleted edges, \
		if not set, the service will only return operation statistics."
	)
const UpdatedEdgesModel = joi.boolean()
	.default(false)
	.description(
		"If *set*, the the service will return the list of updated edges, \
		if not set, the service will only return operation statistics."
	)
const ExistingEdgesModel = joi.boolean()
	.default(false)
	.description(
		"If *set*, the the service will return the list of existing edges, \
		if not set, the service will only return operation statistics."
	)
const IgnoredEdgesModel = joi.boolean()
	.default(false)
	.description(
		"If *set*, the the service will return the list of ignored edges, \
		if not set, the service will only return operation statistics."
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
	'set/edges',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doSetEdges(
				request,
				response,
				true
			)
		}
	},
	'graph-set-edges'
)
	.summary('Set edge')
	.description(dd
		`
            **Set edges**
             
            ***In order to use this service, the current user must have the \`dict\` role.***
            
            Graph node connections are implemented by edges, these are uniquely identified \
            by the subject-predicate-object combination. These edges may be traversed by \
            several paths, each originating from different root nodes in the graph. The \
            edge also features a property that contains custom data that can be used during \
            graph traversals.
            
            This service can be used to create relationships between a parent and its \
            children, the relationships may be many-to-one, or one-to-many. The service \
            can also be used to update the contents of custom data associated with an edge. \
            The service expects the graph *root* document handle, the document handle \
            of the *parent* node and the list of document handles representing the *child \
            nodes*, along with custom data associated with the subject-predicate-object \
            combination.
            
            The service will do the following:
            
            - Assert that the parent node is connected to the root node.
            - If the subject-predicate-object combination does not exist, it will create \
              an edge with the combination of the provided parent, the current child and \
              the predicate, which is managed by the service, for the provided root. If \
              custom data was provided, it will be set, or an empty object will be set.
            - If the subject-predicate-object combination exists:
              - If the root is not among the paths it will be added, and the eventual \
                custom data will replace or reset existing data.
              - If the root is in the list of paths, the service will only set or replace \
                existing data.
        `
	)
	.queryParam('predicates', PredicatesModel)
	.queryParam('save', SaveModel)
	.queryParam('inserted', InsertedEdgesModel)
	.queryParam('updated', UpdatedEdgesModel)
	.queryParam('existing', ExistingEdgesModel)
	.body(Models.SetDelEnums, dd`
**Root, parent, children and data**

The request body should be provided with an object containing the following elements:

- \`root\`: The document handle of the *root graph node*. This represents the path \
traversing the edge to which the relationship belongs.
- \`parent\`: The document handle of the node that represents the *parent* to which \
the provided list of child nodes point to, or that points to the children.
- \`children\`: A key/value dictionary in which the key represents the *child node \
document handle* and the value represents *custom data* associated with the corresponding *edge*.

The values of the \`children\` dictionary can be the following:

- \`object\`: This represents valid data for the edge, the provided object will be merged \
with the existing one. If you set a provided property value to \`null\`, if the property \
exists in the edge data, the service will delete that property from the existing data. \
If you want to ignore the value, pass an empty object.
- \`null\`: If you provide this value the whole custom data container will be reset to \
an empty object.

If the edge does not exist, the provided data will be set in the edge, except for the \
properties that have a *null* value. If the edge exists, the parameters of the provided \
data will replace eventual existing matching parameters, or will be erased, if the value \
is *null*.
	`)
	.response(200, Models.SetEnumsResponse, dd
		`
            **Operation status**
            
            The service will return an object containing the following properties:
            
            - \`stats\`:
              - \`inserted\`: The number of inserted edges.
              - \`updated\`: The number of updated edges.
              - \`existing\`: The number of ignored existing edges.
            - \`inserted\`: The list of inserted edges, if the \`inserted\` \
                            parameter was set.
            - \`updated\`: The list of updated edger, if the \`updated\` \ \
                           parameter was set.
            - \`existing\`: The list of existing edges, if the \`existing\` \
                            parameter was set.
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
 * Update enumeration data.
 */
router.post(
	'upd/enum',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doUpdEnums(
				request,
				response,
				module.context.configuration.predicateEnumeration,
				true
			)
		}
	},
	'graph-upd-enum'
)
	.summary('Update enumeration data')
	.description(dd
		`
            **Update enumeration data**
            
            ***In order to use this service, the current user must have the \`dict\` role.***
            
            Enumerations are controlled vocabularies structured as many-to-one graphs. \
            These graphs have a nested tree structure in which a parent node is pointed \
            to by its children.
            
            Graph node connections are implemented by edges, these are uniquely identified \
            by the subject-predicate-object combination in which the subject is the child, \
            and the object is the parent. These edges may be traversed by several paths, \
            each originating from different root nodes in the graph. The edge also features \
            a property that contains custom data that can be used during graph traversals.
            
            This service can be used to update the custom data in the edges. The service \
            expects the graph *root* document handle, the document handle of the *parent* \
            node and the list of document handles representing the *child nodes* pointing \
            to the parent node, along with custom data associated with the \
            subject-predicate-object combination. This service will make no changes to the \
            graph structure, but it can be used to either reset or update the edge path data.
            
            If you provide \`false\` as the edge path data, the edges data will be reset \
            to an empty object. If you provide an object, the existing edge data object and \
            the provided object will be *merged*. This means that if you want to replace \
            the value, you will need to use the *Set enumerations* service.
        `
	)
	.queryParam('save', SaveModel)
	.queryParam('updated', UpdatedEdgesModel)
	.queryParam('ignored', ExistingEdgesModel)
	.body(Models.UpdEnums, dd
		`
        **Root, parent, children and data**
        
        The request body should be provided with an object containing the following \
        elements:
        
        - \`root\`: The document handle of the *root graph node*, which is the last \
                    target in the graph. This represents the path traversing the edge.
        - \`parent\`: The document handle of the node that represents the *parent* \
                      to which the provided list of child nodes point to.
        - \`children\`: A key/value dictionary in which the key represents the \
                        *child node document handle* and the value represents \
                        *custom data* associated with the corresponding *edge*.
        
        The values of the \`children\` elements can be the following:
        
        - \`object\`: This represents valid data for the edge, the value will \
					  be merged with the existing data.
        - \`null\`: This value indicates that data will should be ignored, in \
                    that case the service will do nothing.
        `
	)
	.response(200, Models.UpdEnumsResponse, dd
		`
            **Operation status**
            
            The service will return an object containing the following properties:
            
            - \`stats\`:
              - \`updated\`: The number of updated edges.
              - \`ignored\`: The number of ignored edges.
            - \`updated\`: The list of updated edger, if the \`updated\` \
                           parameter was set.
            - \`ignored\`: The list of ignored edges, if the \`ignored\` \
                           parameter was set.
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
            
            Enumerations are controlled vocabularies structured as many-to-one graphs. \
            These graphs have a nested tree structure in which a parent node is pointed \
            to by its children.
            
            Graph node connections are implemented by edges, these are uniquely identified \
            by the subject-predicate-object combination in which the subject is the child, \
            and the object is the parent. These edges may be traversed by several paths, \
            each originating from different root nodes in the graph. The edge also features \
            a property that contains custom data that can be used during graph traversals.

            This service can be used to remove a child from its parent in a specific \
            graph path, and to ignore, replace or reset the contents of custom data \
            associated with an edge.
            
            The service expects the graph *root* document handle, the document handle \
            of the *parent* node and the list of document handles representing the *child \
            nodes* pointing to the parent node, along with custom data associated with \
            the subject-predicate-object combination.
            
            The service will do the following:
            
            - Locate the edge containing the current child pointing to the parent.
            - Remove the current root from the list of roots in the edge path:
              - If the path becomes empty:
                - Delete the edge.
                - Recurse the operation for all branches under the child node.
              - If the path is not empty:
                - Ignore, reset or set the edge data.
                - Update the edge.
            
            *Note: this service will only remove the relationships, the nodes will not \
            be deleted. It is the responsability of the caller to manage orphans. \
            Eventual root bridge predicates might be left dangling: this is \
            intended, since one could connect these dangling relationships after \
            the deletions. Finally, edges that do not feature the provided root will \
            be ignored, meaning that custom edge data will be left untouched: this is \
            intended, since custom edge data is implicitly connected to the graph root.*
        `
	)
	.queryParam('save', SaveModel)
	.queryParam('deleted', InsertedEdgesModel)
	.queryParam('updated', UpdatedEdgesModel)
	.queryParam('ignored', IgnoredEdgesModel)
	.body(Models.SetDelEnums, dd
		`
        **Root, parent, children and data**
        
        The request body should be provided with an object containing the following \
        elements:
        
        - \`root\`: The document handle of the *root graph node*, which is the last \
                    target in the graph. This represents the path traversing the edge.
        - \`parent\`: The document handle of the node that represents the *parent* \
                      to which the provided list of child nodes point to.
        - \`children\`: A key/value dictionary in which the key represents the \
                        *child node document handle* and the value represents \
                        *custom data* associated with the corresponding *edge*.
        
        The values of the \`children\` elements can be the following:
        
        - \`object\`: This represents valid data for the edge, the value will \
					  replace existing data or be set in new edges. Note that \
					  the object will *not be merged* with existing objects, \
					  use the update service for that.
        - \`null\`: This value indicates that data will be ignored, which means \
					that only the container will be created in new edges and existing \
					edges will have their data untouched.
        - \`false\`: This value indicates that we want to reset custom data, so in \
                     all cases the container will be reset to an empty object.
        `
	)
	.response(200, Models.DelEnumsResponse, dd
		`
            **Operation status**
            
            The service will return an object containing the following properties:
            
            - \`stats\`:
              - \`deleted\`: The number of deleted edges.
              - \`updated\`: The number of updated edges.
              - \`ignored\`: The number of ignored edges.
            - \`deleted\`: The list of inserted edges, if the \`deleted\` \
                           parameter was set.
            - \`updated\`: The list of updated edger, if the \`updated\` \ \
                           parameter was set.
            - \`ignored\`: The list of existing edges, if the \`ignored\` \
                           parameter was set.
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
	'set/field',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doSetEdges(
				request,
				response,
				module.context.configuration.predicateField,
				true
			)
		}
	},
	'graph-set-field'
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
	.response(200, Models.SetEnumsResponse, dd
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
	.response(200, Models.DelEnumsResponse, dd
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
			doSetEdges(
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
	.response(200, Models.SetEnumsResponse, dd
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
	.response(200, Models.DelEnumsResponse, dd
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
			doSetEdges(
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
	.response(200, Models.SetEnumsResponse, dd
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
	.response(200, Models.SetEnumsResponse, dd
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
	.response(200, Models.SetEnumsResponse, dd
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
 * Set enumerations and their edge data.
 *
 * This function will create new edges or update existing edges to
 * connect a parent node to a set of child nodes in a specific graph.
 *
 * The request body must contain the following elements:
 * - `root`: The document handle of the graph root or type.
 * - `parent`: The document handle of the node to which child nodes will point.
 * - `children`: A key/value dictionary in which the keys are the document
 *               handles of the nodes pointing to the parent, and the values are
 *               the corresponding custom edge data associated to the relationship.
 *
 * Edge custom data can be an object, in which case it will be merged with the
 * existing data. To delete object properties, provide the property with a
 * `null` value.
 *
 * theDirection is used to determine the direction of relationships: `true` will
 * have children pointing to the parent, while `false` will have the parent point
 * to the children.
 *
 * The function will assert that all document handles are valid, and that the
 * parent node is connected to the root node in the graph.
 *
 * Although you will find "updates" variables and descriptions, any update will
 * be actually a "replace" in the database, this means that the "found" variable
 * will be set to the actual updated contents of the object.
 *
 * The function assumes the nodes collection to be terms.
 *
 * @param theRequest {Object}: The request object.
 * @param theResponse {Object}: The response object.
 * @param theDirection {Boolean}: `true` many to one; `false` one to many.
 *
 * @return {void}
 */
function doSetEdges(
	theRequest,
	theResponse,
	theDirection = true
){
	//
	// Init local storage.
	//
	const body = theRequest.body
	const predicate = theRequest.queryParams.predicates
	
	//
	// Check for missing document handles.
	//
	const missing = getOrphanHandles(body)
	if(missing.length > 0) {
		
		const message =
			K.error.kMSG_ERROR_MISSING_DOC_HANDLES.message[module.context.configuration.language]
				.replace('@@@', missing.join(", "))
		
		theResponse.throw(400, message)
		return                                                          // ==>
	}
	
	///
	// Init local storage.
	///
	const pred = module.context.configuration.predicate
	const bridge = module.context.configuration.predicateBridge
	const section = module.context.configuration.predicateSection
	const path = module.context.configuration.sectionPath
	const data = module.context.configuration.sectionPathData
	
	///
	// Two ways to do it:
	// - Find parent in _from and predicate enum or bridge and check if root is there.
	// - Traverse graph from parent to root with predicate enum or bridge.
	///
	const found = (theDirection)
		? K.db._query(aql`
					WITH ${collection_term}
					FOR vertex, edge, path IN 1..10
						OUTBOUND ${body.parent}
						${collection_edge}

						PRUNE edge._to == ${body.root} AND
						      edge.${pred} IN [ ${predicate}, ${section}, ${bridge} ]

					RETURN edge._key
				`).toArray()
		: K.db._query(aql`
					WITH ${collection_term}
					FOR vertex, edge, path IN 1..10
						INBOUND ${body.parent}
						${collection_edge}

						PRUNE edge._to == ${body.root} AND
						      edge.${pred} IN [ ${predicate}, ${section}, ${bridge} ]

					RETURN edge._key
				`).toArray()
	if(found.length === 0)
	{
		const message = dd`
			Cannot create edges: the parent node, [${body.parent}], is not \
			connected to the graph root [${body.root}].
		`
		theResponse.status(400)
		theResponse.send(message)
		
		return                                                          // ==>
	}
	
	//
	// Create list of operations.
	//
	const inserts = []
	const updates = []
	
	//
	// Create list of expected edges.
	//
	let inserted = []
	let updated = []
	let existing = []
	const result = { inserted: 0, updated: 0, existing: 0 }
	Object.entries(body.children).forEach( ([item, payload]) =>
	{
		//
		// Init local identifiers.
		//
		const src = (theDirection) ? item : body.parent
		const dst = (theDirection) ? body.parent : item
		
		///
		// Init local storage.
		///
		const edge = {}
		const key = Utils.getEdgeKey(src, predicate, dst)
		
		//
		// Check if it exists.
		//
		try
		{
			///
			// Get edge.
			///
			let modified = false
			const found = collection_edge.document(key)
			
			///
			// Add root to edge paths.
			///
			if(!found[path].includes(body.root)) {
				modified = true
				found[path] = found[path].concat([body.root])
			}
			
			///
			// Reset custom data.
			///
			if(payload === null) {
				if(!Utils.isEmptyObject(found[data])) {
					modified = true
					found[data] = {}
				}
			} else {
				if(!Utils.recursiveMergeObjects(payload, found[data])) {
					modified = true
				}
			}
			
			///
			// Handle updates.
			///
			if(modified) {
				result.updated += 1
				if(theRequest.queryParams.save) {
					updates.push(found)
				} else {
					if(theRequest.queryParams.updated) {
						updated.push(found)
					}
				}
			} else {
				result.existing += 1
				if(theRequest.queryParams.existing) {
					existing.push(found)
				}
			}
			
		} // Edge found.
			
		///
		// Edge not found or error.
		///
		catch (error)
		{
			//
			// Handle unexpected errors.
			//
			if((!error.isArangoError) || (error.errorNum !== ARANGO_NOT_FOUND)) {
				theResponse.throw(500, error.message)
				return                                                  // ==>
			}
			
			///
			// Create edge.
			///
			edge._key = key
			edge._from = src
			edge._to = dst
			edge[pred] = predicate
			edge[path] = [ body.root ]
			edge[data] = {}
			Utils.recursiveMergeObjects(payload, edge[data])
			
			//
			// Insert edge.
			//
			result.inserted += 1
			if(theRequest.queryParams.save) {
				inserts.push(edge)
			} else {
				if(theRequest.queryParams.inserted) {
					inserted.push(edge)
				}
			}
		}
	})
	
	///
	// Insert edges.
	///
	if(theRequest.queryParams.save)
	{
		//
		// Insert new edges.
		//
		inserted = K.db._query( aql`
			FOR item in ${inserts}
			    INSERT item
			    INTO ${collection_edge}
			    OPTIONS { keepNull: false, overwriteMode: "conflict" }
			RETURN NEW
		`).toArray()
		
		//
		// Update existing edges.
		//
		updated = K.db._query( aql`
			FOR item in ${updates}
			    REPLACE item
			    IN ${collection_edge}
			    OPTIONS { keepNull: false }
			RETURN NEW
		`).toArray()
	}
	
	///
	// Build response.
	///
	const message = { stats: result }
	if(theRequest.queryParams.inserted) {
		message['inserted'] = inserted
	}
	if(theRequest.queryParams.updated) {
		message['updated'] = updated
	}
	if(theRequest.queryParams.existing) {
		message['existing'] = existing
	}
	
	//
	// Return information.
	//
	theResponse.send(message)
	
} // doSetEdges()

/**
 * Update enumerations edge data.
 *
 * This function will reset or update enumerations edge path data.
 *
 * The request body must contain the following elements:
 * - `root`: The document handle of the graph root or type.
 * - `parent`: The document handle of the node to which child nodes will point.
 * - `children`: A key/value dictionary in which the keys are the document
 *               handles of the nodes pointing to the parent, and the values are
 *               the corresponding custom edge data associated to the relationship.
 *
 * Edge custom data can be an object, in which case it will be merged with the
 * eventual existing data, or `false` to reset the custom data to its default
 * value, which is an empty object, or `null` to ignore edge data.
 *
 * theDirection is used to determine the direction of relationships: `true` will
 * have children pointing to the parent, while `false` will have the parent point
 * to the children.
 *
 * The function will assert that all document handles are valid, and that the
 * parent node is connected to the root node in the graph.
 *
 * @param theRequest {Object}: The request object.
 * @param theResponse {Object}: The response object.
 * @param thePredicate {String}: The predicate global identifier.
 * @param theDirection {Boolean}: `true` many to one; `false` one to many.
 *
 * @return {void}
 */
function doUpdEnums(
	theRequest,
	theResponse,
	thePredicate,
	theDirection = true
){
	//
	// Init local storage.
	//
	const body = theRequest.body
	
	//
	// Check for missing document handles.
	//
	const missing = getOrphanHandles(body)
	if(missing.length > 0) {
		
		const message =
			K.error.kMSG_ERROR_MISSING_DOC_HANDLES.message[module.context.configuration.language]
				.replace('@@@', missing.join(", "))
		
		theResponse.throw(400, message)
		return                                                          // ==>
	}
	
	///
	// Init local storage.
	///
	const pred = module.context.configuration.predicate
	const bridge = module.context.configuration.predicateBridge
	const path = module.context.configuration.sectionPath
	const data = module.context.configuration.sectionPathData
	
	///
	// Two ways to do it:
	// - Find parent in _from and predicate enum or bridge and check if root is there.
	// - Traverse graph from parent to root with predicate enum or bridge.
	///
	const found = (theDirection)
		? K.db._query(aql`
					WITH ${collection_term}
					FOR vertex, edge, path IN 1..10
						OUTBOUND ${body.parent}
						${collection_edge}

						PRUNE edge._to == ${body.root} AND
						      edge.${pred} IN [ ${thePredicate}, ${bridge} ]

					RETURN edge._key
				`).toArray()
		: K.db._query(aql`
					WITH ${collection_term}
					FOR vertex, edge, path IN 1..10
						INBOUND ${body.parent}
						${collection_edge}

						PRUNE edge._to == ${body.root} AND
						      edge.${pred} IN [ ${thePredicate}, ${bridge} ]

					RETURN edge._key
				`).toArray()
	if(found.length === 0)
	{
		const message = dd`
			Cannot create edges: the parent node, [${body.parent}], is not \
			connected to the graph root [${body.root}].
		`
		theResponse.status(400)
		theResponse.send(message)
		
		return                                                          // ==>
	}
	
	//
	// Create list of operations.
	//
	const updates = []
	
	//
	// Create list of expected edges.
	//
	const ignored = []
	const updated = []
	const result = { updated: 0, existing: 0 }
	Object.entries(body.children).forEach( ([item, payload]) =>
	{
		//
		// Init local identifiers.
		//
		const src = (theDirection) ? item : body.parent
		const dst = (theDirection) ? body.parent : item
		
		///
		// Init local storage.
		///
		const edge = {}
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
			// Edge has root.
			///
			if(found[path].includes(body.root)) {
				if(payload !== null)
				{
					edge._key = key
					edge[data] = payload
					updates.push(edge)
					
					result.updated += 1
					if(theRequest.queryParams.updated) {
						updated.push(edge)
					}
				}
			}
			
			///
			// If edge was not set we ignore it.
			///
			if(Object.keys(edge).length === 0) {
				result.ignored += 1
				if(theRequest.queryParams.ignored) {
					ignored.push(found)
				}
			}
			
		} // Edge found.
			
		///
		// Edge not found or error.
		///
		catch (error)
		{
			//
			// Handle unexpected errors.
			//
			if((!error.isArangoError) || (error.errorNum !== ARANGO_NOT_FOUND)) {
				theResponse.throw(500, error.message)
				return                                                  // ==>
			}
			
			///
			// Create edge.
			///
			edge._key = key
			edge._from = src
			edge._to = dst
			edge[pred] = thePredicate
			
			//
			// Insert edge.
			//
			ignored.push(edge)
			result.ignored += 1
			if(theRequest.queryParams.ignored) {
				ignored.push(edge)
			}
		}
	})
	
	///
	// Insert edges.
	///
	if(theRequest.queryParams.save)
	{
		//
		// Update edges.
		//
		K.db._query( aql`
			FOR item in ${updated}
			    UPDATE item
			    IN ${collection_edge}
			    OPTIONS { keepNull: false, mergeObjects: true }
		`)
	}
	
	///
	// Build response.
	///
	const message = { stats: result }
	if(theRequest.queryParams.updated) {
		message['updated'] = updated
	}
	if(theRequest.queryParams.ignored) {
		message['ignored'] = ignored
	}
	
	//
	// Return information.
	//
	theResponse.send(message)
	
} // doUpdEnums()

/**
 * Delete enumerations and their edge data.
 *
 * This function will delete or update edges in order to remove the relationship
 * between a parent node and its child nodes for a specific graph.
 *
 * The request body must contain the following elements:
 * - `root`: The document handle of the graph root or type.
 * - `parent`: The document handle of the node to which child nodes point.
 * - `children`: A key/value dictionary in which the keys are the document
 *               handles of the nodes pointing to the parent, and the values are
 *               the corresponding custom edge data associated to the relationship.
 *
 * The function will first remove the relationships between the parent and its
 * children: if no other root paths pass through the edge, this will be deleted;
 * if there are root paths left, the function will ignore, replace or reset
 * custom edge data after removing the current root from the current edge.
 *
 * Edge custom data can be an object, in which case it will replace eventual existing
 * data, or `false` to reset the custom data to its default value, which is an empty
 * object, or `null` to ignore edge data.
 *
 * theDirection is used to determine the direction of relationships: `true` will
 * have children pointing to the parent, while `false` will have the parent point
 * to the children.
 *
 * The function will assert that all document handles are valid, and that the
 * parent node is connected to the root node in the graph.
 *
 * Note: if the parent-child edge does not feature the root, it will be ignored.
 *
 * @param theRequest {Object}: The request object.
 * @param theResponse {Object}: The response object.
 * @param thePredicate {String}: The predicate global identifier.
 * @param theDirection {Boolean}: `true` many to one; `false` one to many.
 *
 * @return {void}
 */
function doDelEnums(
	theRequest,
	theResponse,
	thePredicate,
	theDirection = true
){
	//
	// Init local storage.
	//
	const body = theRequest.body
	
	//
	// Check for missing document handles.
	//
	const missing = getOrphanHandles(body)
	if(missing.length > 0) {
		
		const message =
			K.error.kMSG_ERROR_MISSING_DOC_HANDLES.message[module.context.configuration.language]
				.replace('@@@', missing.join(", "))
		
		theResponse.throw(400, message)
		return                                                          // ==>
	}
	
	///
	// Init local storage.
	///
	const pred = module.context.configuration.predicate
	const bridge = module.context.configuration.predicateBridge
	const path = module.context.configuration.sectionPath
	const data = module.context.configuration.sectionPathData
	
	///
	// Two ways to do it:
	// - Find parent in _from and predicate enum or bridge and check if root is there.
	// - Traverse graph from parent to root with predicate enum or bridge.
	///
	const found = (theDirection)
		? K.db._query(aql`
					WITH ${collection_term}
					FOR vertex, edge, path IN 1..10
						OUTBOUND ${body.parent}
						${collection_edge}

						PRUNE edge._to == ${body.root} AND
						      edge.${pred} IN [ ${thePredicate}, ${bridge} ]

					RETURN edge._key
				`).toArray()
		: K.db._query(aql`
					WITH ${collection_term}
					FOR vertex, edge, path IN 1..10
						INBOUND ${body.parent}
						${collection_edge}

						PRUNE edge._to == ${body.root} AND
						      edge.${pred} IN [ ${thePredicate}, ${bridge} ]

					RETURN edge._key
				`).toArray()
	if(found.length === 0)
	{
		const message = dd`
			Cannot delete edges: the parent node, [${body.parent}], is not \
			connected to the graph root [${body.root}].
		`
		theResponse.status(400)
		theResponse.send(message)
		
		return                                                          // ==>
	}
	
	//
	// Create list of operations.
	//
	const deletes = []
	const updates = []
	
	//
	// Create list of expected edges.
	//
	const deleted = []
	const updated = []
	const ignored = []
	const result = { deleted: 0, updated: 0, ignored: 0 }
	Object.entries(body.children).forEach( ([item, payload]) =>
	{
		//
		// Init local identifiers.
		//
		const src = (theDirection) ? item : body.parent
		const dst = (theDirection) ? body.parent : item
		
		///
		// Init local storage.
		///
		const edge = {}
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
			// Edge does not have root.
			// In this case we ignore the edge,
			// since it does not belong to the desired graph.
			///
			if(!found[path].includes(body.root)) {
				result.ignored += 1
				if(theRequest.queryParams.ignored) {
					ignored.push(found)
				}
				return                                              // =>
			}
			
			///
			// Remove root from path.
			// We blindly ise indexOf() because we know the root is there.
			///
			found[path] = found[path].filter(element => element !== body.root)
			
			///
			// Delete edge.
			///
			if(found[path].length === 0)
			{
				deletes.push(found._key)
				result.deleted += 1
				if(theRequest.queryParams.deleted) {
					deleted.push(found)
				}
			}
			
			///
			// Update edge.
			///
			else
			{
				///
				// Init edge to update.
				///
				edge['_key'] = found._key
				edge[path] = found[path]
				
				///
				// Do not ignore path data.
				///
				if(payload !== null)
				{
					///
					// Reset path data.
					///
					if(payload === false)
					{
						///
						// Edge has path data.
						///
						if(!Utils.isEmptyObject(found[data]))
						{
							// Reset path data.
							found[data] = {}
							// Add path data.
							edge[data] = {}
						}
					} else {
						if(!_.isEqual(found[data], payload))
						{
							// Replace path data.
							found[data] = payload
							// Add path data.
							edge[data] = found[data]
						}
					}
				}
				
				///
				// Add update and update stats.
				///
				updates.push(edge)
				result.updated += 1
				if(theRequest.queryParams.updated) {
					updated.push(found)
				}
				
				///
				// Collect and process all edges from child to leaf nodes.
				///
				K.db._query(aql`
					FOR vertex, edge, path IN 0..10
					  INBOUND ${item}
					  ${collection_edge}
					  
					  PRUNE ${body.root} NOT IN edge.${path}
					
					  OPTIONS {
					    "order": "dfs",
					    "uniqueVertices": "path"
					  }
					
					  FILTER ${body.root} IN edge.${path}
					RETURN edge
                `)
					.toArray()
					.forEach( (element) => {
						if(element[path].includes(body.root)) {
							element[path] = element[path].filter(it => it !== body.root)
							if(element[path].length === 0) {
								deletes.push(element._key)
								result.deleted += 1
								if(theRequest.queryParams.deleted) {
									deleted.push(element)
								}
							} else {
								updates.push({
									_key: element._key,
									[path]: element[path]
								})
								result.updated += 1
								if(theRequest.queryParams.updated) {
									updated.push(element)
								}
							}
						}
					})
				
			} // There are elements left in the path.
			
		} // Edge found.
			
		///
		// Edge not found or error.
		///
		catch (error)
		{
			//
			// Handle unexpected errors.
			//
			if((!error.isArangoError) || (error.errorNum !== ARANGO_NOT_FOUND)) {
				theResponse.throw(500, error.message)
				return                                                  // ==>
			}
			
			///
			// Do nothing if edge does not exist.
			///
		}
	})
	
	///
	// Delete edges.
	///
	if(theRequest.queryParams.save)
	{
		//
		// Perform updates.
		//
		K.db._query( aql`
			FOR item in ${updates}
			UPDATE item IN ${collection_edge}
			OPTIONS { keepNull: false, mergeObjects: false }
		`)
		
		//
		// Perform removals.
		//
		K.db._query( aql`
	        FOR item in ${deletes}
	        REMOVE item IN ${collection_edge}
	    `)
	}
	
	///
	// Build response.
	///
	const message = { stats: result }
	if(theRequest.queryParams.deleted) {
		message['deleted'] = deleted
	}
	if(theRequest.queryParams.updated) {
		message['updated'] = updated
	}
	if(theRequest.queryParams.ignored) {
		message['ignored'] = ignored
	}
	
	//
	// Return information.
	//
	theResponse.send(message)
	
} // doDelEnums()

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
function oldDoDelEnums(
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
	
} // oldDoDelEnums()

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
 * Assert edge set, update and delete request handles exist.
 *
 * This function will return the list of orphan document handles.
 *
 * @param theData {Object}: Object containing `root`, `parent` and `children`.
 *
 * @return {Array<String>}: List of orphan handles
 */
function getOrphanHandles(theData)
{
	//
	// Collect keys.
	//
	const handles =
		Array.from(
			new Set(
				Object.keys(theData.children)
					.concat([theData.root, theData.parent])
			)
		)

	//
	// Query all handles.
	//
	const found =
		K.db._query( aql`
            LET documents = DOCUMENT(${handles})
            FOR document IN documents
            RETURN document._id
        `).toArray()
	
	return handles.filter(handle => !found.includes(handle))    // ==>
	
} // getOrphanHandles()

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
