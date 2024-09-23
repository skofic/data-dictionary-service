// Warning: requests below are going to be executed in parallel

// request Create term 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/terms/insert?terms=true&types=false&defns=false&resolve=true&resfld=_lid&save=true',
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
    request.write("{\n  \"_code\": {\n    \"_lid\": \"test\"\n  },\n  \"_info\": {\n    \"_title\": {\n      \"eng\": \"Test term\"\n    },\n    \"_definition\": {\n      \"eng\": \"A term created for testing purposes.\"\n    },\n    \"_description\": {\n      \"eng\": \"This term can be *safely deleted*.\"\n    }\n  },\n  \"_data\": {\n    \"_scalar\": {\n      \"_type\": \"enum\",\n      \"_kind\": [\"_type\"]\n    }\n  }\n}")
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
        path: '/_db/EUFGIS/dict/terms/insert/many?terms=true&types=false&defns=false&resolve=true&resfld=_aid&save=true',
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
    request.write("[\n  {\n    \"_code\": {\n      \"_lid\": \"test-01\"\n    },\n    \"_info\": {\n      \"_title\": {\n        \"eng\": \"Test term 1\"\n      }\n    },\n    \"_data\": {\n      \"_scalar\": {\n        \"_type\": \"_type_object\"\n      }\n    }\n  },\n  {\n    \"_code\": {\n      \"_lid\": \"test-02\"\n    },\n    \"_info\": {\n      \"_title\": {\n        \"iso_639_3_eng\": \"Test term 2\"\n      }\n    },\n    \"_data\": {\n      \"_scalar\": {\n\t\t\"_type\": \"enum\",\n\t\t\"_kind\": [\"_type\"]\n\t  }\n    }\n  },\n  {\n    \"_code\": {\n      \"_lid\": \"test-03\"\n    },\n    \"_info\": {\n      \"_title\": {\n        \"iso_639_3_eng\": \"Test term 3\"\n      }\n    }\n  }\n]")
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
        path: '/_db/EUFGIS/dict/terms?key=test-01&terms=true&types=false&defns=false&resolve=true&resfld=_lid&save=true',
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
    request.write("{\n  \"updates\": {\n    \"_code\": {\n      \"_aid\": [\n        \"test_one\"\n      ]\n    },\n    \"_info\": {\n      \"_title\": { \"iso_639_3_ita\": \"Termine di prova uno.\" }\n    }\n  },\n  \"references\": [\n    \"_code._aid\",\n    \"_info._title.iso_639_3_ita\"\n  ]\n}")
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
    request.write("[\n  \"test-01\",\n  \"test-02\",\n  \"INKNOWN TERM\"\n]")
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
        path: '/_db/EUFGIS/dict/terms/dict?lang=iso_639_3_eng',
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
    request.write("[\n  \"_type\",\n  \"_code\",\n  \"UNKNOWN\"\n]")
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
        path: '/_db/EUFGIS/dict/terms/query/keys',
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
        path: '/_db/EUFGIS/dict/terms/query/terms?lang=iso_639_3_eng',
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

