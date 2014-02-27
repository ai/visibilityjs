window = global;
document = {
  createElement:    function () { },
  addEventListener: function () { }
};
window.addEventListener = function () { };

sinon = require('sinon');

Visibility = require('../')

chai      = require('chai');
sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);
