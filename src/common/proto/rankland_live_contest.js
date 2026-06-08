/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots.rankland_live_contest_client || ($protobuf.roots.rankland_live_contest_client = {});

$root.rankland_live_contest_client = (function() {

    /**
     * Namespace rankland_live_contest_client.
     * @exports rankland_live_contest_client
     * @namespace
     */
    var rankland_live_contest_client = {};

    rankland_live_contest_client.ClientEvent = (function() {

        /**
         * Properties of a ClientEvent.
         * @memberof rankland_live_contest_client
         * @interface IClientEvent
         * @property {number|null} [eventId] ClientEvent eventId
         * @property {rankland_live_contest_common.EventType|null} [type] ClientEvent type
         * @property {rankland_live_contest_common.INewSolutionEvent|null} [newSolutionData] ClientEvent newSolutionData
         * @property {rankland_live_contest_common.ISolutionOnProgressEvent|null} [solutionOnProgressData] ClientEvent solutionOnProgressData
         * @property {rankland_live_contest_common.ISolutionOnResultSettleEvent|null} [solutionOnResultSettleData] ClientEvent solutionOnResultSettleData
         * @property {rankland_live_contest_common.ISolutionOnResultChangeEvent|null} [solutionOnResultChangeData] ClientEvent solutionOnResultChangeData
         * @property {rankland_live_contest_common.IContestConfigChangeEvent|null} [contestConfigChangeData] ClientEvent contestConfigChangeData
         */

        /**
         * Constructs a new ClientEvent.
         * @memberof rankland_live_contest_client
         * @classdesc Represents a ClientEvent.
         * @implements IClientEvent
         * @constructor
         * @param {rankland_live_contest_client.IClientEvent=} [properties] Properties to set
         */
        function ClientEvent(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ClientEvent eventId.
         * @member {number} eventId
         * @memberof rankland_live_contest_client.ClientEvent
         * @instance
         */
        ClientEvent.prototype.eventId = 0;

        /**
         * ClientEvent type.
         * @member {rankland_live_contest_common.EventType} type
         * @memberof rankland_live_contest_client.ClientEvent
         * @instance
         */
        ClientEvent.prototype.type = 0;

        /**
         * ClientEvent newSolutionData.
         * @member {rankland_live_contest_common.INewSolutionEvent|null|undefined} newSolutionData
         * @memberof rankland_live_contest_client.ClientEvent
         * @instance
         */
        ClientEvent.prototype.newSolutionData = null;

        /**
         * ClientEvent solutionOnProgressData.
         * @member {rankland_live_contest_common.ISolutionOnProgressEvent|null|undefined} solutionOnProgressData
         * @memberof rankland_live_contest_client.ClientEvent
         * @instance
         */
        ClientEvent.prototype.solutionOnProgressData = null;

        /**
         * ClientEvent solutionOnResultSettleData.
         * @member {rankland_live_contest_common.ISolutionOnResultSettleEvent|null|undefined} solutionOnResultSettleData
         * @memberof rankland_live_contest_client.ClientEvent
         * @instance
         */
        ClientEvent.prototype.solutionOnResultSettleData = null;

        /**
         * ClientEvent solutionOnResultChangeData.
         * @member {rankland_live_contest_common.ISolutionOnResultChangeEvent|null|undefined} solutionOnResultChangeData
         * @memberof rankland_live_contest_client.ClientEvent
         * @instance
         */
        ClientEvent.prototype.solutionOnResultChangeData = null;

        /**
         * ClientEvent contestConfigChangeData.
         * @member {rankland_live_contest_common.IContestConfigChangeEvent|null|undefined} contestConfigChangeData
         * @memberof rankland_live_contest_client.ClientEvent
         * @instance
         */
        ClientEvent.prototype.contestConfigChangeData = null;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields;

        /**
         * ClientEvent data.
         * @member {"newSolutionData"|"solutionOnProgressData"|"solutionOnResultSettleData"|"solutionOnResultChangeData"|"contestConfigChangeData"|undefined} data
         * @memberof rankland_live_contest_client.ClientEvent
         * @instance
         */
        Object.defineProperty(ClientEvent.prototype, "data", {
            get: $util.oneOfGetter($oneOfFields = ["newSolutionData", "solutionOnProgressData", "solutionOnResultSettleData", "solutionOnResultChangeData", "contestConfigChangeData"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new ClientEvent instance using the specified properties.
         * @function create
         * @memberof rankland_live_contest_client.ClientEvent
         * @static
         * @param {rankland_live_contest_client.IClientEvent=} [properties] Properties to set
         * @returns {rankland_live_contest_client.ClientEvent} ClientEvent instance
         */
        ClientEvent.create = function create(properties) {
            return new ClientEvent(properties);
        };

        /**
         * Encodes the specified ClientEvent message. Does not implicitly {@link rankland_live_contest_client.ClientEvent.verify|verify} messages.
         * @function encode
         * @memberof rankland_live_contest_client.ClientEvent
         * @static
         * @param {rankland_live_contest_client.IClientEvent} message ClientEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ClientEvent.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.eventId != null && Object.hasOwnProperty.call(message, "eventId"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.eventId);
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.type);
            if (message.newSolutionData != null && Object.hasOwnProperty.call(message, "newSolutionData"))
                $root.rankland_live_contest_common.NewSolutionEvent.encode(message.newSolutionData, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            if (message.solutionOnProgressData != null && Object.hasOwnProperty.call(message, "solutionOnProgressData"))
                $root.rankland_live_contest_common.SolutionOnProgressEvent.encode(message.solutionOnProgressData, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
            if (message.solutionOnResultSettleData != null && Object.hasOwnProperty.call(message, "solutionOnResultSettleData"))
                $root.rankland_live_contest_common.SolutionOnResultSettleEvent.encode(message.solutionOnResultSettleData, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            if (message.solutionOnResultChangeData != null && Object.hasOwnProperty.call(message, "solutionOnResultChangeData"))
                $root.rankland_live_contest_common.SolutionOnResultChangeEvent.encode(message.solutionOnResultChangeData, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            if (message.contestConfigChangeData != null && Object.hasOwnProperty.call(message, "contestConfigChangeData"))
                $root.rankland_live_contest_common.ContestConfigChangeEvent.encode(message.contestConfigChangeData, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ClientEvent message, length delimited. Does not implicitly {@link rankland_live_contest_client.ClientEvent.verify|verify} messages.
         * @function encodeDelimited
         * @memberof rankland_live_contest_client.ClientEvent
         * @static
         * @param {rankland_live_contest_client.IClientEvent} message ClientEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ClientEvent.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ClientEvent message from the specified reader or buffer.
         * @function decode
         * @memberof rankland_live_contest_client.ClientEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {rankland_live_contest_client.ClientEvent} ClientEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ClientEvent.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_client.ClientEvent();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.eventId = reader.uint32();
                    break;
                case 2:
                    message.type = reader.int32();
                    break;
                case 3:
                    message.newSolutionData = $root.rankland_live_contest_common.NewSolutionEvent.decode(reader, reader.uint32());
                    break;
                case 4:
                    message.solutionOnProgressData = $root.rankland_live_contest_common.SolutionOnProgressEvent.decode(reader, reader.uint32());
                    break;
                case 5:
                    message.solutionOnResultSettleData = $root.rankland_live_contest_common.SolutionOnResultSettleEvent.decode(reader, reader.uint32());
                    break;
                case 6:
                    message.solutionOnResultChangeData = $root.rankland_live_contest_common.SolutionOnResultChangeEvent.decode(reader, reader.uint32());
                    break;
                case 7:
                    message.contestConfigChangeData = $root.rankland_live_contest_common.ContestConfigChangeEvent.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ClientEvent message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof rankland_live_contest_client.ClientEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {rankland_live_contest_client.ClientEvent} ClientEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ClientEvent.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ClientEvent message.
         * @function verify
         * @memberof rankland_live_contest_client.ClientEvent
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ClientEvent.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            var properties = {};
            if (message.eventId != null && message.hasOwnProperty("eventId"))
                if (!$util.isInteger(message.eventId))
                    return "eventId: integer expected";
            if (message.type != null && message.hasOwnProperty("type"))
                switch (message.type) {
                default:
                    return "type: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                    break;
                }
            if (message.newSolutionData != null && message.hasOwnProperty("newSolutionData")) {
                properties.data = 1;
                {
                    var error = $root.rankland_live_contest_common.NewSolutionEvent.verify(message.newSolutionData);
                    if (error)
                        return "newSolutionData." + error;
                }
            }
            if (message.solutionOnProgressData != null && message.hasOwnProperty("solutionOnProgressData")) {
                if (properties.data === 1)
                    return "data: multiple values";
                properties.data = 1;
                {
                    var error = $root.rankland_live_contest_common.SolutionOnProgressEvent.verify(message.solutionOnProgressData);
                    if (error)
                        return "solutionOnProgressData." + error;
                }
            }
            if (message.solutionOnResultSettleData != null && message.hasOwnProperty("solutionOnResultSettleData")) {
                if (properties.data === 1)
                    return "data: multiple values";
                properties.data = 1;
                {
                    var error = $root.rankland_live_contest_common.SolutionOnResultSettleEvent.verify(message.solutionOnResultSettleData);
                    if (error)
                        return "solutionOnResultSettleData." + error;
                }
            }
            if (message.solutionOnResultChangeData != null && message.hasOwnProperty("solutionOnResultChangeData")) {
                if (properties.data === 1)
                    return "data: multiple values";
                properties.data = 1;
                {
                    var error = $root.rankland_live_contest_common.SolutionOnResultChangeEvent.verify(message.solutionOnResultChangeData);
                    if (error)
                        return "solutionOnResultChangeData." + error;
                }
            }
            if (message.contestConfigChangeData != null && message.hasOwnProperty("contestConfigChangeData")) {
                if (properties.data === 1)
                    return "data: multiple values";
                properties.data = 1;
                {
                    var error = $root.rankland_live_contest_common.ContestConfigChangeEvent.verify(message.contestConfigChangeData);
                    if (error)
                        return "contestConfigChangeData." + error;
                }
            }
            return null;
        };

        /**
         * Creates a ClientEvent message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof rankland_live_contest_client.ClientEvent
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {rankland_live_contest_client.ClientEvent} ClientEvent
         */
        ClientEvent.fromObject = function fromObject(object) {
            if (object instanceof $root.rankland_live_contest_client.ClientEvent)
                return object;
            var message = new $root.rankland_live_contest_client.ClientEvent();
            if (object.eventId != null)
                message.eventId = object.eventId >>> 0;
            switch (object.type) {
            case "NEW_SOLUTION":
            case 0:
                message.type = 0;
                break;
            case "SOLUTION_ON_PROGRESS":
            case 1:
                message.type = 1;
                break;
            case "SOLUTION_ON_RESULT_SETTLE":
            case 2:
                message.type = 2;
                break;
            case "SOLUTION_ON_RESULT_CHANGE":
            case 3:
                message.type = 3;
                break;
            case "CONTEST_CONFIG_CHANGE":
            case 4:
                message.type = 4;
                break;
            }
            if (object.newSolutionData != null) {
                if (typeof object.newSolutionData !== "object")
                    throw TypeError(".rankland_live_contest_client.ClientEvent.newSolutionData: object expected");
                message.newSolutionData = $root.rankland_live_contest_common.NewSolutionEvent.fromObject(object.newSolutionData);
            }
            if (object.solutionOnProgressData != null) {
                if (typeof object.solutionOnProgressData !== "object")
                    throw TypeError(".rankland_live_contest_client.ClientEvent.solutionOnProgressData: object expected");
                message.solutionOnProgressData = $root.rankland_live_contest_common.SolutionOnProgressEvent.fromObject(object.solutionOnProgressData);
            }
            if (object.solutionOnResultSettleData != null) {
                if (typeof object.solutionOnResultSettleData !== "object")
                    throw TypeError(".rankland_live_contest_client.ClientEvent.solutionOnResultSettleData: object expected");
                message.solutionOnResultSettleData = $root.rankland_live_contest_common.SolutionOnResultSettleEvent.fromObject(object.solutionOnResultSettleData);
            }
            if (object.solutionOnResultChangeData != null) {
                if (typeof object.solutionOnResultChangeData !== "object")
                    throw TypeError(".rankland_live_contest_client.ClientEvent.solutionOnResultChangeData: object expected");
                message.solutionOnResultChangeData = $root.rankland_live_contest_common.SolutionOnResultChangeEvent.fromObject(object.solutionOnResultChangeData);
            }
            if (object.contestConfigChangeData != null) {
                if (typeof object.contestConfigChangeData !== "object")
                    throw TypeError(".rankland_live_contest_client.ClientEvent.contestConfigChangeData: object expected");
                message.contestConfigChangeData = $root.rankland_live_contest_common.ContestConfigChangeEvent.fromObject(object.contestConfigChangeData);
            }
            return message;
        };

        /**
         * Creates a plain object from a ClientEvent message. Also converts values to other types if specified.
         * @function toObject
         * @memberof rankland_live_contest_client.ClientEvent
         * @static
         * @param {rankland_live_contest_client.ClientEvent} message ClientEvent
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ClientEvent.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.eventId = 0;
                object.type = options.enums === String ? "NEW_SOLUTION" : 0;
            }
            if (message.eventId != null && message.hasOwnProperty("eventId"))
                object.eventId = message.eventId;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = options.enums === String ? $root.rankland_live_contest_common.EventType[message.type] : message.type;
            if (message.newSolutionData != null && message.hasOwnProperty("newSolutionData")) {
                object.newSolutionData = $root.rankland_live_contest_common.NewSolutionEvent.toObject(message.newSolutionData, options);
                if (options.oneofs)
                    object.data = "newSolutionData";
            }
            if (message.solutionOnProgressData != null && message.hasOwnProperty("solutionOnProgressData")) {
                object.solutionOnProgressData = $root.rankland_live_contest_common.SolutionOnProgressEvent.toObject(message.solutionOnProgressData, options);
                if (options.oneofs)
                    object.data = "solutionOnProgressData";
            }
            if (message.solutionOnResultSettleData != null && message.hasOwnProperty("solutionOnResultSettleData")) {
                object.solutionOnResultSettleData = $root.rankland_live_contest_common.SolutionOnResultSettleEvent.toObject(message.solutionOnResultSettleData, options);
                if (options.oneofs)
                    object.data = "solutionOnResultSettleData";
            }
            if (message.solutionOnResultChangeData != null && message.hasOwnProperty("solutionOnResultChangeData")) {
                object.solutionOnResultChangeData = $root.rankland_live_contest_common.SolutionOnResultChangeEvent.toObject(message.solutionOnResultChangeData, options);
                if (options.oneofs)
                    object.data = "solutionOnResultChangeData";
            }
            if (message.contestConfigChangeData != null && message.hasOwnProperty("contestConfigChangeData")) {
                object.contestConfigChangeData = $root.rankland_live_contest_common.ContestConfigChangeEvent.toObject(message.contestConfigChangeData, options);
                if (options.oneofs)
                    object.data = "contestConfigChangeData";
            }
            return object;
        };

        /**
         * Converts this ClientEvent to JSON.
         * @function toJSON
         * @memberof rankland_live_contest_client.ClientEvent
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ClientEvent.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ClientEvent;
    })();

    rankland_live_contest_client.BatchClientEvent = (function() {

        /**
         * Properties of a BatchClientEvent.
         * @memberof rankland_live_contest_client
         * @interface IBatchClientEvent
         * @property {Array.<rankland_live_contest_client.IClientEvent>|null} [events] BatchClientEvent events
         */

        /**
         * Constructs a new BatchClientEvent.
         * @memberof rankland_live_contest_client
         * @classdesc Represents a BatchClientEvent.
         * @implements IBatchClientEvent
         * @constructor
         * @param {rankland_live_contest_client.IBatchClientEvent=} [properties] Properties to set
         */
        function BatchClientEvent(properties) {
            this.events = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * BatchClientEvent events.
         * @member {Array.<rankland_live_contest_client.IClientEvent>} events
         * @memberof rankland_live_contest_client.BatchClientEvent
         * @instance
         */
        BatchClientEvent.prototype.events = $util.emptyArray;

        /**
         * Creates a new BatchClientEvent instance using the specified properties.
         * @function create
         * @memberof rankland_live_contest_client.BatchClientEvent
         * @static
         * @param {rankland_live_contest_client.IBatchClientEvent=} [properties] Properties to set
         * @returns {rankland_live_contest_client.BatchClientEvent} BatchClientEvent instance
         */
        BatchClientEvent.create = function create(properties) {
            return new BatchClientEvent(properties);
        };

        /**
         * Encodes the specified BatchClientEvent message. Does not implicitly {@link rankland_live_contest_client.BatchClientEvent.verify|verify} messages.
         * @function encode
         * @memberof rankland_live_contest_client.BatchClientEvent
         * @static
         * @param {rankland_live_contest_client.IBatchClientEvent} message BatchClientEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BatchClientEvent.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.events != null && message.events.length)
                for (var i = 0; i < message.events.length; ++i)
                    $root.rankland_live_contest_client.ClientEvent.encode(message.events[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified BatchClientEvent message, length delimited. Does not implicitly {@link rankland_live_contest_client.BatchClientEvent.verify|verify} messages.
         * @function encodeDelimited
         * @memberof rankland_live_contest_client.BatchClientEvent
         * @static
         * @param {rankland_live_contest_client.IBatchClientEvent} message BatchClientEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BatchClientEvent.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BatchClientEvent message from the specified reader or buffer.
         * @function decode
         * @memberof rankland_live_contest_client.BatchClientEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {rankland_live_contest_client.BatchClientEvent} BatchClientEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BatchClientEvent.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_client.BatchClientEvent();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.events && message.events.length))
                        message.events = [];
                    message.events.push($root.rankland_live_contest_client.ClientEvent.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BatchClientEvent message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof rankland_live_contest_client.BatchClientEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {rankland_live_contest_client.BatchClientEvent} BatchClientEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BatchClientEvent.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BatchClientEvent message.
         * @function verify
         * @memberof rankland_live_contest_client.BatchClientEvent
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BatchClientEvent.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.events != null && message.hasOwnProperty("events")) {
                if (!Array.isArray(message.events))
                    return "events: array expected";
                for (var i = 0; i < message.events.length; ++i) {
                    var error = $root.rankland_live_contest_client.ClientEvent.verify(message.events[i]);
                    if (error)
                        return "events." + error;
                }
            }
            return null;
        };

        /**
         * Creates a BatchClientEvent message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof rankland_live_contest_client.BatchClientEvent
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {rankland_live_contest_client.BatchClientEvent} BatchClientEvent
         */
        BatchClientEvent.fromObject = function fromObject(object) {
            if (object instanceof $root.rankland_live_contest_client.BatchClientEvent)
                return object;
            var message = new $root.rankland_live_contest_client.BatchClientEvent();
            if (object.events) {
                if (!Array.isArray(object.events))
                    throw TypeError(".rankland_live_contest_client.BatchClientEvent.events: array expected");
                message.events = [];
                for (var i = 0; i < object.events.length; ++i) {
                    if (typeof object.events[i] !== "object")
                        throw TypeError(".rankland_live_contest_client.BatchClientEvent.events: object expected");
                    message.events[i] = $root.rankland_live_contest_client.ClientEvent.fromObject(object.events[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a BatchClientEvent message. Also converts values to other types if specified.
         * @function toObject
         * @memberof rankland_live_contest_client.BatchClientEvent
         * @static
         * @param {rankland_live_contest_client.BatchClientEvent} message BatchClientEvent
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BatchClientEvent.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.events = [];
            if (message.events && message.events.length) {
                object.events = [];
                for (var j = 0; j < message.events.length; ++j)
                    object.events[j] = $root.rankland_live_contest_client.ClientEvent.toObject(message.events[j], options);
            }
            return object;
        };

        /**
         * Converts this BatchClientEvent to JSON.
         * @function toJSON
         * @memberof rankland_live_contest_client.BatchClientEvent
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BatchClientEvent.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return BatchClientEvent;
    })();

    rankland_live_contest_client.GetContestEventsResponse = (function() {

        /**
         * Properties of a GetContestEventsResponse.
         * @memberof rankland_live_contest_client
         * @interface IGetContestEventsResponse
         * @property {string|null} [uk] GetContestEventsResponse uk
         * @property {number|null} [fromEventId] GetContestEventsResponse fromEventId
         * @property {number|null} [toEventId] GetContestEventsResponse toEventId
         * @property {number|null} [checkpointEventId] GetContestEventsResponse checkpointEventId
         * @property {number|null} [latestEventId] GetContestEventsResponse latestEventId
         * @property {number|null} [streamRevision] GetContestEventsResponse streamRevision
         * @property {boolean|null} [hasMore] GetContestEventsResponse hasMore
         * @property {boolean|null} [resetRequired] GetContestEventsResponse resetRequired
         * @property {string|null} [resetReason] GetContestEventsResponse resetReason
         * @property {Array.<rankland_live_contest_client.IClientEvent>|null} [events] GetContestEventsResponse events
         */

        /**
         * Constructs a new GetContestEventsResponse.
         * @memberof rankland_live_contest_client
         * @classdesc Represents a GetContestEventsResponse.
         * @implements IGetContestEventsResponse
         * @constructor
         * @param {rankland_live_contest_client.IGetContestEventsResponse=} [properties] Properties to set
         */
        function GetContestEventsResponse(properties) {
            this.events = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetContestEventsResponse uk.
         * @member {string} uk
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @instance
         */
        GetContestEventsResponse.prototype.uk = "";

        /**
         * GetContestEventsResponse fromEventId.
         * @member {number|null|undefined} fromEventId
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @instance
         */
        GetContestEventsResponse.prototype.fromEventId = null;

        /**
         * GetContestEventsResponse toEventId.
         * @member {number|null|undefined} toEventId
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @instance
         */
        GetContestEventsResponse.prototype.toEventId = null;

        /**
         * GetContestEventsResponse checkpointEventId.
         * @member {number} checkpointEventId
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @instance
         */
        GetContestEventsResponse.prototype.checkpointEventId = 0;

        /**
         * GetContestEventsResponse latestEventId.
         * @member {number} latestEventId
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @instance
         */
        GetContestEventsResponse.prototype.latestEventId = 0;

        /**
         * GetContestEventsResponse streamRevision.
         * @member {number} streamRevision
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @instance
         */
        GetContestEventsResponse.prototype.streamRevision = 0;

        /**
         * GetContestEventsResponse hasMore.
         * @member {boolean} hasMore
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @instance
         */
        GetContestEventsResponse.prototype.hasMore = false;

        /**
         * GetContestEventsResponse resetRequired.
         * @member {boolean} resetRequired
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @instance
         */
        GetContestEventsResponse.prototype.resetRequired = false;

        /**
         * GetContestEventsResponse resetReason.
         * @member {string} resetReason
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @instance
         */
        GetContestEventsResponse.prototype.resetReason = "";

        /**
         * GetContestEventsResponse events.
         * @member {Array.<rankland_live_contest_client.IClientEvent>} events
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @instance
         */
        GetContestEventsResponse.prototype.events = $util.emptyArray;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields;

        /**
         * GetContestEventsResponse _fromEventId.
         * @member {"fromEventId"|undefined} _fromEventId
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @instance
         */
        Object.defineProperty(GetContestEventsResponse.prototype, "_fromEventId", {
            get: $util.oneOfGetter($oneOfFields = ["fromEventId"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * GetContestEventsResponse _toEventId.
         * @member {"toEventId"|undefined} _toEventId
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @instance
         */
        Object.defineProperty(GetContestEventsResponse.prototype, "_toEventId", {
            get: $util.oneOfGetter($oneOfFields = ["toEventId"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new GetContestEventsResponse instance using the specified properties.
         * @function create
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @static
         * @param {rankland_live_contest_client.IGetContestEventsResponse=} [properties] Properties to set
         * @returns {rankland_live_contest_client.GetContestEventsResponse} GetContestEventsResponse instance
         */
        GetContestEventsResponse.create = function create(properties) {
            return new GetContestEventsResponse(properties);
        };

        /**
         * Encodes the specified GetContestEventsResponse message. Does not implicitly {@link rankland_live_contest_client.GetContestEventsResponse.verify|verify} messages.
         * @function encode
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @static
         * @param {rankland_live_contest_client.IGetContestEventsResponse} message GetContestEventsResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetContestEventsResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.uk != null && Object.hasOwnProperty.call(message, "uk"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.uk);
            if (message.fromEventId != null && Object.hasOwnProperty.call(message, "fromEventId"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.fromEventId);
            if (message.toEventId != null && Object.hasOwnProperty.call(message, "toEventId"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.toEventId);
            if (message.checkpointEventId != null && Object.hasOwnProperty.call(message, "checkpointEventId"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.checkpointEventId);
            if (message.latestEventId != null && Object.hasOwnProperty.call(message, "latestEventId"))
                writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.latestEventId);
            if (message.streamRevision != null && Object.hasOwnProperty.call(message, "streamRevision"))
                writer.uint32(/* id 6, wireType 0 =*/48).uint32(message.streamRevision);
            if (message.hasMore != null && Object.hasOwnProperty.call(message, "hasMore"))
                writer.uint32(/* id 7, wireType 0 =*/56).bool(message.hasMore);
            if (message.resetRequired != null && Object.hasOwnProperty.call(message, "resetRequired"))
                writer.uint32(/* id 8, wireType 0 =*/64).bool(message.resetRequired);
            if (message.resetReason != null && Object.hasOwnProperty.call(message, "resetReason"))
                writer.uint32(/* id 9, wireType 2 =*/74).string(message.resetReason);
            if (message.events != null && message.events.length)
                for (var i = 0; i < message.events.length; ++i)
                    $root.rankland_live_contest_client.ClientEvent.encode(message.events[i], writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified GetContestEventsResponse message, length delimited. Does not implicitly {@link rankland_live_contest_client.GetContestEventsResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @static
         * @param {rankland_live_contest_client.IGetContestEventsResponse} message GetContestEventsResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetContestEventsResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GetContestEventsResponse message from the specified reader or buffer.
         * @function decode
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {rankland_live_contest_client.GetContestEventsResponse} GetContestEventsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetContestEventsResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_client.GetContestEventsResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.uk = reader.string();
                    break;
                case 2:
                    message.fromEventId = reader.uint32();
                    break;
                case 3:
                    message.toEventId = reader.uint32();
                    break;
                case 4:
                    message.checkpointEventId = reader.uint32();
                    break;
                case 5:
                    message.latestEventId = reader.uint32();
                    break;
                case 6:
                    message.streamRevision = reader.uint32();
                    break;
                case 7:
                    message.hasMore = reader.bool();
                    break;
                case 8:
                    message.resetRequired = reader.bool();
                    break;
                case 9:
                    message.resetReason = reader.string();
                    break;
                case 10:
                    if (!(message.events && message.events.length))
                        message.events = [];
                    message.events.push($root.rankland_live_contest_client.ClientEvent.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetContestEventsResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {rankland_live_contest_client.GetContestEventsResponse} GetContestEventsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetContestEventsResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetContestEventsResponse message.
         * @function verify
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetContestEventsResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            var properties = {};
            if (message.uk != null && message.hasOwnProperty("uk"))
                if (!$util.isString(message.uk))
                    return "uk: string expected";
            if (message.fromEventId != null && message.hasOwnProperty("fromEventId")) {
                properties._fromEventId = 1;
                if (!$util.isInteger(message.fromEventId))
                    return "fromEventId: integer expected";
            }
            if (message.toEventId != null && message.hasOwnProperty("toEventId")) {
                properties._toEventId = 1;
                if (!$util.isInteger(message.toEventId))
                    return "toEventId: integer expected";
            }
            if (message.checkpointEventId != null && message.hasOwnProperty("checkpointEventId"))
                if (!$util.isInteger(message.checkpointEventId))
                    return "checkpointEventId: integer expected";
            if (message.latestEventId != null && message.hasOwnProperty("latestEventId"))
                if (!$util.isInteger(message.latestEventId))
                    return "latestEventId: integer expected";
            if (message.streamRevision != null && message.hasOwnProperty("streamRevision"))
                if (!$util.isInteger(message.streamRevision))
                    return "streamRevision: integer expected";
            if (message.hasMore != null && message.hasOwnProperty("hasMore"))
                if (typeof message.hasMore !== "boolean")
                    return "hasMore: boolean expected";
            if (message.resetRequired != null && message.hasOwnProperty("resetRequired"))
                if (typeof message.resetRequired !== "boolean")
                    return "resetRequired: boolean expected";
            if (message.resetReason != null && message.hasOwnProperty("resetReason"))
                if (!$util.isString(message.resetReason))
                    return "resetReason: string expected";
            if (message.events != null && message.hasOwnProperty("events")) {
                if (!Array.isArray(message.events))
                    return "events: array expected";
                for (var i = 0; i < message.events.length; ++i) {
                    var error = $root.rankland_live_contest_client.ClientEvent.verify(message.events[i]);
                    if (error)
                        return "events." + error;
                }
            }
            return null;
        };

        /**
         * Creates a GetContestEventsResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {rankland_live_contest_client.GetContestEventsResponse} GetContestEventsResponse
         */
        GetContestEventsResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.rankland_live_contest_client.GetContestEventsResponse)
                return object;
            var message = new $root.rankland_live_contest_client.GetContestEventsResponse();
            if (object.uk != null)
                message.uk = String(object.uk);
            if (object.fromEventId != null)
                message.fromEventId = object.fromEventId >>> 0;
            if (object.toEventId != null)
                message.toEventId = object.toEventId >>> 0;
            if (object.checkpointEventId != null)
                message.checkpointEventId = object.checkpointEventId >>> 0;
            if (object.latestEventId != null)
                message.latestEventId = object.latestEventId >>> 0;
            if (object.streamRevision != null)
                message.streamRevision = object.streamRevision >>> 0;
            if (object.hasMore != null)
                message.hasMore = Boolean(object.hasMore);
            if (object.resetRequired != null)
                message.resetRequired = Boolean(object.resetRequired);
            if (object.resetReason != null)
                message.resetReason = String(object.resetReason);
            if (object.events) {
                if (!Array.isArray(object.events))
                    throw TypeError(".rankland_live_contest_client.GetContestEventsResponse.events: array expected");
                message.events = [];
                for (var i = 0; i < object.events.length; ++i) {
                    if (typeof object.events[i] !== "object")
                        throw TypeError(".rankland_live_contest_client.GetContestEventsResponse.events: object expected");
                    message.events[i] = $root.rankland_live_contest_client.ClientEvent.fromObject(object.events[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a GetContestEventsResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @static
         * @param {rankland_live_contest_client.GetContestEventsResponse} message GetContestEventsResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetContestEventsResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.events = [];
            if (options.defaults) {
                object.uk = "";
                object.checkpointEventId = 0;
                object.latestEventId = 0;
                object.streamRevision = 0;
                object.hasMore = false;
                object.resetRequired = false;
                object.resetReason = "";
            }
            if (message.uk != null && message.hasOwnProperty("uk"))
                object.uk = message.uk;
            if (message.fromEventId != null && message.hasOwnProperty("fromEventId")) {
                object.fromEventId = message.fromEventId;
                if (options.oneofs)
                    object._fromEventId = "fromEventId";
            }
            if (message.toEventId != null && message.hasOwnProperty("toEventId")) {
                object.toEventId = message.toEventId;
                if (options.oneofs)
                    object._toEventId = "toEventId";
            }
            if (message.checkpointEventId != null && message.hasOwnProperty("checkpointEventId"))
                object.checkpointEventId = message.checkpointEventId;
            if (message.latestEventId != null && message.hasOwnProperty("latestEventId"))
                object.latestEventId = message.latestEventId;
            if (message.streamRevision != null && message.hasOwnProperty("streamRevision"))
                object.streamRevision = message.streamRevision;
            if (message.hasMore != null && message.hasOwnProperty("hasMore"))
                object.hasMore = message.hasMore;
            if (message.resetRequired != null && message.hasOwnProperty("resetRequired"))
                object.resetRequired = message.resetRequired;
            if (message.resetReason != null && message.hasOwnProperty("resetReason"))
                object.resetReason = message.resetReason;
            if (message.events && message.events.length) {
                object.events = [];
                for (var j = 0; j < message.events.length; ++j)
                    object.events[j] = $root.rankland_live_contest_client.ClientEvent.toObject(message.events[j], options);
            }
            return object;
        };

        /**
         * Converts this GetContestEventsResponse to JSON.
         * @function toJSON
         * @memberof rankland_live_contest_client.GetContestEventsResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetContestEventsResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return GetContestEventsResponse;
    })();

    return rankland_live_contest_client;
})();

$root.rankland_live_contest_common = (function() {

    /**
     * Namespace rankland_live_contest_common.
     * @exports rankland_live_contest_common
     * @namespace
     */
    var rankland_live_contest_common = {};

    /**
     * Result enum.
     * @name rankland_live_contest_common.Result
     * @enum {number}
     * @property {number} PD=0 PD value
     * @property {number} JG=1 JG value
     * @property {number} CNL=2 CNL value
     * @property {number} FZ=3 FZ value
     * @property {number} UKE=4 UKE value
     * @property {number} AC=5 AC value
     * @property {number} FB=6 FB value
     * @property {number} RJ=7 RJ value
     * @property {number} WA=8 WA value
     * @property {number} PE=9 PE value
     * @property {number} TLE=10 TLE value
     * @property {number} MLE=11 MLE value
     * @property {number} OLE=12 OLE value
     * @property {number} RTE=13 RTE value
     * @property {number} NOUT=14 NOUT value
     * @property {number} CE=15 CE value
     */
    rankland_live_contest_common.Result = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "PD"] = 0;
        values[valuesById[1] = "JG"] = 1;
        values[valuesById[2] = "CNL"] = 2;
        values[valuesById[3] = "FZ"] = 3;
        values[valuesById[4] = "UKE"] = 4;
        values[valuesById[5] = "AC"] = 5;
        values[valuesById[6] = "FB"] = 6;
        values[valuesById[7] = "RJ"] = 7;
        values[valuesById[8] = "WA"] = 8;
        values[valuesById[9] = "PE"] = 9;
        values[valuesById[10] = "TLE"] = 10;
        values[valuesById[11] = "MLE"] = 11;
        values[valuesById[12] = "OLE"] = 12;
        values[valuesById[13] = "RTE"] = 13;
        values[valuesById[14] = "NOUT"] = 14;
        values[valuesById[15] = "CE"] = 15;
        return values;
    })();

    /**
     * TimeUnit enum.
     * @name rankland_live_contest_common.TimeUnit
     * @enum {number}
     * @property {number} S=0 S value
     * @property {number} MS=1 MS value
     * @property {number} US=2 US value
     * @property {number} NS=3 NS value
     */
    rankland_live_contest_common.TimeUnit = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "S"] = 0;
        values[valuesById[1] = "MS"] = 1;
        values[valuesById[2] = "US"] = 2;
        values[valuesById[3] = "NS"] = 3;
        return values;
    })();

    rankland_live_contest_common.TimeDuration = (function() {

        /**
         * Properties of a TimeDuration.
         * @memberof rankland_live_contest_common
         * @interface ITimeDuration
         * @property {Long|null} [value] TimeDuration value
         * @property {rankland_live_contest_common.TimeUnit|null} [unit] TimeDuration unit
         */

        /**
         * Constructs a new TimeDuration.
         * @memberof rankland_live_contest_common
         * @classdesc Represents a TimeDuration.
         * @implements ITimeDuration
         * @constructor
         * @param {rankland_live_contest_common.ITimeDuration=} [properties] Properties to set
         */
        function TimeDuration(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * TimeDuration value.
         * @member {Long} value
         * @memberof rankland_live_contest_common.TimeDuration
         * @instance
         */
        TimeDuration.prototype.value = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * TimeDuration unit.
         * @member {rankland_live_contest_common.TimeUnit} unit
         * @memberof rankland_live_contest_common.TimeDuration
         * @instance
         */
        TimeDuration.prototype.unit = 0;

        /**
         * Creates a new TimeDuration instance using the specified properties.
         * @function create
         * @memberof rankland_live_contest_common.TimeDuration
         * @static
         * @param {rankland_live_contest_common.ITimeDuration=} [properties] Properties to set
         * @returns {rankland_live_contest_common.TimeDuration} TimeDuration instance
         */
        TimeDuration.create = function create(properties) {
            return new TimeDuration(properties);
        };

        /**
         * Encodes the specified TimeDuration message. Does not implicitly {@link rankland_live_contest_common.TimeDuration.verify|verify} messages.
         * @function encode
         * @memberof rankland_live_contest_common.TimeDuration
         * @static
         * @param {rankland_live_contest_common.ITimeDuration} message TimeDuration message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TimeDuration.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.value);
            if (message.unit != null && Object.hasOwnProperty.call(message, "unit"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.unit);
            return writer;
        };

        /**
         * Encodes the specified TimeDuration message, length delimited. Does not implicitly {@link rankland_live_contest_common.TimeDuration.verify|verify} messages.
         * @function encodeDelimited
         * @memberof rankland_live_contest_common.TimeDuration
         * @static
         * @param {rankland_live_contest_common.ITimeDuration} message TimeDuration message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TimeDuration.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a TimeDuration message from the specified reader or buffer.
         * @function decode
         * @memberof rankland_live_contest_common.TimeDuration
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {rankland_live_contest_common.TimeDuration} TimeDuration
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TimeDuration.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_common.TimeDuration();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.value = reader.int64();
                    break;
                case 2:
                    message.unit = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a TimeDuration message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof rankland_live_contest_common.TimeDuration
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {rankland_live_contest_common.TimeDuration} TimeDuration
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TimeDuration.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a TimeDuration message.
         * @function verify
         * @memberof rankland_live_contest_common.TimeDuration
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        TimeDuration.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.value != null && message.hasOwnProperty("value"))
                if (!$util.isInteger(message.value) && !(message.value && $util.isInteger(message.value.low) && $util.isInteger(message.value.high)))
                    return "value: integer|Long expected";
            if (message.unit != null && message.hasOwnProperty("unit"))
                switch (message.unit) {
                default:
                    return "unit: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                    break;
                }
            return null;
        };

        /**
         * Creates a TimeDuration message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof rankland_live_contest_common.TimeDuration
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {rankland_live_contest_common.TimeDuration} TimeDuration
         */
        TimeDuration.fromObject = function fromObject(object) {
            if (object instanceof $root.rankland_live_contest_common.TimeDuration)
                return object;
            var message = new $root.rankland_live_contest_common.TimeDuration();
            if (object.value != null)
                if ($util.Long)
                    (message.value = $util.Long.fromValue(object.value)).unsigned = false;
                else if (typeof object.value === "string")
                    message.value = parseInt(object.value, 10);
                else if (typeof object.value === "number")
                    message.value = object.value;
                else if (typeof object.value === "object")
                    message.value = new $util.LongBits(object.value.low >>> 0, object.value.high >>> 0).toNumber();
            switch (object.unit) {
            case "S":
            case 0:
                message.unit = 0;
                break;
            case "MS":
            case 1:
                message.unit = 1;
                break;
            case "US":
            case 2:
                message.unit = 2;
                break;
            case "NS":
            case 3:
                message.unit = 3;
                break;
            }
            return message;
        };

        /**
         * Creates a plain object from a TimeDuration message. Also converts values to other types if specified.
         * @function toObject
         * @memberof rankland_live_contest_common.TimeDuration
         * @static
         * @param {rankland_live_contest_common.TimeDuration} message TimeDuration
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        TimeDuration.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.value = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.value = options.longs === String ? "0" : 0;
                object.unit = options.enums === String ? "S" : 0;
            }
            if (message.value != null && message.hasOwnProperty("value"))
                if (typeof message.value === "number")
                    object.value = options.longs === String ? String(message.value) : message.value;
                else
                    object.value = options.longs === String ? $util.Long.prototype.toString.call(message.value) : options.longs === Number ? new $util.LongBits(message.value.low >>> 0, message.value.high >>> 0).toNumber() : message.value;
            if (message.unit != null && message.hasOwnProperty("unit"))
                object.unit = options.enums === String ? $root.rankland_live_contest_common.TimeUnit[message.unit] : message.unit;
            return object;
        };

        /**
         * Converts this TimeDuration to JSON.
         * @function toJSON
         * @memberof rankland_live_contest_common.TimeDuration
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        TimeDuration.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return TimeDuration;
    })();

    /**
     * EventType enum.
     * @name rankland_live_contest_common.EventType
     * @enum {number}
     * @property {number} NEW_SOLUTION=0 NEW_SOLUTION value
     * @property {number} SOLUTION_ON_PROGRESS=1 SOLUTION_ON_PROGRESS value
     * @property {number} SOLUTION_ON_RESULT_SETTLE=2 SOLUTION_ON_RESULT_SETTLE value
     * @property {number} SOLUTION_ON_RESULT_CHANGE=3 SOLUTION_ON_RESULT_CHANGE value
     * @property {number} CONTEST_CONFIG_CHANGE=4 CONTEST_CONFIG_CHANGE value
     */
    rankland_live_contest_common.EventType = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "NEW_SOLUTION"] = 0;
        values[valuesById[1] = "SOLUTION_ON_PROGRESS"] = 1;
        values[valuesById[2] = "SOLUTION_ON_RESULT_SETTLE"] = 2;
        values[valuesById[3] = "SOLUTION_ON_RESULT_CHANGE"] = 3;
        values[valuesById[4] = "CONTEST_CONFIG_CHANGE"] = 4;
        return values;
    })();

    rankland_live_contest_common.NewSolutionEvent = (function() {

        /**
         * Properties of a NewSolutionEvent.
         * @memberof rankland_live_contest_common
         * @interface INewSolutionEvent
         * @property {number|null} [solutionId] NewSolutionEvent solutionId
         * @property {string|null} [userId] NewSolutionEvent userId
         * @property {string|null} [problemAlias] NewSolutionEvent problemAlias
         * @property {rankland_live_contest_common.ITimeDuration|null} [time] NewSolutionEvent time
         */

        /**
         * Constructs a new NewSolutionEvent.
         * @memberof rankland_live_contest_common
         * @classdesc Represents a NewSolutionEvent.
         * @implements INewSolutionEvent
         * @constructor
         * @param {rankland_live_contest_common.INewSolutionEvent=} [properties] Properties to set
         */
        function NewSolutionEvent(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * NewSolutionEvent solutionId.
         * @member {number} solutionId
         * @memberof rankland_live_contest_common.NewSolutionEvent
         * @instance
         */
        NewSolutionEvent.prototype.solutionId = 0;

        /**
         * NewSolutionEvent userId.
         * @member {string} userId
         * @memberof rankland_live_contest_common.NewSolutionEvent
         * @instance
         */
        NewSolutionEvent.prototype.userId = "";

        /**
         * NewSolutionEvent problemAlias.
         * @member {string} problemAlias
         * @memberof rankland_live_contest_common.NewSolutionEvent
         * @instance
         */
        NewSolutionEvent.prototype.problemAlias = "";

        /**
         * NewSolutionEvent time.
         * @member {rankland_live_contest_common.ITimeDuration|null|undefined} time
         * @memberof rankland_live_contest_common.NewSolutionEvent
         * @instance
         */
        NewSolutionEvent.prototype.time = null;

        /**
         * Creates a new NewSolutionEvent instance using the specified properties.
         * @function create
         * @memberof rankland_live_contest_common.NewSolutionEvent
         * @static
         * @param {rankland_live_contest_common.INewSolutionEvent=} [properties] Properties to set
         * @returns {rankland_live_contest_common.NewSolutionEvent} NewSolutionEvent instance
         */
        NewSolutionEvent.create = function create(properties) {
            return new NewSolutionEvent(properties);
        };

        /**
         * Encodes the specified NewSolutionEvent message. Does not implicitly {@link rankland_live_contest_common.NewSolutionEvent.verify|verify} messages.
         * @function encode
         * @memberof rankland_live_contest_common.NewSolutionEvent
         * @static
         * @param {rankland_live_contest_common.INewSolutionEvent} message NewSolutionEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        NewSolutionEvent.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.solutionId != null && Object.hasOwnProperty.call(message, "solutionId"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.solutionId);
            if (message.userId != null && Object.hasOwnProperty.call(message, "userId"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.userId);
            if (message.problemAlias != null && Object.hasOwnProperty.call(message, "problemAlias"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.problemAlias);
            if (message.time != null && Object.hasOwnProperty.call(message, "time"))
                $root.rankland_live_contest_common.TimeDuration.encode(message.time, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified NewSolutionEvent message, length delimited. Does not implicitly {@link rankland_live_contest_common.NewSolutionEvent.verify|verify} messages.
         * @function encodeDelimited
         * @memberof rankland_live_contest_common.NewSolutionEvent
         * @static
         * @param {rankland_live_contest_common.INewSolutionEvent} message NewSolutionEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        NewSolutionEvent.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a NewSolutionEvent message from the specified reader or buffer.
         * @function decode
         * @memberof rankland_live_contest_common.NewSolutionEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {rankland_live_contest_common.NewSolutionEvent} NewSolutionEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        NewSolutionEvent.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_common.NewSolutionEvent();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.solutionId = reader.uint32();
                    break;
                case 2:
                    message.userId = reader.string();
                    break;
                case 3:
                    message.problemAlias = reader.string();
                    break;
                case 4:
                    message.time = $root.rankland_live_contest_common.TimeDuration.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a NewSolutionEvent message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof rankland_live_contest_common.NewSolutionEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {rankland_live_contest_common.NewSolutionEvent} NewSolutionEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        NewSolutionEvent.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a NewSolutionEvent message.
         * @function verify
         * @memberof rankland_live_contest_common.NewSolutionEvent
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        NewSolutionEvent.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.solutionId != null && message.hasOwnProperty("solutionId"))
                if (!$util.isInteger(message.solutionId))
                    return "solutionId: integer expected";
            if (message.userId != null && message.hasOwnProperty("userId"))
                if (!$util.isString(message.userId))
                    return "userId: string expected";
            if (message.problemAlias != null && message.hasOwnProperty("problemAlias"))
                if (!$util.isString(message.problemAlias))
                    return "problemAlias: string expected";
            if (message.time != null && message.hasOwnProperty("time")) {
                var error = $root.rankland_live_contest_common.TimeDuration.verify(message.time);
                if (error)
                    return "time." + error;
            }
            return null;
        };

        /**
         * Creates a NewSolutionEvent message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof rankland_live_contest_common.NewSolutionEvent
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {rankland_live_contest_common.NewSolutionEvent} NewSolutionEvent
         */
        NewSolutionEvent.fromObject = function fromObject(object) {
            if (object instanceof $root.rankland_live_contest_common.NewSolutionEvent)
                return object;
            var message = new $root.rankland_live_contest_common.NewSolutionEvent();
            if (object.solutionId != null)
                message.solutionId = object.solutionId >>> 0;
            if (object.userId != null)
                message.userId = String(object.userId);
            if (object.problemAlias != null)
                message.problemAlias = String(object.problemAlias);
            if (object.time != null) {
                if (typeof object.time !== "object")
                    throw TypeError(".rankland_live_contest_common.NewSolutionEvent.time: object expected");
                message.time = $root.rankland_live_contest_common.TimeDuration.fromObject(object.time);
            }
            return message;
        };

        /**
         * Creates a plain object from a NewSolutionEvent message. Also converts values to other types if specified.
         * @function toObject
         * @memberof rankland_live_contest_common.NewSolutionEvent
         * @static
         * @param {rankland_live_contest_common.NewSolutionEvent} message NewSolutionEvent
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        NewSolutionEvent.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.solutionId = 0;
                object.userId = "";
                object.problemAlias = "";
                object.time = null;
            }
            if (message.solutionId != null && message.hasOwnProperty("solutionId"))
                object.solutionId = message.solutionId;
            if (message.userId != null && message.hasOwnProperty("userId"))
                object.userId = message.userId;
            if (message.problemAlias != null && message.hasOwnProperty("problemAlias"))
                object.problemAlias = message.problemAlias;
            if (message.time != null && message.hasOwnProperty("time"))
                object.time = $root.rankland_live_contest_common.TimeDuration.toObject(message.time, options);
            return object;
        };

        /**
         * Converts this NewSolutionEvent to JSON.
         * @function toJSON
         * @memberof rankland_live_contest_common.NewSolutionEvent
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        NewSolutionEvent.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return NewSolutionEvent;
    })();

    rankland_live_contest_common.SolutionOnProgressEvent = (function() {

        /**
         * Properties of a SolutionOnProgressEvent.
         * @memberof rankland_live_contest_common
         * @interface ISolutionOnProgressEvent
         * @property {number|null} [solutionId] SolutionOnProgressEvent solutionId
         * @property {number|null} [percentageProgress] SolutionOnProgressEvent percentageProgress
         * @property {rankland_live_contest_common.ITimeDuration|null} [time] SolutionOnProgressEvent time
         */

        /**
         * Constructs a new SolutionOnProgressEvent.
         * @memberof rankland_live_contest_common
         * @classdesc Represents a SolutionOnProgressEvent.
         * @implements ISolutionOnProgressEvent
         * @constructor
         * @param {rankland_live_contest_common.ISolutionOnProgressEvent=} [properties] Properties to set
         */
        function SolutionOnProgressEvent(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SolutionOnProgressEvent solutionId.
         * @member {number} solutionId
         * @memberof rankland_live_contest_common.SolutionOnProgressEvent
         * @instance
         */
        SolutionOnProgressEvent.prototype.solutionId = 0;

        /**
         * SolutionOnProgressEvent percentageProgress.
         * @member {number} percentageProgress
         * @memberof rankland_live_contest_common.SolutionOnProgressEvent
         * @instance
         */
        SolutionOnProgressEvent.prototype.percentageProgress = 0;

        /**
         * SolutionOnProgressEvent time.
         * @member {rankland_live_contest_common.ITimeDuration|null|undefined} time
         * @memberof rankland_live_contest_common.SolutionOnProgressEvent
         * @instance
         */
        SolutionOnProgressEvent.prototype.time = null;

        /**
         * Creates a new SolutionOnProgressEvent instance using the specified properties.
         * @function create
         * @memberof rankland_live_contest_common.SolutionOnProgressEvent
         * @static
         * @param {rankland_live_contest_common.ISolutionOnProgressEvent=} [properties] Properties to set
         * @returns {rankland_live_contest_common.SolutionOnProgressEvent} SolutionOnProgressEvent instance
         */
        SolutionOnProgressEvent.create = function create(properties) {
            return new SolutionOnProgressEvent(properties);
        };

        /**
         * Encodes the specified SolutionOnProgressEvent message. Does not implicitly {@link rankland_live_contest_common.SolutionOnProgressEvent.verify|verify} messages.
         * @function encode
         * @memberof rankland_live_contest_common.SolutionOnProgressEvent
         * @static
         * @param {rankland_live_contest_common.ISolutionOnProgressEvent} message SolutionOnProgressEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SolutionOnProgressEvent.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.solutionId != null && Object.hasOwnProperty.call(message, "solutionId"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.solutionId);
            if (message.percentageProgress != null && Object.hasOwnProperty.call(message, "percentageProgress"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.percentageProgress);
            if (message.time != null && Object.hasOwnProperty.call(message, "time"))
                $root.rankland_live_contest_common.TimeDuration.encode(message.time, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified SolutionOnProgressEvent message, length delimited. Does not implicitly {@link rankland_live_contest_common.SolutionOnProgressEvent.verify|verify} messages.
         * @function encodeDelimited
         * @memberof rankland_live_contest_common.SolutionOnProgressEvent
         * @static
         * @param {rankland_live_contest_common.ISolutionOnProgressEvent} message SolutionOnProgressEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SolutionOnProgressEvent.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a SolutionOnProgressEvent message from the specified reader or buffer.
         * @function decode
         * @memberof rankland_live_contest_common.SolutionOnProgressEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {rankland_live_contest_common.SolutionOnProgressEvent} SolutionOnProgressEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SolutionOnProgressEvent.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_common.SolutionOnProgressEvent();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.solutionId = reader.uint32();
                    break;
                case 2:
                    message.percentageProgress = reader.uint32();
                    break;
                case 3:
                    message.time = $root.rankland_live_contest_common.TimeDuration.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a SolutionOnProgressEvent message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof rankland_live_contest_common.SolutionOnProgressEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {rankland_live_contest_common.SolutionOnProgressEvent} SolutionOnProgressEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SolutionOnProgressEvent.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SolutionOnProgressEvent message.
         * @function verify
         * @memberof rankland_live_contest_common.SolutionOnProgressEvent
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SolutionOnProgressEvent.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.solutionId != null && message.hasOwnProperty("solutionId"))
                if (!$util.isInteger(message.solutionId))
                    return "solutionId: integer expected";
            if (message.percentageProgress != null && message.hasOwnProperty("percentageProgress"))
                if (!$util.isInteger(message.percentageProgress))
                    return "percentageProgress: integer expected";
            if (message.time != null && message.hasOwnProperty("time")) {
                var error = $root.rankland_live_contest_common.TimeDuration.verify(message.time);
                if (error)
                    return "time." + error;
            }
            return null;
        };

        /**
         * Creates a SolutionOnProgressEvent message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof rankland_live_contest_common.SolutionOnProgressEvent
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {rankland_live_contest_common.SolutionOnProgressEvent} SolutionOnProgressEvent
         */
        SolutionOnProgressEvent.fromObject = function fromObject(object) {
            if (object instanceof $root.rankland_live_contest_common.SolutionOnProgressEvent)
                return object;
            var message = new $root.rankland_live_contest_common.SolutionOnProgressEvent();
            if (object.solutionId != null)
                message.solutionId = object.solutionId >>> 0;
            if (object.percentageProgress != null)
                message.percentageProgress = object.percentageProgress >>> 0;
            if (object.time != null) {
                if (typeof object.time !== "object")
                    throw TypeError(".rankland_live_contest_common.SolutionOnProgressEvent.time: object expected");
                message.time = $root.rankland_live_contest_common.TimeDuration.fromObject(object.time);
            }
            return message;
        };

        /**
         * Creates a plain object from a SolutionOnProgressEvent message. Also converts values to other types if specified.
         * @function toObject
         * @memberof rankland_live_contest_common.SolutionOnProgressEvent
         * @static
         * @param {rankland_live_contest_common.SolutionOnProgressEvent} message SolutionOnProgressEvent
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SolutionOnProgressEvent.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.solutionId = 0;
                object.percentageProgress = 0;
                object.time = null;
            }
            if (message.solutionId != null && message.hasOwnProperty("solutionId"))
                object.solutionId = message.solutionId;
            if (message.percentageProgress != null && message.hasOwnProperty("percentageProgress"))
                object.percentageProgress = message.percentageProgress;
            if (message.time != null && message.hasOwnProperty("time"))
                object.time = $root.rankland_live_contest_common.TimeDuration.toObject(message.time, options);
            return object;
        };

        /**
         * Converts this SolutionOnProgressEvent to JSON.
         * @function toJSON
         * @memberof rankland_live_contest_common.SolutionOnProgressEvent
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SolutionOnProgressEvent.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return SolutionOnProgressEvent;
    })();

    rankland_live_contest_common.SolutionOnResultSettleEvent = (function() {

        /**
         * Properties of a SolutionOnResultSettleEvent.
         * @memberof rankland_live_contest_common
         * @interface ISolutionOnResultSettleEvent
         * @property {number|null} [solutionId] SolutionOnResultSettleEvent solutionId
         * @property {rankland_live_contest_common.Result|null} [result] SolutionOnResultSettleEvent result
         * @property {rankland_live_contest_common.ITimeDuration|null} [time] SolutionOnResultSettleEvent time
         */

        /**
         * Constructs a new SolutionOnResultSettleEvent.
         * @memberof rankland_live_contest_common
         * @classdesc Represents a SolutionOnResultSettleEvent.
         * @implements ISolutionOnResultSettleEvent
         * @constructor
         * @param {rankland_live_contest_common.ISolutionOnResultSettleEvent=} [properties] Properties to set
         */
        function SolutionOnResultSettleEvent(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SolutionOnResultSettleEvent solutionId.
         * @member {number} solutionId
         * @memberof rankland_live_contest_common.SolutionOnResultSettleEvent
         * @instance
         */
        SolutionOnResultSettleEvent.prototype.solutionId = 0;

        /**
         * SolutionOnResultSettleEvent result.
         * @member {rankland_live_contest_common.Result} result
         * @memberof rankland_live_contest_common.SolutionOnResultSettleEvent
         * @instance
         */
        SolutionOnResultSettleEvent.prototype.result = 0;

        /**
         * SolutionOnResultSettleEvent time.
         * @member {rankland_live_contest_common.ITimeDuration|null|undefined} time
         * @memberof rankland_live_contest_common.SolutionOnResultSettleEvent
         * @instance
         */
        SolutionOnResultSettleEvent.prototype.time = null;

        /**
         * Creates a new SolutionOnResultSettleEvent instance using the specified properties.
         * @function create
         * @memberof rankland_live_contest_common.SolutionOnResultSettleEvent
         * @static
         * @param {rankland_live_contest_common.ISolutionOnResultSettleEvent=} [properties] Properties to set
         * @returns {rankland_live_contest_common.SolutionOnResultSettleEvent} SolutionOnResultSettleEvent instance
         */
        SolutionOnResultSettleEvent.create = function create(properties) {
            return new SolutionOnResultSettleEvent(properties);
        };

        /**
         * Encodes the specified SolutionOnResultSettleEvent message. Does not implicitly {@link rankland_live_contest_common.SolutionOnResultSettleEvent.verify|verify} messages.
         * @function encode
         * @memberof rankland_live_contest_common.SolutionOnResultSettleEvent
         * @static
         * @param {rankland_live_contest_common.ISolutionOnResultSettleEvent} message SolutionOnResultSettleEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SolutionOnResultSettleEvent.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.solutionId != null && Object.hasOwnProperty.call(message, "solutionId"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.solutionId);
            if (message.result != null && Object.hasOwnProperty.call(message, "result"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.result);
            if (message.time != null && Object.hasOwnProperty.call(message, "time"))
                $root.rankland_live_contest_common.TimeDuration.encode(message.time, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified SolutionOnResultSettleEvent message, length delimited. Does not implicitly {@link rankland_live_contest_common.SolutionOnResultSettleEvent.verify|verify} messages.
         * @function encodeDelimited
         * @memberof rankland_live_contest_common.SolutionOnResultSettleEvent
         * @static
         * @param {rankland_live_contest_common.ISolutionOnResultSettleEvent} message SolutionOnResultSettleEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SolutionOnResultSettleEvent.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a SolutionOnResultSettleEvent message from the specified reader or buffer.
         * @function decode
         * @memberof rankland_live_contest_common.SolutionOnResultSettleEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {rankland_live_contest_common.SolutionOnResultSettleEvent} SolutionOnResultSettleEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SolutionOnResultSettleEvent.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_common.SolutionOnResultSettleEvent();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.solutionId = reader.uint32();
                    break;
                case 2:
                    message.result = reader.int32();
                    break;
                case 3:
                    message.time = $root.rankland_live_contest_common.TimeDuration.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a SolutionOnResultSettleEvent message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof rankland_live_contest_common.SolutionOnResultSettleEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {rankland_live_contest_common.SolutionOnResultSettleEvent} SolutionOnResultSettleEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SolutionOnResultSettleEvent.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SolutionOnResultSettleEvent message.
         * @function verify
         * @memberof rankland_live_contest_common.SolutionOnResultSettleEvent
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SolutionOnResultSettleEvent.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.solutionId != null && message.hasOwnProperty("solutionId"))
                if (!$util.isInteger(message.solutionId))
                    return "solutionId: integer expected";
            if (message.result != null && message.hasOwnProperty("result"))
                switch (message.result) {
                default:
                    return "result: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                case 9:
                case 10:
                case 11:
                case 12:
                case 13:
                case 14:
                case 15:
                    break;
                }
            if (message.time != null && message.hasOwnProperty("time")) {
                var error = $root.rankland_live_contest_common.TimeDuration.verify(message.time);
                if (error)
                    return "time." + error;
            }
            return null;
        };

        /**
         * Creates a SolutionOnResultSettleEvent message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof rankland_live_contest_common.SolutionOnResultSettleEvent
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {rankland_live_contest_common.SolutionOnResultSettleEvent} SolutionOnResultSettleEvent
         */
        SolutionOnResultSettleEvent.fromObject = function fromObject(object) {
            if (object instanceof $root.rankland_live_contest_common.SolutionOnResultSettleEvent)
                return object;
            var message = new $root.rankland_live_contest_common.SolutionOnResultSettleEvent();
            if (object.solutionId != null)
                message.solutionId = object.solutionId >>> 0;
            switch (object.result) {
            case "PD":
            case 0:
                message.result = 0;
                break;
            case "JG":
            case 1:
                message.result = 1;
                break;
            case "CNL":
            case 2:
                message.result = 2;
                break;
            case "FZ":
            case 3:
                message.result = 3;
                break;
            case "UKE":
            case 4:
                message.result = 4;
                break;
            case "AC":
            case 5:
                message.result = 5;
                break;
            case "FB":
            case 6:
                message.result = 6;
                break;
            case "RJ":
            case 7:
                message.result = 7;
                break;
            case "WA":
            case 8:
                message.result = 8;
                break;
            case "PE":
            case 9:
                message.result = 9;
                break;
            case "TLE":
            case 10:
                message.result = 10;
                break;
            case "MLE":
            case 11:
                message.result = 11;
                break;
            case "OLE":
            case 12:
                message.result = 12;
                break;
            case "RTE":
            case 13:
                message.result = 13;
                break;
            case "NOUT":
            case 14:
                message.result = 14;
                break;
            case "CE":
            case 15:
                message.result = 15;
                break;
            }
            if (object.time != null) {
                if (typeof object.time !== "object")
                    throw TypeError(".rankland_live_contest_common.SolutionOnResultSettleEvent.time: object expected");
                message.time = $root.rankland_live_contest_common.TimeDuration.fromObject(object.time);
            }
            return message;
        };

        /**
         * Creates a plain object from a SolutionOnResultSettleEvent message. Also converts values to other types if specified.
         * @function toObject
         * @memberof rankland_live_contest_common.SolutionOnResultSettleEvent
         * @static
         * @param {rankland_live_contest_common.SolutionOnResultSettleEvent} message SolutionOnResultSettleEvent
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SolutionOnResultSettleEvent.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.solutionId = 0;
                object.result = options.enums === String ? "PD" : 0;
                object.time = null;
            }
            if (message.solutionId != null && message.hasOwnProperty("solutionId"))
                object.solutionId = message.solutionId;
            if (message.result != null && message.hasOwnProperty("result"))
                object.result = options.enums === String ? $root.rankland_live_contest_common.Result[message.result] : message.result;
            if (message.time != null && message.hasOwnProperty("time"))
                object.time = $root.rankland_live_contest_common.TimeDuration.toObject(message.time, options);
            return object;
        };

        /**
         * Converts this SolutionOnResultSettleEvent to JSON.
         * @function toJSON
         * @memberof rankland_live_contest_common.SolutionOnResultSettleEvent
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SolutionOnResultSettleEvent.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return SolutionOnResultSettleEvent;
    })();

    rankland_live_contest_common.SolutionOnResultChangeEvent = (function() {

        /**
         * Properties of a SolutionOnResultChangeEvent.
         * @memberof rankland_live_contest_common
         * @interface ISolutionOnResultChangeEvent
         * @property {number|null} [solutionId] SolutionOnResultChangeEvent solutionId
         * @property {rankland_live_contest_common.Result|null} [previousResult] SolutionOnResultChangeEvent previousResult
         * @property {rankland_live_contest_common.Result|null} [result] SolutionOnResultChangeEvent result
         * @property {rankland_live_contest_common.ITimeDuration|null} [time] SolutionOnResultChangeEvent time
         */

        /**
         * Constructs a new SolutionOnResultChangeEvent.
         * @memberof rankland_live_contest_common
         * @classdesc Represents a SolutionOnResultChangeEvent.
         * @implements ISolutionOnResultChangeEvent
         * @constructor
         * @param {rankland_live_contest_common.ISolutionOnResultChangeEvent=} [properties] Properties to set
         */
        function SolutionOnResultChangeEvent(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SolutionOnResultChangeEvent solutionId.
         * @member {number} solutionId
         * @memberof rankland_live_contest_common.SolutionOnResultChangeEvent
         * @instance
         */
        SolutionOnResultChangeEvent.prototype.solutionId = 0;

        /**
         * SolutionOnResultChangeEvent previousResult.
         * @member {rankland_live_contest_common.Result} previousResult
         * @memberof rankland_live_contest_common.SolutionOnResultChangeEvent
         * @instance
         */
        SolutionOnResultChangeEvent.prototype.previousResult = 0;

        /**
         * SolutionOnResultChangeEvent result.
         * @member {rankland_live_contest_common.Result} result
         * @memberof rankland_live_contest_common.SolutionOnResultChangeEvent
         * @instance
         */
        SolutionOnResultChangeEvent.prototype.result = 0;

        /**
         * SolutionOnResultChangeEvent time.
         * @member {rankland_live_contest_common.ITimeDuration|null|undefined} time
         * @memberof rankland_live_contest_common.SolutionOnResultChangeEvent
         * @instance
         */
        SolutionOnResultChangeEvent.prototype.time = null;

        /**
         * Creates a new SolutionOnResultChangeEvent instance using the specified properties.
         * @function create
         * @memberof rankland_live_contest_common.SolutionOnResultChangeEvent
         * @static
         * @param {rankland_live_contest_common.ISolutionOnResultChangeEvent=} [properties] Properties to set
         * @returns {rankland_live_contest_common.SolutionOnResultChangeEvent} SolutionOnResultChangeEvent instance
         */
        SolutionOnResultChangeEvent.create = function create(properties) {
            return new SolutionOnResultChangeEvent(properties);
        };

        /**
         * Encodes the specified SolutionOnResultChangeEvent message. Does not implicitly {@link rankland_live_contest_common.SolutionOnResultChangeEvent.verify|verify} messages.
         * @function encode
         * @memberof rankland_live_contest_common.SolutionOnResultChangeEvent
         * @static
         * @param {rankland_live_contest_common.ISolutionOnResultChangeEvent} message SolutionOnResultChangeEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SolutionOnResultChangeEvent.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.solutionId != null && Object.hasOwnProperty.call(message, "solutionId"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.solutionId);
            if (message.previousResult != null && Object.hasOwnProperty.call(message, "previousResult"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.previousResult);
            if (message.result != null && Object.hasOwnProperty.call(message, "result"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.result);
            if (message.time != null && Object.hasOwnProperty.call(message, "time"))
                $root.rankland_live_contest_common.TimeDuration.encode(message.time, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified SolutionOnResultChangeEvent message, length delimited. Does not implicitly {@link rankland_live_contest_common.SolutionOnResultChangeEvent.verify|verify} messages.
         * @function encodeDelimited
         * @memberof rankland_live_contest_common.SolutionOnResultChangeEvent
         * @static
         * @param {rankland_live_contest_common.ISolutionOnResultChangeEvent} message SolutionOnResultChangeEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SolutionOnResultChangeEvent.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a SolutionOnResultChangeEvent message from the specified reader or buffer.
         * @function decode
         * @memberof rankland_live_contest_common.SolutionOnResultChangeEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {rankland_live_contest_common.SolutionOnResultChangeEvent} SolutionOnResultChangeEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SolutionOnResultChangeEvent.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_common.SolutionOnResultChangeEvent();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.solutionId = reader.uint32();
                    break;
                case 2:
                    message.previousResult = reader.int32();
                    break;
                case 3:
                    message.result = reader.int32();
                    break;
                case 4:
                    message.time = $root.rankland_live_contest_common.TimeDuration.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a SolutionOnResultChangeEvent message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof rankland_live_contest_common.SolutionOnResultChangeEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {rankland_live_contest_common.SolutionOnResultChangeEvent} SolutionOnResultChangeEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SolutionOnResultChangeEvent.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SolutionOnResultChangeEvent message.
         * @function verify
         * @memberof rankland_live_contest_common.SolutionOnResultChangeEvent
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SolutionOnResultChangeEvent.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.solutionId != null && message.hasOwnProperty("solutionId"))
                if (!$util.isInteger(message.solutionId))
                    return "solutionId: integer expected";
            if (message.previousResult != null && message.hasOwnProperty("previousResult"))
                switch (message.previousResult) {
                default:
                    return "previousResult: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                case 9:
                case 10:
                case 11:
                case 12:
                case 13:
                case 14:
                case 15:
                    break;
                }
            if (message.result != null && message.hasOwnProperty("result"))
                switch (message.result) {
                default:
                    return "result: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                case 9:
                case 10:
                case 11:
                case 12:
                case 13:
                case 14:
                case 15:
                    break;
                }
            if (message.time != null && message.hasOwnProperty("time")) {
                var error = $root.rankland_live_contest_common.TimeDuration.verify(message.time);
                if (error)
                    return "time." + error;
            }
            return null;
        };

        /**
         * Creates a SolutionOnResultChangeEvent message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof rankland_live_contest_common.SolutionOnResultChangeEvent
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {rankland_live_contest_common.SolutionOnResultChangeEvent} SolutionOnResultChangeEvent
         */
        SolutionOnResultChangeEvent.fromObject = function fromObject(object) {
            if (object instanceof $root.rankland_live_contest_common.SolutionOnResultChangeEvent)
                return object;
            var message = new $root.rankland_live_contest_common.SolutionOnResultChangeEvent();
            if (object.solutionId != null)
                message.solutionId = object.solutionId >>> 0;
            switch (object.previousResult) {
            case "PD":
            case 0:
                message.previousResult = 0;
                break;
            case "JG":
            case 1:
                message.previousResult = 1;
                break;
            case "CNL":
            case 2:
                message.previousResult = 2;
                break;
            case "FZ":
            case 3:
                message.previousResult = 3;
                break;
            case "UKE":
            case 4:
                message.previousResult = 4;
                break;
            case "AC":
            case 5:
                message.previousResult = 5;
                break;
            case "FB":
            case 6:
                message.previousResult = 6;
                break;
            case "RJ":
            case 7:
                message.previousResult = 7;
                break;
            case "WA":
            case 8:
                message.previousResult = 8;
                break;
            case "PE":
            case 9:
                message.previousResult = 9;
                break;
            case "TLE":
            case 10:
                message.previousResult = 10;
                break;
            case "MLE":
            case 11:
                message.previousResult = 11;
                break;
            case "OLE":
            case 12:
                message.previousResult = 12;
                break;
            case "RTE":
            case 13:
                message.previousResult = 13;
                break;
            case "NOUT":
            case 14:
                message.previousResult = 14;
                break;
            case "CE":
            case 15:
                message.previousResult = 15;
                break;
            }
            switch (object.result) {
            case "PD":
            case 0:
                message.result = 0;
                break;
            case "JG":
            case 1:
                message.result = 1;
                break;
            case "CNL":
            case 2:
                message.result = 2;
                break;
            case "FZ":
            case 3:
                message.result = 3;
                break;
            case "UKE":
            case 4:
                message.result = 4;
                break;
            case "AC":
            case 5:
                message.result = 5;
                break;
            case "FB":
            case 6:
                message.result = 6;
                break;
            case "RJ":
            case 7:
                message.result = 7;
                break;
            case "WA":
            case 8:
                message.result = 8;
                break;
            case "PE":
            case 9:
                message.result = 9;
                break;
            case "TLE":
            case 10:
                message.result = 10;
                break;
            case "MLE":
            case 11:
                message.result = 11;
                break;
            case "OLE":
            case 12:
                message.result = 12;
                break;
            case "RTE":
            case 13:
                message.result = 13;
                break;
            case "NOUT":
            case 14:
                message.result = 14;
                break;
            case "CE":
            case 15:
                message.result = 15;
                break;
            }
            if (object.time != null) {
                if (typeof object.time !== "object")
                    throw TypeError(".rankland_live_contest_common.SolutionOnResultChangeEvent.time: object expected");
                message.time = $root.rankland_live_contest_common.TimeDuration.fromObject(object.time);
            }
            return message;
        };

        /**
         * Creates a plain object from a SolutionOnResultChangeEvent message. Also converts values to other types if specified.
         * @function toObject
         * @memberof rankland_live_contest_common.SolutionOnResultChangeEvent
         * @static
         * @param {rankland_live_contest_common.SolutionOnResultChangeEvent} message SolutionOnResultChangeEvent
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SolutionOnResultChangeEvent.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.solutionId = 0;
                object.previousResult = options.enums === String ? "PD" : 0;
                object.result = options.enums === String ? "PD" : 0;
                object.time = null;
            }
            if (message.solutionId != null && message.hasOwnProperty("solutionId"))
                object.solutionId = message.solutionId;
            if (message.previousResult != null && message.hasOwnProperty("previousResult"))
                object.previousResult = options.enums === String ? $root.rankland_live_contest_common.Result[message.previousResult] : message.previousResult;
            if (message.result != null && message.hasOwnProperty("result"))
                object.result = options.enums === String ? $root.rankland_live_contest_common.Result[message.result] : message.result;
            if (message.time != null && message.hasOwnProperty("time"))
                object.time = $root.rankland_live_contest_common.TimeDuration.toObject(message.time, options);
            return object;
        };

        /**
         * Converts this SolutionOnResultChangeEvent to JSON.
         * @function toJSON
         * @memberof rankland_live_contest_common.SolutionOnResultChangeEvent
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SolutionOnResultChangeEvent.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return SolutionOnResultChangeEvent;
    })();

    rankland_live_contest_common.ContestConfigPatch = (function() {

        /**
         * Properties of a ContestConfigPatch.
         * @memberof rankland_live_contest_common
         * @interface IContestConfigPatch
         * @property {string|null} [name] ContestConfigPatch name
         * @property {google.protobuf.IStruct|null} [contest] ContestConfigPatch contest
         * @property {google.protobuf.IListValue|null} [problems] ContestConfigPatch problems
         * @property {google.protobuf.IListValue|null} [users] ContestConfigPatch users
         * @property {google.protobuf.IListValue|null} [markers] ContestConfigPatch markers
         * @property {google.protobuf.IListValue|null} [series] ContestConfigPatch series
         * @property {google.protobuf.IValue|null} [sorter] ContestConfigPatch sorter
         * @property {google.protobuf.IValue|null} [contributors] ContestConfigPatch contributors
         */

        /**
         * Constructs a new ContestConfigPatch.
         * @memberof rankland_live_contest_common
         * @classdesc Represents a ContestConfigPatch.
         * @implements IContestConfigPatch
         * @constructor
         * @param {rankland_live_contest_common.IContestConfigPatch=} [properties] Properties to set
         */
        function ContestConfigPatch(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ContestConfigPatch name.
         * @member {string|null|undefined} name
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @instance
         */
        ContestConfigPatch.prototype.name = null;

        /**
         * ContestConfigPatch contest.
         * @member {google.protobuf.IStruct|null|undefined} contest
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @instance
         */
        ContestConfigPatch.prototype.contest = null;

        /**
         * ContestConfigPatch problems.
         * @member {google.protobuf.IListValue|null|undefined} problems
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @instance
         */
        ContestConfigPatch.prototype.problems = null;

        /**
         * ContestConfigPatch users.
         * @member {google.protobuf.IListValue|null|undefined} users
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @instance
         */
        ContestConfigPatch.prototype.users = null;

        /**
         * ContestConfigPatch markers.
         * @member {google.protobuf.IListValue|null|undefined} markers
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @instance
         */
        ContestConfigPatch.prototype.markers = null;

        /**
         * ContestConfigPatch series.
         * @member {google.protobuf.IListValue|null|undefined} series
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @instance
         */
        ContestConfigPatch.prototype.series = null;

        /**
         * ContestConfigPatch sorter.
         * @member {google.protobuf.IValue|null|undefined} sorter
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @instance
         */
        ContestConfigPatch.prototype.sorter = null;

        /**
         * ContestConfigPatch contributors.
         * @member {google.protobuf.IValue|null|undefined} contributors
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @instance
         */
        ContestConfigPatch.prototype.contributors = null;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields;

        /**
         * ContestConfigPatch _name.
         * @member {"name"|undefined} _name
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @instance
         */
        Object.defineProperty(ContestConfigPatch.prototype, "_name", {
            get: $util.oneOfGetter($oneOfFields = ["name"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new ContestConfigPatch instance using the specified properties.
         * @function create
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @static
         * @param {rankland_live_contest_common.IContestConfigPatch=} [properties] Properties to set
         * @returns {rankland_live_contest_common.ContestConfigPatch} ContestConfigPatch instance
         */
        ContestConfigPatch.create = function create(properties) {
            return new ContestConfigPatch(properties);
        };

        /**
         * Encodes the specified ContestConfigPatch message. Does not implicitly {@link rankland_live_contest_common.ContestConfigPatch.verify|verify} messages.
         * @function encode
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @static
         * @param {rankland_live_contest_common.IContestConfigPatch} message ContestConfigPatch message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ContestConfigPatch.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
            if (message.contest != null && Object.hasOwnProperty.call(message, "contest"))
                $root.google.protobuf.Struct.encode(message.contest, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.problems != null && Object.hasOwnProperty.call(message, "problems"))
                $root.google.protobuf.ListValue.encode(message.problems, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            if (message.users != null && Object.hasOwnProperty.call(message, "users"))
                $root.google.protobuf.ListValue.encode(message.users, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
            if (message.markers != null && Object.hasOwnProperty.call(message, "markers"))
                $root.google.protobuf.ListValue.encode(message.markers, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            if (message.series != null && Object.hasOwnProperty.call(message, "series"))
                $root.google.protobuf.ListValue.encode(message.series, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            if (message.sorter != null && Object.hasOwnProperty.call(message, "sorter"))
                $root.google.protobuf.Value.encode(message.sorter, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
            if (message.contributors != null && Object.hasOwnProperty.call(message, "contributors"))
                $root.google.protobuf.Value.encode(message.contributors, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ContestConfigPatch message, length delimited. Does not implicitly {@link rankland_live_contest_common.ContestConfigPatch.verify|verify} messages.
         * @function encodeDelimited
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @static
         * @param {rankland_live_contest_common.IContestConfigPatch} message ContestConfigPatch message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ContestConfigPatch.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ContestConfigPatch message from the specified reader or buffer.
         * @function decode
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {rankland_live_contest_common.ContestConfigPatch} ContestConfigPatch
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ContestConfigPatch.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_common.ContestConfigPatch();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.name = reader.string();
                    break;
                case 2:
                    message.contest = $root.google.protobuf.Struct.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.problems = $root.google.protobuf.ListValue.decode(reader, reader.uint32());
                    break;
                case 4:
                    message.users = $root.google.protobuf.ListValue.decode(reader, reader.uint32());
                    break;
                case 5:
                    message.markers = $root.google.protobuf.ListValue.decode(reader, reader.uint32());
                    break;
                case 6:
                    message.series = $root.google.protobuf.ListValue.decode(reader, reader.uint32());
                    break;
                case 7:
                    message.sorter = $root.google.protobuf.Value.decode(reader, reader.uint32());
                    break;
                case 8:
                    message.contributors = $root.google.protobuf.Value.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ContestConfigPatch message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {rankland_live_contest_common.ContestConfigPatch} ContestConfigPatch
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ContestConfigPatch.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ContestConfigPatch message.
         * @function verify
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ContestConfigPatch.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            var properties = {};
            if (message.name != null && message.hasOwnProperty("name")) {
                properties._name = 1;
                if (!$util.isString(message.name))
                    return "name: string expected";
            }
            if (message.contest != null && message.hasOwnProperty("contest")) {
                var error = $root.google.protobuf.Struct.verify(message.contest);
                if (error)
                    return "contest." + error;
            }
            if (message.problems != null && message.hasOwnProperty("problems")) {
                var error = $root.google.protobuf.ListValue.verify(message.problems);
                if (error)
                    return "problems." + error;
            }
            if (message.users != null && message.hasOwnProperty("users")) {
                var error = $root.google.protobuf.ListValue.verify(message.users);
                if (error)
                    return "users." + error;
            }
            if (message.markers != null && message.hasOwnProperty("markers")) {
                var error = $root.google.protobuf.ListValue.verify(message.markers);
                if (error)
                    return "markers." + error;
            }
            if (message.series != null && message.hasOwnProperty("series")) {
                var error = $root.google.protobuf.ListValue.verify(message.series);
                if (error)
                    return "series." + error;
            }
            if (message.sorter != null && message.hasOwnProperty("sorter")) {
                var error = $root.google.protobuf.Value.verify(message.sorter);
                if (error)
                    return "sorter." + error;
            }
            if (message.contributors != null && message.hasOwnProperty("contributors")) {
                var error = $root.google.protobuf.Value.verify(message.contributors);
                if (error)
                    return "contributors." + error;
            }
            return null;
        };

        /**
         * Creates a ContestConfigPatch message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {rankland_live_contest_common.ContestConfigPatch} ContestConfigPatch
         */
        ContestConfigPatch.fromObject = function fromObject(object) {
            if (object instanceof $root.rankland_live_contest_common.ContestConfigPatch)
                return object;
            var message = new $root.rankland_live_contest_common.ContestConfigPatch();
            if (object.name != null)
                message.name = String(object.name);
            if (object.contest != null) {
                if (typeof object.contest !== "object")
                    throw TypeError(".rankland_live_contest_common.ContestConfigPatch.contest: object expected");
                message.contest = $root.google.protobuf.Struct.fromObject(object.contest);
            }
            if (object.problems != null) {
                if (typeof object.problems !== "object")
                    throw TypeError(".rankland_live_contest_common.ContestConfigPatch.problems: object expected");
                message.problems = $root.google.protobuf.ListValue.fromObject(object.problems);
            }
            if (object.users != null) {
                if (typeof object.users !== "object")
                    throw TypeError(".rankland_live_contest_common.ContestConfigPatch.users: object expected");
                message.users = $root.google.protobuf.ListValue.fromObject(object.users);
            }
            if (object.markers != null) {
                if (typeof object.markers !== "object")
                    throw TypeError(".rankland_live_contest_common.ContestConfigPatch.markers: object expected");
                message.markers = $root.google.protobuf.ListValue.fromObject(object.markers);
            }
            if (object.series != null) {
                if (typeof object.series !== "object")
                    throw TypeError(".rankland_live_contest_common.ContestConfigPatch.series: object expected");
                message.series = $root.google.protobuf.ListValue.fromObject(object.series);
            }
            if (object.sorter != null) {
                if (typeof object.sorter !== "object")
                    throw TypeError(".rankland_live_contest_common.ContestConfigPatch.sorter: object expected");
                message.sorter = $root.google.protobuf.Value.fromObject(object.sorter);
            }
            if (object.contributors != null) {
                if (typeof object.contributors !== "object")
                    throw TypeError(".rankland_live_contest_common.ContestConfigPatch.contributors: object expected");
                message.contributors = $root.google.protobuf.Value.fromObject(object.contributors);
            }
            return message;
        };

        /**
         * Creates a plain object from a ContestConfigPatch message. Also converts values to other types if specified.
         * @function toObject
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @static
         * @param {rankland_live_contest_common.ContestConfigPatch} message ContestConfigPatch
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ContestConfigPatch.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.contest = null;
                object.problems = null;
                object.users = null;
                object.markers = null;
                object.series = null;
                object.sorter = null;
                object.contributors = null;
            }
            if (message.name != null && message.hasOwnProperty("name")) {
                object.name = message.name;
                if (options.oneofs)
                    object._name = "name";
            }
            if (message.contest != null && message.hasOwnProperty("contest"))
                object.contest = $root.google.protobuf.Struct.toObject(message.contest, options);
            if (message.problems != null && message.hasOwnProperty("problems"))
                object.problems = $root.google.protobuf.ListValue.toObject(message.problems, options);
            if (message.users != null && message.hasOwnProperty("users"))
                object.users = $root.google.protobuf.ListValue.toObject(message.users, options);
            if (message.markers != null && message.hasOwnProperty("markers"))
                object.markers = $root.google.protobuf.ListValue.toObject(message.markers, options);
            if (message.series != null && message.hasOwnProperty("series"))
                object.series = $root.google.protobuf.ListValue.toObject(message.series, options);
            if (message.sorter != null && message.hasOwnProperty("sorter"))
                object.sorter = $root.google.protobuf.Value.toObject(message.sorter, options);
            if (message.contributors != null && message.hasOwnProperty("contributors"))
                object.contributors = $root.google.protobuf.Value.toObject(message.contributors, options);
            return object;
        };

        /**
         * Converts this ContestConfigPatch to JSON.
         * @function toJSON
         * @memberof rankland_live_contest_common.ContestConfigPatch
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ContestConfigPatch.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ContestConfigPatch;
    })();

    rankland_live_contest_common.ContestConfigChangeEvent = (function() {

        /**
         * Properties of a ContestConfigChangeEvent.
         * @memberof rankland_live_contest_common
         * @interface IContestConfigChangeEvent
         * @property {Array.<string>|null} [changedFields] ContestConfigChangeEvent changedFields
         * @property {rankland_live_contest_common.IContestConfigPatch|null} [config] ContestConfigChangeEvent config
         * @property {rankland_live_contest_common.ITimeDuration|null} [time] ContestConfigChangeEvent time
         */

        /**
         * Constructs a new ContestConfigChangeEvent.
         * @memberof rankland_live_contest_common
         * @classdesc Represents a ContestConfigChangeEvent.
         * @implements IContestConfigChangeEvent
         * @constructor
         * @param {rankland_live_contest_common.IContestConfigChangeEvent=} [properties] Properties to set
         */
        function ContestConfigChangeEvent(properties) {
            this.changedFields = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ContestConfigChangeEvent changedFields.
         * @member {Array.<string>} changedFields
         * @memberof rankland_live_contest_common.ContestConfigChangeEvent
         * @instance
         */
        ContestConfigChangeEvent.prototype.changedFields = $util.emptyArray;

        /**
         * ContestConfigChangeEvent config.
         * @member {rankland_live_contest_common.IContestConfigPatch|null|undefined} config
         * @memberof rankland_live_contest_common.ContestConfigChangeEvent
         * @instance
         */
        ContestConfigChangeEvent.prototype.config = null;

        /**
         * ContestConfigChangeEvent time.
         * @member {rankland_live_contest_common.ITimeDuration|null|undefined} time
         * @memberof rankland_live_contest_common.ContestConfigChangeEvent
         * @instance
         */
        ContestConfigChangeEvent.prototype.time = null;

        /**
         * Creates a new ContestConfigChangeEvent instance using the specified properties.
         * @function create
         * @memberof rankland_live_contest_common.ContestConfigChangeEvent
         * @static
         * @param {rankland_live_contest_common.IContestConfigChangeEvent=} [properties] Properties to set
         * @returns {rankland_live_contest_common.ContestConfigChangeEvent} ContestConfigChangeEvent instance
         */
        ContestConfigChangeEvent.create = function create(properties) {
            return new ContestConfigChangeEvent(properties);
        };

        /**
         * Encodes the specified ContestConfigChangeEvent message. Does not implicitly {@link rankland_live_contest_common.ContestConfigChangeEvent.verify|verify} messages.
         * @function encode
         * @memberof rankland_live_contest_common.ContestConfigChangeEvent
         * @static
         * @param {rankland_live_contest_common.IContestConfigChangeEvent} message ContestConfigChangeEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ContestConfigChangeEvent.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.changedFields != null && message.changedFields.length)
                for (var i = 0; i < message.changedFields.length; ++i)
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.changedFields[i]);
            if (message.config != null && Object.hasOwnProperty.call(message, "config"))
                $root.rankland_live_contest_common.ContestConfigPatch.encode(message.config, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.time != null && Object.hasOwnProperty.call(message, "time"))
                $root.rankland_live_contest_common.TimeDuration.encode(message.time, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ContestConfigChangeEvent message, length delimited. Does not implicitly {@link rankland_live_contest_common.ContestConfigChangeEvent.verify|verify} messages.
         * @function encodeDelimited
         * @memberof rankland_live_contest_common.ContestConfigChangeEvent
         * @static
         * @param {rankland_live_contest_common.IContestConfigChangeEvent} message ContestConfigChangeEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ContestConfigChangeEvent.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ContestConfigChangeEvent message from the specified reader or buffer.
         * @function decode
         * @memberof rankland_live_contest_common.ContestConfigChangeEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {rankland_live_contest_common.ContestConfigChangeEvent} ContestConfigChangeEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ContestConfigChangeEvent.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_common.ContestConfigChangeEvent();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.changedFields && message.changedFields.length))
                        message.changedFields = [];
                    message.changedFields.push(reader.string());
                    break;
                case 2:
                    message.config = $root.rankland_live_contest_common.ContestConfigPatch.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.time = $root.rankland_live_contest_common.TimeDuration.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ContestConfigChangeEvent message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof rankland_live_contest_common.ContestConfigChangeEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {rankland_live_contest_common.ContestConfigChangeEvent} ContestConfigChangeEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ContestConfigChangeEvent.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ContestConfigChangeEvent message.
         * @function verify
         * @memberof rankland_live_contest_common.ContestConfigChangeEvent
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ContestConfigChangeEvent.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.changedFields != null && message.hasOwnProperty("changedFields")) {
                if (!Array.isArray(message.changedFields))
                    return "changedFields: array expected";
                for (var i = 0; i < message.changedFields.length; ++i)
                    if (!$util.isString(message.changedFields[i]))
                        return "changedFields: string[] expected";
            }
            if (message.config != null && message.hasOwnProperty("config")) {
                var error = $root.rankland_live_contest_common.ContestConfigPatch.verify(message.config);
                if (error)
                    return "config." + error;
            }
            if (message.time != null && message.hasOwnProperty("time")) {
                var error = $root.rankland_live_contest_common.TimeDuration.verify(message.time);
                if (error)
                    return "time." + error;
            }
            return null;
        };

        /**
         * Creates a ContestConfigChangeEvent message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof rankland_live_contest_common.ContestConfigChangeEvent
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {rankland_live_contest_common.ContestConfigChangeEvent} ContestConfigChangeEvent
         */
        ContestConfigChangeEvent.fromObject = function fromObject(object) {
            if (object instanceof $root.rankland_live_contest_common.ContestConfigChangeEvent)
                return object;
            var message = new $root.rankland_live_contest_common.ContestConfigChangeEvent();
            if (object.changedFields) {
                if (!Array.isArray(object.changedFields))
                    throw TypeError(".rankland_live_contest_common.ContestConfigChangeEvent.changedFields: array expected");
                message.changedFields = [];
                for (var i = 0; i < object.changedFields.length; ++i)
                    message.changedFields[i] = String(object.changedFields[i]);
            }
            if (object.config != null) {
                if (typeof object.config !== "object")
                    throw TypeError(".rankland_live_contest_common.ContestConfigChangeEvent.config: object expected");
                message.config = $root.rankland_live_contest_common.ContestConfigPatch.fromObject(object.config);
            }
            if (object.time != null) {
                if (typeof object.time !== "object")
                    throw TypeError(".rankland_live_contest_common.ContestConfigChangeEvent.time: object expected");
                message.time = $root.rankland_live_contest_common.TimeDuration.fromObject(object.time);
            }
            return message;
        };

        /**
         * Creates a plain object from a ContestConfigChangeEvent message. Also converts values to other types if specified.
         * @function toObject
         * @memberof rankland_live_contest_common.ContestConfigChangeEvent
         * @static
         * @param {rankland_live_contest_common.ContestConfigChangeEvent} message ContestConfigChangeEvent
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ContestConfigChangeEvent.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.changedFields = [];
            if (options.defaults) {
                object.config = null;
                object.time = null;
            }
            if (message.changedFields && message.changedFields.length) {
                object.changedFields = [];
                for (var j = 0; j < message.changedFields.length; ++j)
                    object.changedFields[j] = message.changedFields[j];
            }
            if (message.config != null && message.hasOwnProperty("config"))
                object.config = $root.rankland_live_contest_common.ContestConfigPatch.toObject(message.config, options);
            if (message.time != null && message.hasOwnProperty("time"))
                object.time = $root.rankland_live_contest_common.TimeDuration.toObject(message.time, options);
            return object;
        };

        /**
         * Converts this ContestConfigChangeEvent to JSON.
         * @function toJSON
         * @memberof rankland_live_contest_common.ContestConfigChangeEvent
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ContestConfigChangeEvent.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ContestConfigChangeEvent;
    })();

    return rankland_live_contest_common;
})();

$root.google = (function() {

    /**
     * Namespace google.
     * @exports google
     * @namespace
     */
    var google = {};

    google.protobuf = (function() {

        /**
         * Namespace protobuf.
         * @memberof google
         * @namespace
         */
        var protobuf = {};

        protobuf.Struct = (function() {

            /**
             * Properties of a Struct.
             * @memberof google.protobuf
             * @interface IStruct
             * @property {Object.<string,google.protobuf.IValue>|null} [fields] Struct fields
             */

            /**
             * Constructs a new Struct.
             * @memberof google.protobuf
             * @classdesc Represents a Struct.
             * @implements IStruct
             * @constructor
             * @param {google.protobuf.IStruct=} [properties] Properties to set
             */
            function Struct(properties) {
                this.fields = {};
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Struct fields.
             * @member {Object.<string,google.protobuf.IValue>} fields
             * @memberof google.protobuf.Struct
             * @instance
             */
            Struct.prototype.fields = $util.emptyObject;

            /**
             * Creates a new Struct instance using the specified properties.
             * @function create
             * @memberof google.protobuf.Struct
             * @static
             * @param {google.protobuf.IStruct=} [properties] Properties to set
             * @returns {google.protobuf.Struct} Struct instance
             */
            Struct.create = function create(properties) {
                return new Struct(properties);
            };

            /**
             * Encodes the specified Struct message. Does not implicitly {@link google.protobuf.Struct.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.Struct
             * @static
             * @param {google.protobuf.IStruct} message Struct message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Struct.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.fields != null && Object.hasOwnProperty.call(message, "fields"))
                    for (var keys = Object.keys(message.fields), i = 0; i < keys.length; ++i) {
                        writer.uint32(/* id 1, wireType 2 =*/10).fork().uint32(/* id 1, wireType 2 =*/10).string(keys[i]);
                        $root.google.protobuf.Value.encode(message.fields[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                    }
                return writer;
            };

            /**
             * Encodes the specified Struct message, length delimited. Does not implicitly {@link google.protobuf.Struct.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.Struct
             * @static
             * @param {google.protobuf.IStruct} message Struct message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Struct.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Struct message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.Struct
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.Struct} Struct
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Struct.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.Struct(), key, value;
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        if (message.fields === $util.emptyObject)
                            message.fields = {};
                        var end2 = reader.uint32() + reader.pos;
                        key = "";
                        value = null;
                        while (reader.pos < end2) {
                            var tag2 = reader.uint32();
                            switch (tag2 >>> 3) {
                            case 1:
                                key = reader.string();
                                break;
                            case 2:
                                value = $root.google.protobuf.Value.decode(reader, reader.uint32());
                                break;
                            default:
                                reader.skipType(tag2 & 7);
                                break;
                            }
                        }
                        message.fields[key] = value;
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Struct message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.Struct
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.Struct} Struct
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Struct.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Struct message.
             * @function verify
             * @memberof google.protobuf.Struct
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Struct.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.fields != null && message.hasOwnProperty("fields")) {
                    if (!$util.isObject(message.fields))
                        return "fields: object expected";
                    var key = Object.keys(message.fields);
                    for (var i = 0; i < key.length; ++i) {
                        var error = $root.google.protobuf.Value.verify(message.fields[key[i]]);
                        if (error)
                            return "fields." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a Struct message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.Struct
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.Struct} Struct
             */
            Struct.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.Struct)
                    return object;
                var message = new $root.google.protobuf.Struct();
                if (object.fields) {
                    if (typeof object.fields !== "object")
                        throw TypeError(".google.protobuf.Struct.fields: object expected");
                    message.fields = {};
                    for (var keys = Object.keys(object.fields), i = 0; i < keys.length; ++i) {
                        if (typeof object.fields[keys[i]] !== "object")
                            throw TypeError(".google.protobuf.Struct.fields: object expected");
                        message.fields[keys[i]] = $root.google.protobuf.Value.fromObject(object.fields[keys[i]]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a Struct message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.Struct
             * @static
             * @param {google.protobuf.Struct} message Struct
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Struct.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.objects || options.defaults)
                    object.fields = {};
                var keys2;
                if (message.fields && (keys2 = Object.keys(message.fields)).length) {
                    object.fields = {};
                    for (var j = 0; j < keys2.length; ++j)
                        object.fields[keys2[j]] = $root.google.protobuf.Value.toObject(message.fields[keys2[j]], options);
                }
                return object;
            };

            /**
             * Converts this Struct to JSON.
             * @function toJSON
             * @memberof google.protobuf.Struct
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Struct.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Struct;
        })();

        protobuf.Value = (function() {

            /**
             * Properties of a Value.
             * @memberof google.protobuf
             * @interface IValue
             * @property {google.protobuf.NullValue|null} [nullValue] Value nullValue
             * @property {number|null} [numberValue] Value numberValue
             * @property {string|null} [stringValue] Value stringValue
             * @property {boolean|null} [boolValue] Value boolValue
             * @property {google.protobuf.IStruct|null} [structValue] Value structValue
             * @property {google.protobuf.IListValue|null} [listValue] Value listValue
             */

            /**
             * Constructs a new Value.
             * @memberof google.protobuf
             * @classdesc Represents a Value.
             * @implements IValue
             * @constructor
             * @param {google.protobuf.IValue=} [properties] Properties to set
             */
            function Value(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Value nullValue.
             * @member {google.protobuf.NullValue|null|undefined} nullValue
             * @memberof google.protobuf.Value
             * @instance
             */
            Value.prototype.nullValue = null;

            /**
             * Value numberValue.
             * @member {number|null|undefined} numberValue
             * @memberof google.protobuf.Value
             * @instance
             */
            Value.prototype.numberValue = null;

            /**
             * Value stringValue.
             * @member {string|null|undefined} stringValue
             * @memberof google.protobuf.Value
             * @instance
             */
            Value.prototype.stringValue = null;

            /**
             * Value boolValue.
             * @member {boolean|null|undefined} boolValue
             * @memberof google.protobuf.Value
             * @instance
             */
            Value.prototype.boolValue = null;

            /**
             * Value structValue.
             * @member {google.protobuf.IStruct|null|undefined} structValue
             * @memberof google.protobuf.Value
             * @instance
             */
            Value.prototype.structValue = null;

            /**
             * Value listValue.
             * @member {google.protobuf.IListValue|null|undefined} listValue
             * @memberof google.protobuf.Value
             * @instance
             */
            Value.prototype.listValue = null;

            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;

            /**
             * Value kind.
             * @member {"nullValue"|"numberValue"|"stringValue"|"boolValue"|"structValue"|"listValue"|undefined} kind
             * @memberof google.protobuf.Value
             * @instance
             */
            Object.defineProperty(Value.prototype, "kind", {
                get: $util.oneOfGetter($oneOfFields = ["nullValue", "numberValue", "stringValue", "boolValue", "structValue", "listValue"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new Value instance using the specified properties.
             * @function create
             * @memberof google.protobuf.Value
             * @static
             * @param {google.protobuf.IValue=} [properties] Properties to set
             * @returns {google.protobuf.Value} Value instance
             */
            Value.create = function create(properties) {
                return new Value(properties);
            };

            /**
             * Encodes the specified Value message. Does not implicitly {@link google.protobuf.Value.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.Value
             * @static
             * @param {google.protobuf.IValue} message Value message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Value.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.nullValue != null && Object.hasOwnProperty.call(message, "nullValue"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.nullValue);
                if (message.numberValue != null && Object.hasOwnProperty.call(message, "numberValue"))
                    writer.uint32(/* id 2, wireType 1 =*/17).double(message.numberValue);
                if (message.stringValue != null && Object.hasOwnProperty.call(message, "stringValue"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.stringValue);
                if (message.boolValue != null && Object.hasOwnProperty.call(message, "boolValue"))
                    writer.uint32(/* id 4, wireType 0 =*/32).bool(message.boolValue);
                if (message.structValue != null && Object.hasOwnProperty.call(message, "structValue"))
                    $root.google.protobuf.Struct.encode(message.structValue, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                if (message.listValue != null && Object.hasOwnProperty.call(message, "listValue"))
                    $root.google.protobuf.ListValue.encode(message.listValue, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified Value message, length delimited. Does not implicitly {@link google.protobuf.Value.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.Value
             * @static
             * @param {google.protobuf.IValue} message Value message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Value.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Value message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.Value
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.Value} Value
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Value.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.Value();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.nullValue = reader.int32();
                        break;
                    case 2:
                        message.numberValue = reader.double();
                        break;
                    case 3:
                        message.stringValue = reader.string();
                        break;
                    case 4:
                        message.boolValue = reader.bool();
                        break;
                    case 5:
                        message.structValue = $root.google.protobuf.Struct.decode(reader, reader.uint32());
                        break;
                    case 6:
                        message.listValue = $root.google.protobuf.ListValue.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Value message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.Value
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.Value} Value
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Value.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Value message.
             * @function verify
             * @memberof google.protobuf.Value
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Value.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                var properties = {};
                if (message.nullValue != null && message.hasOwnProperty("nullValue")) {
                    properties.kind = 1;
                    switch (message.nullValue) {
                    default:
                        return "nullValue: enum value expected";
                    case 0:
                        break;
                    }
                }
                if (message.numberValue != null && message.hasOwnProperty("numberValue")) {
                    if (properties.kind === 1)
                        return "kind: multiple values";
                    properties.kind = 1;
                    if (typeof message.numberValue !== "number")
                        return "numberValue: number expected";
                }
                if (message.stringValue != null && message.hasOwnProperty("stringValue")) {
                    if (properties.kind === 1)
                        return "kind: multiple values";
                    properties.kind = 1;
                    if (!$util.isString(message.stringValue))
                        return "stringValue: string expected";
                }
                if (message.boolValue != null && message.hasOwnProperty("boolValue")) {
                    if (properties.kind === 1)
                        return "kind: multiple values";
                    properties.kind = 1;
                    if (typeof message.boolValue !== "boolean")
                        return "boolValue: boolean expected";
                }
                if (message.structValue != null && message.hasOwnProperty("structValue")) {
                    if (properties.kind === 1)
                        return "kind: multiple values";
                    properties.kind = 1;
                    {
                        var error = $root.google.protobuf.Struct.verify(message.structValue);
                        if (error)
                            return "structValue." + error;
                    }
                }
                if (message.listValue != null && message.hasOwnProperty("listValue")) {
                    if (properties.kind === 1)
                        return "kind: multiple values";
                    properties.kind = 1;
                    {
                        var error = $root.google.protobuf.ListValue.verify(message.listValue);
                        if (error)
                            return "listValue." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a Value message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.Value
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.Value} Value
             */
            Value.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.Value)
                    return object;
                var message = new $root.google.protobuf.Value();
                switch (object.nullValue) {
                case "NULL_VALUE":
                case 0:
                    message.nullValue = 0;
                    break;
                }
                if (object.numberValue != null)
                    message.numberValue = Number(object.numberValue);
                if (object.stringValue != null)
                    message.stringValue = String(object.stringValue);
                if (object.boolValue != null)
                    message.boolValue = Boolean(object.boolValue);
                if (object.structValue != null) {
                    if (typeof object.structValue !== "object")
                        throw TypeError(".google.protobuf.Value.structValue: object expected");
                    message.structValue = $root.google.protobuf.Struct.fromObject(object.structValue);
                }
                if (object.listValue != null) {
                    if (typeof object.listValue !== "object")
                        throw TypeError(".google.protobuf.Value.listValue: object expected");
                    message.listValue = $root.google.protobuf.ListValue.fromObject(object.listValue);
                }
                return message;
            };

            /**
             * Creates a plain object from a Value message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.Value
             * @static
             * @param {google.protobuf.Value} message Value
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Value.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (message.nullValue != null && message.hasOwnProperty("nullValue")) {
                    object.nullValue = options.enums === String ? $root.google.protobuf.NullValue[message.nullValue] : message.nullValue;
                    if (options.oneofs)
                        object.kind = "nullValue";
                }
                if (message.numberValue != null && message.hasOwnProperty("numberValue")) {
                    object.numberValue = options.json && !isFinite(message.numberValue) ? String(message.numberValue) : message.numberValue;
                    if (options.oneofs)
                        object.kind = "numberValue";
                }
                if (message.stringValue != null && message.hasOwnProperty("stringValue")) {
                    object.stringValue = message.stringValue;
                    if (options.oneofs)
                        object.kind = "stringValue";
                }
                if (message.boolValue != null && message.hasOwnProperty("boolValue")) {
                    object.boolValue = message.boolValue;
                    if (options.oneofs)
                        object.kind = "boolValue";
                }
                if (message.structValue != null && message.hasOwnProperty("structValue")) {
                    object.structValue = $root.google.protobuf.Struct.toObject(message.structValue, options);
                    if (options.oneofs)
                        object.kind = "structValue";
                }
                if (message.listValue != null && message.hasOwnProperty("listValue")) {
                    object.listValue = $root.google.protobuf.ListValue.toObject(message.listValue, options);
                    if (options.oneofs)
                        object.kind = "listValue";
                }
                return object;
            };

            /**
             * Converts this Value to JSON.
             * @function toJSON
             * @memberof google.protobuf.Value
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Value.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Value;
        })();

        /**
         * NullValue enum.
         * @name google.protobuf.NullValue
         * @enum {number}
         * @property {number} NULL_VALUE=0 NULL_VALUE value
         */
        protobuf.NullValue = (function() {
            var valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "NULL_VALUE"] = 0;
            return values;
        })();

        protobuf.ListValue = (function() {

            /**
             * Properties of a ListValue.
             * @memberof google.protobuf
             * @interface IListValue
             * @property {Array.<google.protobuf.IValue>|null} [values] ListValue values
             */

            /**
             * Constructs a new ListValue.
             * @memberof google.protobuf
             * @classdesc Represents a ListValue.
             * @implements IListValue
             * @constructor
             * @param {google.protobuf.IListValue=} [properties] Properties to set
             */
            function ListValue(properties) {
                this.values = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ListValue values.
             * @member {Array.<google.protobuf.IValue>} values
             * @memberof google.protobuf.ListValue
             * @instance
             */
            ListValue.prototype.values = $util.emptyArray;

            /**
             * Creates a new ListValue instance using the specified properties.
             * @function create
             * @memberof google.protobuf.ListValue
             * @static
             * @param {google.protobuf.IListValue=} [properties] Properties to set
             * @returns {google.protobuf.ListValue} ListValue instance
             */
            ListValue.create = function create(properties) {
                return new ListValue(properties);
            };

            /**
             * Encodes the specified ListValue message. Does not implicitly {@link google.protobuf.ListValue.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.ListValue
             * @static
             * @param {google.protobuf.IListValue} message ListValue message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ListValue.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.values != null && message.values.length)
                    for (var i = 0; i < message.values.length; ++i)
                        $root.google.protobuf.Value.encode(message.values[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified ListValue message, length delimited. Does not implicitly {@link google.protobuf.ListValue.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.ListValue
             * @static
             * @param {google.protobuf.IListValue} message ListValue message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ListValue.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ListValue message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.ListValue
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.ListValue} ListValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ListValue.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.ListValue();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        if (!(message.values && message.values.length))
                            message.values = [];
                        message.values.push($root.google.protobuf.Value.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ListValue message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.ListValue
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.ListValue} ListValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ListValue.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ListValue message.
             * @function verify
             * @memberof google.protobuf.ListValue
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ListValue.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.values != null && message.hasOwnProperty("values")) {
                    if (!Array.isArray(message.values))
                        return "values: array expected";
                    for (var i = 0; i < message.values.length; ++i) {
                        var error = $root.google.protobuf.Value.verify(message.values[i]);
                        if (error)
                            return "values." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a ListValue message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.ListValue
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.ListValue} ListValue
             */
            ListValue.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.ListValue)
                    return object;
                var message = new $root.google.protobuf.ListValue();
                if (object.values) {
                    if (!Array.isArray(object.values))
                        throw TypeError(".google.protobuf.ListValue.values: array expected");
                    message.values = [];
                    for (var i = 0; i < object.values.length; ++i) {
                        if (typeof object.values[i] !== "object")
                            throw TypeError(".google.protobuf.ListValue.values: object expected");
                        message.values[i] = $root.google.protobuf.Value.fromObject(object.values[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a ListValue message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.ListValue
             * @static
             * @param {google.protobuf.ListValue} message ListValue
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ListValue.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults)
                    object.values = [];
                if (message.values && message.values.length) {
                    object.values = [];
                    for (var j = 0; j < message.values.length; ++j)
                        object.values[j] = $root.google.protobuf.Value.toObject(message.values[j], options);
                }
                return object;
            };

            /**
             * Converts this ListValue to JSON.
             * @function toJSON
             * @memberof google.protobuf.ListValue
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ListValue.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return ListValue;
        })();

        return protobuf;
    })();

    return google;
})();

$root.rankland_live_contest_producer = (function() {

    /**
     * Namespace rankland_live_contest_producer.
     * @exports rankland_live_contest_producer
     * @namespace
     */
    var rankland_live_contest_producer = {};

    rankland_live_contest_producer.ProducerEvent = (function() {

        /**
         * Properties of a ProducerEvent.
         * @memberof rankland_live_contest_producer
         * @interface IProducerEvent
         * @property {number|null} [eventId] ProducerEvent eventId
         * @property {rankland_live_contest_common.EventType|null} [type] ProducerEvent type
         * @property {rankland_live_contest_common.INewSolutionEvent|null} [newSolutionData] ProducerEvent newSolutionData
         * @property {rankland_live_contest_common.ISolutionOnProgressEvent|null} [solutionOnProgressData] ProducerEvent solutionOnProgressData
         * @property {rankland_live_contest_common.ISolutionOnResultSettleEvent|null} [solutionOnResultSettleData] ProducerEvent solutionOnResultSettleData
         * @property {rankland_live_contest_common.ISolutionOnResultChangeEvent|null} [solutionOnResultChangeData] ProducerEvent solutionOnResultChangeData
         * @property {rankland_live_contest_common.IContestConfigChangeEvent|null} [contestConfigChangeData] ProducerEvent contestConfigChangeData
         */

        /**
         * Constructs a new ProducerEvent.
         * @memberof rankland_live_contest_producer
         * @classdesc Represents a ProducerEvent.
         * @implements IProducerEvent
         * @constructor
         * @param {rankland_live_contest_producer.IProducerEvent=} [properties] Properties to set
         */
        function ProducerEvent(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ProducerEvent eventId.
         * @member {number} eventId
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @instance
         */
        ProducerEvent.prototype.eventId = 0;

        /**
         * ProducerEvent type.
         * @member {rankland_live_contest_common.EventType} type
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @instance
         */
        ProducerEvent.prototype.type = 0;

        /**
         * ProducerEvent newSolutionData.
         * @member {rankland_live_contest_common.INewSolutionEvent|null|undefined} newSolutionData
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @instance
         */
        ProducerEvent.prototype.newSolutionData = null;

        /**
         * ProducerEvent solutionOnProgressData.
         * @member {rankland_live_contest_common.ISolutionOnProgressEvent|null|undefined} solutionOnProgressData
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @instance
         */
        ProducerEvent.prototype.solutionOnProgressData = null;

        /**
         * ProducerEvent solutionOnResultSettleData.
         * @member {rankland_live_contest_common.ISolutionOnResultSettleEvent|null|undefined} solutionOnResultSettleData
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @instance
         */
        ProducerEvent.prototype.solutionOnResultSettleData = null;

        /**
         * ProducerEvent solutionOnResultChangeData.
         * @member {rankland_live_contest_common.ISolutionOnResultChangeEvent|null|undefined} solutionOnResultChangeData
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @instance
         */
        ProducerEvent.prototype.solutionOnResultChangeData = null;

        /**
         * ProducerEvent contestConfigChangeData.
         * @member {rankland_live_contest_common.IContestConfigChangeEvent|null|undefined} contestConfigChangeData
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @instance
         */
        ProducerEvent.prototype.contestConfigChangeData = null;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields;

        /**
         * ProducerEvent data.
         * @member {"newSolutionData"|"solutionOnProgressData"|"solutionOnResultSettleData"|"solutionOnResultChangeData"|"contestConfigChangeData"|undefined} data
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @instance
         */
        Object.defineProperty(ProducerEvent.prototype, "data", {
            get: $util.oneOfGetter($oneOfFields = ["newSolutionData", "solutionOnProgressData", "solutionOnResultSettleData", "solutionOnResultChangeData", "contestConfigChangeData"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new ProducerEvent instance using the specified properties.
         * @function create
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @static
         * @param {rankland_live_contest_producer.IProducerEvent=} [properties] Properties to set
         * @returns {rankland_live_contest_producer.ProducerEvent} ProducerEvent instance
         */
        ProducerEvent.create = function create(properties) {
            return new ProducerEvent(properties);
        };

        /**
         * Encodes the specified ProducerEvent message. Does not implicitly {@link rankland_live_contest_producer.ProducerEvent.verify|verify} messages.
         * @function encode
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @static
         * @param {rankland_live_contest_producer.IProducerEvent} message ProducerEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ProducerEvent.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.eventId != null && Object.hasOwnProperty.call(message, "eventId"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.eventId);
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.type);
            if (message.newSolutionData != null && Object.hasOwnProperty.call(message, "newSolutionData"))
                $root.rankland_live_contest_common.NewSolutionEvent.encode(message.newSolutionData, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            if (message.solutionOnProgressData != null && Object.hasOwnProperty.call(message, "solutionOnProgressData"))
                $root.rankland_live_contest_common.SolutionOnProgressEvent.encode(message.solutionOnProgressData, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
            if (message.solutionOnResultSettleData != null && Object.hasOwnProperty.call(message, "solutionOnResultSettleData"))
                $root.rankland_live_contest_common.SolutionOnResultSettleEvent.encode(message.solutionOnResultSettleData, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            if (message.solutionOnResultChangeData != null && Object.hasOwnProperty.call(message, "solutionOnResultChangeData"))
                $root.rankland_live_contest_common.SolutionOnResultChangeEvent.encode(message.solutionOnResultChangeData, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            if (message.contestConfigChangeData != null && Object.hasOwnProperty.call(message, "contestConfigChangeData"))
                $root.rankland_live_contest_common.ContestConfigChangeEvent.encode(message.contestConfigChangeData, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ProducerEvent message, length delimited. Does not implicitly {@link rankland_live_contest_producer.ProducerEvent.verify|verify} messages.
         * @function encodeDelimited
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @static
         * @param {rankland_live_contest_producer.IProducerEvent} message ProducerEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ProducerEvent.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ProducerEvent message from the specified reader or buffer.
         * @function decode
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {rankland_live_contest_producer.ProducerEvent} ProducerEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ProducerEvent.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_producer.ProducerEvent();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.eventId = reader.uint32();
                    break;
                case 2:
                    message.type = reader.int32();
                    break;
                case 3:
                    message.newSolutionData = $root.rankland_live_contest_common.NewSolutionEvent.decode(reader, reader.uint32());
                    break;
                case 4:
                    message.solutionOnProgressData = $root.rankland_live_contest_common.SolutionOnProgressEvent.decode(reader, reader.uint32());
                    break;
                case 5:
                    message.solutionOnResultSettleData = $root.rankland_live_contest_common.SolutionOnResultSettleEvent.decode(reader, reader.uint32());
                    break;
                case 6:
                    message.solutionOnResultChangeData = $root.rankland_live_contest_common.SolutionOnResultChangeEvent.decode(reader, reader.uint32());
                    break;
                case 7:
                    message.contestConfigChangeData = $root.rankland_live_contest_common.ContestConfigChangeEvent.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ProducerEvent message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {rankland_live_contest_producer.ProducerEvent} ProducerEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ProducerEvent.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ProducerEvent message.
         * @function verify
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ProducerEvent.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            var properties = {};
            if (message.eventId != null && message.hasOwnProperty("eventId"))
                if (!$util.isInteger(message.eventId))
                    return "eventId: integer expected";
            if (message.type != null && message.hasOwnProperty("type"))
                switch (message.type) {
                default:
                    return "type: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                    break;
                }
            if (message.newSolutionData != null && message.hasOwnProperty("newSolutionData")) {
                properties.data = 1;
                {
                    var error = $root.rankland_live_contest_common.NewSolutionEvent.verify(message.newSolutionData);
                    if (error)
                        return "newSolutionData." + error;
                }
            }
            if (message.solutionOnProgressData != null && message.hasOwnProperty("solutionOnProgressData")) {
                if (properties.data === 1)
                    return "data: multiple values";
                properties.data = 1;
                {
                    var error = $root.rankland_live_contest_common.SolutionOnProgressEvent.verify(message.solutionOnProgressData);
                    if (error)
                        return "solutionOnProgressData." + error;
                }
            }
            if (message.solutionOnResultSettleData != null && message.hasOwnProperty("solutionOnResultSettleData")) {
                if (properties.data === 1)
                    return "data: multiple values";
                properties.data = 1;
                {
                    var error = $root.rankland_live_contest_common.SolutionOnResultSettleEvent.verify(message.solutionOnResultSettleData);
                    if (error)
                        return "solutionOnResultSettleData." + error;
                }
            }
            if (message.solutionOnResultChangeData != null && message.hasOwnProperty("solutionOnResultChangeData")) {
                if (properties.data === 1)
                    return "data: multiple values";
                properties.data = 1;
                {
                    var error = $root.rankland_live_contest_common.SolutionOnResultChangeEvent.verify(message.solutionOnResultChangeData);
                    if (error)
                        return "solutionOnResultChangeData." + error;
                }
            }
            if (message.contestConfigChangeData != null && message.hasOwnProperty("contestConfigChangeData")) {
                if (properties.data === 1)
                    return "data: multiple values";
                properties.data = 1;
                {
                    var error = $root.rankland_live_contest_common.ContestConfigChangeEvent.verify(message.contestConfigChangeData);
                    if (error)
                        return "contestConfigChangeData." + error;
                }
            }
            return null;
        };

        /**
         * Creates a ProducerEvent message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {rankland_live_contest_producer.ProducerEvent} ProducerEvent
         */
        ProducerEvent.fromObject = function fromObject(object) {
            if (object instanceof $root.rankland_live_contest_producer.ProducerEvent)
                return object;
            var message = new $root.rankland_live_contest_producer.ProducerEvent();
            if (object.eventId != null)
                message.eventId = object.eventId >>> 0;
            switch (object.type) {
            case "NEW_SOLUTION":
            case 0:
                message.type = 0;
                break;
            case "SOLUTION_ON_PROGRESS":
            case 1:
                message.type = 1;
                break;
            case "SOLUTION_ON_RESULT_SETTLE":
            case 2:
                message.type = 2;
                break;
            case "SOLUTION_ON_RESULT_CHANGE":
            case 3:
                message.type = 3;
                break;
            case "CONTEST_CONFIG_CHANGE":
            case 4:
                message.type = 4;
                break;
            }
            if (object.newSolutionData != null) {
                if (typeof object.newSolutionData !== "object")
                    throw TypeError(".rankland_live_contest_producer.ProducerEvent.newSolutionData: object expected");
                message.newSolutionData = $root.rankland_live_contest_common.NewSolutionEvent.fromObject(object.newSolutionData);
            }
            if (object.solutionOnProgressData != null) {
                if (typeof object.solutionOnProgressData !== "object")
                    throw TypeError(".rankland_live_contest_producer.ProducerEvent.solutionOnProgressData: object expected");
                message.solutionOnProgressData = $root.rankland_live_contest_common.SolutionOnProgressEvent.fromObject(object.solutionOnProgressData);
            }
            if (object.solutionOnResultSettleData != null) {
                if (typeof object.solutionOnResultSettleData !== "object")
                    throw TypeError(".rankland_live_contest_producer.ProducerEvent.solutionOnResultSettleData: object expected");
                message.solutionOnResultSettleData = $root.rankland_live_contest_common.SolutionOnResultSettleEvent.fromObject(object.solutionOnResultSettleData);
            }
            if (object.solutionOnResultChangeData != null) {
                if (typeof object.solutionOnResultChangeData !== "object")
                    throw TypeError(".rankland_live_contest_producer.ProducerEvent.solutionOnResultChangeData: object expected");
                message.solutionOnResultChangeData = $root.rankland_live_contest_common.SolutionOnResultChangeEvent.fromObject(object.solutionOnResultChangeData);
            }
            if (object.contestConfigChangeData != null) {
                if (typeof object.contestConfigChangeData !== "object")
                    throw TypeError(".rankland_live_contest_producer.ProducerEvent.contestConfigChangeData: object expected");
                message.contestConfigChangeData = $root.rankland_live_contest_common.ContestConfigChangeEvent.fromObject(object.contestConfigChangeData);
            }
            return message;
        };

        /**
         * Creates a plain object from a ProducerEvent message. Also converts values to other types if specified.
         * @function toObject
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @static
         * @param {rankland_live_contest_producer.ProducerEvent} message ProducerEvent
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ProducerEvent.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.eventId = 0;
                object.type = options.enums === String ? "NEW_SOLUTION" : 0;
            }
            if (message.eventId != null && message.hasOwnProperty("eventId"))
                object.eventId = message.eventId;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = options.enums === String ? $root.rankland_live_contest_common.EventType[message.type] : message.type;
            if (message.newSolutionData != null && message.hasOwnProperty("newSolutionData")) {
                object.newSolutionData = $root.rankland_live_contest_common.NewSolutionEvent.toObject(message.newSolutionData, options);
                if (options.oneofs)
                    object.data = "newSolutionData";
            }
            if (message.solutionOnProgressData != null && message.hasOwnProperty("solutionOnProgressData")) {
                object.solutionOnProgressData = $root.rankland_live_contest_common.SolutionOnProgressEvent.toObject(message.solutionOnProgressData, options);
                if (options.oneofs)
                    object.data = "solutionOnProgressData";
            }
            if (message.solutionOnResultSettleData != null && message.hasOwnProperty("solutionOnResultSettleData")) {
                object.solutionOnResultSettleData = $root.rankland_live_contest_common.SolutionOnResultSettleEvent.toObject(message.solutionOnResultSettleData, options);
                if (options.oneofs)
                    object.data = "solutionOnResultSettleData";
            }
            if (message.solutionOnResultChangeData != null && message.hasOwnProperty("solutionOnResultChangeData")) {
                object.solutionOnResultChangeData = $root.rankland_live_contest_common.SolutionOnResultChangeEvent.toObject(message.solutionOnResultChangeData, options);
                if (options.oneofs)
                    object.data = "solutionOnResultChangeData";
            }
            if (message.contestConfigChangeData != null && message.hasOwnProperty("contestConfigChangeData")) {
                object.contestConfigChangeData = $root.rankland_live_contest_common.ContestConfigChangeEvent.toObject(message.contestConfigChangeData, options);
                if (options.oneofs)
                    object.data = "contestConfigChangeData";
            }
            return object;
        };

        /**
         * Converts this ProducerEvent to JSON.
         * @function toJSON
         * @memberof rankland_live_contest_producer.ProducerEvent
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ProducerEvent.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ProducerEvent;
    })();

    rankland_live_contest_producer.BatchProducerEvent = (function() {

        /**
         * Properties of a BatchProducerEvent.
         * @memberof rankland_live_contest_producer
         * @interface IBatchProducerEvent
         * @property {Array.<rankland_live_contest_producer.IProducerEvent>|null} [events] BatchProducerEvent events
         * @property {number|null} [streamRevision] BatchProducerEvent streamRevision
         */

        /**
         * Constructs a new BatchProducerEvent.
         * @memberof rankland_live_contest_producer
         * @classdesc Represents a BatchProducerEvent.
         * @implements IBatchProducerEvent
         * @constructor
         * @param {rankland_live_contest_producer.IBatchProducerEvent=} [properties] Properties to set
         */
        function BatchProducerEvent(properties) {
            this.events = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * BatchProducerEvent events.
         * @member {Array.<rankland_live_contest_producer.IProducerEvent>} events
         * @memberof rankland_live_contest_producer.BatchProducerEvent
         * @instance
         */
        BatchProducerEvent.prototype.events = $util.emptyArray;

        /**
         * BatchProducerEvent streamRevision.
         * @member {number} streamRevision
         * @memberof rankland_live_contest_producer.BatchProducerEvent
         * @instance
         */
        BatchProducerEvent.prototype.streamRevision = 0;

        /**
         * Creates a new BatchProducerEvent instance using the specified properties.
         * @function create
         * @memberof rankland_live_contest_producer.BatchProducerEvent
         * @static
         * @param {rankland_live_contest_producer.IBatchProducerEvent=} [properties] Properties to set
         * @returns {rankland_live_contest_producer.BatchProducerEvent} BatchProducerEvent instance
         */
        BatchProducerEvent.create = function create(properties) {
            return new BatchProducerEvent(properties);
        };

        /**
         * Encodes the specified BatchProducerEvent message. Does not implicitly {@link rankland_live_contest_producer.BatchProducerEvent.verify|verify} messages.
         * @function encode
         * @memberof rankland_live_contest_producer.BatchProducerEvent
         * @static
         * @param {rankland_live_contest_producer.IBatchProducerEvent} message BatchProducerEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BatchProducerEvent.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.events != null && message.events.length)
                for (var i = 0; i < message.events.length; ++i)
                    $root.rankland_live_contest_producer.ProducerEvent.encode(message.events[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.streamRevision != null && Object.hasOwnProperty.call(message, "streamRevision"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.streamRevision);
            return writer;
        };

        /**
         * Encodes the specified BatchProducerEvent message, length delimited. Does not implicitly {@link rankland_live_contest_producer.BatchProducerEvent.verify|verify} messages.
         * @function encodeDelimited
         * @memberof rankland_live_contest_producer.BatchProducerEvent
         * @static
         * @param {rankland_live_contest_producer.IBatchProducerEvent} message BatchProducerEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BatchProducerEvent.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BatchProducerEvent message from the specified reader or buffer.
         * @function decode
         * @memberof rankland_live_contest_producer.BatchProducerEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {rankland_live_contest_producer.BatchProducerEvent} BatchProducerEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BatchProducerEvent.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_producer.BatchProducerEvent();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.events && message.events.length))
                        message.events = [];
                    message.events.push($root.rankland_live_contest_producer.ProducerEvent.decode(reader, reader.uint32()));
                    break;
                case 2:
                    message.streamRevision = reader.uint32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BatchProducerEvent message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof rankland_live_contest_producer.BatchProducerEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {rankland_live_contest_producer.BatchProducerEvent} BatchProducerEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BatchProducerEvent.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BatchProducerEvent message.
         * @function verify
         * @memberof rankland_live_contest_producer.BatchProducerEvent
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BatchProducerEvent.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.events != null && message.hasOwnProperty("events")) {
                if (!Array.isArray(message.events))
                    return "events: array expected";
                for (var i = 0; i < message.events.length; ++i) {
                    var error = $root.rankland_live_contest_producer.ProducerEvent.verify(message.events[i]);
                    if (error)
                        return "events." + error;
                }
            }
            if (message.streamRevision != null && message.hasOwnProperty("streamRevision"))
                if (!$util.isInteger(message.streamRevision))
                    return "streamRevision: integer expected";
            return null;
        };

        /**
         * Creates a BatchProducerEvent message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof rankland_live_contest_producer.BatchProducerEvent
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {rankland_live_contest_producer.BatchProducerEvent} BatchProducerEvent
         */
        BatchProducerEvent.fromObject = function fromObject(object) {
            if (object instanceof $root.rankland_live_contest_producer.BatchProducerEvent)
                return object;
            var message = new $root.rankland_live_contest_producer.BatchProducerEvent();
            if (object.events) {
                if (!Array.isArray(object.events))
                    throw TypeError(".rankland_live_contest_producer.BatchProducerEvent.events: array expected");
                message.events = [];
                for (var i = 0; i < object.events.length; ++i) {
                    if (typeof object.events[i] !== "object")
                        throw TypeError(".rankland_live_contest_producer.BatchProducerEvent.events: object expected");
                    message.events[i] = $root.rankland_live_contest_producer.ProducerEvent.fromObject(object.events[i]);
                }
            }
            if (object.streamRevision != null)
                message.streamRevision = object.streamRevision >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a BatchProducerEvent message. Also converts values to other types if specified.
         * @function toObject
         * @memberof rankland_live_contest_producer.BatchProducerEvent
         * @static
         * @param {rankland_live_contest_producer.BatchProducerEvent} message BatchProducerEvent
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BatchProducerEvent.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.events = [];
            if (options.defaults)
                object.streamRevision = 0;
            if (message.events && message.events.length) {
                object.events = [];
                for (var j = 0; j < message.events.length; ++j)
                    object.events[j] = $root.rankland_live_contest_producer.ProducerEvent.toObject(message.events[j], options);
            }
            if (message.streamRevision != null && message.hasOwnProperty("streamRevision"))
                object.streamRevision = message.streamRevision;
            return object;
        };

        /**
         * Converts this BatchProducerEvent to JSON.
         * @function toJSON
         * @memberof rankland_live_contest_producer.BatchProducerEvent
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BatchProducerEvent.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return BatchProducerEvent;
    })();

    return rankland_live_contest_producer;
})();

module.exports = $root;
