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

        //
        // Ignore unknown descriptors.
        //
        describe('Ensure unknown descriptors are not parsed.',function () {
            let descriptor = "unknown"
            let value = [{"value": { "_code": "code" }}, "value"]

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
            it('Ensure report status has no descriptor.', function () {
                expect(report.status.hasOwnProperty("descriptor")).to.equal(false)
            })
            it('Ensure report status has no value.', function () {
                expect(report.status.hasOwnProperty("value")).to.equal(false)
            })

            it('Ensure status code is correct.', function () {
                expect(report.status.code).to.equal(0)
            })
        })

        //
        // Consider known descriptors.
        //
        describe('Ensure known descriptors are parsed.',function () {
            let descriptor = "_code"
            let value = [{"value": "code"}, "value"]

            it('Should throw error.', function () {

                report = new ValidationReport(descriptor, value)
                result = validation.validateDescriptor(descriptor, value, report)

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
        })

    }) // validateDescriptor()

    //
    // validateDataBlock()
    //
    describe('validateDataBlock()', function () {

        //
        // Ignore empty data block.
        //
        describe('Ensure empty data block does not validate.',function () {
            let type = {}
            let value = [{"value": "wrong"}, "value"]

            it('Does not throw error.', function () {

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
        })

        //
        // Consider known descriptors.
        //
        describe('Ensure data block can only be empty or correct.',function () {
            let type = {"something": "not expected"}
            let value = [{"value": "wrong"}, "value"]

            it('Should throw error.', function () {

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
        })

    }) // validateDataBlock()

    //
    // validateScalar()
    //
    describe('validateScalar()', function () {

        //
        // Ensure value is a scalar.
        //
        describe('Ensure empty data block filters arrays.',function () {
            let type = {}
            let value = [ {"value": [1]}, "value" ]

            it('Should throw error.', function () {

                report = new ValidationReport("_code", value)
                result = validation.validateScalar(type, value, report)

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
                expect(report.status.code).to.equal(9)
            })
        })

        //
        // Ensure value is a string.
        //
        describe('Ensure value is a string.', function () {

            //
            // A string is a string.
            //
            describe('A string is a string.', function () {
                let type = {"_type": "_type_string"}
                let value = [{"value": "a string"}, "value"]

                it('Scalar string.', function () {

                    report = new ValidationReport("not used", value)
                    result = validation.validateScalar(type, value, report)

                    if (!result) {
                        if (report.hasOwnProperty("status")) {
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
            })

            //
            // A boolean is not a string.
            //
            describe('A boolean is not a string.', function () {
                let type = {"_type": "_type_string"}
                let value = [{"value": 12}, "value"]

                it('Scalar integer.', function () {

                    report = new ValidationReport("not used", value)
                    result = validation.validateScalar(type, value, report)

                    if (!result) {
                        if (report.hasOwnProperty("status")) {
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
                it('Ensure report status has no block.', function () {
                    expect(report.status.hasOwnProperty("block")).to.equal(false)
                })
                it('Ensure report status has no value.', function () {
                    expect(report.status.hasOwnProperty("value")).to.equal(true)
                })
                it('Ensure report status has descriptor.', function () {
                    expect(report.status.hasOwnProperty("descriptor")).to.equal(!result)
                })

                it('Ensure status code is correct.', function () {
                    expect(report.status.code).to.equal(14)
                })
            })

            //
            // An integer is not a string.
            //
            describe('An integer is not a string.', function () {
                let type = {"_type": "_type_string"}
                let value = [{"value": 12}, "value"]

                it('Scalar integer.', function () {

                    report = new ValidationReport("not used", value)
                    result = validation.validateScalar(type, value, report)

                    if (!result) {
                        if (report.hasOwnProperty("status")) {
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
                it('Ensure report status has no block.', function () {
                    expect(report.status.hasOwnProperty("block")).to.equal(false)
                })
                it('Ensure report status has no value.', function () {
                    expect(report.status.hasOwnProperty("value")).to.equal(true)
                })
                it('Ensure report status has descriptor.', function () {
                    expect(report.status.hasOwnProperty("descriptor")).to.equal(!result)
                })

                it('Ensure status code is correct.', function () {
                    expect(report.status.code).to.equal(14)
                })
            })

            //
            // A number is not a string.
            //
            describe('A number is not a string.', function () {
                let type = {"_type": "_type_string"}
                let value = [{"value": 7.32}, "value"]

                it('Scalar integer.', function () {

                    report = new ValidationReport("not used", value)
                    result = validation.validateScalar(type, value, report)

                    if (!result) {
                        if (report.hasOwnProperty("status")) {
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
                it('Ensure report status has no block.', function () {
                    expect(report.status.hasOwnProperty("block")).to.equal(false)
                })
                it('Ensure report status has no value.', function () {
                    expect(report.status.hasOwnProperty("value")).to.equal(true)
                })
                it('Ensure report status has descriptor.', function () {
                    expect(report.status.hasOwnProperty("descriptor")).to.equal(!result)
                })

                it('Ensure status code is correct.', function () {
                    expect(report.status.code).to.equal(14)
                })
            })

            //
            // An object is not a string.
            // Note that this also covers dictionaries.
            //
            describe('An object is not a string.', function () {
                let type = {"_type": "_type_string"}
                let value = [{"value": {"Uno": 1}}, "value"]

                it('Scalar integer.', function () {

                    report = new ValidationReport("not used", value)
                    result = validation.validateScalar(type, value, report)

                    if (!result) {
                        if (report.hasOwnProperty("status")) {
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
                it('Ensure report status has no block.', function () {
                    expect(report.status.hasOwnProperty("block")).to.equal(false)
                })
                it('Ensure report status has no value.', function () {
                    expect(report.status.hasOwnProperty("value")).to.equal(true)
                })
                it('Ensure report status has descriptor.', function () {
                    expect(report.status.hasOwnProperty("descriptor")).to.equal(!result)
                })

                it('Ensure status code is correct.', function () {
                    expect(report.status.code).to.equal(14)
                })
            })
        })

        //
        // Ensure regular expressions work.
        // Remember not to put spaces in regex...
        //
        describe('Validate regular expression.', function () {

            describe('"ITA003" for ^[A-Z]{3,3}[0-9]{3,4}$', function () {
                let type = { "_type": "_type_string" , "_regexp": "^[A-Z]{3,3}[0-9]{3,4}$"}
                let value = [ {"value": "ITA003"}, "value" ]

                it('Should succeed.', function () {

                    report = new ValidationReport("not used", value)
                    result = validation.validateScalar(type, value, report)

                    if(!result) {
                        if(report.hasOwnProperty("status")) {
                            report.status["descriptor"] = report.current
                        }
                    }
                    delete report.current

                    expect(result).to.equal(true)
                    // expect(JSON.stringify(report)).to.equal(true)
                })

                it('Ensure report has status.', function () {
                    expect(report.hasOwnProperty("status")).to.equal(true)
                })
                it('Ensure report status has code.', function () {
                    expect(report.status.hasOwnProperty("code")).to.equal(true)
                })
                it('Ensure report status has descriptor.', function () {
                    expect(report.status.hasOwnProperty("regexp")).to.equal(false)
                })
                it('Ensure report status has no value.', function () {
                    expect(report.status.hasOwnProperty("value")).to.equal(false)
                })

                it('Ensure status code is correct.', function () {
                    expect(report.status.code).to.equal(0)
                })
            })

            describe('"ITA0X04" for ^[A-Z]{3,3}[0-9]{3,4}$', function () {
                let type = { "_type": "_type_string" , "_regexp": "^[A-Z]{3,3}[0-9]{3,4}$"}
                let value = [ {"value": "ITA0X04"}, "value" ]

                it('Should fail.', function () {

                    report = new ValidationReport("not used", value)
                    result = validation.validateScalar(type, value, report)

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
                    expect(report.status.hasOwnProperty("regexp")).to.equal(true)
                })
                it('Ensure report status has no value.', function () {
                    expect(report.status.hasOwnProperty("value")).to.equal(true)
                })

                it('Ensure status code is correct.', function () {
                    expect(report.status.code).to.equal(19)
                })
                it('Ensure status value is correct.', function () {
                    expect(report.status.value).to.equal(value[0][value[1]])
                })
            })
        })

    }) // validateScalar()

})
