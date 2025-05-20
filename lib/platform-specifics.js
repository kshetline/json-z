let topLevel;
let fromBase64;
let toBase64;

try {
  topLevel = global;
  fromBase64 = base64 => new Uint8Array(Buffer.from(base64, 'base64'));
  toBase64 = array => Buffer.from(array).toString('base64');
}
catch (err) {}

try {
  topLevel = window;
  fromBase64 = base64 => new Uint8Array(atob(base64).split('').map(char => char.charCodeAt(0)));
  toBase64 = array => btoa(String.fromCharCode(...array));
}
catch (err) {}

const uint8ArrayHandler = {
  name: 'Uint8Array',
  test: obj => (obj instanceof Uint8Array) || (obj instanceof Uint8ClampedArray),
  creator: fromBase64,
  serializer: toBase64
};

const handlerKeys = [];

module.exports = {
  /* eslint-disable new-cap */
  toBigDecimal(bigDecimal, s) {
    if (bigDecimal) {
      return bigDecimal.constructor ? new bigDecimal(s) : bigDecimal(s);
    }

    return Number(s);
  },

  toDecimal(decimal, s) {
    if (decimal) {
      let n = decimal.constructor ? new decimal(s) : decimal(s);

      if (typeof decimal.precision === 'number' && typeof n.toSignificantDigits === 'function') {
        n = n.toSignificantDigits(decimal.precision);
      }

      return n;
    }

    return Number(s);
  },

  globalizeTypeHandlers(typeHandlers, prefix) {
    module.exports.removeGlobalizedTypeHandlers();

    if (topLevel) {
      if (!prefix) {
        prefix = '_';
      }

      typeHandlers.forEach(handler => {
        const key = prefix + handler.name;

        topLevel[key] = handler.creator;
        handlerKeys.push(key);
      });
    }
  },

  removeGlobalizedTypeHandlers() {
    if (topLevel) {
      let key;

      while ((key = handlerKeys.pop())) {
        delete topLevel[key];
      }
    }
  },

  uint8ArrayHandler
};
