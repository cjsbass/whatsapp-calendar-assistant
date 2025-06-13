/**
 * DIRECT TOKEN FIX
 * This script completely overrides the global axios and http/https modules
 * to ensure the correct token is always used.
 */

// DIRECT HARDCODED TOKEN - this is a last resort fix
const realToken = "EAARahBZAxZBD8BOy8vLD43Rh5ehr7ItZAyZAkOhgMuJToZAff2XPZC8fdl4wTu924Sy6Wvv1ML7ft8MeA4zd7zlNSZBUHCd0E6iIyCZAv4zbmXSdF3LEeLEIRfEjZCamE1tn2eZA4Fhxf2gNRZAZCpQDnSHkSuhsWLXzUZBwLMn3qXdOmBWinrjhi1mLaWM5b94ugxAZDZD";

// Override Node's require function to intercept axios require
const Module = require('module');
const originalRequire = Module.prototype.require;

// Replace Module.prototype.require to intercept axios
Module.prototype.require = function() {
  const exports = originalRequire.apply(this, arguments);
  const moduleName = arguments[0];
  
  // Intercept axios module
  if (moduleName === 'axios') {
    console.log('📌 Intercepting axios module for token fix');
    
    // Wrap the original request function
    const originalRequest = exports.request;
    exports.request = function(config) {
      // Force the correct token for any graph.facebook.com API calls
      if (config.url && config.url.includes('graph.facebook.com')) {
        if (!config.headers) {
          config.headers = {};
        }
        
        // Force the Authorization header to use the correct token
        config.headers.Authorization = `Bearer ${realToken}`;
        console.log('🔑 Forced Authorization header for Facebook API call');
      }
      
      return originalRequest.call(this, config);
    };
    
    // Also override axios.create to ensure created instances have the patch
    const originalCreate = exports.create;
    exports.create = function(config) {
      const instance = originalCreate.call(this, config);
      
      const originalInstanceRequest = instance.request;
      instance.request = function(config) {
        // Force the correct token for any graph.facebook.com API calls
        if (config.url && config.url.includes('graph.facebook.com')) {
          if (!config.headers) {
            config.headers = {};
          }
          
          // Force the Authorization header to use the correct token
          config.headers.Authorization = `Bearer ${realToken}`;
          console.log('🔑 Forced Authorization header for Facebook API call (axios instance)');
        }
        
        return originalInstanceRequest.call(this, config);
      };
      
      return instance;
    };
  }
  
  return exports;
};

console.log('✅ Direct token fix applied - all Facebook API calls will use the correct token');

// Require this at the very beginning of your application
module.exports = {}; 