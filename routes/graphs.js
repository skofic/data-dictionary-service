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
const RootModel = joi.string()
	.required()
	.description(
		"This parameter represents the *document handle* of the *graph root node*. \
		The root, along with the functional predicate, identifies the path that \
		traverses the current edge."
	)
const ParentModel = joi.string()
	.required()
	.description(
		"This parameter represents the *document handle* of the *node* that \
		represents the *parent* to which the child nodes point to, or that \
		points to the child nodes."
	)
const PredicateModel = joi.string()
	.required()
	.description(
		"This parameter represents the *functional* predicate of the current edge. \
		A functional predicate determines what function the child node has. \
		Here are a couple of examples:\n\
		- `_predicate_enum-of`: Valid enumeration element.\n\
		- `_predicate_field-of`: Valid field element.\n\
		- `_predicate_property-of`: Valid property element."
	)
const SectionModel = joi.string()
	.required()
	.default("_predicate_section-of")
	.description(
		"This parameter represents the *section* predicate to be used in the \
		current operation. A section predicate does not have any specific function, \
		except that of serving as a common category for a set of children. Here is \
		an example:\n\
		- `_predicate_section-of`: The target node is a section, not a functional element."
	)
const BridgeModel = joi.string().allow(null)
	.required()
	.default("_predicate_bridge-of")
	.description(
		"This parameter represents the *bridge* predicate to be used in the \
		current operation. A bridge predicate is neither a functional nor a section \
		predicate, it allows skipping the connected node and land on the next functional \
		or section node. Here is an example:\n\
		- `_predicate_bridge-of`: The target node will be skipped and ignored."
	)
const PruneModel = joi.boolean()
	.default(true)
	.description(
		"This parameter is used when deleting edges: if *set*, after deleting the \
		edges connecting parent to chindren, all edges from children to leaf nodes \
		will also be deleted, preventing dangling relationships; if *not set*, \
		branches originating from child nodes will be left intact, which can be \
		useful if you want to attach the children to another parent."
	)
const SaveModel = joi.boolean()
	.default(true)
	.description(
		"If *set*, the edges will be created, updated or deleted; \
		if *not set*, the service will only return information on \
		potential operations."
	)
