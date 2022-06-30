'use strict';
const _ = require('lodash');
const joi = require('joi');
const crypto = require('@arangodb/crypto');

module.exports = {
  schema: {
    // Describe the attributes with joi here
    _key: joi.string().required(),
    _from: joi.string().required(),
    _to: joi.string().required(),
    _predicate: joi.string().required(),
    _path: joi.array().items(joi.string()).required()
  },
  forClient(obj) {
    // Implement outgoing transformations here
    obj = _.omit(obj, ['_id', '_rev', '_oldRev']);
    return obj;
  },
  fromClient(obj) {
    // Implement incoming transformations here

    //
    // Create edge key.
    //
    obj._key = crypto.md5(
        obj._from       +
        '_'             +
        obj._predicate  +
        '_'             +
        obj._to
    )

    return obj;
  }
};
