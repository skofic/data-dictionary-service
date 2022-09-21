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
const enumSchema = joi.string().required()
const enumKeyList = joi.array().items(joi.string())
const enumTermList = joi.array().items(joi.object({
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
router.tag('dictionary');


/**
 * Return all enumeration keys by path.
 * The service will return all the enumeration keys corresponding to the provided path
 * provided as a term global identifier.
 * No hierarchy is maintained and only valid enumeration elements are selected.
 */
router.get('enum/keys/:path', getAllEnumerationKeys, 'keys')
    .pathParam('path', enumSchema, "Enumeration root global identifier")
    .response(enumKeyList, dd
        `
            **List of enumeration global identifiers**
            
            The service will return the list of all the enumeration elements belonging to the \
            indicated path. The elements are represented by their global identifiers.
            
            Note that no hierarchy or order is maintained, it is a flat list of term global identifiers. \
            Also, only items representing active elements of the enumeration will be selected: this means \
            that terms used as sections or bridges will not be considered.
        `
    )
    .summary('Return flattened list of all enumeration keys')
    .description(dd
        `
            **Get all enumeration element global identifiers**
            
            Enumerations are graphs used as controlled vocabularies whose elements are terms. \
            At the root of the graph is a term that represents the type or definition of this \
            controlled vocabulary, this term represents the enumeration graph.
            
            The service expects the global identifier of that term as a path parameter, and will \
            return the flattened list of all enumeration elements belonging to that controlled \
            vocabulary. These elements will be returned as the global identifiers of the terms.
            
            You can try providing \`_type\`: this will return the list of data type identifiers.
        `
    )

/**
 * Return all enumerations.
 * The service will return all the enumeration elements of an enumeration type:
 * provide the enumeration type root and the service will return the array of terms.
 * No hierarchy is maintained and only valid enumeration elements are selected.
 */
router.get('enum/term/:path', getAllEnumerations, 'terms')
    .pathParam('path', enumSchema, "Enumeration root global identifier")
    .response(enumTermList, dd
        `
            **List of enumeration terms**
            
            The service will return the list of all the enumeration elements belonging to the \
            indicated path. The elements are represented by their term objects.
            
            Note that no hierarchy or order is maintained, it is a flat list of terms. \
            Also, only items representing active elements of the enumeration will be selected: this means \
            that terms used as sections or bridges will not be considered.
        `
    )
    .summary('Return flattened list of all enumeration terms')
    .description(dd
        `
            **Get all enumeration terms**
            
            Enumerations are graphs used as controlled vocabularies whose elements are terms. \
            At the root of the graph is a term that represents the type or definition of this \
            controlled vocabulary, this term represents the enumeration graph.
            
            The service expects the global identifier of that term as a path parameter, and will \
            return the flattened list of all enumeration elements belonging to that controlled \
            vocabulary. These elements will be returned as term objects.
            
            You can try providing \`_type\`: this will return the list of data type terms.
        `
    )

//
// Functions.
//

/**
 * Get all enumerations belonging to provided term.
 * @param request: API request.
 * @param response: API response.
 */
function getAllEnumerations(request, response)
{
    //
    // Get enumeration root.
    //
    const path = K.collection.term.name + '/' + request.pathParams.path;

    //
    // Query database.
    //
    const result = dictionary.getAllEnumerations(path);

    response.send(result);                                              // ==>

} // getAllEnumerations()

/**
 * Get all enumeration keys belonging to provided term.
 * @param request: API request.
 * @param response: API response.
 */
function getAllEnumerationKeys(request, response)
{
    //
    // Get enumeration root.
    //
    const path = K.collection.term.name + '/' + request.pathParams.path;

    //
    // Query database.
    //
    const result = dictionary.getAllEnumerationKeys(path);

    response.send(result);                                              // ==>

} // getAllEnumerations()

/*
router.get(function (req, res) {
  res.send(terms.all());
}, 'list')
.response([Term], 'A list of terms.')
.summary('List all terms')
.description(dd`
  Retrieves a list of all terms.
`);


router.post(function (req, res) {
    const term = req.body;
    let meta;
    try {
        meta = terms.save(term);
    } catch (e) {
        if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
            throw httpError(HTTP_CONFLICT, e.message);
        }
        throw e;
    }
    Object.assign(term, meta);
    res.status(201);
    res.set('location', req.makeAbsolute(
        req.reverse('detail', {key: term._key})
    ));
    res.send(term);
}, 'create')
    .body(Term, 'The term to create.')
    .response(201, Term, 'The created term.')
    .error(HTTP_CONFLICT, 'The term already exists.')
    .summary('Create a new term')
    .description(dd`
  Creates a new term from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
    const key = req.pathParams.key;
    let term
    try {
        term = terms.document(key);
    } catch (e) {
        if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
            throw httpError(HTTP_NOT_FOUND, e.message);
        }
        throw e;
    }
    res.send(term);
}, 'detail')
    .pathParam('key', keySchema)
    .response(Term, 'The term.')
    .summary('Fetch a term')
    .description(dd`
  Retrieves a term by its key.
`);


router.put(':key', function (req, res) {
    const key = req.pathParams.key;
    const term = req.body;
    let meta;
    try {
        meta = terms.replace(key, term);
    } catch (e) {
        if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
            throw httpError(HTTP_NOT_FOUND, e.message);
        }
        if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
            throw httpError(HTTP_CONFLICT, e.message);
        }
        throw e;
    }
    Object.assign(term, meta);
    res.send(term);
}, 'replace')
    .pathParam('key', keySchema)
    .body(Term, 'The data to replace the term with.')
    .response(Term, 'The new term.')
    .summary('Replace a term')
    .description(dd`
  Replaces an existing term with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
    const key = req.pathParams.key;
    const patchData = req.body;
    let term;
    try {
        terms.update(key, patchData);
        term = terms.document(key);
    } catch (e) {
        if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
            throw httpError(HTTP_NOT_FOUND, e.message);
        }
        if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
            throw httpError(HTTP_CONFLICT, e.message);
        }
        throw e;
    }
    res.send(term);
}, 'update')
    .pathParam('key', keySchema)
    .body(joi.object().description('The data to update the term with.'))
    .response(Term, 'The updated term.')
    .summary('Update a term')
    .description(dd`
  Patches a term with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
    const key = req.pathParams.key;
    try {
        terms.remove(key);
    } catch (e) {
        if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
            throw httpError(HTTP_NOT_FOUND, e.message);
        }
        throw e;
    }
}, 'delete')
    .pathParam('key', keySchema)
    .response(null)
    .summary('Remove a term')
    .description(dd`
  Deletes a term from the database.
`);
*/