/*global describe, it */
'use strict'

//
// Libraries.
//
const expect = require('chai').expect

//
// Functions.
//
const validation = require("../../utils/validation");

//
// Types.
//
const ValidationReport = require('../../models/ValidationReport')

//
// Test should pass.
//
describe('Default test.', function () {
    it('It must succeed.', function () {
        expect(true).to.equal(true)
    })
})
