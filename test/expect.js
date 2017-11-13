var chai  = require('chai');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);

// expose expect as global
global.expect = chai.expect;
