'use strict';

const joi = require('joi');

module.exports = {
    schema: {
        descriptor: joi.string().required(),
        language: joi.string(),
        value: joi.any().required()
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
