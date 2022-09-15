'use strict';

const joi = require('joi');

module.exports = {
    schema: {
        language: joi.string(),
        value: joi.object().required()
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
