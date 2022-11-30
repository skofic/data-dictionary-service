'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Term = require('../models/term');
const K = require("../utils/constants");

const old_terms = K.db._collection(K.collection.term.name)
const keySchema = joi.string().required()
.description('The key of the term');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('UNSAFE TERM SERVICES');

/*
router.get(function (req, res) {
  res.send(terms.all());
}, 'list')
.response([Term], 'A list of terms.')
.summary('List all terms')
.description(dd`
  Retrieves a list of all terms.
`);
*/

/*
router.post(function (req, res) {
  const term = req.body;
  let meta;
  try {
    meta = old_terms.save(term);
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
 */

/*
router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let term
  try {
    term = old_terms.document(key);
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
 */

router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const term = req.body;
  let meta;
  try {
    meta = old_terms.replace(key, term);
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
    old_terms.update(key, patchData);
    term = old_terms.document(key);
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
    old_terms.remove(key);
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
