/**
 *  @module Object Generator
 *
 *  @author Shelby L Morris (secretagentxnine@gmail.com)
 *  @license MIT
 **/

;(function (publish) {
  'use strict';

  var NativeClassTemplate = '[object =]';

  function getNativeClassValue(className) {
    return NativeClassTemplate.replace('=', className);
  }

  var hasOwnProperty = {}.hasOwnProperty;
  var toString = {}.toString;
  var slice = [].slice;
  var stringify = JSON.stringify;

  function getClass(val) {
    return toString.call(val);
  }

  function strictEq() {
    var args = slice.call(arguments),
      leftHand = args[0];

    return args.length === 1
      ? function(rightHand) {
      return strictEq(leftHand, rightHand);
    }
      : args[0] === args[1];
  }

  function isClass(value, className) {
    return strictEq(getClass(value), getNativeClassValueWithCache(className));
  }

  function isUndefined(val) {
    return strictEq(val, void(0));
  }

  function isDefined(val) {
    return (val = isUndefined(val), !val);
  }

  function isFunction(val) {
    return isClass(val, 'Function');
  }

  function isObject(val) {
    return isClass(val, 'Object');
  }

  function isString(val) {
    return isClass(val, 'String');
  }

  function isArray(val) {
    return isClass(val, 'Array');
  }

  function isEmptyStr(val) {
    return isString(val) && strictEq(val.trim(), '');
  }

  function isPropChain(candidate) {
    return candidate.indexOf('.') !== -1;
  }

  function toParts(dotChain) {
    return dotChain.split('.');
  }

  function getValueFromProperty(obj, prop) {
    if(isString(prop)) prop = isPropChain(prop)? toParts(prop) : [prop];

    if(isEmptyStr(prop[0])) prop.shift();

    if(prop.length > 1) {
      var e = prop.shift();
      return getValueFromProperty(obj[e] = isObject(obj[e])? obj[e] : {}, prop);
    } else {
      return obj[prop[0]];
    }
  }

  function assignProperty(obj, prop, val) {
    if (isString(prop)) prop = isPropChain(prop)? toParts(prop) : prop;

    if (prop.length > 1) {
      var e = prop.shift();
      assignProperty(obj[e] = isObject(obj[e])? obj[e] : {},
        prop,
        val);
    } else {
      obj[prop[0]] = val;
    }
  }

  function hasProp(obj) {
    return function(prop) {
      return obj ? hasOwnProperty.call(obj, prop) : false;
    };
  }

  function composeObj() {
    var sources = slice.call(arguments);
    if(!isArray(sources)) return {};

    var destination = sources.pop();

    sources.forEach(function(source) {
      for(var key in source) {
        destination[key] = source[key];
      }
    });

    return destination;
  }

  function memoize(fn) {
    var cache = {};

    function cachedFn() {
      var hash = stringify(arguments);
      var cacheHasHache = hasProp(cache)(hash);
      return cacheHasHache? cache[hash] : cache[hash] = fn.apply(this, arguments);
    }

    cachedFn.___cache = (function() {
      return (cache.remove || (cache.remove = function() {
        return (delete cache[stringify(arguments)]);
      })), cache;
    }).call(this);

    return cachedFn;
  }

  function flattenAsObject(prev, cur) {
    return composeObj(prev, cur);
  }

  var getNativeClassValueWithCache = memoize(getNativeClassValue);

  function OGSingleton() {
    var instance, cache;

    function _hasCachedTemplates() {
      return isDefined(cache.templates)
        ? true
        : (cache.templates = {}, cache.items = {}, false);
    }

    function _isCachedTemplate(templateHash) {
      return hasCachedTemplates() && isDefined(cache.templates[templateHash])
        ? true
        : (cache.templates[templateHash] = {}, cache.items[templateHash] = {}, false);
    }

    function _isCachedItem(templateHash, itemHash) {
      return isCachedTemplate(templateHash) && cache.items[templateHash][itemHash];
    }

    function _isEqItem(candidate) {
      return strictEq(candidate, '=item');
    }

    var hasCachedTemplates  = _hasCachedTemplates = memoize(_hasCachedTemplates);
    var isCachedTemplate = _isCachedTemplate = memoize(_isCachedTemplate);
    var isCachedItem = _isCachedItem = memoize(_isCachedItem);
    var isEqItem = _isEqItem = memoize(_isEqItem);

    function _standardValueParser(rule, item) {
      var value;

      if(isString(rule) && isPropChain(rule)) {
        value = getValueFromProperty(item, rule);
      } else {
        value = isEqItem(rule)? item : rule;
      }

      if(isObject(value)) {
        value = (Object.keys(value).map(function(key) {
          return standardParser(key, value[key], item)
        }).reduce(flattenAsObject));
      }

      return value;
    }

    function _standardParser(key, rule, item) {
      var obj = {};
      var ruleValue = '', keyValue = key.toString();

      if(isFunction(rule)) {
        ruleValue = rule(item);
      } else {
        ruleValue = standardValueParser(rule, item);
      }

      keyValue = standardValueParser(keyValue, item);;

      return (obj[keyValue] = ruleValue, obj);
    }

    var standardValueParser = _standardValueParser = memoize(_standardValueParser);
    var standardParser = _standardParser = memoize(_standardParser);

    function generateParserWithTemplate(keyParser, valueParser, template) {
      var templateHash =  stringify(template);

      if(!isCachedTemplate(templateHash)) {
        cache.templates[templateHash] = function parser(item) {
          var itemHash = stringify(item);

          if (!isCachedItem(templateHash, itemHash)) {
            var object = cache.items[templateHash][itemHash] = {};

            for (var key in template) {
              var parsedRule = standardParser(key, template[key], item),
                keyValue = Object.keys(parsedRule)[0],
                ruleValue = parsedRule[keyValue];

              keyValue = keyParser && isFunction(keyParser)
                ? keyParser(keyValue)
                : keyValue;

              object[keyValue] = valueParser && isFunction(valueParser)
                ? valueParser(ruleValue)
                : ruleValue;
            }
          }

          return cache.items[templateHash][itemHash];
        };
      }

      return cache.templates[templateHash];
    }

    function parseItemWithTemplate(keyParser, valueParser, template, item) {
      return generateParserWithTemplate(keyParser, valueParser, template)(item);
    }

    function parseArrayWithTemplate(keyParser, valueParser, template, array) {
      return array.map(generateParserWithTemplate(keyParser, valueParser, template));
    }

    function parseArrayAsObjectWithTemplate(keyParser, valueParser, template, array) {
      return array
        .map(generateParserWithTemplate(keyParser, valueParser, template))
        .reduce(flattenAsObject);
    }

    function init() {
      return {
        generateParserWithTemplate: memoize(generateParserWithTemplate),
        parseItemWithTemplate: memoize(parseItemWithTemplate),
        parseArrayWithTemplate: memoize(parseArrayWithTemplate),
        parseArrayAsObjectWithTemplate: memoize(parseArrayAsObjectWithTemplate)
      };
    }

    function getInstance() {
      return !instance? (cache = {}, instance = init(), instance) : instance;
    }

    return {
      getInstance: getInstance
    };
  }

  publish(OGSingleton());
}(
  function(OGSingleton) {
    if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
      module.exports = OGSingleton();
    } else if(typeof define !== 'undefined') {
      define([], function() {
        return OGSingleton;
      });
    } else if(typeof window !== 'undefined' && this === window) {
      this['OG'] = OGSingleton;
    }
  }
));