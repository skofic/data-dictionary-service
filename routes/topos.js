'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Topo = require('../models/topo');

const topos = module.context.collection('topos');
const keySchema = joi.string().required()
.description('The key of the topo');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('topo');


const NewTopo = Object.assign({}, Topo, {
  schema: Object.assign({}, Topo.schema, {
    _from: joi.string(),
    _to: joi.string()
  })
});

/*
router.get(function (req, res) {
  res.send(topos.all());
}, 'list')
.response([Topo], 'A list of topos.')
.summary('List all topos')
.description(dd`
  Retrieves a list of all topos.
`);
*/

router.post(function (req, res) {
  const topo = req.body;
  let meta;
  try {
    meta = topos.save(topo._from, topo._to, topo);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(topo, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: topo._key})
  ));
  res.send(topo);
}, 'create')
.body(NewTopo, 'The topo to create.')
.response(201, Topo, 'The created topo.')
.error(HTTP_CONFLICT, 'The topo already exists.')
.summary('Create a new topo')
.description(dd`
  Creates a new topo from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let topo
  try {
    topo = topos.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(topo);
}, 'detail')
.pathParam('key', keySchema)
.response(Topo, 'The topo.')
.summary('Fetch a topo')
.description(dd`
  Retrieves a topo by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const topo = req.body;
  let meta;
  try {
    meta = topos.replace(key, topo);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(topo, meta);
  res.send(topo);
}, 'replace')
.pathParam('key', keySchema)
.body(Topo, 'The data to replace the topo with.')
.response(Topo, 'The new topo.')
.summary('Replace a topo')
.description(dd`
  Replaces an existing topo with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let topo;
  try {
    topos.update(key, patchData);
    topo = topos.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(topo);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the topo with.'))
.response(Topo, 'The updated topo.')
.summary('Update a topo')
.description(dd`
  Patches a topo with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    topos.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a topo')
.description(dd`
  Deletes a topo from the database.
`);
