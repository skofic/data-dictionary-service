'use strict'

//
// Imports.
//
const dd = require('dedent')
const joi = require('joi')
const aql = require('@arangodb').aql
const status = require('statuses')
const errors = require('@arangodb').errors

//
// Error codes.
//
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code
const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code
const HTTP_NOT_FOUND = status('not found')
const HTTP_CONFLICT = status('conflict')

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
const TargetModel = joi.string()
	.required()
	.description(
		"This parameter represents the *document handle* of the *node* that \
		represents the *target* of the graph traversal."
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
const DirectionModel = joi.boolean()
	.default(true)
	.description(
		"This parameter determines the direction of relationships for the \
		provided predicate: `true` indicates that the relationship direction \
		starts from the leaf nodes and points to the root node, this represents \
		a *many-to-one* relationship; `false` indicates that the relationship \
		direction starts from the graph root and points to the leaf nodes, this \
		represents a *one-to-many* relationship. By default this parameter assumes \
		*many-to-one* relationships, `true`.\n\
		*Note that the direction should be consistent with all predicates \
		used in the graph."
	)

const SectionPredicatesModel = joi.array()
	.items(joi.string())
	.default([
		module.context.configuration.predicateSection,
		module.context.configuration.predicateBridge
	])
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
router.tag('Edge graphs');


//
// FLAT LIST SERVICES
//

/**
 * Return all graph subject keys by path and predicate.
 *
 * The service will return the list of all edge subject node document handles
 * belonging to the provided root graph that use the provided predicate.
 *
 * No hierarchy is maintained and only valid enumeration elements are selected:
 * this means container and bridge predicates are skipped.
 */
router.get(
	'all/handles',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			getFunctionalNodeHandles(request, response)
		}
	},
	'all-handles'
)
	.summary('Get flat list of functional node handles')
	.description(dd`
        **Get all functional nodes for provided root and predicate**
        
        ***To use this service, the current user must have the \`read\` role.***
        
        The service expects the document handle of the graph root, the \
        functional predicate of the graph and the direction of the relationships.
        
        The service will return the list of node document handles, related with \
        the functional predicate, corresponding to the subject or object nodes, \
        depending on the direction of the functional predicate.
        
        You can try providing \`terms/_type\` as the graph root: this will \
        use the graph containing the controlled vocabulary of all data types. \
        Provide \`_predicate_enum-of\`  as the functional predicate: this will \
        select all valid data type elements.
        
        *Note: this service will return all the functional nodes of the graph, this means \
        that large graphs may block the service, so use this service with caution.*
    `)
	.queryParam('root', RootModel)
	.queryParam('predicate', PredicateModel)
	.queryParam('direction', DirectionModel)
	.response(200, Models.StringArrayModel, dd`
        **List of functional node handles**
        
        The service will return the list of *all* functional node handles of the graph \
        identified by the provided root node.
        
        *Functional nodes* are those nodes connected by relationships that feature \
        the functional predicate: only edges featuring the provided predicate will \
        be considered.
        
        Note that *no hierarchy* or *order* is maintained, it is a *flat list* of \
        *document handles*.
    `)
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
 * Return all graph subject records by path and predicate.
 *
 * The service will return the list of all edge subject node documents
 * belonging to the provided root graph that use the provided predicate.
 *
 * No hierarchy is maintained and only valid enumeration elements are selected:
 * this means container and bridge predicates are skipped.
 */
router.get(
	'all/docs',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			getFunctionalNodeDocuments(request, response)
		}
	},
	'all-docs'
)
	.summary('Get flat list of functional node documents')
	.description(dd`
        **Get all functional nodes records for provided root and predicate**
        
        ***To use this service, the current user must have the \`read\` role.***
        
        The service expects the document handle of the graph root, the \
        functional predicate of the graph and the direction of the graph \
        relationships.
        
        The service will return the list of node documents, related with \
        the functional predicate, corresponding to the subject or object nodes, \
        depending on the direction of the functional predicate.
        
        You can try providing \`terms/_type\` as the graph root: this will \
        use the graph containing the controlled vocabulary of all data types. \
        Provide \`_predicate_enum-of\`  as the functional predicate: this will \
        select all valid data types.
        
        *Note: this service will return all the functional nodes of the graph, this means \
        that large graphs may block the service, so use this service with caution.*
    `)
	.queryParam('root', RootModel)
	.queryParam('predicate', PredicateModel)
	.queryParam('direction', DirectionModel)
	.response(200, Models.ObjectArrayModel, dd`
        **List of functional node records**
        
        The service will return the list of *all* functional node records of the \
        graph identified by the provided root node.
        
        *Functional nodes* are those nodes connected by relationships that feature \
        the functional predicate: only edges featuring the provided predicate will \
        be considered.
        
        Note that *no hierarchy* or *order* is maintained, it is a *flat list* of \
        *document handles*.
    `)
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
 * Return all graph edges by path and predicate.
 *
 * The service will return the list of all edges belonging to the provided
 * root graph that use the provided predicate.
 *
 * Only valid enumeration elements are selected: this means container and
 * bridge predicates are skipped.
 */
