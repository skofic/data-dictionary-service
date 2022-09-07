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
// validateDataBlock()
//
describe('validateDataBlock()', function () {

    //
    // Ignore empty data block.
    //
    describe('Ensure empty data block does not validate: { "_code": "wrong" }.', function () {
        let type = {}
        let value = [{"value": "wrong"}, "value"]

        it('Does not throw error.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateDataBlock(type, value, report)

            if(!result) {
                if(report.hasOwnProperty("status")) {
                    report.status["descriptor"] = report.current
                }
            }
            if(report.hasOwnProperty("current")) {
                delete report.current
            }

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
    describe('Ensure data block can only be empty or correct: { "_data": { "something": "not expected" } }.', function () {

        let type = { "something": "not expected" }
        let value = [{"value": "wrong"}, "value"]

        it('Should throw error.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateDataBlock(type, value, report)

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
        it('Ensure report status has block.', function () {
            expect(report.status.hasOwnProperty("block")).to.equal(true)
        })
        it('Ensure report status has descriptor.', function () {
            expect(report.status.hasOwnProperty("descriptor")).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(-3)
        })
        it('Ensure status block is correct.', function () {
            expect(report.status.block).to.equal(type)
        })
    })

}) // validateDataBlock()