const DirectionModel = joi.boolean()
	.default(true)
	.description(
		"This parameter determines the direction of relationships for the \
		provided predicate: `true` indicates that children point to the parent, \
		`false` indicates that the parent points to the children. By default \
		this parameter assumes many to one relationships, `true`. \
		*Note that the direction should be consistent with all predicates \
		used in the graph."
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
const router = createRouter();
module.exports = router;
router.tag('Graphs');


//
// CREATION SERVICES
//

/**
 * Set edges.
 */
router.post(
	'set/edges',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doSetEdges(request, response)
		}
	},
	'graph-set-edges'
)
	.summary('Set edge')
	.description(dd
		`
            **Set edges**
             
            ***In order to use this service, the current user must have the \`dict\` role.***
            
            Graphs are networks of *nodes* connected to each other by *edges*. An edge is \
            uniquely identified by its *subject-predicate-object* relationship. This means \
            that many paths can traverse the same edge: these paths are identified by the \
            graph root node, and the functional predicate characterising its path.
            
            Predicates are of three types: *functional*, *section* and *bridge*. \
            Functional predicates determine what the current graph represents: \
            a controlled vocabulary, a data structure type, etc. Nodes connected with \
            such predicates are valid choices for that predicate. Section predicates are \
            used to group child nodes under a common category that has no function, other
            than to collect a set of choices. Bridge predicates are used to allow another \
            graph (different root) to share the structure of the current graph. Edges also \
            feature an object property that holds data that can be used during traversals.
            
            This service can be used to create edges with functional predicates. \
            The service expects the graph root node reference, which identifies the graph \
            path, the parent and children node references to be connected, the functional \
            predicate, the list of section predicates expected during traversals, the custom \
            data associated with the edge and a set of flags governing the operation.
            
            The service will do the following:
            
            - Assert that the parent node is connected to the root node.
            - If the subject-predicate-object combination does not exist, it will create \
              an edge with the combination of the provided parent, the provided predicate \
              and the current child, for the provided root. If custom data was provided, \
              it will be set, or an empty object will be set.
            - If the subject-predicate-object combination exists:
              - If the root is not among the paths it will be added, and the eventual \
                custom data will replace or reset existing data.
              - If the root is in the list of paths, the service will only handle the \
                edge data.
        `
	)
	.queryParam('root', RootModel)
	.queryParam('parent', ParentModel)
	.queryParam('predicate', PredicateModel)
	.queryParam('direction', DirectionModel)
	.queryParam('save', SaveModel)
	.queryParam('inserted', InsertedEdgesModel)
	.queryParam('updated', UpdatedEdgesModel)
	.queryParam('existing', ExistingEdgesModel)
	.body(Models.SetDelEnums, dd`
        **Children, sections and data**

        The request body should be provided with an object containing the following elements:

        - \`children\`: A key/value dictionary in which the key represents the *child node
          document handle* and the value represents *custom data* associated with the
          corresponding *edge*.
        - \`sections\`: Graphs have predicates that indicate the type of graph: enumeration,
          field, etc. There are other predicates, however, whose goal is to link nodes which
          will not have the function of the main predicate. The provided default values indicate
          sections, that represent display or category nodes used for subdividing child nodes,
          and bridges, which allow one node to connect to another node through a bridge node.
        
        The values of the \`children\` dictionary can be the following:
        
        - \`object\`: This represents valid data for the edge, the provided object will be merged
          with the existing one. If you set a provided property value to \`null\`, if the property
          exists in the edge data, the service will delete that property from the existing data.
          If you want to ignore the value, pass an empty object.
        - \`null\`: If you provide this value the whole custom data container will be reset to
          an empty object.
        
        If the edge does not exist, the provided data will be set in the edge, except for the
        properties that have a *null* value. If the edge exists, the parameters of the provided
        data will replace eventual existing matching parameters, or will be erased, if the value
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
 * Delete edges.
 */
router.post(
	'del/edges',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doDelEdges(request, response)
		}
	},
	'graph-del-edges'
)
	.summary('Delete edges')
	.description(dd
		`
            **Delete edges**
            
            ***In order to use this service, the current user must have the \`dict\` role.***
            
            Graphs are networks of *nodes* connected to each other by *edges*. An edge is \
            uniquely identified by its *subject-predicate-object* relationship. This means \
            that many paths can traverse the same edge: these paths are identified by the \
            graph root node, and the functional predicate characterising its path.
            
            Predicates are of three types: *functional*, *section* and *bridge*. \
            Functional predicates determine what the current graph represents: \
            a controlled vocabulary, a data structure type, etc. Nodes connected with \
            such predicates are valid choices for that predicate. Section predicates are \
            used to group child nodes under a common category that has no function, other
            than to collect a set of choices. Bridge predicates are used to allow another \
            graph (different root) to share the structure of the current graph. Edges also \
            feature an object property that holds data that can be used during traversals.
            
            This service can be used to delete edges with functional predicates. \
            The service expects the graph root node reference, which identifies the graph \
            path, the parent and children node references to be connected, the functional \
            predicate, the list of section predicates expected during traversals, the custom \
            data associated with the edge and a set of flags governing the operation.
            
            The service will do the following:
            
            - Locate the edge containing the current child pointing to the parent.
            - Remove the current root from the list of roots in the edge path:
              - If the path becomes empty:
                - Delete the edge.
                - If the *prune* parameter is set:
                  - Recurse the operation for all branches stemming from the child node.
              - If the path is not empty:
                - Ignore, reset or set the edge data.
                - Update the edge.
            
            *Note: this service will only remove the relationships, the nodes will not \
            be deleted. It is the responsibility of the caller to manage orphans. \
            Eventual root bridge predicates might be left dangling: this is \
            intended, since one could connect these dangling relationships after \
            the deletions. Finally, edges that do not feature the provided root will \
            be ignored, meaning that custom edge data will be left untouched: this is \
            intended, since custom edge data is implicitly connected to the graph root.*
        `
	)
	.queryParam('root', RootModel)
	.queryParam('parent', ParentModel)
	.queryParam('predicate', PredicateModel)
	.queryParam('direction', DirectionModel)
	.queryParam('save', SaveModel)
	.queryParam('prune', PruneModel)
	.queryParam('deleted', DeletedEdgesModel)
	.queryParam('updated', UpdatedEdgesModel)
	.queryParam('existing', ExistingEdgesModel)
	.body(Models.SetDelEnums, dd`
        **Children, sections and data**

        The request body should be provided with an object containing the following elements:

        - \`children\`: A key/value dictionary in which the key represents the *child node
          document handle* and the value represents *custom data* associated with the
          corresponding *edge*.
        - \`sections\`: Graphs have predicates that indicate the type of graph: enumeration,
          field, etc. There are other predicates, however, whose goal is to link nodes which
          will not have the function of the main predicate. The provided default values indicate
          sections, that represent display or category nodes used for subdividing child nodes,
          and bridges, which allow one node to connect to another node through a bridge node.
        
        The values of the \`children\` dictionary can be the following:
        
        - \`object\`: This represents valid data for the edge, the provided object will be merged
          with the existing one. If you set a provided property value to \`null\`, if the property
          exists in the edge data, the service will delete that property from the existing data.
          If you want to ignore the value, pass an empty object.
        - \`null\`: If you provide this value the whole custom data container will be reset to
          an empty object.
        
        If the edge exists, the provided root is removed from the edge path: if there are \
        elements left in the path, the parameters of the provided data will replace eventual \
        existing matching parameters, or will be erased, if the value is *null*.
	`)
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
 * Add sections.
 */
