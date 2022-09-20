'use strict';

const joi = require('joi');

module.exports = {
    schema: {
        descriptor: joi.string().required(),
        value: joi.any().required(),
        language: joi.string(),
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
