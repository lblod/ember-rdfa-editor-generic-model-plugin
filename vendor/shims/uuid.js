(function() {
  function vendorModule() {
    'use strict';

    return {
      'default': self['uuidv4'],
      __esModule: true,
    };
  }

  define('uuidv4', [], vendorModule);
})();
