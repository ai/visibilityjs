window   = global;
window.addEventListener = function () { };
document = {
  createElement:    function () { },
  addEventListener: function () { }
};

sinon = require('sinon');

chai      = require('chai');
sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);
