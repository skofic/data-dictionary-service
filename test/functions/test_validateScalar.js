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
// validateScalar()
//
describe('validateScalar()', function () {

    //
    // Allow boolean.
    //
    describe('Ensure empty data block allows booleans: true.', function () {
        let type = {}
        let value = [ {"value": true}, "value" ]

        it('Should succeed.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateScalar(type, value, report)

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
    // Allow number.
    //
    describe('Ensure empty data block allows numbers: 12.47.', function () {
        let type = {}
        let value = [ {"value": 12.47}, "value" ]

        it('Should succeed.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateScalar(type, value, report)

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
    // Allow string.
    //
    describe('Ensure empty data block allows strings: "A string".', function () {
        let type = {}
        let value = [ {"value": "A string"}, "value" ]

        it('Should succeed.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateScalar(type, value, report)

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
    // Allow objects.
    //
    describe('Ensure empty data block allows objects: { "an": "object" }.', function () {
        let type = {}
        let value = [ {"value": { "an": "object" } }, "value" ]

        it('Should succeed.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateScalar(type, value, report)

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
    // Reject arrays.
    //
    describe('Ensure empty data block rejects arrays: [1].', function () {
        let type = {}
        let value = [ {"value": [1]}, "value" ]

        it('Should throw error.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateScalar(type, value, report)

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
            expect(report.status.code).to.equal(9)
        })
    })

}) // validateScalar()
