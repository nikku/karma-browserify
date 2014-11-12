var chai  = require('chai');
var spies = require('chai-spies');

chai.use(spies);

// expose expect as global
global.expect = chai.expect;
