'use strict';

const _ = require('lodash');
const joi = require('joi');

module.exports = {
    schema: {
        definition: joi.object().required(),
        value: joi.any().required(),
        result: joi.object().required()
    },
    forClient(obj) {
        // Implement outgoing transformations here
        return obj;
    },
    fromClient(obj) {
        // Implement incoming transformations here
        return obj;
    }
};