router.get(
	'all/edges',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			getFunctionalNodeEdges(request, response)
		}
	},
	'all-edges'
)
	.summary('Get list of functional edges')
	.description(dd`
        **Get all functional edges for provided root and predicate**
        
        ***To use this service, the current user must have the \`read\` role.***
        
        The service will return the list of *all* edges of the graph, identified \
        by the provided root node, that feature the provided predicate.
        
        You can try providing \`terms/_type\` as the graph root: this will \
        use the graph containing the controlled vocabulary of all data types. \
        Provide \`_predicate_enum-of\`  as the functional predicate: this will \
        select all valid data types.
        
        *Note: this service will return all the functional edges of the graph, \
        this means that large graphs may block the service, so use this service \
        with caution.*
    `)
	.queryParam('root', RootModel)
	.queryParam('predicate', PredicateModel)
	.queryParam('direction', DirectionModel)
	.response(200, Models.ObjectArrayModel, dd`
        **List of functional edges**
        
        The service will return the list of *all* edges of the graph identified \
        by the provided root node that feature the provided predicate.
        
        *Functional edges* are those that feature he functional predicate: only \
        edges featuring the provided predicate will be considered.
    `)
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
// TREE SERVICES
//

/**
 * Return handles tree.
 *
 * This service will traverse the graph identified by the provided root node
 * handle up to the provided number of levels: the service will return the
 * many-to-one, or one-to-many relationships depending on the graph direction.
 *
 * The service expects the graph root, the graph direction and the number of
 * depth levels to traverse. The result will be a list of objects each having
 * one property structured as follows:
 *
 * - `property`: An object containing one property named as the parent node
 *   document handle. Parent nodes are those closer to the graph root.
 *   - `predicate`: An object with a single property named as the predicate
 *     relating the parent with its children, with as value an array.
 *     - `array`: The array of child node handles related to the parent with
 *       the predicate represented in the property name. Child nodes are those
 *       closer to the graph's leaf nodes.
 *
 * The whole graph, down to the provided number of depth levels, is serialised
 * in a list of the above described structures. This list can be used by a
 * client to traverse the graph: start with the structure featuring the root
 * node handle as the structure top property.
 */
router.post(
	'tree/handles',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			traverseGraphHandlesTree(request, response)
		}
	},
	'tree-handles'
)
	.summary('Return graph handles tree')
	.description(dd`
        **Tree of graph handles**
        
        ***To use this service, the current user must have the \`read\` role.***
        
        This service will return the list of subject-predicate-object document \
        handles for the graph identified by the root node, the functional \
        predicate and the provided list of container and bridge predicates, \
        up to a maximum number of depth levels.
        
        The service expects the graph root node handle, the functional \
        predicate of the graph, the direction of the graph relationships, \
        the maximum number of depth levels to traverse and the list of \
        non-functional predicates to consider during the traversal.
        
        You can try providing \`terms/_predicate\` as the graph root, \
        \`_predicate_enum-of\` as the functional predicate, \`true\` as the \
        graph relationships direction (many-to-one), 10 as the maximum number \
        of levels to traverse and \`["_predicate_section-of", "_predicate_bridge-of"]\` \
        as the list of non-functional predicates. This should \
        return the graph of the predicates controlled vocabulary enumeration.
    `)
	.queryParam('root', RootModel)
	.queryParam('predicate', PredicateModel)
	.queryParam('direction', DirectionModel)
	.queryParam('levels', Models.LevelsModel, "Maximum tree depth level")
	.body(SectionPredicatesModel, dd`
		The array should feature all the container and bridge predicates used \
		in the graph, in order to select all relevant edges.
	`)
	.response(200, Models.TreeModel, dd`
        **Serialised graph tree**
        
        The service will return a list of objects each representing a single \
        level of relationship. Each element features the parent node, the \
        predicate and the child nodes:
        
        - \`property\`: The top level property is named after the parent node \
          document handle. It is a single property object whose value \
          is an object:
          - \`predicate\`: The property is named after the relationship \
            predicate. The value of this property is an array:
            - \`array\`: The array contains the child node handles which \
              are related to the parent node with the predicate.
        
        The resulting list can be used to navigate the graph: locate the \
        element whose top property matches the graph root document handle.
    `)
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
 * Return preferred graph document by target document handle.
 *
 * The service will return the preferred graph node record matching the provided
 * target document handle.
 */
