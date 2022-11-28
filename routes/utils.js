'use strict'

/**
 * Administration utility services
 */

//
// Import frameworks.
//
const fs = require('fs')
const joi = require('joi')
const dd = require('dedent')

//
// Application constants.
//
const K = require('../utils/constants')
const Session = require('../utils/sessions')

//
// Instantiate and export router.
//
const createRouter = require('@arangodb/foxx/router')
const router = createRouter()
module.exports = router
router.tag( 'Administration utilities' )


/**
 * Ping
 * The service will return pong.
 */
router.get('/ping', doPong, 'ping')
    .summary("Check if database is on-line.")
    .description(dd
        `
            **Ping database**
            
            The service should return "\`pong\`" if the database is on-line and responding.
        `
    )
    .response(200, joi.string().default("pong"), dd
        `
            **"pong"**
        `
    )


/**
 * Mirror GET request contents
 * The service will return the GET request contents.
 */
router.get(
    '/echo/get',
    (request, response) => {
        const roles = [K.environment.role.admin]
        if(Session.hasPermission(request, response, roles)) {
            doMirrorRequest(request, response)
        }
    },
    'echoGET'
)
    .summary("Mirror the GET request data.")
    .description(dd
        `
            **Mirror GET request data**
            
            ***To use this service, the current user must have the \`admin\` role.***
           
            The service will return the full GET request contents.
            Can be useful to debug request data.
        `
    )
    .response(200, joi.object(), dd
        `
            **The service request**
        `
    )


/**
 * Mirror POST request contents
 * The service will return the POST request contents.
 */
router.post(
    '/echo/post',
    (request, response) => {
        const roles = [K.environment.role.admin]
        if(Session.hasPermission(request, response, roles)) {
            doMirrorRequest(request, response)
        }
    },
    'echoPOST'
)
    .summary("Mirror the POST request data.")
    .description(dd
        `
            **Mirror POST request data**
            
            ***To use this service, the current user must have the \`admin\` role.***
            
            The service will return the full POST request contents.
            Can be useful to debug request data.
        `
    )
    .body(joi.any(), dd
        `
            **Body contents**
        `
    )
    .response(200, joi.object(), dd
        `
            **The service request**
        `
    )


/**
 * Return service base path
 * The service will return the base path of the application.
 */
router.get(
    '/path/base',
    (request, response) => {
        const roles = [K.environment.role.admin]
        if(Session.hasPermission(request, response, roles)) {
            doBasePath(request, response)
        }
    },
    'basePath'
)
    .summary("Return the base path.")
    .description(dd
        `
            **Return base path**
            
            ***To use this service, the current user must have the \`admin\` role.***
            
            The service will return the base path of the service application.
        `
    )
    .response(200, joi.string(), dd
        `
            The service application base path.
        `
    )


/**
 * Return service temp path
 * The service will return the temp path of the server.
 */
router.get(
    '/path/temp',
    (request, response) => {
        const roles = [K.environment.role.admin]
        if(Session.hasPermission(request, response, roles)) {
            doTempPath(request, response)
        }
    },
    'tempPath'
)
    .summary("Return the temp path.")
    .description(dd
        `
            **Return temp path**
            
            ***To use this service, the current user must have the \`admin\` role.***
            
            The service will return the temporary files path of the service server.
        `
    )
    .response(200, joi.string(), dd
        `
            The service application temporary files path.
        `
    )


/**
 * Return temp file path
 * The service will return the path to the temporary file.
 */
router.get(
    '/file/temp',
    (request, response) => {
        const roles = [K.environment.role.admin]
        if(Session.hasPermission(request, response, roles)) {
            doTempFile(request, response)
        }
    },
    'tempFile'
)
    .summary("Return the temp file path.")
    .description(dd
        `
            **Return temp file path**
             
            ***To use this service, the current user must have the \`admin\` role.***
           
            The service will return the path to a temporary file, \
            *the file will not be created*.
        `
    )
    .response(200, joi.string(), dd
        `
            The service application temporary file path.
        `
    )


/**
 * Return session
 * The service will return the current session.
 */
router.get(
    '/session',
    (request, response) => {
        const roles = [K.environment.role.admin]
        if(Session.hasPermission(request, response, roles)) {
            doSession(request, response)
        }
    },
    'session'
)
    .summary("Return the current session.")
    .description(dd
        `
            **Return current session**
            
            ***To use this service, the current user must have the \`admin\` role.***
            
            The service will return the current session information \
            from the service request.
        `
    )
    .response(200, joi.object(), dd
        `
            The current session information from the service request.
        `
    )


//
// Functions.
//

/**
 * Return pong.
 * @param request: API request.
 * @param response: API response.
 */
function doPong(request, response)
{
    response.send("pong")                                                       // ==>

} // doPong()

/**
 * Return GET request.
 * @param request: API request.
 * @param response: API response.
 */
function doMirrorRequest(request, response)
{
    response.send(request)                                                      // ==>

} // doMirrorRequest()

/**
 * Return base path.
 * @param request: API request.
 * @param response: API response.
 */
function doBasePath(request, response)
{
    response.send(module.context.basePath)                                      // ==>

} // doBasePath()

/**
 * Return temp path.
 * @param request: API request.
 * @param response: API response.
 */
function doTempPath(request, response)
{
    response.send(fs.getTempPath())                                             // ==>

} // doTempPath()

/**
 * Return temp file.
 * @param request: API request.
 * @param response: API response.
 */
function doTempFile(request, response)
{
    response.send(fs.getTempFile(fs.getTempPath(), false))                      // ==>

} // doTempFile()

/**
 * Return session.
 * @param request: API request.
 * @param response: API response.
 */
function doSession(request, response)
{
    response.send(request.session)                                              // ==>

} // doSession()
