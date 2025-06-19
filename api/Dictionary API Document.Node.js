// Warning: requests below are going to be executed in parallel

// request Contains point 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/chelsa/click?lat=46.30140&lon=7.50134',
        method: 'GET',
        headers: {}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Is within distance 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/chelsa/dist?what=KEY&min=0&max=10000&sort=ASC',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"geometry\":{\"type\":\"Point\",\"coordinates\":[7.50134,46.30140]},\"start\":0,\"limit\":10}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Is contained 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/chelsa/contain?what=KEY',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[7.495,46.307],[7.495,46.294],[7.51,46.294],[7.51,46.307],[7.495,46.307]]]},\"start\":0,\"limit\":10}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Intersects 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/chelsa/contain?what=KEY',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[7.495,46.307],[7.495,46.294],[7.51,46.294],[7.51,46.307],[7.495,46.307]]]},\"start\":0,\"limit\":10}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Contains point 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/worldclim/click?lat=46.30140&lon=7.50134',
        method: 'GET',
        headers: {}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Is within distance 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/worldclim/dist?what=KEY&min=0&max=10000&sort=ASC',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"geometry\":{\"type\":\"Point\",\"coordinates\":[7.50134,46.30140]},\"start\":0,\"limit\":10}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Is contained 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/worldclim/contain?what=KEY',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[7.495,46.307],[7.495,46.294],[7.51,46.294],[7.51,46.307],[7.495,46.307]]]},\"start\":0,\"limit\":10}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Intersects 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/worldclim/contain?what=KEY',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[7.495,46.307],[7.495,46.294],[7.51,46.294],[7.51,46.307],[7.495,46.307]]]},\"start\":0,\"limit\":10}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Point 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/hash?lat=42&lon=12',
        method: 'GET',
        headers: {}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Polygon 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/hash/poly',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"coordinates\":[[[35,10],[45,45],[15,40],[10,20],[35,10]],[[20,30],[30,20],[35,35],[20,30]]]}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request MultiPolygon 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/hash/multipoly',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\n\"coordinates\": [ [ [[40, 40], [20, 45], [45, 30], [40, 40]] ], [ [[20, 35], [10, 30], [10, 10], [30, 5], [45, 20], [20, 35]], [[30, 20], [20, 15], [20, 25], [30, 20]] ] ]\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Unit by unit ID 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/gcu/shape?gcu_id_number=CHE00006',
        method: 'GET',
        headers: {}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Unit by geometry reference 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/gcu/rec?geometry_hash=46164fdefc87fad25fc55e0146bae752',
        method: 'GET',
        headers: {}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Unit by point 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/gcu/click?lat=41.83&lon=16.02',
        method: 'GET',
        headers: {}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Unit search 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/shape/search',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"geo_shape_area\":{\"min\":32922692,\"max\":45275174},\"paging\":{\"offset\":0,\"limit\":100}}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Geometry by reference 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/shape?geometry_hash=0df76d46196094c8bade10e30faf6ae0',
        method: 'GET',
        headers: {}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Geometry by point 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/shape/click?lat=41.83&lon=16.02',
        method: 'GET',
        headers: {}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Geometry search 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/shape/search',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"geometry_hash_list\":[\"02f184cfb58d5d8cb3b0769cb2631c94\",\"3bb8b24468aa2ddee2941a7455dcbc81\"],\"std_dataset_ids\":[\"814b4937-3bbd-47c7-99d5-2cd51a0f3469\"],\"geo_shape_area\":{\"min\":32922692,\"max\":39275174},\"chr_AvElevation\":{\"min\":220,\"max\":930},\"chr_StdElevation\":{\"min\":5,\"max\":450},\"chr_AvSlope\":{\"min\":1,\"max\":30},\"chr_AvAspect\":{\"min\":150,\"max\":190},\"intersects\":{\"type\":\"Polygon\",\"coordinates\":[[[19.172351,50.399665],[11.205682,50.399665],[11.205682,45.511248],[19.172351,45.511248],[19.172351,50.399665]]]},\"distance\":{\"reference\":{\"type\":\"Point\",\"coordinates\":[15.407384,48.150157]},\"range\":{\"min\":0,\"max\":500000000}},\"paging\":{\"offset\":0,\"limit\":100}}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Shape metadata by time span 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/rs/meta/span/shape',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"geometry_hash_list\":[\"5884f50ccde8024a30d84cf29c12c3ed\",\"6117b4b921bbe98c0ee8c5a253132634\"],\"std_date_span\":[\"std_date_span_day\",\"std_date_span_month\",\"std_date_span_year\"],\"std_date_start\":\"2000\",\"std_date_end\":\"2023\",\"std_terms\":[\"chr_RelHumid\",\"env_climate_temp-2m\",\"chr_LandSurfTemp\",\"chr_AvLeafAreaIdx\",\"chr_AvBiomass\"],\"std_dataset_ids\":[\"5f9c61fc-8a82-41b5-b2ae-42c0068cfb6e\",\"9f0b933b-a6e7-435d-a1ba-c49c10c94c52\",\"647be387-4dda-4257-a7c8-e5c47e90ccc9\",\"750b614a-8dbc-49e0-85e2-8279c2b80269\",\"08e0810c-c259-409b-8626-e8699540cfaa\",\"d9f9676f-d31e-4f31-80d7-fd00909039aa\",\"5161a461-1fb1-46df-89de-fd1caab906e7\",\"cfe881bd-65f3-4c4c-a0fb-c0b9fd35ea51\",\"2a9ca201-0b15-495f-ad65-c138886986df\"]}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Unit metadata by time span 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/rs/meta/span/unit',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"gcu_id_number_list\":[\"ITA00001\",\"AUT00001\"],\"std_date_span\":[\"std_date_span_day\",\"std_date_span_month\",\"std_date_span_year\"],\"std_date_start\":\"2000\",\"std_date_end\":\"2023\",\"std_terms\":[\"chr_RelHumid\",\"env_climate_temp-2m\",\"chr_LandSurfTemp\",\"chr_AvLeafAreaIdx\",\"chr_AvBiomass\"],\"std_dataset_ids\":[\"5f9c61fc-8a82-41b5-b2ae-42c0068cfb6e\",\"9f0b933b-a6e7-435d-a1ba-c49c10c94c52\",\"647be387-4dda-4257-a7c8-e5c47e90ccc9\",\"750b614a-8dbc-49e0-85e2-8279c2b80269\",\"08e0810c-c259-409b-8626-e8699540cfaa\",\"d9f9676f-d31e-4f31-80d7-fd00909039aa\",\"5161a461-1fb1-46df-89de-fd1caab906e7\",\"cfe881bd-65f3-4c4c-a0fb-c0b9fd35ea51\",\"2a9ca201-0b15-495f-ad65-c138886986df\"]}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Shape metadata by geometry and time span 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/rs/meta/shape',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"geometry_hash_list\":[\"5884f50ccde8024a30d84cf29c12c3ed\",\"6117b4b921bbe98c0ee8c5a253132634\"],\"std_date_span\":[\"std_date_span_day\",\"std_date_span_month\",\"std_date_span_year\"],\"std_date_start\":\"2000\",\"std_date_end\":\"2023\",\"std_terms\":[\"chr_RelHumid\",\"env_climate_temp-2m\",\"chr_LandSurfTemp\",\"chr_AvLeafAreaIdx\",\"chr_AvBiomass\"],\"std_dataset_ids\":[\"5f9c61fc-8a82-41b5-b2ae-42c0068cfb6e\",\"9f0b933b-a6e7-435d-a1ba-c49c10c94c52\",\"647be387-4dda-4257-a7c8-e5c47e90ccc9\",\"750b614a-8dbc-49e0-85e2-8279c2b80269\",\"08e0810c-c259-409b-8626-e8699540cfaa\",\"d9f9676f-d31e-4f31-80d7-fd00909039aa\",\"5161a461-1fb1-46df-89de-fd1caab906e7\",\"cfe881bd-65f3-4c4c-a0fb-c0b9fd35ea51\",\"2a9ca201-0b15-495f-ad65-c138886986df\"]}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Unit metadata by geometry and time span 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/rs/meta/unit',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"gcu_id_number_list\":[\"ITA00001\",\"AUT00001\"],\"std_date_span\":[\"std_date_span_day\",\"std_date_span_month\",\"std_date_span_year\"],\"std_date_start\":\"2000\",\"std_date_end\":\"2023\",\"std_terms\":[\"chr_RelHumid\",\"env_climate_temp-2m\",\"chr_LandSurfTemp\",\"chr_AvLeafAreaIdx\",\"chr_AvBiomass\"],\"std_dataset_ids\":[\"5f9c61fc-8a82-41b5-b2ae-42c0068cfb6e\",\"9f0b933b-a6e7-435d-a1ba-c49c10c94c52\",\"647be387-4dda-4257-a7c8-e5c47e90ccc9\",\"750b614a-8dbc-49e0-85e2-8279c2b80269\",\"08e0810c-c259-409b-8626-e8699540cfaa\",\"d9f9676f-d31e-4f31-80d7-fd00909039aa\",\"5161a461-1fb1-46df-89de-fd1caab906e7\",\"cfe881bd-65f3-4c4c-a0fb-c0b9fd35ea51\",\"2a9ca201-0b15-495f-ad65-c138886986df\"]}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Data by geometry and time span 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/rs/data/shape?geometry_hash=5884f50ccde8024a30d84cf29c12c3ed',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"std_date_span\":[\"std_date_span_day\",\"std_date_span_month\",\"std_date_span_year\"],\"std_date_start\":\"2010\",\"std_date_end\":\"20101231\",\"std_terms\":[\"chr_RelHumid\",\"env_climate_temp-2m\",\"chr_LandSurfTemp\",\"chr_AvLeafAreaIdx\",\"chr_AvBiomass\"],\"std_dataset_ids\":[\"5f9c61fc-8a82-41b5-b2ae-42c0068cfb6e\",\"9f0b933b-a6e7-435d-a1ba-c49c10c94c52\",\"647be387-4dda-4257-a7c8-e5c47e90ccc9\",\"750b614a-8dbc-49e0-85e2-8279c2b80269\",\"08e0810c-c259-409b-8626-e8699540cfaa\",\"d9f9676f-d31e-4f31-80d7-fd00909039aa\",\"5161a461-1fb1-46df-89de-fd1caab906e7\",\"cfe881bd-65f3-4c4c-a0fb-c0b9fd35ea51\",\"2a9ca201-0b15-495f-ad65-c138886986df\"]}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Data by unit and time span 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/rs/data/unit?gcu_id_number=GBR00001',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"std_date_span\":[\"std_date_span_day\",\"std_date_span_month\",\"std_date_span_year\"],\"std_date_start\":\"2010\",\"std_date_end\":\"20101231\",\"std_terms\":[\"chr_RelHumid\",\"env_climate_temp-2m\",\"chr_LandSurfTemp\",\"chr_AvLeafAreaIdx\",\"chr_AvBiomass\"],\"std_dataset_ids\":[\"5f9c61fc-8a82-41b5-b2ae-42c0068cfb6e\",\"9f0b933b-a6e7-435d-a1ba-c49c10c94c52\",\"647be387-4dda-4257-a7c8-e5c47e90ccc9\",\"750b614a-8dbc-49e0-85e2-8279c2b80269\",\"08e0810c-c259-409b-8626-e8699540cfaa\",\"d9f9676f-d31e-4f31-80d7-fd00909039aa\",\"5161a461-1fb1-46df-89de-fd1caab906e7\",\"cfe881bd-65f3-4c4c-a0fb-c0b9fd35ea51\",\"2a9ca201-0b15-495f-ad65-c138886986df\"]}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Metadata for coordinates 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/do/meta?lat=42&lon=12',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"std_date_start\":\"2004\",\"std_date_end\":\"2005\",\"std_terms\":[\"env_climate_fapar\",\"env_climate_fapan\",\"env_climate_sma\",\"env_climate_smi\"],\"std_dataset_ids\":[\"056e569a-66ef-4033-8d15-5c4c3c36c1bb\",\"9eda6111-c840-4862-9759-4a805cd6fc35\"],\"geometry_point_radius\":[0.020833335,0.031752945]}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Metadata by geometry for coordinates 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/do/meta/shape?lat=42&lon=12',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"std_date_start\":\"2004\",\"std_date_end\":\"2005\",\"std_terms\":[\"env_climate_fapar\",\"env_climate_fapan\",\"env_climate_sma\",\"env_climate_smi\"],\"std_dataset_ids\":[\"056e569a-66ef-4033-8d15-5c4c3c36c1bb\",\"9eda6111-c840-4862-9759-4a805cd6fc35\"],\"geometry_point_radius\":[0.020833335,0.031752945]}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Data by geometry 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/do/data/shape?lat=42&lon=12',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"std_date_start\":\"2004\",\"std_date_end\":\"2005\",\"std_terms\":[\"env_climate_fapar\",\"env_climate_fapan\",\"env_climate_sma\",\"env_climate_smi\"],\"std_dataset_ids\":[\"056e569a-66ef-4033-8d15-5c4c3c36c1bb\",\"9eda6111-c840-4862-9759-4a805cd6fc35\"],\"geometry_point_radius\":[0.020833335,0.031752945]}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Data by date 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/do/data/date?lat=42&lon=12',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"std_date_start\":\"2004\",\"std_date_end\":\"2005\",\"std_terms\":[\"env_climate_fapar\",\"env_climate_fapan\",\"env_climate_sma\",\"env_climate_smi\"],\"std_dataset_ids\":[\"056e569a-66ef-4033-8d15-5c4c3c36c1bb\",\"9eda6111-c840-4862-9759-4a805cd6fc35\"],\"geometry_point_radius\":[0.020833335,0.031752945],\"paging\":{\"offset\":0,\"limit\":10}}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Query datasets 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/GeoService/env/dataset/query?op=AND',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8"}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
 
    // Paw Store Cookies option is not supported

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;
            
            callback(null, res.statusCode, res.headers, responseStr);
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("{\"_key\":[\"056e569a-66ef-4033-8d15-5c4c3c36c1bb\"],\"_collection_list\":{\"items\":[\"DroughtObservatory\"],\"doAll\":false},\"std_project\":[\"EUFGIS\"],\"std_dataset\":\"EDO_FAPAR\",\"std_dataset_group\":[\"EDO\"],\"std_date\":{\"std_date_start\":\"1990\",\"std_date_end\":\"2023\"},\"std_date_submission\":{\"min\":\"2020\",\"max\":\"2023\"},\"_title\":\"drought radiation index\",\"_description\":\"drought moisture temperature anomaly\",\"std_terms\":{\"items\":[\"env_climate_fapar\",\"env_climate_fapan\"],\"doAll\":true},\"std_terms_quant\":{\"items\":[\"env_climate_fapar\",\"env_climate_fapan\"],\"doAll\":false},\"std_terms_key\":{\"items\":[\"geometry_hash\",\"std_date\"],\"doAll\":true}}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});