router.post(
	'match/node',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			matchGraphNode(request, response)
		}
	},
	'match-node'
)
	.summary('Return preferred node record by handle')
	.description(dd`
        **Get preferred node by document handle**
        
        ***To use this service, the current user must have the \`read\` role.***
        
        The service expects the graph root, the target node document handle, \
        the functional predicate, the relationships direction and the list of \
        container and bridge predicates for traversing the graph.
        
        You can try providing:
        
        \`terms/iso_639_1\` as the graph root.
        \`terms/iso_639_1_it\` as the target node handle.
        \`_predicate_enum-of\` as the predicate.
        \`true\` as the relationships direction, (many-to-one)
        \`10\` as the maximum depth level.
        \`["_predicate_section-of", "_predicate_bridge-of"]\` as the container \
        and bridge predicates.
        
        The service will return the matched node record, or an empty object if \
        a match was not found.
    `)
	.queryParam('root', RootModel)
	.queryParam('target', TargetModel)
	.queryParam('predicate', PredicateModel)
	.queryParam('direction', DirectionModel)
	.queryParam('levels', Models.LevelsModel, dd`
		Maximum depth level for traversals when node is not functional.
	`)
	.body(SectionPredicatesModel, dd`
       The list of container and bridge predicates to traverse.
	`)
	.response(200, joi.object(), dd`
       **Check status**
        
        The service will return the record matching the preferred node for the \
        target in the graph, or an empty object if there was no match.
    `)
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
 * Return preferred graph document by target term code.
 *
 * The service will return the preferred graph node record matching the provided
 * target term code.
 */
