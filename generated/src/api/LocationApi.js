/**
 * EVE Swagger Interface
 * An OpenAPI for EVE Online
 *
 * OpenAPI spec version: 0.3.2.dev3
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/GetCharactersCharacterIdLocationForbidden', 'model/GetCharactersCharacterIdLocationOk', 'model/GetCharactersCharacterIdLocationInternalServerError', 'model/GetCharactersCharacterIdShipOk', 'model/GetCharactersCharacterIdShipInternalServerError', 'model/GetCharactersCharacterIdShipForbidden'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/GetCharactersCharacterIdLocationForbidden'), require('../model/GetCharactersCharacterIdLocationOk'), require('../model/GetCharactersCharacterIdLocationInternalServerError'), require('../model/GetCharactersCharacterIdShipOk'), require('../model/GetCharactersCharacterIdShipInternalServerError'), require('../model/GetCharactersCharacterIdShipForbidden'));
  } else {
    // Browser globals (root is window)
    if (!root.EveSwaggerInterface) {
      root.EveSwaggerInterface = {};
    }
    root.EveSwaggerInterface.LocationApi = factory(root.EveSwaggerInterface.ApiClient, root.EveSwaggerInterface.GetCharactersCharacterIdLocationForbidden, root.EveSwaggerInterface.GetCharactersCharacterIdLocationOk, root.EveSwaggerInterface.GetCharactersCharacterIdLocationInternalServerError, root.EveSwaggerInterface.GetCharactersCharacterIdShipOk, root.EveSwaggerInterface.GetCharactersCharacterIdShipInternalServerError, root.EveSwaggerInterface.GetCharactersCharacterIdShipForbidden);
  }
}(this, function(ApiClient, GetCharactersCharacterIdLocationForbidden, GetCharactersCharacterIdLocationOk, GetCharactersCharacterIdLocationInternalServerError, GetCharactersCharacterIdShipOk, GetCharactersCharacterIdShipInternalServerError, GetCharactersCharacterIdShipForbidden) {
  'use strict';

  /**
   * Location service.
   * @module api/LocationApi
   * @version 0.3.2.dev3
   */

  /**
   * Constructs a new LocationApi. 
   * @alias module:api/LocationApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the getCharactersCharacterIdLocation operation.
     * @callback module:api/LocationApi~getCharactersCharacterIdLocationCallback
     * @param {String} error Error message, if any.
     * @param {module:model/GetCharactersCharacterIdLocationOk} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get character location
     * Information about the characters current location. Returns the current solar system id, and also the current station or structure ID if applicable.  ---  Alternate route: &#x60;/v1/characters/{character_id}/location/&#x60;  Alternate route: &#x60;/legacy/characters/{character_id}/location/&#x60;  Alternate route: &#x60;/dev/characters/{character_id}/location/&#x60;   ---  This route is cached for up to 5 seconds
     * @param {Integer} characterId An EVE character ID
     * @param {Object} opts Optional parameters
     * @param {module:model/String} opts.datasource The server name you would like data from (default to tranquility)
     * @param {module:api/LocationApi~getCharactersCharacterIdLocationCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/GetCharactersCharacterIdLocationOk}
     */
    this.getCharactersCharacterIdLocation = function(characterId, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'characterId' is set
      if (characterId == undefined || characterId == null) {
        throw "Missing the required parameter 'characterId' when calling getCharactersCharacterIdLocation";
      }


      var pathParams = {
        'character_id': characterId
      };
      var queryParams = {
        'datasource': opts['datasource']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['evesso'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = GetCharactersCharacterIdLocationOk;

      return this.apiClient.callApi(
        '/characters/{character_id}/location/', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the getCharactersCharacterIdShip operation.
     * @callback module:api/LocationApi~getCharactersCharacterIdShipCallback
     * @param {String} error Error message, if any.
     * @param {module:model/GetCharactersCharacterIdShipOk} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Get current ship
     * Get the current ship type, name and id  ---  Alternate route: &#x60;/v1/characters/{character_id}/ship/&#x60;  Alternate route: &#x60;/legacy/characters/{character_id}/ship/&#x60;  Alternate route: &#x60;/dev/characters/{character_id}/ship/&#x60;   ---  This route is cached for up to 5 seconds
     * @param {Integer} characterId An EVE character ID
     * @param {Object} opts Optional parameters
     * @param {module:model/String} opts.datasource The server name you would like data from (default to tranquility)
     * @param {module:api/LocationApi~getCharactersCharacterIdShipCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/GetCharactersCharacterIdShipOk}
     */
    this.getCharactersCharacterIdShip = function(characterId, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'characterId' is set
      if (characterId == undefined || characterId == null) {
        throw "Missing the required parameter 'characterId' when calling getCharactersCharacterIdShip";
      }


      var pathParams = {
        'character_id': characterId
      };
      var queryParams = {
        'datasource': opts['datasource']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['evesso'];
      var contentTypes = [];
      var accepts = ['application/json'];
      var returnType = GetCharactersCharacterIdShipOk;

      return this.apiClient.callApi(
        '/characters/{character_id}/ship/', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));