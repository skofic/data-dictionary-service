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
// validateValue()
//
describe('validateValue()', function () {

    //
    // Ignore empty data block.
    //
    it('Empty block succeeds: {}.', function () {
        let type = {}
        let value = [{"value": "wrong"}, "value"]

        report = new ValidationReport(descriptor, value)
        result = validation.validateValue(type, value, report)

        expect(result).to.equal(true)
    })

    //
    // Handle type.
    //
    describe('Parse type', function () {

        it('Boolean: true.', function () {
            let type = { "_type": "_type_boolean" }
            let value = [{"value": true}, "value"]

            report = new ValidationReport(descriptor, value)
            result = validation.validateValue(type, value, report)

            expect(result).to.equal(true)
        })

        it('Integer: 12.', function () {
            let type = { "_type": "_type_integer" }
            let value = [{"value": 12}, "value"]

            report = new ValidationReport(descriptor, value)
            result = validation.validateValue(type, value, report)

            expect(result).to.equal(true)
        })

        it('Number: 1.7.', function () {
            let type = { "_type": "_type_number" }
            let value = [{"value": 1.7}, "value"]

            report = new ValidationReport(descriptor, value)
            result = validation.validateValue(type, value, report)

            expect(result).to.equal(true)
        })

        it('Timestamp: "August 19, 1975 23:15:30".', function () {
            let type = { "_type": "_type_number_timestamp" }
            let value = [{"value": "August 19, 1975 23:15:30"}, "value"]

            report = new ValidationReport(descriptor, value)
            result = validation.validateValue(type, value, report)

            expect(result).to.equal(true)
        })

        it('String: "A string".', function () {
            let type = { "_type": "_type_string" }
            let value = [{"value": "A string"}, "value"]

            report = new ValidationReport(descriptor, value)
            result = validation.validateValue(type, value, report)

            expect(result).to.equal(true)
        })

        it('Term key: "_type_string_key".', function () {
            let type = { "_type": "_type_string_key" }
            let value = [{"value": "_type_string_key"}, "value"]

            report = new ValidationReport(descriptor, value)
            result = validation.validateValue(type, value, report)

            expect(result).to.equal(true)
        })

        it('Document handle: "terms/_unit".', function () {
            let type = { "_type": "_type_string_handle" }
            let value = [{"value": "terms/_unit"}, "value"]

            report = new ValidationReport(descriptor, value)
            result = validation.validateValue(type, value, report)

            expect(result).to.equal(true)
        })

        it('Enumeration: "_unit".', function () {
            let type = { "_type": "_type_string_enum", "_kind": "_any-term" }
            let value = [{"value": "_unit"}, "value"]

            report = new ValidationReport(descriptor, value)
            result = validation.validateValue(type, value, report)

            expect(result).to.equal(true)
        })

        it('Object: "{ "key": "value" }".', function () {
            let type = { "_type": "_type_object", "_kind": "_any-object" }
            let value = [{"value": { "key": "value" }}, "value"]

            report = new ValidationReport(descriptor, value)
            result = validation.validateValue(type, value, report)

            expect(result).to.equal(true)
        })

        it('GeoJSON geometry: (a GeoJSON object).', function () {
            let type = { "_type": "_type_object_geo-json" }
            let value = [{"value": {"geometry": {"type": "Point", "coordinates": [125.6, 10.1]}}}, "value"]

            report = new ValidationReport(descriptor, value)
            result = validation.validateValue(type, value, report)

            expect(result).to.equal(false) &&
            expect(report.status.code).to.equal(-6)
        })

        it('Unsupported type: "unknown".', function () {
            let type = { "_type": "unknown" }
            let value = [{"value": "something"}, "value"]

            report = new ValidationReport(descriptor, value)
            result = validation.validateValue(type, value, report)

            expect(result).to.equal(false) &&
            expect(report.status.code).to.equal(-5)
        })
    })

}) // validateValue()
