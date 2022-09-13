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
describe('validateInteger()', function () {

    describe('Integer fails: true.', function () {
        let type = { "_type": "_type_integer, " }
        let value = [ { "value": true }, "value" ]

        it('Should fail.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateInteger(type, value, report)

            expect(result).to.equal(false)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(12)
        })
    })

    describe('Integer fails: false.', function () {
        let type = { "_type": "_type_integer" }
        let value = [ { "value": false }, "value" ]

        it('Should fail.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateInteger(type, value, report)

            expect(result).to.equal(false)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(12)
        })
    })

    describe('Integer works with integer: 3.', function () {
        let type = { "_type": "_type_integer", "_valid-range": {"_min-range-inclusive": 2, "_max-range-inclusive": 4 } }
        let value = [ { "value": 3 }, "value" ]

        it('Should succeed.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateInteger(type, value, report)

            expect(result).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(0)
        })

        it('Ensure value is within range: 12 should fail.', function () {
            value = [ { "value": 12 }, "value" ]
            report = new ValidationReport(descriptor, value)

            result = validation.validateInteger(type, value, report)

            expect(result).to.equal(false)
        })
    })

    describe('Integer fails with number: 1.2.', function () {
        let type = { "_type": "_type_integer" }
        let value = [ { "value": 1.2 }, "value" ]

        it('Should fail.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateInteger(type, value, report)

            expect(result).to.equal(false)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(12)
        })
    })

    describe('Integer fails with string: "true".', function () {
        let type = { "_type": "_type_integer" }
        let value = [ { "value": "true" }, "value" ]

        it('Should fail.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateInteger(type, value, report)

            expect(result).to.equal(false)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(12)
        })
    })

    describe('Integer fails with object: {"key": "value"}.', function () {
        let type = { "_type": "_type_integer" }
        let value = [ { "value": {"key": "value"} }, "value" ]

        it('Should fail.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateInteger(type, value, report)

            expect(result).to.equal(false)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(12)
        })
    })

}) // validateInteger()
