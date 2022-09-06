/*global describe, it */
'use strict'

//
// Libraries.
//
const expect = require('chai').expect

//
// Functions.
//
const utils = require('../utils/utils')

//
// Types.
//
const ValidationReport = require('../models/ValidationReport')
const validation = require("../utils/validation");

//
// Test functions.
//
describe('Functions', function () {
    let report = {}
    let result = true

    //
    // validateDescriptor()
    //
    describe('validateDescriptor()', function () {
        let value = null
        let descriptor = null

        it('Ensure known descriptors are parsed.', function () {
            descriptor = "_code"
            value = "code"

            report = new ValidationReport(descriptor, value)
            result = validation.validateDescriptor(descriptor, [report, "value"], report)

            if(!result) {
                if(report.hasOwnProperty("status")) {
                    report.status["descriptor"] = report.current
                }
            }
            delete report.current

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
        it('Ensure status descriptor is correct.', function () {
            expect(report.status.descriptor).to.equal("_code")
        })
        it('Ensure status value is correct.', function () {
            expect(report.status.value).to.equal("code")
        })

        it('Ensure unknown descriptors are not parsed.', function () {
            descriptor = "unknown"
            value = { "_code": "code" }

            report = new ValidationReport(descriptor, value)
            result = validation.validateDescriptor(descriptor, [report, "value"], report)

            expect(result).to.equal(true)
        })

    }) // validateDescriptor()

    //
    // validateDataBlock()
    //
    describe('validateDataBlock()', function () {
        let type = {}
        let value = null

        it('Ensure empty data block does not validate.', function () {
            value = "wrong"

            report = new ValidationReport("_code", value)
            result = validation.validateDataBlock(type, value, report)

            if(!result) {
                if(report.hasOwnProperty("status")) {
                    report.status["descriptor"] = report.current
                }
            }
            delete report.current

            expect(result).to.equal(true)
        })

        it('Ensure report has status.', function () {
            expect(report.hasOwnProperty("status")).to.equal(true)
        })
        it('Ensure report status has code.', function () {
            expect(report.status.hasOwnProperty("code")).to.equal(true)
        })
        it('Ensure report status has no descriptor.', function () {
            expect(report.status.hasOwnProperty("descriptor")).to.equal(false)
        })
        it('Ensure report status has no value.', function () {
            expect(report.status.hasOwnProperty("value")).to.equal(false)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(0)
        })

        it('Ensure data block can be empty or correct.', function () {
            type = {"something": "not expected"}
            value = "wrong"

            report = new ValidationReport("not relevant", value)
            result = validation.validateDataBlock(type, value, report)

            if(!result) {
                if(report.hasOwnProperty("status")) {
                    report.status["descriptor"] = report.current
                }
            }
            delete report.current

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
        it('Ensure report status has no value.', function () {
            expect(report.status.hasOwnProperty("value")).to.equal(false)
        })
        it('Ensure report status has descriptor.', function () {
            expect(report.status.hasOwnProperty("descriptor")).to.equal(!result)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(-3)
        })
        it('Ensure status block is correct.', function () {
            expect(report.status.block).to.equal(type)
        })

    }) // validateDataBlock()
})
