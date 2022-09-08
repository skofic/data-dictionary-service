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
// Local globals.
//
let report = {}
let result = true
let descriptor = "not used"

//
// Validate boolean.
//
describe('validateBoolean()', function () {

    describe('Boolean works: true.', function () {
        let type = { "_type": "_type:boolean" }
        let value = [ { "value": true }, "value" ]

        it('Should succeed.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateBoolean(type, value, report)

            expect(result).to.equal(true)
        })

        it('Ensure report has status.', function () {
            expect(report.hasOwnProperty("status")).to.equal(true)
        })
        it('Ensure report status has code.', function () {
            expect(report.status.hasOwnProperty("code")).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(0)
        })
    })

}) // validateBoolean()
