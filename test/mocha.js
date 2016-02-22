sinon = require('sinon');

window = global;
document = {
  createElement:    function () { },
  addEventListener: function () { }
};
window.addEventListener = function () { };

Visibility = require('../')

chai      = require('chai');
sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);
