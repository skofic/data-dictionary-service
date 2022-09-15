'use strict';

const _ = require('lodash');
const joi = require('joi');

module.exports = {
    schema: joi.object(),
    forClient(obj) {
        // Implement outgoing transformations here
        return obj;
    },
    fromClient(obj) {
        // Implement incoming transformations here
        return obj;
    }
};
