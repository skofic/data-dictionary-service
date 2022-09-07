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

//
// validateDescriptor()
//
describe('validateDescriptor()', function () {

    //
    // Ignore unknown descriptors.
    //
    describe('Ensure unknown descriptors are not parsed: { "unknown": { "_code": "wrong" } }', function () {
        let descriptor = "unknown"
        let value = [ { "value": { "_code": "wrong" } }, "value" ]

        it('Does not throw error.', function () {

            report = new ValidationReport(descriptor, value[0,[value[1]]])
            result = validation.validateDescriptor(descriptor, value, report)

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

    //
    // Consider known descriptors.
    //
    describe('Ensure known descriptors are parsed: { "_code": "wrong" }.', function () {
        let descriptor = "_code"
        let value = [{"value": "wrong"}, "value"]

        it('Should throw error.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateDescriptor(descriptor, value, report)

            if(!result) {
                if(report.hasOwnProperty("status")) {
                    report.status["descriptor"] = report.current
                }
            }
            if(report.hasOwnProperty("current")) {
                delete report.current
            }

            expect(result).to.equal(false)
        })

        it('Ensure report has status.', function () {
            expect(report.hasOwnProperty("status")).to.equal(true)
        })
        it('Ensure report status has code.', function () {
            expect(report.status.hasOwnProperty("code")).to.equal(true)
        })
        it('Ensure report status has descriptor.', function () {
            expect(report.status.hasOwnProperty("descriptor")).to.equal(true)
        })
        it('Ensure report status has value.', function () {
            expect(report.status.hasOwnProperty("value")).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(11)
        })
    })

}) // validateDescriptor()
