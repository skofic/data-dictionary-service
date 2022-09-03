'use strict';

//
// Imports.
//
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');

//
// Models.
//
const Term = require('../models/term');
const List = require('../models/KeyList')

//
// Functions.
//
const dictionary = require("../utils/dictionary");

//
// Constants.
//
const collection_terms = module.context.collection('terms');
const enumSchema = joi.string().required()
    .description('The global identifier of the root element of the controlled vocabulary');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

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
 * Return all enumerations.
 * The service will return all the enumeration elements of an enumeration type:
 * provide the enumeration type root and the service will return the array of terms.
 * No hierarchy is maintained and only valid enumeration elements are selected.
 */
router.get('enum/all/:root', getAllEnumerations, 'all')
    .pathParam('root', enumSchema)
    .response([Term], 'Flat list of all enumeration terms.')
    .summary('Return flattened list of all enumerations')
    .description(dd
        `
            Provided the root to an enumeration, will return the flattened òlist of all enumeration's terms.
        `
    );

/**
 * Return all enumeration keys.
 * The service will return all the enumeration keys of an enumeration type:
 * provide the enumeration type root and the service will return the array of term keys.
 * No hierarchy is maintained and only valid enumeration elements are selected.
 */
router.get('enum/keys/:root', getAllEnumerationKeys, 'keys')
    .pathParam('root', enumSchema)
    .response(List, 'Flat list of all enumeration term keys.')
    .summary('Return flattened list of all enumeration keys')
    .description(dd
        `
            Provided the root to an enumeration, will return the flattened list of all enumeration keys.
        `
    );

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
    const root = request.pathParams.root;

    //
    // Query database.
    //
    const result = dictionary.getAllEnumerations(root);

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
    const root = request.pathParams.root;

    //
    // Query database.
    //
    const result = dictionary.getAllEnumerationKeys(root);

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