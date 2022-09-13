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
// Local constants.
//
const date = new Date("1957/07/28")
const min  = new Date("1957/01/01")
const max  = new Date("1957/12/31")

//
// Local globals.
//
let report = {}
let result = true
let descriptor = "not used"

//
// Validate boolean.
//
describe('validateTimestamp()', function () {

    describe('Timestamp fails: true.', function () {
        let type = { "_type": "_type_timestamp" }
        let value = [ { "value": true }, "value" ]

        it('Should fail.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateTimestamp(type, value, report)

            expect(result).to.equal(false)
        })

        it('Ensure report has status.', function () {
            expect(report.hasOwnProperty("status")).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(28)
        })
    })

    describe('Timestamp fails: false.', function () {
        let type = { "_type": "_type_timestamp" }
        let value = [ { "value": false }, "value" ]

        it('Should fail.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateTimestamp(type, value, report)

            expect(result).to.equal(false)
        })

        it('Ensure report has status.', function () {
            expect(report.hasOwnProperty("status")).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(28)
        })
    })

    describe('Timestamp succeeds with integer: -392259600000.', function () {
        let type = { "_type": "_type_timestamp", "_valid-range": {"_min-range-inclusive": -410230800000, "_max-range-inclusive": -378781200000 } }
        let value = [ { "value": -392259600000 }, "value" ]

        it('Should succeed.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateTimestamp(type, value, report)

            expect(result).to.equal(true)
        })

        it('Ensure report has status.', function () {
            expect(report.hasOwnProperty("status")).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(0)
        })
    })

    describe('Timestamp fails with integer: -510230800000.', function () {
        let type = { "_type": "_type_timestamp", "_valid-range": {"_min-range-inclusive": -410230800000, "_max-range-inclusive": -378781200000 } }
        let value = [ { "value": -510230800000 }, "value" ]

        it('Should fail.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateTimestamp(type, value, report)

            expect(result).to.equal(false)
        })

        it('Ensure report has status.', function () {
            expect(report.hasOwnProperty("status")).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(17)
        })
    })

    describe('Timestamp fails with number: -392259600000.7.', function () {
        let type = { "_type": "_type_timestamp", "_valid-range": {"_min-range-inclusive": -410230800000, "_max-range-inclusive": -378781200000 } }
        let value = [ { "value": -392259600000.7 }, "value" ]

        it('Should succeed.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateTimestamp(type, value, report)

            expect(result).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(0)
        })
    })

    describe('Timestamp fails with string: "true".', function () {
        let type = { "_type": "_type_timestamp" }
        let value = [ { "value": "true" }, "value" ]

        it('Should fail.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateTimestamp(type, value, report)

            expect(result).to.equal(false)
        })

        it('Ensure report has status.', function () {
            expect(report.hasOwnProperty("status")).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(28)
        })
    })

    describe('Timestamp fails with object: {"key": "value"}.', function () {
        let type = { "_type": "_type_timestamp" }
        let value = [ { "value": {"key": "value"} }, "value" ]

        it('Should fail.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateTimestamp(type, value, report)

            expect(result).to.equal(false)
        })

        it('Ensure report has status.', function () {
            expect(report.hasOwnProperty("status")).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(28)
        })
    })

}) // validateTimestamp()
