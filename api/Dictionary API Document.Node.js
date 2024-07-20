// Warning: requests below are going to be executed in parallel

// request Create term 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/terms/insert',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("{\n  \"_code\": {\n    \"_lid\": \"test\"\n  },\n  \"_info\": {\n    \"_title\": {\n      \"iso_639_3_eng\": \"Test term\"\n    },\n    \"_definition\": {\n      \"iso_639_3_eng\": \"A term created for testing purposes.\"\n    },\n    \"_description\": {\n      \"iso_639_3_eng\": \"This term can be *safely deleted*.\"\n    }\n  }\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Create terms 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/terms/insert/many',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("[\n  {\n    \"_code\": {\n      \"_lid\": \"test-01\"\n    },\n    \"_info\": {\n      \"_title\": {\n        \"iso_639_3_eng\": \"Test term 1\"\n      }\n    },\n    \"_data\": {\n      \"_scalar\": {\n        \"_type\": \"_type_object\"\n      }\n    }\n  },\n  {\n    \"_code\": {\n      \"_lid\": \"test-02\"\n    },\n    \"_info\": {\n      \"_title\": {\n        \"iso_639_3_eng\": \"Test term 2\"\n      }\n    },\n    \"_data\": {\n      \"_scalar\": {\n\t\t\"_type\": \"_type_string_enum\",\n\t\t\"_kind\": [\"_type\"]\n\t  }\n    }\n  },\n  {\n    \"_code\": {\n      \"_lid\": \"test-03\"\n    },\n    \"_info\": {\n      \"_title\": {\n        \"iso_639_3_eng\": \"Test term 3\"\n      }\n    }\n  }\n]")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Update term 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/terms?key=test',
        method: 'PATCH',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("{\n  \"_info\": {\n    \"_title\": {\n     \"iso_639_3_eng\": \"Test term (modified)\"\n    }\n  }\n}\n")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Delete term 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/terms/delete?key=test-01',
        method: 'DELETE',
        headers: {"Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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

// request Delete terms 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/terms/delete/many',
        method: 'DELETE',
        headers: {"Content-Type":"application/json; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("[\"test-01\",\"test-02\",\"INKNOWN TERM\"]")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Get term by key 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/terms?key=_type&lang=iso_639_3_eng',
        method: 'GET',
        headers: {"Content-Type":"application/json; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("{\"start\":0,\"limit\":25,\"username\":\"test\",\"role\":[\"read\"],\"default\":false}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Get terms by key 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/terms/many?lang=iso_639_3_eng',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("[ \"_type\", \"_code\", \"UNKNOWN\" ]")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Query term keys 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/terms/key',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("{\n  \"start\": 0,\n  \"limit\": 25,\n  \"term_type\": \"descriptor\",\n  \"_lid\": \"type\",\n  \"_gid\": \"_type\",\n  \"_aid\": [\n    \"type\"\n  ],\n  \"_title\": \"type\",\n  \"_definition\": \"data type\"\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Query term records 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/terms?lang=iso_639_3_eng',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("{\n  \"start\": 0,\n  \"limit\": 25,\n  \"term_type\": \"descriptor\",\n  \"_lid\": \"type\",\n  \"_gid\": \"_type\",\n  \"_aid\": [\n    \"type\"\n  ],\n  \"_title\": \"type\",\n  \"_definition\": \"data type\"\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Add enumerations 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/graph/add/enum',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("{\n  \"root\": \"test\",\n  \"parent\": \"test\",\n  \"items\": [\n    \"test-01\",\n    \"test-02\"\n  ]\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Add fields 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/graph/add/field',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("{\n  \"root\": \"test\",\n  \"parent\": \"test\",\n  \"items\": [\n    \"count\",\n    \"species\"\n  ]\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Add properties 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/graph/add/property',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("{\n  \"parent\": \"test-02\",\n  \"items\": [\n    \"count\",\n    \"species\"\n  ]\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Add sections 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/graph/add/section',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("{\n  \"root\": \"test\",\n  \"parent\": \"test\",\n  \"items\": [\n    \"test-02\"\n  ]\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Add bridge 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/graph/add/bridge',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("{\n  \"root\": \"test\",\n  \"parent\": \"test\",\n  \"items\": [\n    \"test-03\"\n  ]\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Enumeration path flat list of keys  
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/enum/all/keys?path=_predicate',
        method: 'GET',
        headers: {"Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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

// request Enumeration path flat list of terms  
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/enum/all/terms?path=_type',
        method: 'GET',
        headers: {"Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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

// request Enumeration keys tree  
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/enum/tree/keys?path=_type&levels=10',
        method: 'GET',
        headers: {"Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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

// request Get enumeration key by code, field and path 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/enum/match/field/keys?field=_aid&code=en&type=iso_639_1',
        method: 'GET',
        headers: {"Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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

// request Get enumeration term by code, field and path 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/enum/match/field/terms?field=_aid&code=en&type=iso_639_1',
        method: 'GET',
        headers: {"Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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

// request Get enumeration path by code, field and path  
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/enum/traverse/field/path?path=iso_639_1&code=en&field=_aid',
        method: 'GET',
        headers: {"Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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

// request Enumeration path by local identifier  
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/enum/lid/path?path=iso_639_1&code=eng',
        method: 'GET',
        headers: {"Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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

// request Enumeration path by global identifier  
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/enum/gid/path?path=iso_639_1&code=iso_639_1_en',
        method: 'GET',
        headers: {"Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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

// request Check enumeration element global identifiers  
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/enum/check/keys?path=iso_639_1',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("[\"iso_639_1_en\",\"iso_639_1_fr\",\"UNKNOWN\"]")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Check enumeration element local identifiers  
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/enum/check/codes?path=iso_639_1&field=_aid',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("[\n  \"en\",\n  \"fr\",\n  \"UNKNOWN\"\n]")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Required descriptor keys 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/link/required/keys',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("[ \"chr_EffPopSize\" ]")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Required descriptor records 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/link/required/terms',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("[ \"chr_EffPopSize\" ]")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Descriptor enumeration flat list of keys  
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/descr/enum/key?key=_type',
        method: 'GET',
        headers: {"Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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

// request Descriptor enumeration flat list of records  
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/descr/enum/term?key=_type',
        method: 'GET',
        headers: {"Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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

// request Descriptor enumeration tree of keys  
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/descr/enum/tree?key=_type&levels=10',
        method: 'GET',
        headers: {"Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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

// request Descriptor categories  
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/descr/qual/keys',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("[ \"chr_EffPopSize\" ]")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Validate value by descriptor 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/check/descriptor',
        method: 'POST',
        headers: {"Content-Type":"application/json; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("{\"descriptor\":\"_type\",\"value\":\"string\",\"language\":\"all\"}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Validate value by data definition 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/check/definition',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("{\n  \"definition\": {\n    \"_class\": \"_class_category\",\n    \"_scalar\": {\n      \"_type\": \"_type_string_enum\",\n      \"_kind\": [\n        \"_type\"\n      ]\n    }\n  },\n  \"value\": \"string\",\n  \"language\": \"all\"\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Validate object 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/check/object',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("{\n  \"value\": {\n    \"_code\": {\n      \"_lid\": \"test-01\",\n      \"_gid\": \"test-01\",\n      \"_aid\": [\n        \"test-01\"\n      ]\n    },\n    \"_info\": {\n      \"_title\": {\n        \"iso_639_3_eng\": \"Test term 1\"\n      }\n    },\n    \"_data\": {\n      \"_scalar\": {\n        \"_type\": \"_type_object\"\n      }\n    },\n    \"custom_value\": 42\n  },\n  \"language\": \"iso_639_3_eng\"\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Validate objects 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/check/objects',
        method: 'POST',
        headers: {"Content-Type":"text/plain; charset=utf-8","Cookie":"FOXXSID=null; FOXXSID.sig=659130347e9eb043443995f5b9aef83b6238df078ef297696fdd33b56bd7b0cb"}
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
    request.write("{\n  \"value\": [\n    {\n      \"_code\": {\n        \"_lid\": \"test-01\",\n        \"_gid\": \"test-01\",\n        \"_aid\": [\n          \"test-01\"\n        ]\n      },\n      \"_info\": {\n        \"_title\": {\n          \"iso_639_3_eng\": \"Test term 1\"\n        }\n      },\n      \"_data\": {\n        \"_scalar\": {\n          \"_type\": \"_type_object\"\n        }\n      }\n    },\n    {\n      \"_code\": {\n        \"_gid\": \"test-01\",\n        \"_aid\": [\n          \"test-01\"\n        ]\n      }\n    },\n    {\n      \"_type\": \"UNKNOWN\"\n    },\n    {\n      \"CUSTOM\": \"VALUE\"\n    },\n    {\n      \"_type\": \"string\"\n    }\n  ],\n  \"language\": \"iso_639_3_eng\"\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});
