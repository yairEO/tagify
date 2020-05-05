if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
      value: function(predicate) {
          if (this == null)
              throw new TypeError('"this" is null or not defined');

          var o = Object(this), len = o.length >>> 0;

          if (typeof predicate !== 'function') {
              throw new TypeError('predicate must be a function');
          }

          var thisArg = arguments[1], k = 0;

          while (k < len) {
              var kValue = o[k];
              if (predicate.call(thisArg, kValue, k, o)) {
                  return k;
              }
              k++;
          }

          return -1;
      },
      configurable: true,
      writable: true
  })
}