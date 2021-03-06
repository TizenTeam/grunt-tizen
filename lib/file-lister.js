/**
 * Copyright 2013 Intel Corporate Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var fs = require('fs');
var _ = require('lodash');
var glob = require('glob');

/**
 * Object for local filesystem listing.
 */
module.exports = (function () {
  'use strict';

  return {
    /**
     * Stat the filenames in filePaths and return the latest (NB this
     * uses node to process the directory, not ls).
     */
    getLatest: function (filePaths) {
      if (filePaths.length > 1) {
        // sort so latest file is first in the list
        var sortFn = function(a, b) {
          var aTime = fs.statSync(a).mtime.getTime();
          var bTime = fs.statSync(b).mtime.getTime();
          return bTime - aTime;
        };

        filePaths = filePaths.sort(sortFn);
      }

      return filePaths[0];
    },

    /**
     * Get a list of local files which optionally match a pattern and
     * filters.
     *
     * Note that if you pass a string or string array, you'll just
     * get it back: this is just here to normalise and check the format
     * of the localFiles, not test whether the files exist.
     *
     * {String|Object|String[]} localFiles Spec for finding a list
     * of local files. If an Object, it should look like:
     *
     *   {pattern: '/home/developer/*.wgt', filter: 'latest'}
     *
     * The pattern and filter (optional) properties specify how to find the
     * files on the device; pattern is a file glob usable with ls and
     * filter can take the value 'latest', meaning install only the latest
     * matching file.
     * {Function} cb Callback; invoked with cb(error) or
     * cb(null, <filename array>)
     */
    list: function (localFiles, cb) {
      var self = this;

      if (_.isString(localFiles)) {
        cb(null, [localFiles]);
      }
      else if (_.isArray(localFiles)) {
        cb(null, localFiles);
      }
      else if (_.isObject(localFiles)) {
        // get a list of files and apply a filter
        var pattern = localFiles.pattern;

        var globCb = function (err, files) {
          if (err) {
            cb(err);
          }
          else {
            // apply filters
            if (localFiles.filter === 'latest') {
              var latestFile = self.getLatest(files);
              cb(null, [latestFile]);
            }
            else {
              cb(null, files);
            }
          }
        };

        try {
          glob(pattern, globCb);
        }
        catch (err) {
          cb(err);
        }
      }
      else {
        var msg = 'localFiles parameter was not valid; ' +
                  'use a string, string array, or pattern object';
        cb(new Error(msg));
      }
    }
  };
})();