router.post(
	'set/section',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doSetEdges(request, response, request.queryParams.section)
		}
	},
	'graph-set-section'
)
	.summary('Set sections')
	.description(dd
		`
            **Set sections**
            
            ***In order to use this service, the current user must have the \`dict\` role.***
            
            Graphs are networks of *nodes* connected to each other by *edges*. An edge is \
            uniquely identified by its *subject-predicate-object* relationship. This means \
            that many paths can traverse the same edge: these paths are identified by the \
            graph root node, and the functional predicate characterising its path.
            
            Predicates are of three types: *functional*, *section* and *bridge*. \
            Functional predicates determine what the current graph represents: \
            a controlled vocabulary, a data structure type, etc. Nodes connected with \
            such predicates are valid choices for that predicate. Section predicates are \
            used to group child nodes under a common category that has no function, other
            than to collect a set of choices. Bridge predicates are used to allow another \
            graph (different root) to share the structure of the current graph. Edges also \
            feature an object property that holds data that can be used during traversals.
            
            This service can be used to create edges with section predicates. \
            The service expects the graph root node reference, which identifies the graph \
            path, the parent and children node references to be connected, the functional \
            predicate which identifies the functional paths of the graph, the section \
            predicate to be set, the list of section and bridge predicates expected during \
            traversals, the custom data associated with the edge and a set of flags governing \
            the operation.
            
            The service will do the following:
            
            - Assert that the parent node is connected to the root node.
            - If the subject-predicate-object combination does not exist, it will create \
              an edge with the combination of the provided parent, the provided predicate \
              and the current child, for the provided root. If custom data was provided, \
              it will be set, or an empty object will be set.
            - If the subject-predicate-object combination exists:
              - If the root is not among the paths it will be added, and the eventual \
                custom data will replace or reset existing data.
              - If the root is in the list of paths, the service will only handle the \
                edge data.
        `
	)
	.queryParam('root', RootModel)
	.queryParam('parent', ParentModel)
	.queryParam('section', SectionModel)
	.queryParam('predicate', PredicateModel)
	.queryParam('direction', DirectionModel)
	.queryParam('save', SaveModel)
	.queryParam('inserted', InsertedEdgesModel)
	.queryParam('updated', UpdatedEdgesModel)
	.queryParam('existing', ExistingEdgesModel)
	.body(Models.SetDelEnums, dd
		`
            **Children, sections and data**
            
            - \`children\`: A key/value dictionary in which the key represents the *child node \
              document handle*, which represents the section node, and the value represents \
              *custom data* associated with the corresponding *edge*.
            - \`sections\`: Graphs have predicates that indicate the type of graph: enumeration, \
              field, etc. There are other predicates, however, whose goal is to link nodes which \
              will not have the function of the main predicate. The provided default values \
              indicate sections, that represent display or category nodes used for subdividing \
              child nodes, and bridges, which allow one node to connect to another node through \
              a bridge node.
            
              The values of the \`children\` dictionary can be the following:
            
            - \`object\`: This represents valid data for the edge, the provided object will be \
              merged with the existing one. If you set a provided property value to \`null\`, \
              if the property exists in the edge data, the service will delete that property \
              from the existing data. If you want to ignore the value, pass an empty object.
            - \`null\`: If you provide this value the whole custom data container will be reset \
              to an empty object.
            
            The edges that feature other roots in their path will be updated with the provided
            custom value.
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
 * Delete edges.
 */
router.post(
	'del/section',
	(request, response) => {
		const roles = [K.environment.role.dict]
		if(Session.hasPermission(request, response, roles)) {
			doDelEdges(request, response, request.queryParams.section)
		}
	},
	'graph-del-sections'
)
	.summary('Delete sections')
	.description(dd
		`
            **Delete sections**
            
            ***In order to use this service, the current user must have the \`dict\` role.***
            
            Graphs are networks of *nodes* connected to each other by *edges*. An edge is \
            uniquely identified by its *subject-predicate-object* relationship. This means \
            that many paths can traverse the same edge: these paths are identified by the \
            graph root node, and the functional predicate characterising its path.
            
            Predicates are of three types: *functional*, *section* and *bridge*. \
            Functional predicates determine what the current graph represents: \
            a controlled vocabulary, a data structure type, etc. Nodes connected with \
            such predicates are valid choices for that predicate. Section predicates are \
            used to group child nodes under a common category that has no function, other
            than to collect a set of choices. Bridge predicates are used to allow another \
            graph (different root) to share the structure of the current graph. Edges also \
            feature an object property that holds data that can be used during traversals.
            
            This service can be used to delete edges with functional predicates. \
            The service expects the graph root node reference, which identifies the graph \
            path, the parent and children node references to be connected, the functional \
            predicate which identifies the functional paths of the graph, the section \
            predicate to be set, the list of section and bridge predicates expected during \
            traversals, the custom data associated with the edge and a set of flags governing \
            the operation.
            
            The service will do the following:
            
            - Locate the edge containing the current child pointing to the parent with \
              the section predicate.
            - Remove the current root from the list of roots in the edge path:
              - If the path becomes empty:
                - Delete the edge.
                - If the *prune* parameter is set:
                  - Recurse the operation for all branches stemming from the child node. \
                    Note that the predicates used to traverse the graph will be the provided \
                    functional predicate and list of section predicates.
              - If the path is not empty:
                - Ignore, reset or set the edge data.
                - Update the edge.
            
            *Note: this service will only remove the relationships, the nodes will not \
            be deleted. It is the responsibility of the caller to manage orphans. \
            Eventual root bridge predicates might be left dangling: this is \
            intended, since one could connect these dangling relationships after \
            the deletions. Finally, edges that do not feature the provided root will \
            be ignored, meaning that custom edge data will be left untouched: this is \
            intended, since custom edge data is implicitly connected to the graph root.*
        `
	)
	.queryParam('root', RootModel)
	.queryParam('parent', ParentModel)
	.queryParam('section', SectionModel)
	.queryParam('predicate', PredicateModel)
	.queryParam('direction', DirectionModel)
	.queryParam('save', SaveModel)
	.queryParam('prune', PruneModel)
	.queryParam('deleted', DeletedEdgesModel)
	.queryParam('updated', UpdatedEdgesModel)
	.queryParam('existing', ExistingEdgesModel)
	.body(Models.SetDelEnums, dd`
        **Children, sections and data**

        The request body should be provided with an object containing the following elements:

        - \`children\`: A key/value dictionary in which the key represents the *child node
          document handle* and the value represents *custom data* associated with the
          corresponding *edge*.
        - \`sections\`: Graphs have predicates that indicate the type of graph: enumeration,
          field, etc. There are other predicates, however, whose goal is to link nodes which
          will not have the function of the main predicate. The provided default values indicate
          sections, that represent display or category nodes used for subdividing child nodes,
          and bridges, which allow one node to connect to another node through a bridge node.
        
        The values of the \`children\` dictionary can be the following:
        
        - \`object\`: This represents valid data for the edge, the provided object will be merged
          with the existing one. If you set a provided property value to \`null\`, if the property
          exists in the edge data, the service will delete that property from the existing data.
          If you want to ignore the value, pass an empty object.
        - \`null\`: If you provide this value the whole custom data container will be reset to
          an empty object.
        
        If the edge exists, the provided root is removed from the edge path: if there are \
        elements left in the path, the parameters of the provided data will replace eventual \
        existing matching parameters, or will be erased, if the value is *null*.
	`)
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
 * The path query parameters contain the following information:
 * - `root`: The document handle of the graph root or type.
 * - `parent`: The document handle of the node to which child nodes will point.
 * - `predicate`: The predicate associated with the graph.
 * - `direction`: A boolean used to determine the direction of relationships:
 *                `true` will have children pointing to the parent, while
 *                `false` will have the parent point to the children.
 * - `save`: A boolean indicating whether to perform the operation, or only
 *           return the list of expected operations.
 * - `inserted`: Return list of inserted, actual or planned, edge records.
 * - `updated`: Return list of updated, actual or planned, edge records.
 * - `existing`: Return list of existing, actual or planned, edge records.
 *
 * The request body must contain the following elements:
 * - `children`: A key/value dictionary in which the keys are the document
 *               handles of the nodes pointing to the parent, and the values are
 *               the corresponding custom edge data associated to the relationship.
 * - `sections`: A list of predicates representing the sections and bridges that
 *               could be encountered while traversing the graph: this will allow
 *               traversals that span from root to leaves.
 *
 * Edge custom data can be an object, in which case it will be merged with the
 * existing data. To delete object properties, provide the property with a
 * `null` value.
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
 * @param theSection {String|null}: The section predicate.
 *
 * @return {void}
 */
