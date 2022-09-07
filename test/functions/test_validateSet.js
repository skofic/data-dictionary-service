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
// validateSet()
//
describe('validateSet()', function () {

    //
    // Reject boolean.
    //
    describe('Ensure empty data block rejects booleans: true.', function () {
        let type = {}
        let value = [ {"value": true}, "value" ]

        it('Should throw error.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateSet(type, value, report)

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
            expect(report.status.code).to.equal(7)
        })
    })

    //
    // Reject number.
    //
    describe('Ensure empty data block rejects numbers: 12.47.', function () {
        let type = {}
        let value = [ {"value": 12.47}, "value" ]

        it('Should throw error.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateSet(type, value, report)

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
            expect(report.status.code).to.equal(7)
        })
    })

    //
    // Reject string.
    //
    describe('Ensure empty data block rejects strings: "A string".', function () {
        let type = {}
        let value = [ {"value": "A string"}, "value" ]

        it('Should throw error.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateSet(type, value, report)

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
            expect(report.status.code).to.equal(7)
        })
    })

    //
    // Reject objects.
    //
    describe('Ensure empty data block rejects objects: { "an": "object" }.', function () {
        let type = {}
        let value = [ {"value": { "an": "object" } }, "value" ]

        it('Should throw error.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateSet(type, value, report)

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
            expect(report.status.code).to.equal(7)
        })
    })

    //
    // Accept arrays.
    //
    describe('Ensure empty data block accepts arrays: [ 1, 2, 3 ].', function () {
        let type = {}
        let value = [ {"value": [ 1, 2, 3 ]}, "value" ]

        it('Should succeed.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateSet(type, value, report)

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
    // Reject duplicates.
    //
    describe('Ensure empty data block rejects duplicate elements: [ 1, 2, 2, 3 ].', function () {
        let type = {}
        let value = [ {"value": [ 1, 2, 2, 3 ] }, "value" ]

        it('Should throw error.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateSet(type, value, report)

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
            expect(report.status.code).to.equal(8)
        })
    })

    //
    // Filter duplicates by type.
    //
    describe('Ensure empty data block filters duplicates by type: [ 1, 2, "2", 3 ].', function () {
        let type = {}
        let value = [ {"value": [ 1, 2, "2", 3 ] }, "value" ]

        it('Should throw error.', function () {

            report = new ValidationReport(descriptor, value)
            result = validation.validateSet(type, value, report)

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
    // Check element constraints.
    //
    describe('Check element constraints.', function () {

        describe('[1 ... 2]: [1]', function () {
            let type = { "_elements": { "_min-items": 1, "_max-items": 2 } }
            let value = [ { "value": [1] }, "value" ]

            it('Should succeed.', function () {

                report = new ValidationReport(descriptor, value)
                result = validation.validateSet(type, value, report)

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

        describe('[1 ... 2]: [1, 2]', function () {
            let type = { "_elements": { "_min-items": 1, "_max-items": 2 } }
            let value = [ { "value": [1, 2] }, "value" ]

            it('Should succeed.', function () {

                report = new ValidationReport(descriptor, value)
                result = validation.validateSet(type, value, report)

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

        describe('[1 ... 2]: []', function () {
            let type = { "_elements": { "_min-items": 1, "_max-items": 2 } }
            let value = [ { "value": [] }, "value" ]

            it('Should fail.', function () {

                report = new ValidationReport(descriptor, value)
                result = validation.validateSet(type, value, report)

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
                expect(report.status.code).to.equal(15)
            })
        })

        describe('[1 ... 2]: [1, 2, 3]', function () {
            let type = { "_elements": { "_min-items": 1, "_max-items": 2 } }
            let value = [ { "value": [1, 2, 3] }, "value" ]

            it('Should fail.', function () {

                report = new ValidationReport(descriptor, value)
                result = validation.validateSet(type, value, report)

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
                expect(report.status.code).to.equal(16)
            })
        })

        describe('[0 ...]: []', function () {
            let type = { "_elements": { "_min-items": 0 } }
            let value = [ { "value": [] }, "value" ]

            it('Should succeed.', function () {

                report = new ValidationReport(descriptor, value)
                result = validation.validateSet(type, value, report)

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

        describe('[0 ...]: [1, 2, 3]', function () {
            let type = { "_elements": { "_min-items": 0 } }
            let value = [ { "value": [1, 2, 3] }, "value" ]

            it('Should succeed.', function () {

                report = new ValidationReport(descriptor, value)
                result = validation.validateSet(type, value, report)

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

        describe('[... 2]: []', function () {
            let type = { "_elements": { "_max-items": 2 } }
            let value = [ { "value": [] }, "value" ]

            it('Should succeed.', function () {

                report = new ValidationReport(descriptor, value)
                result = validation.validateSet(type, value, report)

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

        describe('[... 2]: [1, 2, 3]', function () {
            let type = { "_elements": { "_max-items": 2 } }
            let value = [ { "value": [1, 2, 3] }, "value" ]

            it('Should fail.', function () {

                report = new ValidationReport(descriptor, value)
                result = validation.validateSet(type, value, report)

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
                expect(report.status.code).to.equal(16)
            })
        })
    })

}) // validateSet()