router.post(
	'match/code',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			matchGraphCode(request, response)
		}
	},
	'match-code'
)
	.summary('Return preferred node record by code')
	.description(dd`
        **Get preferred node by code**
        
        ***To use this service, the current user must have the \`read\` role.***
        
        The service expects the graph root, the target node code, the code \
        section field used for matching the code, the functional predicate, \
        the relationships direction and the list of container and bridge \
        predicates for traversing the graph.
        
        *The service expects the codes to be stored in the
        
        You can try providing:
        
        \`terms/iso_639_1\` as the graph root.
        \`it\` as the target code.
        \`_lid\` as the codes section field to match.
        \`_predicate_enum-of\` as the predicate.
        \`true\` as the relationships direction, (many-to-one)
        \`["_predicate_section-of", "_predicate_bridge-of"]\` as the container \
        and bridge predicates.
        
        The service will return the matched node record, or an empty object if \
        a match was not found.
    `)
	.queryParam('root', RootModel)
	.queryParam('code', Models.StringModel, "Target code to be matched.")
	.queryParam('field', ArrayIdentifierFields, dd`
        Code section field name where the code should be matched:
        - \`_lid\`: Local identifier. Match the local identifier code.
        - \`_gid\`: Global identifier. Match the global identifier code.
        - \`_aid\`: List of official codes. Match the official code.
        - \`_pid\`: List of provider codes. Match the provided code.
        - \`_nid\`: Namespace. Match the namespace code.
    `)
	.queryParam('predicate', PredicateModel)
	.queryParam('direction', DirectionModel)
	.queryParam('levels', Models.LevelsModel, dd`
		Maximum depth level for traversals when node is not functional.
	`)
	.body(SectionPredicatesModel, dd`
       The list of container and bridge predicates to traverse.
	`)
	.response(200, joi.array().items(Models.TermInsertedModel), dd
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


//
// TRAVERSAL SERVICES
//

/**
 * Traverse graph.
 *
 * This service will traverse the graph identified by the provided root node
 * handle and the provided functional predicate, starting from the provided
 * parent node traversing the provided maximum number of depth levels.
 *
 * The service expects the graph root, the graph functional predicate, the
 * relationships direction, the starting and ending number of depth levels
 * and the list of container and bridge predicates to consider.
 *
 * The service will return an object containing the list of visited vertices
 * and edges.
 */
router.post(
	'path/levels',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			traverseGraphByLevel(request, response)
		}
	},
	'path-levels'
)
	.summary('Traverse graph levels')
	.description(dd`
        **Traverse graph from parent by level**
        
        ***To use this service, the current user must have the \`read\` role.***
        
        With this service it is possible to traverse a graph starting from a \
        specific node, a specific starting depth level until a maximum number of \
        levels has been reached.
        
        The service expects the graph root node handle, the document handle of \
        the node from which to start the traversal, the functional predicate of \
        the graph, the direction of the relationships, the traversal start level, \
        the maximum depth level and the list of container and bridge predicates \
        to consider during the traversal.
        
        You can try providing:
        
        \`terms/_type\` as the graph root.
        \`terms/_type_string\` as the parent node.
        \`_predicate_enum-of\` as the predicate.
        \`true\` as the relationships direction, (many-to-one)
        \`0\` as the start depth level.
        \`10\` as the maximum depth level.
        \`["_predicate_section-of", "_predicate_bridge-of"]\` as the list of \
          container and bridge predicates to consider.
        
        This should return the graph of the scalar data types enumeration.
    `)
	.queryParam('root', RootModel)
	.queryParam('parent', ParentModel)
	.queryParam('predicate', PredicateModel)
	.queryParam('direction', DirectionModel)
	.queryParam('min_level', joi.number().integer().min(0).default(0), "Start depth level")
	.queryParam('max_level', joi.number().integer().min(0).default(10), "Maximum depth level")
	.body(SectionPredicatesModel, dd`
		The array should feature all the container and bridge predicates used \
		in the graph, in order to select all relevant edges.
	`)
	.response(200, Models.GraphPathsModel, dd`
        **Path to max level**
        
        The response is an array pf paths, each path is an object containing two \
        properties:
        
        - \`vertices\`: The list of nodes in the path.
        - \`edges\`: The list of edges in the path.
    `)
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
 * Return path to target node.
 *
 * The service will return the path from the root node to the target node.
 */
router.post(
	'path/node',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			traverseGraphToTargetHandle(request, response)
		}
	},
	'path-node'
)
	.summary('Return path from root to target node')
	.description(dd`
        **Get path from parent to target node**
        
        ***To use this service, the current user must have the \`read\` role.***
        
        This service will traverse the graph identified by the root node \
        until it matches the target node: the service will return the path \
        from the root node to the target node.
            
        The service expects the graph root node handle, the document handle of \
        the target node to reach in the traversal, the functional predicate of \
        the graph, the direction of the relationships, the maximum depth level \
        and the list of container and bridge predicates to consider during the \
        traversal.
        
        You can try providing:
        
        \`terms/_predicate\` as the graph root.
        \`terms/iso_3166_2_type_autonomous-republic\` as the target node.
        \`_predicate_enum-of\` as the predicate.
        \`true\` as the relationships direction, (many-to-one)
        \`10\` as the maximum depth level.
        \`["_predicate_section-of", "_predicate_bridge-of"]\` as the list of \
          container and bridge predicates to consider.
        
        This should return the path starting from the edge predicates node to \
        the *autonomous republic* none in the predicates enumeration path.
    `)
	.queryParam('root', RootModel)
	.queryParam('target', TargetModel)
	.queryParam('predicate', PredicateModel)
	.queryParam('direction', DirectionModel)
	.queryParam('max_level', Models.LevelsModel, "Maximum depth level")
	.body(SectionPredicatesModel, dd`
		The array should feature all the container and bridge predicates used \
		in the graph, in order to select all relevant edges.
	`)
	.response(200, Models.GraphPathsModel, dd`
        **Path to target node**
        
        The response is an array of paths, it should consist of one element \
        featuring the path from the \`root\` node to the \`target\` node, \
        if found in the graph. Each path is as follows:
        
        - \`vertices\`: The list of nodes in the path.
        - \`edges\`: The list of edges in the path.
    `)
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
 * Return path to target code.
 *
 * The service will return the path from the origin node to the first target
 * term node that features a field matching a provided code.
 */
