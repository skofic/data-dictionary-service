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
// validateDictionary()
//
describe('validateDictionary()', function () {

    //
    // Require key and data definitions.
    //
    describe('Require key and data definitions in type.', function () {

        describe('Missing both blocks: {}.', function () {
            let type = {}
            let value = [ { "value": { "key": "value" } }, "value" ]

            it('Should fail.', function () {

                report = new ValidationReport(descriptor, value)
                result = validation.validateDictionary(type, value, report)

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
            it('Ensure report status has block.', function () {
                expect(report.status.hasOwnProperty("block")).to.equal(true)
            })
            it('Ensure report status has property.', function () {
                expect(report.status.hasOwnProperty("property")).to.equal(true)
            })

            it('Ensure status code is correct.', function () {
                expect(report.status.code).to.equal(-3)
            })
            it('Ensure status block is correct.', function () {
                expect(report.status.block).to.equal(type)
            })
            it('Ensure status property is dictionary key.', function () {
                expect(report.status.property).to.equal("_dict_key")
            })
        })

        describe('Missing key block: { "_dict_value": {} }.', function () {
            let type = { "_dict_value": {} }
            let value = [ { "value": { "key": "value" } }, "value" ]

            it('Should fail.', function () {

                report = new ValidationReport(descriptor, value)
                result = validation.validateDictionary(type, value, report)

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
            it('Ensure report status has block.', function () {
                expect(report.status.hasOwnProperty("block")).to.equal(true)
            })
            it('Ensure report status has property.', function () {
                expect(report.status.hasOwnProperty("property")).to.equal(true)
            })

            it('Ensure status code is correct.', function () {
                expect(report.status.code).to.equal(-3)
            })
            it('Ensure status block is correct.', function () {
                expect(report.status.block).to.equal(type)
            })
            it('Ensure status property is dictionary key.', function () {
                expect(report.status.property).to.equal("_dict_key")
            })
        })

        describe('Missing value block: { "_dict_key": {} }.', function () {
            let type = { "_dict_key": {} }
            let value = [ { "value": { "key": "value" } }, "value" ]

            it('Should fail.', function () {

                report = new ValidationReport(descriptor, value)
                result = validation.validateDictionary(type, value, report)

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
            it('Ensure report status has block.', function () {
                expect(report.status.hasOwnProperty("block")).to.equal(true)
            })
            it('Ensure report status has property.', function () {
                expect(report.status.hasOwnProperty("property")).to.equal(true)
            })

            it('Ensure status code is correct.', function () {
                expect(report.status.code).to.equal(-3)
            })
            it('Ensure status block is correct.', function () {
                expect(report.status.block).to.equal(type)
            })
            it('Ensure status property is dictionary key.', function () {
                expect(report.status.property).to.equal("_dict_value")
            })
        })

        describe('Has key and data blocks: { "_dict_key": {}, "_dict_value": {} }.', function () {
            let type = { "_dict_key": {}, "_dict_value": {} }
            let value = [ { "value": { "_code": [1, 2,"3"] } }, "value" ]

            it('Should succeed.', function () {

                report = new ValidationReport(descriptor, value)
                result = validation.validateDictionary(type, value, report)

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
    })

    describe('Incorrect type in key block: { "_dict_key": { "_type": "_type_string" }, "_dict_value": {} }.', function () {
        let type = { "_dict_key": { "_type": "_type_string" }, "_dict_value": {} }
        let value = [ { "value": { "key": "value" } }, "value" ]

        it('Should fail.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateDictionary(type, value, report)

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
        it('Ensure report status has block.', function () {
            expect(report.status.hasOwnProperty("block")).to.equal(true)
        })
        it('Ensure report status has property.', function () {
            expect(report.status.hasOwnProperty("property")).to.equal(true)
        })

        it('Ensure status code is correct.', function () {
            expect(report.status.code).to.equal(-5)
        })
        it('Ensure status block is correct.', function () {
            expect(report.status.block).to.equal(type)
        })
        it('Ensure status property is dictionary key.', function () {
            expect(report.status.property).to.equal("_type")
        })
    })

}) // validateDictionary()
