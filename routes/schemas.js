'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Schema = require('../models/schema');

const schemas = module.context.collection('schemas');
const keySchema = joi.string().required()
.description('The key of the schema');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('schema');


const NewSchema = Object.assign({}, Schema, {
  schema: Object.assign({}, Schema.schema, {
    _from: joi.string(),
    _to: joi.string()
  })
});

/*
router.get(function (req, res) {
  res.send(schemas.all());
}, 'list')
.response([Schema], 'A list of schemas.')
.summary('List all schemas')
.description(dd`
  Retrieves a list of all schemas.
`);
*/

router.post(function (req, res) {
  const schema = req.body;
  let meta;
  try {
    meta = schemas.save(schema._from, schema._to, schema);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(schema, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: schema._key})
  ));
  res.send(schema);
}, 'create')
.body(NewSchema, 'The schema to create.')
.response(201, Schema, 'The created schema.')
.error(HTTP_CONFLICT, 'The schema already exists.')
.summary('Create a new schema')
.description(dd`
  Creates a new schema from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let schema
  try {
    schema = schemas.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(schema);
}, 'detail')
.pathParam('key', keySchema)
.response(Schema, 'The schema.')
.summary('Fetch a schema')
.description(dd`
  Retrieves a schema by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const schema = req.body;
  let meta;
  try {
    meta = schemas.replace(key, schema);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(schema, meta);
  res.send(schema);
}, 'replace')
.pathParam('key', keySchema)
.body(Schema, 'The data to replace the schema with.')
.response(Schema, 'The new schema.')
.summary('Replace a schema')
.description(dd`
  Replaces an existing schema with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let schema;
  try {
    schemas.update(key, patchData);
    schema = schemas.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(schema);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the schema with.'))
.response(Schema, 'The updated schema.')
.summary('Update a schema')
.description(dd`
  Patches a schema with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    schemas.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a schema')
.description(dd`
  Deletes a schema from the database.
`);