router.post(
	'path/code',
	(request, response) => {
		const roles = [K.environment.role.read]
		if(Session.hasPermission(request, response, roles)) {
			traverseGraphToTargetCode(request, response)
		}
	},
	'path-code'
)
	.summary('Return path from root to term matching code')
	.description(dd`
        **Get path from root node to term matching code**
        
        ***To use this service, the current user must have the \`read\` role.***
        
        This service will return all paths, in the graph identified by the root, \
        from the root to all term nodes that feature the provided code in the \
        provided codes section field.
        
        *The target graph nodes must belong to the terms collection.*
        
        The service expects the graph root node handle, the code to match, \
        the terms codes section field where to look for the code, the functional \
        predicate of the graph, the direction of the graph relationships, the \
        maximum number of depth levels to traverse and the list of container \
        and bridge predicates to consider during the traversal.
        
        *If the matched node is beyond the maximum depth level, the service will \
        return an empty array.*
        
        You can try providing:
        
        \`terms/_predicate\` as the graph root.
        \`autonomous-republic\` as the code.
        \`_lid\` as the terms field for matching the code.
        \`_predicate_enum-of\` as the functional predicate.
        \`true\` as the relationships direction, (many-to-one)
        \`10\` as the maximum depth level.
        \`["_predicate_section-of", "_predicate_bridge-of"]\` as the list of \
          container and bridge predicates to consider.
        
        This should return the path starting from the root node to \
        the node whose provided field matches the *autonomous-republic* \
        code in the graph.
    `)
	.queryParam('root', RootModel)
	.queryParam('code', Models.StringModel, "Target enumeration identifier")
	.queryParam('field', ArrayIdentifierFields, dd`
        Code section field name where the code should be matched:
        - \`_lid\`: Local identifier. Match the local identifier code.
        - \`_gid\`: Global identifier. Match the global identifier code.
        - \`_aid\`: List of official codes. Match the official code.
        - \`_pid\`: List of provider codes. Match the provided code.
        - \`_nid\`: Namespace. Match the namespace code.
    `)
	.queryParam('predicate', PredicateModel)
	.queryParam('direction', DirectionModel)
	.queryParam('max_level', Models.LevelsModel, "Maximum depth level")
	.body(SectionPredicatesModel, dd`
		The array should feature all the container and bridge predicates used \
		in the graph, in order to select all relevant edges.
	`)
	.response(200, Models.GraphPathsModel, dd`
        **Path to first matched code**
        
        The result is an array of paths structured as follows:
     
        - \`vertices\`: The list of nodes in the path.
        - \`edges\`: The list of edges in the path.
        
        If there is no matches, the path will be an empty array.
    `)
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
// List Functions.
//


/**
 * Get flattened list of functional node handles.
 *
 * The function expects the graph root document handle, the functional predicate
 * and the graph direction (many-to-one or one-to-many).
 *
 * The function will select all edges belonging to the provided root path that
 * feature the provided predicate and return the subject or object of the
 * relationship, depending on the direction of the graph.
 *
 * @param request: API request.
 * @param response: API response.
 */
function getFunctionalNodeHandles(request, response)
{
	///
	// Determine edge terms by direction.
	///
	const handle = (request.queryParams.direction) ? aql`edge._from` : aql`edge._to`
	
	//
	// Query schema.
	//
	const result =
		K.db._query( aql`
            FOR edge IN ${collection_edge}
                FILTER ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath}
                FILTER edge.${module.context.configuration.predicate} == ${request.queryParams.predicate}
            RETURN ${handle}
        `).toArray()
	
	response.send(result)                                               // ==>
	
} // getFunctionalNodeHandles()

/**
 * Get flattened list of functional node records.
 *
 * The function expects the graph root document handle, the functional predicate
 * and the graph direction (many-to-one or one-to-many).
 *
 * The function will select all edges belonging to the provided root path that
 * feature the provided predicate and return the subject or object of the
 * relationship, depending on the direction of the graph.
 *
 * @param request: API request.
 * @param response: API response.
 */
function getFunctionalNodeDocuments(request, response)
{
	///
	// Determine edge terms by direction.
	///
	const handle = (request.queryParams.direction) ? aql`edge._from` : aql`edge._to`
	
	//
	// Query schema.
	//
	const result =
		K.db._query( aql`
            FOR edge IN ${collection_edge}
                FILTER ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath}
                FILTER edge.${module.context.configuration.predicate} == ${request.queryParams.predicate}
            RETURN DOCUMENT(${handle})
        `).toArray()
	
	response.send(result)                                               // ==>
	
} // getFunctionalNodeDocuments()