// request Set edges 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/graph/set/edge?root=terms%2F_type&parent=terms%2F_type_string&predicate=_predicate_enum-of&direction=true&save=false&inserted=true&updated=true&existing=true',
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
    request.write("{\n  \"children\": {\n    \"terms/_predicate_enum-of\": {\"_name\": \"Enumeration\"},\n    \"terms/_predicate_field-of\": {\"_name\": \"Field.\"},\n    \"terms/_type_string_enum\": {\"_title\": {\"iso_639_3_eng\": \"This is custom data.\"}},\n    \"terms/_type_string_key\": null\n  },\n  \"sections\": [\n    \"_predicate_section-of\",\n    \"_predicate_bridge-of\"\n  ]\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Delete edges 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/graph/del/edge?root=terms%2F_type&parent=terms%2F_type&predicate=_predicate_enum-of&direction=true&save=false&prune=false&deleted=true&updated=true&ignored=true',
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
    request.write("{\n  \"children\": {\n    \"terms/_type_string\": {\"_name\": \"Pippo\"},\n    \"terms/_type_string_enum\": null,\n    \"terms/_type_number\": null\n  },\n  \"sections\": [\n    \"_predicate_section-of\",\n    \"_predicate_bridge-of\"\n  ]\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Set containers 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/graph/set/container?root=terms%2F_type&parent=terms%2F_type_string&container=_predicate_section-of&predicate=_predicate_enum-of&direction=true&save=false&inserted=true&updated=true&existing=true',
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
    request.write("{\n  \"children\": {\n    \"terms/_type_string_enum\": {\"_name\": \"Enumeration type.\"}\n  },\n  \"sections\": [\n    \"_predicate_section-of\",\n    \"_predicate_bridge-of\"\n  ]\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Delete containers 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/graph/del/container?root=terms%2F_predicate&parent=terms%2F_predicate&container=_predicate_section-of&predicate=_predicate_enum-of&direction=true&save=false&prune=true&deleted=true&updated=true&ignored=true',
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
    request.write("{\n  \"children\": {\n    \"terms/_predicate_functional\": null,\n    \"terms/_predicate_requires\": {\"_name\": \"Custom data.\"},\n    \"terms/_type_string\": null\n  },\n  \"sections\": [\n    \"_predicate_section-of\",\n    \"_predicate_bridge-of\"\n  ]\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Set bridge 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/graph/set/bridge?root=terms%2F_predicate&bridged=terms%2F_type&bridge=_predicate_bridge-of&direction=true&save=false&inserted=true&updated=true&existing=true',
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
    request.write("{\n  \"_name\": \"This is custom data.\"\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Delete bridge 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/graph/del/bridge?root=terms%2Fiso_639_2&bridged=terms%2Fiso_639_2_srr&bridge=_predicate_bridge-of&predicate=_predicate_enum-of&direction=true&save=false&prune=true&deleted=true&updated=true&ignored=true',
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
    request.write("{\n  \"sections\": [\n    \"_predicate_section-of\",\n    \"_predicate_bridge-of\"\n  ],\n  \"data\": {\"_name\": \"Custom data.\"}\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Set links 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/graph/set/link?parent=terms%2Fchr_LeafAreaIndex&predicate=_predicate_requires_indicator&direction=false&descriptors=true&save=false&inserted=true&updated=true&existing=true',
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
    request.write("{\n  \"children\": {\n    \"terms/std_date\": {\"_name\": \"Custom data.\"}\n  }\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Delete links 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/graph/del/link?parent=terms%2Fchr_LeafAreaIndex&predicate=_predicate_requires_indicator&direction=false&save=false&deleted=true&ignored=true',
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
    request.write("[\n   \"terms/std_date\",\n   \"terms/_type\"\n]")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Get linked keys 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/link/keys?predicate=_predicate_requires_indicator',
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

// request Get linked terms 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/link/terms?predicate=_predicate_requires_indicator',
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

// request Flat list of keys 
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

// request Flat list of terms 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/enum/all/terms?path=_type&lang=iso_639_3_eng',
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

// request Enumeration tree  
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/enum/tree/keys?path=_predicate&levels=10',
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

// request Match enumeration keys by code, field and path 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/enum/match/field/keys?path=iso_639_1&code=en&field=_aid',
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

// request Get enumeration terms by code, field and path 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/enum/match/field/terms?path=iso_639_1&code=en&field=_aid',
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
    request.write("[\n  \"iso_639_1_en\",\n  \"iso_639_1_fr\",\n  \"UNKNOWN\"\n]")
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
        path: '/_db/EUFGIS/dict/check/descriptor/value?descriptor=_term&cache=true&miss=true&terms=true&types=false&defns=false&resolve=true&resfld=_aid',
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
    request.write("{\n    \"_key\": \"TEST-03\",\n    \"_code\": {\n        \"_lid\": \"TEST-03\",\n        \"_gid\": \"TEST-03\",\n        \"_aid\": [ \"TEST-03\" ],\n        \"_name\": \"My test object descriptor\"\n    },\n    \"_info\": {\n        \"_title\": {\"en\": \"Test descriptor.\"}\n    },\n    \"_data\": {\n        \"_scalar\": {\n            \"_type\": \"object\",\n            \"_kind\": [\"TEST-03\"]\n        }\n    }\n}")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});

// request Validate values by descriptor 
(function(callback) {
    'use strict';
        
    const httpTransport = require('http');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'localhost',
        port: '8529',
        path: '/_db/EUFGIS/dict/check/descriptor/values?descriptor=_type&cache=true&miss=true&terms=true&types=false&defns=false&resolve=true&resfld=_aid',
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
    request.write("[\n  \"_type_string_enum\",\n  12,\n  \"object\"\n]")
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
        path: '/_db/EUFGIS/dict/check/object?cache=true&miss=true&terms=false&types=false&defns=false&resolve=true&resfld=_aid',
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
    request.write("{\n  \"_info\": {\n    \"_title\": {\n      \"en\": \"Test term 1\"\n    }\n  },\n  \"_data\": {\n    \"_scalar\": {\n      \"_type\": \"object\"\n    }\n  },\n  \"language\": \"eng\",\n  \"custom_value\": 42\n}")
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
    request.write("[\n    {\n        \"_info\": {\n            \"_title\": {\"iso_639_3_eng\": \"Test term 1\"}\n        },\n        \"_data\": {\n            \"_scalar\": {\"_type\": \"_type_object\"}\n        },\n        \"language\": \"eng\",\n        \"custom_value\": 42\n    },\n    {\n        \"_info\": {\n            \"_title\": {\"iso_639_3_eng\": \"Test term 2\"}\n        },\n        \"_data\": {\n            \"_scalar\": {\"_type\": \"_type_string\"}\n        }\n    }\n]")
    request.end();
    

})((error, statusCode, headers, body) => {
    console.log('ERROR:', error); 
    console.log('STATUS:', statusCode);
    console.log('HEADERS:', JSON.stringify(headers));
    console.log('BODY:', body);
});
