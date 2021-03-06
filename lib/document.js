'use strict';

const BufferList = require('bl'),
      http = require('http'),
      when = require('when'),
      events = require('events'),
      util = require('util'),
      _ = require('lodash');

/**
 * A document served either out of the origin server, the filesystem,
 * or the cache.
 *
 * "Adopts" instances of @link http.IncomingMessage as-is;
 * "synthesizes" instances for other document sources (cache or
 * filesystem)
 */

module.exports = Document;

/**
 * @constructor
 *
 * Creates a synthetic document from headers and 
 *
 * @param {Object} headers
 * @param {Stream.Readable} body
 */
function Document(statusCode, headers, body) {
    this._headers_orig = _.extend({}, headers);
    this.statusCode = statusCode;
    this.headers = {};
    for (var h in headers) {
        this.headers[h.toLowerCase()] = headers[h];
    }

    // Delegate streams API to body
    if (body.readable) {
        this.readable = body.readable
    } else {
        throw new Error('Cannot pipe non-readable stream')
    }
    for (let streamsAPIfn of ['pipe', 'on', 'once',
                              'addListener', 'removeListener']) {
        this[streamsAPIfn] = body[streamsAPIfn].bind(body)
    }
    for (let streamsAPIProperty of ['aborted', 'complete']) {
        Object.defineProperty(this, streamsAPIProperty, {
            get: () => body[streamsAPIProperty]
        })
    }
}

Document.prototype.getHeader = function(h) {
    return this._lc_headers[h.toLowerCase()];
}

/**
 * Override for the "instanceof" operator with Document
 */
// Class-less example syntax found here:
// https://github.com/babel/babel/issues/2286#issuecomment-136131040
Object.defineProperty(Document, Symbol.hasInstance,
                      { value: (what) => (('headers' in what) &&
                                          ('on' in what)) })

Document.coerce = function(what) {
    if (what instanceof Document) {
        return what
    } else {
        throw new Error("I don't know how to cast " + what + " into a Document")
    }
}