/**
 * Get flattened list of functional node edges.
 *
 * The function expects the graph root document handle, the functional predicate
 * and the graph direction (many-to-one or one-to-many).
 *
 * The function will return all edges belonging to the provided root path that
 * feature the provided predicate .
 *
 * @param request: API request.
 * @param response: API response.
 */
function getFunctionalNodeEdges(request, response)
{
	//
	// Query schema.
	//
	const result =
		K.db._query( aql`
            FOR edge IN ${collection_edge}
                FILTER ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath}
                FILTER edge.${module.context.configuration.predicate} == ${request.queryParams.predicate}
            RETURN edge
        `).toArray()
	
	response.send(result)                                               // ==>
	
} // getFunctionalNodeEdges()


//
// Match Functions.
//


/**
 * Return preferred node record for provided document handle match.
 *
 * The function will perform the following operations:
 *
 * - Check if there is an edge matching the graph root and the provided target
 *   node document handle.
 *   - If the edge was found:
 *     - If the edge predicate matches the provided predicate:
 *       - Return the record matching the subject or object handle, depending
 *         on the provided relationship direction.
 *     - If the edge predicate does not match the provided predicate:
 *       - It means that the target node is not the preferred node: traverse
 *         the graph starting from the target node in the opposite direction
 *         until we get an edge whose predicate matches the provided functional
 *         predicate.
 *   - If the edge was not found:
 *     - Return an empty object.
 *
 * @param request: API request.
 * @param response: API response.
 */
function matchGraphNode(request, response)
{
	///
	// Init local storage.
	///
	let match = {}
	
	///
	// Init direction variables.
	///
	const bound = (request.queryParams.direction) ? aql`INBOUND` : aql`OUTBOUND`
	const target = (request.queryParams.direction) ? aql`_from` : aql`_to`
	const field = (request.queryParams.direction) ? '_from' : '_to'
	
	///
	// Set list of predicates to traverse.
	///
	const predicates = request.body.slice()
	if(!predicates.includes(request.queryParams.predicate)) {
		predicates.push(request.queryParams.predicate)
	}
	
	//
	// Find connected edge.
	//
	const edges = K.db._query(aql`
		FOR edge IN edges
			FILTER ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath}
			FILTER edge.${target} == ${request.queryParams.target}
		RETURN edge
	`).toArray()
	
	///
	// Handle target node not in graph.
	///
	if(edges.length === 0)
	{
		response.send(match)
		return                                                          // ==>
		
	} // Target not in graph.
	
	///
	// Save edge.
	///
	const edge = edges[0]
	
	///
	// Handle functional edge.
	///
	if(edge[module.context.configuration.predicate] === request.queryParams.predicate)
	{
		match = K.db._query(aql`
			RETURN DOCUMENT(${edge[field]})
		`).toArray()
		
		response.send(
			(match.length === 0)
				? {}
				: match[0]
		)
		return                                                          // ==>
		
	} // Functional predicate edge.
	
	///
	// Traverse graph from target node to leaf node.
	///
	match = K.db._query(aql`
		FOR vertex, edge, path
		IN 0..${request.queryParams.levels}
			${bound} ${edge[field]}
			${collection_edge}

			PRUNE NOT ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath} OR
			      NOT edge.${module.context.configuration.predicate} IN ${predicates}

			OPTIONS {
			    "uniqueVertices": "path"
			}

			FILTER ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath}
			FILTER edge.${module.context.configuration.predicate} == ${request.queryParams.predicate}

		RETURN
			vertex
	`).toArray()
	
	response.send(
		(match.length === 0)
			? {}
			: match[0]
	)
	
} // matchGraphNode)

/**
 * Return preferred node record for provided target code.
 *
 * The function will perform the following operations:
 *
 * - Check if there is an edge matching the graph root and the provided target
 *   node document handle.
 *   - If the edge was found:
 *     - If the edge predicate matches the provided predicate:
 *       - Return the record matching the subject or object handle, depending
 *         on the provided relationship direction.
 *     - If the edge predicate does not match the provided predicate:
 *       - It means that the target node is not the preferred node: traverse
 *         the graph starting from the target node in the opposite direction
 *         until we get an edge whose predicate matches the provided functional
 *         predicate.
 *   - If the edge was not found:
 *     - Return an empty object.
 *
 * @param request: API request.
 * @param response: API response.
 */
