/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots.rankland_live_contest_web_client || ($protobuf.roots.rankland_live_contest_web_client = {});

export const rankland_live_contest_client = $root.rankland_live_contest_client = (() => {

    /**
     * Namespace rankland_live_contest_client.
     * @exports rankland_live_contest_client
     * @namespace
     */
    const rankland_live_contest_client = {};

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
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
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
        let $oneOfFields;

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
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_client.ClientEvent();
            while (reader.pos < end) {
                let tag = reader.uint32();
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
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
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
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_client.BatchClientEvent();
            while (reader.pos < end) {
                let tag = reader.uint32();
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
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
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
        let $oneOfFields;

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
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_client.GetContestEventsResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
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

        return GetContestEventsResponse;
    })();

    return rankland_live_contest_client;
})();

export const rankland_live_contest_common = $root.rankland_live_contest_common = (() => {

    /**
     * Namespace rankland_live_contest_common.
     * @exports rankland_live_contest_common
     * @namespace
     */
    const rankland_live_contest_common = {};

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
        const valuesById = {}, values = Object.create(valuesById);
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
        const valuesById = {}, values = Object.create(valuesById);
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
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
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
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_common.TimeDuration();
            while (reader.pos < end) {
                let tag = reader.uint32();
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
        const valuesById = {}, values = Object.create(valuesById);
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
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
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
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_common.NewSolutionEvent();
            while (reader.pos < end) {
                let tag = reader.uint32();
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
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
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
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_common.SolutionOnProgressEvent();
            while (reader.pos < end) {
                let tag = reader.uint32();
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
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
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
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_common.SolutionOnResultSettleEvent();
            while (reader.pos < end) {
                let tag = reader.uint32();
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
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
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
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_common.SolutionOnResultChangeEvent();
            while (reader.pos < end) {
                let tag = reader.uint32();
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
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
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
        let $oneOfFields;

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
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_common.ContestConfigPatch();
            while (reader.pos < end) {
                let tag = reader.uint32();
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
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
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
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.rankland_live_contest_common.ContestConfigChangeEvent();
            while (reader.pos < end) {
                let tag = reader.uint32();
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

        return ContestConfigChangeEvent;
    })();

    return rankland_live_contest_common;
})();

export const google = $root.google = (() => {

    /**
     * Namespace google.
     * @exports google
     * @namespace
     */
    const google = {};

    google.protobuf = (function() {

        /**
         * Namespace protobuf.
         * @memberof google
         * @namespace
         */
        const protobuf = {};

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
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
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
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.Struct(), key, value;
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        if (message.fields === $util.emptyObject)
                            message.fields = {};
                        let end2 = reader.uint32() + reader.pos;
                        key = "";
                        value = null;
                        while (reader.pos < end2) {
                            let tag2 = reader.uint32();
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
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
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
            let $oneOfFields;

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
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.Value();
                while (reader.pos < end) {
                    let tag = reader.uint32();
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

            return Value;
        })();

        /**
         * NullValue enum.
         * @name google.protobuf.NullValue
         * @enum {number}
         * @property {number} NULL_VALUE=0 NULL_VALUE value
         */
        protobuf.NullValue = (function() {
            const valuesById = {}, values = Object.create(valuesById);
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
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
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
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.ListValue();
                while (reader.pos < end) {
                    let tag = reader.uint32();
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

            return ListValue;
        })();

        return protobuf;
    })();

    return google;
})();

export { $root as default };