function doSetEdges(theRequest, theResponse, theSection = null)
{
	//
	// Init local storage.
	//
	const body = theRequest.body
	const root = theRequest.queryParams.root
	const parent = theRequest.queryParams.parent
	const direction = theRequest.queryParams.direction
	const predicate = theRequest.queryParams.predicate
	const predicates = (body.sections.includes(predicate))
		? body.sections
		: body.sections.concat(predicate)
	
	//
	// Check for missing document handles.
	//
	const missing = getOrphanHandles(root, parent, body)
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
	const path = module.context.configuration.sectionPath
	const data = module.context.configuration.sectionPathData
	
	///
	// Two ways to do it:
	// - Find parent in _from and predicate enum or bridge and check if root is there.
	// - Traverse graph from parent to root with predicate enum or bridge.
	///
	const bound = (direction) ? aql`OUTBOUND` : aql`INBOUND`
	const found = K.db._query(aql`
        FOR vertex, edge, path IN 1..10
            ${bound} ${parent}
            ${collection_edge}

            PRUNE edge._to == ${root} AND
                  edge.${pred} IN ${predicates}

        RETURN edge._key
    `).toArray()
	if(found.length === 0)
	{
		const message = dd`
			Cannot create edges: the parent node, [${parent}], is not \
			connected to the graph root [${root}].
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
		const src = (direction) ? item : parent
		const dst = (direction) ? parent : item
		
		///
		// Init local storage.
		///
		const edge = {}
		const key =
			Utils.getEdgeKey(
				src,
				(theSection === null) ? predicate : theSection,
				dst
			)
		
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
			if(!found[path].includes(root)) {
				modified = true
				found[path] = found[path].concat([root])
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
			edge[pred] = (theSection === null) ? predicate : theSection
			edge[path] = [ root ]
			edge[data] = {}
			if(payload !== null) {
				Utils.recursiveMergeObjects(payload, edge[data])
			}
			
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
 * Delete enumerations and their edge data.
 *
 * This function will delete or update edges in order to remove the relationship
 * between a parent node and its child nodes for a specific graph.
 *
 * The path query parameters contain the following information:
 * - `root`: The document handle of the graph root or type.
 * - `parent`: The document handle of the node to which child nodes will point.
 * - `section`: The eventual section predicate.
 * - `predicate`: The functional predicate associated with the graph.
 * - `direction`: A boolean used to determine the direction of relationships:
 *                `true` will have children pointing to the parent, while
 *                `false` will have the parent point to the children.
 * - `save`: A boolean indicating whether to perform the operation, or only
 *           return the list of expected operations.
 * - `prune`: A boolean determining whether to prune branches originating from
 *            child nodes, `true`, or leave these branches untouched, `false`.
 * - `deleted`: Return list of deleted, actual or planned, edge records.
 * - `updated`: Return list of updated, actual or planned, edge records.
 * - `existing`: Return list of existing, actual or planned, edge records.
 *
 * The request body must contain the following elements:
 * - `children`: A key/value dictionary in which the keys are the document
 *               handles of the nodes pointing to the parent, and the values are
 *               the corresponding custom edge data associated to the relationship.
 * - `sections`: A list of predicates representing the sections and bridges that
 *               could be encountered while traversing the graph: this will allow
 *               traversals that span from root to leaves.
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
 * @param theSection {String|null}: The section predicate.
 *
 * @return {void}
 */
function doDelEdges(theRequest, theResponse, theSection = null)
{
	//
	// Init local storage.
	//
	const body = theRequest.body
	const root = theRequest.queryParams.root
	const prune = theRequest.queryParams.prune
	const parent = theRequest.queryParams.parent
	const direction = theRequest.queryParams.direction
	const predicate = theRequest.queryParams.predicate
	const predicates = (body.sections.includes(predicate))
		? body.sections
		: body.sections.concat(predicate)
	
	//
	// Check for missing document handles.
	//
	const missing = getOrphanHandles(root, parent, body)
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
	const path = module.context.configuration.sectionPath
	const data = module.context.configuration.sectionPathData
	
	///
	// Two ways to do it:
	// - Find parent in _from and predicate enum or bridge and check if root is there.
	// - Traverse graph from parent to root with predicate enum or bridge.
	///
	const bound = (direction) ? aql`OUTBOUND` : aql`INBOUND`
	const found = K.db._query(aql`
        FOR vertex, edge, path IN 1..10
            ${bound} ${parent}
            ${collection_edge}

            PRUNE edge._to == ${root} AND
                  edge.${pred} IN ${predicates}

        RETURN edge._key
    `).toArray()
	if(found.length === 0)
	{
		const message = dd`
			Cannot delete edges: the parent node, [${parent}], is not \
			connected to the graph root [${root}].
		`
		theResponse.status(400)
		theResponse.send(message)
		
		return                                                          // ==>
	}
	
	//
	// Create list of operations.
	//
	const deletes = []
	const updates = {}
	
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
		const src = (direction) ? item : parent
		const dst = (direction) ? parent : item
		
		///
		// Init local storage.
		///
		const edge = {}
		const key =
			Utils.getEdgeKey(
				src,
				(theSection === null) ? predicate : theSection,
				dst
			)
		
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
			if(!found[path].includes(root)) {
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
			found[path] = found[path].filter(element => element !== root)
			
			///
			// Delete edge.
			///
			if(found[path].length === 0)
			{
				if(!deletes.includes(found._key)) {
					deletes.push(found._key)
					result.deleted += 1
					if(theRequest.queryParams.deleted) {
						deleted.push(found)
					}
				}
				
			} // No more paths left.
				
			///
			// Update edge.
			///
			else
			{
				///
				// Reset custom data.
				///
				if(payload === null) {
					if(!Utils.isEmptyObject(found[data])) {
						found[data] = {}
					}
				} else {
					Utils.recursiveMergeObjects(payload, found[data])
				}
				
				///
				// Add update and update stats.
				///
				if(!updates.hasOwnProperty(found._key)) {
					updates[found._key] = found
					result.updated += 1
					if(theRequest.queryParams.updated) {
						updated.push(found)
					}
				}
				
			} // Paths left in edge.
			
			///
			// Prune relationships originating from children.
			///
			if(prune)
			{
				///
				// Collect and process all edges from child to leaf nodes.
				///
				const outbound = (direction) ? aql`INBOUND` : aql`OUTBOUND`
				K.db._query(aql`
				FOR vertex, edge, path IN 0..10
					${outbound} ${src}
					${collection_edge}
				
					PRUNE ${root} NOT IN edge.${path}
					
					OPTIONS {
						"order": "dfs",
						"uniqueVertices": "path"
					}
					
					FILTER ${root} IN edge.${path} AND
						   edge.${pred} IN ${predicates}
	
				RETURN edge
            `)
					.toArray()
					.forEach( (element) => {
						if(element[path].includes(root)) {
							element[path] = element[path].filter(it => it !== root)
							if(element[path].length === 0) {
								deletes.push(element._key)
								result.deleted += 1
								if(theRequest.queryParams.deleted) {
									deleted.push(element)
								}
							} else {
								if(!updates.hasOwnProperty(element._key)) {
									updates[element._key] = element
									result.updated += 1
									if(theRequest.queryParams.updated) {
										updated.push(element)
									}
								}
							}
						}
					})
				
			} // Prune branches.
			
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
			FOR item in ${Object.values(updates)}
		    REPLACE item
		    IN ${collection_edge}
		    OPTIONS { keepNull: false }
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
	
} // doDelEdges()

/**
 * Set section edges and their data.
 *
 * This function will create new section edges or update existing section edges
 * to connect a parent node to a set of child section nodes in a specific graph.
 *
 * The path query parameters contain the following information:
 * - `root`: The document handle of the graph root or type.
 * - `parent`: The document handle of the node to which child nodes will point.
 * - `section`: The section predicate to be used.
 * - `predicate`: The functional predicate associated with the graph.
 *
 * The request body must contain the following elements:
 * - `children`: A key/value dictionary in which the keys are the document
 *               handles of the nodes pointing to the parent, and the values are
 *               the corresponding custom edge data associated to the relationship.
 * - `sections`: A list of predicates representing the sections and bridges that
 *               could be encountered while traversing the graph: this will allow
 *               traversals that span from root to leaves.
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
 *
 * @return {void}
 */
function doSetSections(theRequest, theResponse)
{
	//
	// Init local storage.
	//
	const body = theRequest.body
	const root = theRequest.queryParams.root
	const parent = theRequest.queryParams.parent
	const section = theRequest.queryParams.section
	const direction = theRequest.queryParams.direction
	const predicate = theRequest.queryParams.predicate
	const predicates = (body.sections.includes(predicate))
		? body.sections
		: body.sections.concat(predicate)
	
	//
	// Check for missing document handles.
	//
	const missing = getOrphanHandles(root, parent, body)
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
	const path = module.context.configuration.sectionPath
	const data = module.context.configuration.sectionPathData
	
	///
	// Two ways to do it:
	// - Find parent in _from and predicate enum or bridge and check if root is there.
	// - Traverse graph from parent to root with predicate enum or bridge.
	///
	const bound = (direction) ? aql`OUTBOUND` : aql`INBOUND`
	const found = K.db._query(aql`
        FOR vertex, edge, path IN 1..10
            ${bound} ${parent}
            ${collection_edge}

            PRUNE edge._to == ${root} AND
                  edge.${pred} IN ${predicates}

        RETURN edge._key
    `).toArray()
	if(found.length === 0)
	{
		const message = dd`
			Cannot create sections: the parent node, [${parent}], is not \
			connected to the graph root [${root}].
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
		const src = (direction) ? item : parent
		const dst = (direction) ? parent : item
		
		///
		// Init local storage.
		///
		const edge = {}
		const key = Utils.getEdgeKey(src, section, dst)
		
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
			if(!found[path].includes(root)) {
				modified = true
				found[path] = found[path].concat([root])
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
			edge[pred] = section
			edge[path] = [ root ]
			edge[data] = {}
			if(payload !== null) {
				Utils.recursiveMergeObjects(payload, edge[data])
			}
			
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
	
} // doSetSections()

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
		const src = (direction)
			? `${module.context.configuration.collectionTerm}/${item}`
			: `${module.context.configuration.collectionTerm}/${data.parent}`
		const dst = (direction)
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
		const src = (direction)
			? `${module.context.configuration.collectionTerm}/${child}`
			: `${module.context.configuration.collectionTerm}/${data.parent}`
		const dst = (direction)
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
 * @param theRoot {Object}: `root` parameter, graph root node reference.
 * @param theParent {Object}: `parent` parameter, aggregator node reference.
 * @param theBody {Object}: Object containing `children` with custom data.
 * @param theCollections {String[]|null}: Will receive the list of collections in document handles.
 *
 * @return {Array<String>}: List of orphan handles
 */
function getOrphanHandles(theRoot, theParent, theBody,theCollections = null)
{
	//
	// Collect keys.
	//
	const handles =
		Array.from(
			new Set([
				...Object.keys(theBody.children),
				theRoot,
				theParent
			])
		)
	
	///
	// Collect collection names.
	///
	if(theCollections !== null) {
		handles.forEach( (handle) => {
			const collection = handle.split('/', 2)[0]
			if(!theCollections.includes(collection)) {
				theCollections.push(collection)
			}
		})
	}

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
