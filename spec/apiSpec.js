'use strict'
var request = require('request');
var auth = require('../server/auth')
var base_url = 'http://localhost:8080/'
 


describe("Api Test file", function(){

jasmine.getEnv().defaultTimeoutInterval = 500;

    it("should pass if the server is running", function(done) {
        request.get(base_url, function(error, response, body) {
            expect(response.statusCode).toBe(200);
            done();
            });
        });
    
});

