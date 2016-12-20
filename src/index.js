/**
 * Hand-written Promisified wrapper around generated ESI code.
* @module eve_swagger_interface
 */

/**
 * A Bluebird JS Promise.
 * @external Promise
 * @see http://bluebirdjs.com
 */

const Promise = require('bluebird');
const Moment = require('moment');
const Cache = require('node-cache');
const ESI = require('../generated/src');

module.exports = function(datasource, baseURL) {
    var exports = {};
    var cache = new Cache({useClones: false});

    if (datasource === undefined) {
        datasource = 'tranquility';
    }

    /**
     * Create a new ESI Api instance based on the given Ctor. If `accessToken`
     * is not undefined, the new Api is also created with a new ApiClient 
     * instance  configured to use 'evesso' authentication with the given token.
     *
     * A new Api must be created for each request since the authentications data
     * is otherwise persistent, resulting in race conditions when multiple 
     * requests need to be made with different tokens.
     *
     * @param {Constructor} apiCtor One of the ESI.xyzApi constructor functions
     * @param {String} accessToken Optional Eve SSO access token for 
     *   authentication 
     * @return A new Api instance
     * @private
     */
    var newApi = function(apiCtor, accessToken) {
        var api;
        if (accessToken === undefined) {
            api = new apiCtor();
        } else {
            api = new apiCtor(new ESI.ApiClient());
            api.apiClient.authentications['evesso'].accessToken = accessToken;
        }

        // Hack in a new baseURL, which is hardcoded by the swagger-codegen
        if (baseURL) {
            api.apiClient.basePath = baseURL;
        }
        return api;
    };

    /**
     * Create a new object holding the default options/parameters for an ESI 
     * request. Currently this configures the data source to tranquility.
     * @return {Object} The default options
     * @private
     */
    var defaultOpts = function() {
        return { 'datasource': datasource };
    };

    /**
     * Invoke the function, `functionName`, on an Api instance to be created by
     * `apiCtor` if an http request must actually be made. The function will be
     * invoked with `args`, which must be an array of arguments as you'd pass
     * to `Function.apply()`. If `accessToken` is not undefined it will be used
     * as the EVE SSO token for authentication.
     * 
     * This will cache data and error responses, where the cache time is 
     * based on the "expires" header in the http response. 
     *
     * `resolve` and `reject` must be Promise handler functions, as provided by
     * the Promise constructor.
     *
     * @param {Constructor} apiCtor One of the ESI.xyzApi constructor functions
     * @param {String} functionName The name of a function callable on the 
     *   Api instance created by `apiCtor`.
     * @param {Array} args Array of arguments to pass to ESI Api function call
     * @param {String} accessToken Optional access token to use for 
     *   authentication, pass `undefined` if not needed
     * @param {Function} resolve Promise resolve handler
     * @param {Function} reject Promise error resolution handler
     * @private
     */
    var getCachedRequest = function(apiCtor, functionName, args, accessToken, 
                                    resolve, reject) {
        var _this = this;
        var key = functionName + '/' + args.join(',');
        if (accessToken) {
            key = key + '@' + accessToken;
        }

        var blob = cache.get(key);
        if (blob == undefined) {
            // Request isn't cached any more, so must make the request anew

            // Append the ESI callback function to the arguments array
            var fullArgs = args.slice(0);
            fullArgs.push(defaultOpts());
            fullArgs.push(function(error, data, response) {
                // Look up all collected resolve/reject handlers in the cache
                var toNotify = cache.get(key);
                try {
                    // Set state of cache to received data before resolving 
                    // promises, with a timeout based on expires header.
                    var timeout = 0;
                    if (response.header.expires) {
                        var expires = Moment.utc(response.header.expires, 
                            'ddd, DD MMM YYYY HH:mm:ss GMT');
                        timeout = expires.diff(Moment.utc([]), 'seconds', true);
                    } 
                
                    if (error) {
                        cache.set(key, {error: error.response.error}, timeout);
                        for (r in toNotify.onReject) {
                            toNotify.onReject[r].apply(_this, 
                                                       [error.response.error]);
                        }
                    } else {
                        cache.set(key, {data: data}, timeout);
                        for (r in toNotify.onResolve) {
                            toNotify.onResolve[r].apply(_this, [data]);
                        }
                    }
                } catch(e) {
                    // Push the exception caught in the ESI callback to all the
                    // registered rejects.
                    if (toNotify && toNotify.onReject) {
                        for (r in toNotify.onReject) {
                            toNotify.onReject[r].apply(_this, e);
                        }
                    } else {
                        // In this worst case scenario, at least notify the 
                        // reject handler that was provided initially (will not 
                        // reject any subsequently cached handlers but that 
                        // shouldn't happen).
                        reject.apply(_this, e);
                    }
                }
            });
            // Invoke ESI function
            var api = newApi(apiCtor, accessToken);
            api[functionName].apply(api, fullArgs);

            // Set in cache after API call, in the event that the API function
            // fails on validation before it gets to the point where it handles
            // the callback which would notify the resolve/reject listeners.
            // - No timeout yet so that this won't expire until ESI request
            //   is completed or times-out on its own
            cache.set(key, { onResolve: [resolve], onReject: [reject] });
        } else if (blob.data) {
            // A previous request has completed successfully, so just invoke 
            // the provided resolve.
            resolve.apply(_this, [blob.data]);
        } else if (blob.error) {
            // A previous request has completed with an error, so just invoke 
            // the provided reject.
            reject.apply(_this, [blob.error]);
        } else {
            // A prior equivalent request has been initiated but hasn't 
            // completed, so append the promise handlers to the cache blob.
            blob.onResolve.push(resolve);
            blob.onReject.push(reject);
        }
    };

    /**
     * Create a new Promise for invoking the ESI request described by the
     * Api constructor, `apiCtor`, the function `functionName`, and arguments
     * stored in the array, `args`. If `accessToken` is defined then it will
     * be used for SSO authentication.
     *
     * @param {Constructor} apiCtor One of the ESI.xyzApi constructor functions
     * @param {String} functionName The name of a function callable on the 
     *   Api instance created by `apiCtor`.
     * @param {Array} args Array of arguments to pass to ESI Api function call
     * @param {String} accessToken Optional access token to use for 
     *   authentication, pass `undefined` if not needed
     * @return A new promise that resolves to the data returned by the request
     * @private
     */
    var newRequest = function(apiCtor, functionName, args, accessToken) {
        return new Promise(function(resolve, reject) {
            getCachedRequest(apiCtor, functionName, args, accessToken, resolve, 
                             reject);
        });
    };

    /**
     * A namespace container for the [corporation](https://esi.tech.ccp.is/latest/#/Corporation)
     * ESI endpoints.
     * @see https://esi.tech.ccp.is/latest/#/Corporation
     * @namespace
     */
    exports.Corporation = {
        /**
         * Get a corporation's public info from the ESI endpoint. This makes 
         * an HTTP GET request to [`corporations/{id}/](https://esi.tech.ccp.is/latest/#!/Corporation/get_corporations_corporation_id).
         * The request is returned as an asynchronous Promise that resolves to 
         * an object parsed from the response JSON model. An example value looks 
         * like:
         *
         * ```
         * {
         *   alliance_id: 434243723,
         *   ceo_id: 180548812,
         *   corporation_name: "C C P",
         *   member_count: 656,
         *   ticker: "-CCP-"
         * }
         * ```
         *
         * @param {Integer} id The corporation id
         * @return {external:Promise} A Promise that resolves to the response of
         *   the request
         * @see https://esi.tech.ccp.is/latest/#!/Corporation/get_corporations_corporation_id
         * @esi_link CorporationApi.getCorporationsCorporationId
         */
        get: function(id) {
            return newRequest(ESI.CorporationApi, 
                              'getCorporationsCorporationId', [id]);
        },

        /**
         * Get a corporation's alliance history from the ESI endpoint. This 
         * makes an HTTP GET request to [`corporations/{id}/alliancehistory/](https://esi.tech.ccp.is/latest/#!/Corporation/get_corporations_corporation_id_alliancehistory).
         * The request is returned as an asynchronous Promise that resolves to 
         * an array parsed from the response JSON model. An example value looks 
         * like:
         *
         * ```
         * [
         *   {
         *     "alliance": {
         *       "alliance_id": 99000006,
         *       "is_deleted": false
         *     },
         *     "record_id": 23,
         *     "start_date": "2016-10-25T14:46:00Z"
         *   },
         *   {
         *     "record_id": 1,
         *     "start_date": "2015-07-06T20:56:00Z"
         *   }
         * ]
         * ```
         *
         * @param {Integer} id The corporation id
         * @return {external:Promise} A Promise that resolves to the response of
         *   the request
         * @see https://esi.tech.ccp.is/latest/#!/Corporation/get_corporations_corporation_id_alliancehistory
         * @esi_link CorporationApi.getCorporationsCorporationIdAllianceHistory
         */
        getAllianceHistory: function(id) {
            return newRequest(ESI.CorporationApi, 
                              'getCorporationsCorporationIdAllianceHistory', 
                              [id]);
        },

        /**
         * Get a corporation's icon URLs from the ESI endpoint. This makes 
         * an HTTP GET request to [`corporations/{id}/icons/](https://esi.tech.ccp.is/latest/#!/Corporation/get_corporations_corporation_id_icons).
         * The request is returned as an asynchronous Promise that resolves to 
         * an object parsed from the response JSON model. An example value looks 
         * like:
         *
         * ```
         * {
         *   "px128x128": "https://imageserver.eveonline.com/Corporation/1000010_128.png",
         *   "px256x256": "https://imageserver.eveonline.com/Corporation/1000010_256.png",
         *   "px64x64": "https://imageserver.eveonline.com/Corporation/1000010_64.png"
         * }
         * ```
         *
         * @param {Integer} id The corporation id
         * @return {external:Promise} A Promise that resolves to the response of
         *   the request
         * @see https://esi.tech.ccp.is/latest/#!/Corporation/get_corporations_corporation_id_icons
         * @esi_link CorporationApi.getCorporationsCorporationIdIcons
         */
        getIcons: function(id) {
            return newRequest(ESI.CorporationApi, 
                              'getCorporationsCorporationIdIcons', [id]);
        },

        /**
         * Get a corporation's member list from the ESI endpoint. This 
         * makes an HTTP GET request to [`corporations/{id}/members/](https://esi.tech.ccp.is/latest/#!/Corporation/get_corporations_corporation_id_members).
         * The request is returned as an asynchronous Promise that resolves to 
         * an array parsed from the response JSON model. An example value looks 
         * like:
         *
         * ```
         * [
         *   {
         *     "character_id": 90000001
         *   },
         *   {
         *     "character_id": 90000002
         *   }
         * ]
         * ```
         *
         * @param {Integer} id The corporation id
         * @param {String} accessToken The SSO access token of a member of the
         *   corporation, used to authenticate the request
         * @return {external:Promise} A Promise that resolves to the response of
         *   the request
         * @see https://esi.tech.ccp.is/latest/#!/Corporation/get_corporations_corporation_id_members
         * @esi_link CorporationApi.getCorporationsCorporationIdMembers
         */
        getMembers: function(id, accessToken) {
            return newRequest(ESI.CorporationApi, 
                              'getCorporationsCorporationIdMembers', 
                              [id], accessToken);
        },

        /**
         * Get a corporation's member list with roles for each character from 
         * the ESI endpoint. This makes an HTTP GET request to 
         * [`corporations/{id}/members/](https://esi.tech.ccp.is/latest/#!/Corporation/get_corporations_corporation_id_roles).
         * The request is returned as an asynchronous Promise that resolves to 
         * an array parsed from the response JSON model. An example value looks 
         * like:
         *
         * ```
         * [
         *   {
         *     "character_id": 1000171,
         *     "roles": [
         *       "Director",
         *       "Station_Manager"
         *     ]
         *   }
         * ]
         * ```
         *
         * @param {Integer} id The corporation id
         * @param {String} accessToken The SSO access token of a member of the
         *   corporation that has the personnel manager or any other grantable
         *   role, used to authenticate the request
         * @return {external:Promise} A Promise that resolves to the response of
         *   the request
         * @see https://esi.tech.ccp.is/latest/#!/Corporation/get_corporations_corporation_id_roles
         * @esi_link CorporationApi.getCorporationsCorporationIdRoles
         */
        getRoles: function(id, accessToken) {
            return newRequest(ESI.CorporationApi, 
                              'getCorporationsCorporationIdRoles',
                              [id], accessToken);
        },

        /**
         * Get the names for a list of corporation ids from the ESI endpoint. 
         * This makes an HTTP GET request to [`corporations/names/](https://esi.tech.ccp.is/latest/#!/Corporation/get_corporations_names).
         * The request is returned as an asynchronous Promise that resolves to 
         * an array parsed from the response JSON model. An example value looks 
         * like:
         *
         * ```
         * [
         *   {
         *     "corporation_id": 1000171,
         *     "corporation_name": "Republic University"
         *   }
         * ]
         * ```
         *
         * @param {Integer} id The corporation id
         * @return {external:Promise} A Promise that resolves to the response of
         *   the request
         * @see https://esi.tech.ccp.is/latest/#!/Corporation/get_corporations_names
         * @esi_link CorporationApi.getCorporationsNames
         */
        getNamesOf: function(ids) {
            return newRequest(ESI.CorporationApi, 'getCorporationsNames', 
                              [ids]);
        }
    };

    return exports;
};
