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
describe('validateNumber()', function () {

    describe('Number fails: true.', function () {
        let type = { "_type": "_tupe_number" }
        let value = [ { "value": true }, "value" ]

        it('Should succeed.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateNumber(type, value, report)

            expect(result).to.equal(false)
        })

        it('Ensure report has status.', function () {
            expect(report.hasOwnProperty("status")).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(13)
        })
    })

    describe('Number fails: false.', function () {
        let type = { "_type": "_tupe_number" }
        let value = [ { "value": false }, "value" ]

        it('Should succeed.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateNumber(type, value, report)

            expect(result).to.equal(false)
        })

        it('Ensure report has status.', function () {
            expect(report.hasOwnProperty("status")).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(13)
        })
    })

    describe('Number succeeds with integer: 12.', function () {
        let type = { "_type": "_tupe_number" }
        let value = [ { "value": 12 }, "value" ]

        it('Should fail.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateNumber(type, value, report)

            expect(result).to.equal(true)
        })

        it('Ensure report has status.', function () {
            expect(report.hasOwnProperty("status")).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(0)
        })
    })

    describe('Number succeeds with number: 2.7.', function () {
        let type = { "_type": "_type_number", "_valid-range": {"_min-range-inclusive": 2.0, "_max-range-inclusive": 4.0 } }
        let value = [ { "value": 2.7 }, "value" ]

        it('Should succeed.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateNumber(type, value, report)

            expect(result).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(0)
        })

        it('Ensure value is within range: 12.0 should fail.', function () {
            value = [ { "value": 12.0 }, "value" ]
            report = new ValidationReport(descriptor, value)

            result = validation.validateNumber(type, value, report)

            expect(result).to.equal(false)
        })
    })

    describe('Number fails with string: "true".', function () {
        let type = { "_type": "_tupe_number" }
        let value = [ { "value": "true" }, "value" ]

        it('Should fail.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateNumber(type, value, report)

            expect(result).to.equal(false)
        })

        it('Ensure report has status.', function () {
            expect(report.hasOwnProperty("status")).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(13)
        })
    })

    describe('Number fails with object: {"key": "value"}.', function () {
        let type = { "_type": "_tupe_number" }
        let value = [ { "value": {"key": "value"} }, "value" ]

        it('Should fail.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateNumber(type, value, report)

            expect(result).to.equal(false)
        })

        it('Ensure report has status.', function () {
            expect(report.hasOwnProperty("status")).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(13)
        })
    })

}) // validateNumber()