function matchGraphCode(request, response)
{
	///
	// Init direction variables.
	///
	const match = {}
	const bound = (request.queryParams.direction) ? aql`INBOUND` : aql`OUTBOUND`
	const target = (request.queryParams.direction) ? aql`_from` : aql`_to`
	const field = (request.queryParams.direction) ? '_from' : '_to'
	
	///
	// Set list of predicates to traverse.
	///
	const predicates = request.body.slice()
	if(!predicates.includes(request.queryParams.predicate)) {
		predicates.push(request.queryParams.predicate)
	}
	
	//
	// Find connected edges.
	//
	const edges = K.db._query(aql`
        LET terms = (
          FOR term IN ${view_reference}
            SEARCH term.${module.context.configuration.sectionCode}.${request.queryParams.field} == ${request.queryParams.code}
          RETURN term._id
        )
        
        FOR edge IN ${collection_edge}
          FILTER edge.${target} IN terms
          FILTER ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath}
        RETURN edge
	`).toArray()
	
	///
	// Handle target node not in graph.
	///
	if(edges.length === 0)
	{
		response.send([])
		return                                                          // ==>
		
	} // Target not in graph.
	
	///
	// Iterate found edges.
	///
	edges.forEach( (edge) =>
	{
		///
		// Handle functional edge.
		///
		if(edge[module.context.configuration.predicate] === request.queryParams.predicate)
		{
			const handle = edge[field]
			const result = K.db._query(aql`
				RETURN DOCUMENT(${handle})
			`).toArray()
			
			if(result.length > 0) {
				match[handle] = result[0]
			}
			
			return                                                  // =>
		}
		
		///
		// Traverse for preferred target.
		///
		const result = K.db._query(aql`
			FOR vertex, edge, path
			IN 0..${request.queryParams.levels}
				${bound} ${edge[field]}
				${collection_edge}
	
				PRUNE NOT ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath} OR
				      NOT edge.${module.context.configuration.predicate} IN ${predicates}
	
				OPTIONS {
				    "uniqueVertices": "path"
				}
	
				FILTER ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath}
				FILTER edge.${module.context.configuration.predicate} == ${request.queryParams.predicate}
	
			RETURN
				vertex
		`).toArray()
		
		if(result.length > 0) {
			match[edge[field]] = result[0]
		}
	})
	
	response.send(Object.values(match))
	
} // matchGraphCode)


//
// Traversal Functions.
//


/**
 * Traverse graph and collect subject-predicate-object relationship groups.
 *
 * The function will return an array of objects each structured as follows:
 *
 * - A single top-level property named after the parent node document handle.
 *   - A single property, named after the predicate, with an array as value:
 *     - Each array element is the document handle of a child node.
 *
 * @param request: API request.
 * @param response: API response.
 */
function traverseGraphHandlesTree(request, response)
{
	//
	// Init local storage.
	//
	const predicates = request.body.slice()
	if(!predicates.includes(request.queryParams.predicate)) {
		predicates.push(request.queryParams.predicate)
	}
	
	///
	// Set relationship terms.
	///
	const bound = (request.queryParams.direction) ? aql`INBOUND` : aql`OUTBOUND`
	const parent = (request.queryParams.direction) ? aql`edge._to` : aql`edge._from`
	
	//
	// Query schema.
	//
	const result =
		K.db._query( aql`
            LET tree = (
                MERGE_RECURSIVE(
                    FOR vertex, edge IN 0..${request.queryParams.levels}
                        ${bound} ${request.queryParams.root}
                        ${collection_edge}
            
                        PRUNE ${request.queryParams.root} NOT IN edge.${module.context.configuration.sectionPath}
                    
                        OPTIONS {
                            "order": "bfs"
                        }
                        
                        FILTER edge.${module.context.configuration.predicate} IN ${predicates}
                        FILTER ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath}
                        
                        COLLECT parent = ${parent},
                                predicate = edge.${module.context.configuration.predicate}
                        INTO children
                    
                    RETURN {
                        [parent]: {
                            [predicate]: UNIQUE(children[*].vertex._id)
                        }
                    }
                )
            )
            
            RETURN HAS(tree, ${request.queryParams.root}) ? tree : []
        `).toArray()
	
	response.send(result)                                               // ==>
	
} // traverseGraphHandlesTree()

