'use strict';

/**
 * Test services
 *
 * This path is used to test services.
 */

//
// Import frameworks.
//
const dd = require('dedent');							// For multiline text.
const fs = require('fs');								// File system utilities.
const errors = require('@arangodb').errors;				// ArangoDB errors.
const createRouter = require('@arangodb/foxx/router');  // Router class.

//
//* Import models.
//
const Term = require('../models/term');                 // Term model.

//
// Application.
//
const reader = require('../utils/JsonLReader')
const utils = require('../utils/utils');                // Utility functions.


//
// Instantiate router.
//
const router = createRouter();
module.exports = router;

//
// Set router tags.
//
router.tag( 'test' );


/**
 * Current test
 *
 * The service will return the result for the current test.
 *
 * @path		/test/current/:test
 * @verb		get
 * @response	{JSON}.
 */
router.get(
    '/test/current/:test',
    (request, response) => {

        const target = request.pathParams.test;

        response.send({
            "found": utils.getTerm(target)
        })
    },
)
    .response([Term], 'A list of terms.')
    .summary(
        "Check if database is on-line."
    )
    .description(dd`
  Returns a "pong" response.
`);


/**
 * Ping
 *
 * The service will return pong.
 *
 * @path		/ping
 * @verb		get
 * @response	{String}	"pong".
 */
router.get(
    '/ping',
    (request, response) => { response.send( 'pong' ); },
    'ping'
)
    .response(
        200,
        [ 'application/text' ],
        "The ping response"
    )
    .summary(
        "Check if database is on-line."
    )
    .description(dd`
  Returns a "pong" response.
`);


/**
 * Mirror GET request contents
 *
 * The service will return the GET request contents.
 *
 * @path		/echo-get
 * @verb		get
 * @response	{Object}	The GET request contents.
 */
router.get(
    '/echo/get',
    (request, response) => { response.send( request ); },
    'echoGET'
)
    .response(
        200,
        [ 'application/json' ],
        "Request echo"
    )
    .summary(
        "Echo GET request"
    )
    .description(dd`
  The service will return the GET request contents.
`);


/**
 * Mirror POST request contents
 *
 * The service will return the request contents.
 *
 * @path		/echo-post
 * @verb		post
 * @response	{Object}	The POST request contents.
 */
router.post(
    '/echo/post',
    (request, response) => { response.send( request ); },
    'echoPOST'
)
    .body(
        [ 'application/json' ],
        "Request contents."
    )
    .response(
        [ 'application/json' ],
        "Request echo."
    )
    .summary(
        "Echo POST request"
    )
    .description(dd`
  Returns the POST request contents.
`);


/**
 * Test get base path
 *
 * The service will return the base path.
 *
 * @path		/path/base
 * @verb		get
 * @response	{Object}	The request contents.
 */
router.get(
    '/path/base',
    (request, response) => { response.send( module.context.basePath ); },
    'echoGET'
)
    .response(
        200,
        [ 'application/text' ],
        "Base path."
    )
    .summary(
        "Returns base path"
    )
    .description(dd`
  Returns the base path.
`);


/**
 * Test get temp directory
 *
 * The service will return the temp directory path.
 *
 * @path		/path/temp
 * @verb		get
 * @response	{String}	The temp directory path.
 */
router.get(
    '/path/temp',
    (request, response) => { response.send( fs.getTempPath() ); },
    'tempPath'
)
    .response(
        [ 'application/text' ],
        "Temp path."
    )
    .summary(
        "Returns temp path"
    )
    .description(dd`
  Returns the temp path.
`);


/**
 * Test get temp file
 *
 * The service will return the temp file path.
 *
 * @path		/path/temp
 * @verb		get
 * @response	{String}	The temp file path.
 */
router.get(
    '/path/temp/file',
    (request, response) => {
        response.send( fs.getTempFile( fs.getTempPath(), false ) );
    },
    'tempPath'
)
    .response(
        [ 'application/text' ],
        "Temp path."
    )
    .summary(
        "Returns temp path"
    )
    .description(dd`
  Returns the temp path.
`);


/**
 * Ping
 *
 * The service is used for ad-hoc tests.
 *
 * @path		/prova
 * @verb		get
 * @response	{String}.
 */
router.get(
    '/prova',
    (request, response) => {
        const rd = new reader('pippo');
        response.send( 'pong' );
    },
    'ping'
)
    .response(
        200,
        [ 'application/text' ],
        "The ping response"
    )
    .summary(
        "Check if on-line"
    )
    .description(dd`
  Returns a ping response
`);