/**
 * Return graph vertices and edges from parent node starting at
 * a minimum depth level until a maximum depth level is reached.
 *
 * @param request: API request.
 * @param response: API response.
 */
function traverseGraphByLevel(request, response)
{
	//
	// Init local storage.
	//
	const predicates = request.body.slice()
	if(!predicates.includes(request.queryParams.predicate)) {
		predicates.push(request.queryParams.predicate)
	}
	
	///
	// Set relationship terms.
	///
	const bound = (request.queryParams.direction) ? aql`INBOUND` : aql`OUTBOUND`
	
	///
	// Query database.
	///
	const result = K.db._query( aql`
        FOR vertex, edge, path
        IN ${request.queryParams.min_level}..${request.queryParams.max_level}
            ${bound} ${request.queryParams.parent}
            ${collection_edge}
            
            PRUNE ${request.queryParams.root} NOT IN edge.${module.context.configuration.sectionPath}
            
            OPTIONS {
				"order": "dfs",
				"uniqueVertices": "path"
            }
            
            FILTER edge.${module.context.configuration.predicate} IN ${predicates} AND
                   ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath}
            
        RETURN path
    `).toArray()
	
	response.send(result);                                                      // ==>
	
} // traverseGraphByLevel()

/**
 * Return graph vertices and edges from root node to target document handle.
 *
 * @param request: API request.
 * @param response: API response.
 */
function traverseGraphToTargetHandle(request, response)
{
	///
	// Set relationship terms.
	///
	const bound = (request.queryParams.direction) ? aql`INBOUND` : aql`OUTBOUND`
	const target = (request.queryParams.direction) ? aql`_from` : aql`_to`
	
	//
	// Init predicates.
	//
	const predicates = request.body.slice()
	if(!predicates.includes(request.queryParams.predicate)) {
		predicates.push(request.queryParams.predicate)
	}
	
	//
	// Query schema.
	//
	const result =
		K.db._query( aql`
			FOR vertex, edge, path
			IN 0..${request.queryParams.max_level}
				${bound} ${request.queryParams.root}
				${collection_edge}
				
				PRUNE NOT ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath} OR
				      NOT edge.${module.context.configuration.predicate} IN ${predicates}
				      
				OPTIONS {
				    "uniqueVertices": "path"
				}
				
				FILTER edge.${target} == ${request.queryParams.target}
				FILTER ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath}
				
			RETURN
				path
        `).toArray()
	
	response.send(result)                                               // ==>
	
} // traverseGraphToTargetHandle()

/**
 * Return graph vertices and edges from root node to target code.
 *
 * @param request: API request.
 * @param response: API response.
 */
function traverseGraphToTargetCode(request, response)
{
	///
	// Set relationship terms.
	///
	const bound = (request.queryParams.direction) ? aql`INBOUND` : aql`OUTBOUND`
	const target = (request.queryParams.direction) ? aql`_from` : aql`_to`
	
	//
	// Init predicates.
	//
	const predicates = request.body.slice()
	if(!predicates.includes(request.queryParams.predicate)) {
		predicates.push(request.queryParams.predicate)
	}
	
	//
	// Find connected edges.
	//
	const nodes = K.db._query(aql`
        LET terms = (
          FOR term IN ${view_reference}
            SEARCH term.${module.context.configuration.sectionCode}.${request.queryParams.field} == ${request.queryParams.code}
          RETURN term._id
        )
        
        FOR edge IN ${collection_edge}
          FILTER edge.${target} IN terms
          FILTER ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath}
        RETURN edge.${target}
	`).toArray()
	
	///
	// Handle no matches.
	///
	if(nodes.length === 0) {
		response.send([])                                               // ==>
	}
	
	///
	// Traverse from matches to root.
	///
	else
	{
		response.send(
			K.db._query( aql`
				FOR vertex, edge, path
				IN 0..${request.queryParams.max_level}
					${bound} ${request.queryParams.root}
					${collection_edge}
					
					PRUNE NOT ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath} OR
					      NOT edge.${module.context.configuration.predicate} IN ${predicates}
					      
					OPTIONS {
					    "uniqueVertices": "path"
					}
					
					FILTER edge.${target} IN ${nodes}
					FILTER ${request.queryParams.root} IN edge.${module.context.configuration.sectionPath}
					
				RETURN
					path
	        `).toArray()
		)                                                               // ==>
	}
	
} // traverseGraphToTargetCode()
