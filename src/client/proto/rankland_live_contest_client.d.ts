import * as $protobuf from "protobufjs";
/** Namespace rankland_live_contest_client. */
export namespace rankland_live_contest_client {

    /** Properties of a ClientEvent. */
    interface IClientEvent {

        /** ClientEvent eventId */
        eventId?: (number|null);

        /** ClientEvent type */
        type?: (rankland_live_contest_common.EventType|null);

        /** ClientEvent newSolutionData */
        newSolutionData?: (rankland_live_contest_common.INewSolutionEvent|null);

        /** ClientEvent solutionOnProgressData */
        solutionOnProgressData?: (rankland_live_contest_common.ISolutionOnProgressEvent|null);

        /** ClientEvent solutionOnResultSettleData */
        solutionOnResultSettleData?: (rankland_live_contest_common.ISolutionOnResultSettleEvent|null);

        /** ClientEvent solutionOnResultChangeData */
        solutionOnResultChangeData?: (rankland_live_contest_common.ISolutionOnResultChangeEvent|null);

        /** ClientEvent contestConfigChangeData */
        contestConfigChangeData?: (rankland_live_contest_common.IContestConfigChangeEvent|null);
    }

    /** Represents a ClientEvent. */
    class ClientEvent implements IClientEvent {

        /**
         * Constructs a new ClientEvent.
         * @param [properties] Properties to set
         */
        constructor(properties?: rankland_live_contest_client.IClientEvent);

        /** ClientEvent eventId. */
        public eventId: number;

        /** ClientEvent type. */
        public type: rankland_live_contest_common.EventType;

        /** ClientEvent newSolutionData. */
        public newSolutionData?: (rankland_live_contest_common.INewSolutionEvent|null);

        /** ClientEvent solutionOnProgressData. */
        public solutionOnProgressData?: (rankland_live_contest_common.ISolutionOnProgressEvent|null);

        /** ClientEvent solutionOnResultSettleData. */
        public solutionOnResultSettleData?: (rankland_live_contest_common.ISolutionOnResultSettleEvent|null);

        /** ClientEvent solutionOnResultChangeData. */
        public solutionOnResultChangeData?: (rankland_live_contest_common.ISolutionOnResultChangeEvent|null);

        /** ClientEvent contestConfigChangeData. */
        public contestConfigChangeData?: (rankland_live_contest_common.IContestConfigChangeEvent|null);

        /** ClientEvent data. */
        public data?: ("newSolutionData"|"solutionOnProgressData"|"solutionOnResultSettleData"|"solutionOnResultChangeData"|"contestConfigChangeData");

        /**
         * Decodes a ClientEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ClientEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_client.ClientEvent;
    }

    /** Properties of a BatchClientEvent. */
    interface IBatchClientEvent {

        /** BatchClientEvent events */
        events?: (rankland_live_contest_client.IClientEvent[]|null);
    }

    /** Represents a BatchClientEvent. */
    class BatchClientEvent implements IBatchClientEvent {

        /**
         * Constructs a new BatchClientEvent.
         * @param [properties] Properties to set
         */
        constructor(properties?: rankland_live_contest_client.IBatchClientEvent);

        /** BatchClientEvent events. */
        public events: rankland_live_contest_client.IClientEvent[];

        /**
         * Decodes a BatchClientEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BatchClientEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_client.BatchClientEvent;
    }

    /** Properties of a GetContestEventsResponse. */
    interface IGetContestEventsResponse {

        /** GetContestEventsResponse uk */
        uk?: (string|null);

        /** GetContestEventsResponse fromEventId */
        fromEventId?: (number|null);

        /** GetContestEventsResponse toEventId */
        toEventId?: (number|null);

        /** GetContestEventsResponse checkpointEventId */
        checkpointEventId?: (number|null);

        /** GetContestEventsResponse latestEventId */
        latestEventId?: (number|null);

        /** GetContestEventsResponse streamRevision */
        streamRevision?: (number|null);

        /** GetContestEventsResponse hasMore */
        hasMore?: (boolean|null);

        /** GetContestEventsResponse resetRequired */
        resetRequired?: (boolean|null);

        /** GetContestEventsResponse resetReason */
        resetReason?: (string|null);

        /** GetContestEventsResponse events */
        events?: (rankland_live_contest_client.IClientEvent[]|null);
    }

    /** Represents a GetContestEventsResponse. */
    class GetContestEventsResponse implements IGetContestEventsResponse {

        /**
         * Constructs a new GetContestEventsResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: rankland_live_contest_client.IGetContestEventsResponse);

        /** GetContestEventsResponse uk. */
        public uk: string;

        /** GetContestEventsResponse fromEventId. */
        public fromEventId?: (number|null);

        /** GetContestEventsResponse toEventId. */
        public toEventId?: (number|null);

        /** GetContestEventsResponse checkpointEventId. */
        public checkpointEventId: number;

        /** GetContestEventsResponse latestEventId. */
        public latestEventId: number;

        /** GetContestEventsResponse streamRevision. */
        public streamRevision: number;

        /** GetContestEventsResponse hasMore. */
        public hasMore: boolean;

        /** GetContestEventsResponse resetRequired. */
        public resetRequired: boolean;

        /** GetContestEventsResponse resetReason. */
        public resetReason: string;

        /** GetContestEventsResponse events. */
        public events: rankland_live_contest_client.IClientEvent[];

        /** GetContestEventsResponse _fromEventId. */
        public _fromEventId?: "fromEventId";

        /** GetContestEventsResponse _toEventId. */
        public _toEventId?: "toEventId";

        /**
         * Decodes a GetContestEventsResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetContestEventsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_client.GetContestEventsResponse;
    }
}

/** Namespace rankland_live_contest_common. */
export namespace rankland_live_contest_common {

    /** Result enum. */
    enum Result {
        PD = 0,
        JG = 1,
        CNL = 2,
        FZ = 3,
        UKE = 4,
        AC = 5,
        FB = 6,
        RJ = 7,
        WA = 8,
        PE = 9,
        TLE = 10,
        MLE = 11,
        OLE = 12,
        RTE = 13,
        NOUT = 14,
        CE = 15
    }

    /** TimeUnit enum. */
    enum TimeUnit {
        S = 0,
        MS = 1,
        US = 2,
        NS = 3
    }

    /** Properties of a TimeDuration. */
    interface ITimeDuration {

        /** TimeDuration value */
        value?: (Long|null);

        /** TimeDuration unit */
        unit?: (rankland_live_contest_common.TimeUnit|null);
    }

    /** Represents a TimeDuration. */
    class TimeDuration implements ITimeDuration {

        /**
         * Constructs a new TimeDuration.
         * @param [properties] Properties to set
         */
        constructor(properties?: rankland_live_contest_common.ITimeDuration);

        /** TimeDuration value. */
        public value: Long;

        /** TimeDuration unit. */
        public unit: rankland_live_contest_common.TimeUnit;

        /**
         * Decodes a TimeDuration message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TimeDuration
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_common.TimeDuration;
    }

    /** EventType enum. */
    enum EventType {
        NEW_SOLUTION = 0,
        SOLUTION_ON_PROGRESS = 1,
        SOLUTION_ON_RESULT_SETTLE = 2,
        SOLUTION_ON_RESULT_CHANGE = 3,
        CONTEST_CONFIG_CHANGE = 4
    }

    /** Properties of a NewSolutionEvent. */
    interface INewSolutionEvent {

        /** NewSolutionEvent solutionId */
        solutionId?: (number|null);

        /** NewSolutionEvent userId */
        userId?: (string|null);

        /** NewSolutionEvent problemAlias */
        problemAlias?: (string|null);

        /** NewSolutionEvent time */
        time?: (rankland_live_contest_common.ITimeDuration|null);
    }

    /** Represents a NewSolutionEvent. */
    class NewSolutionEvent implements INewSolutionEvent {

        /**
         * Constructs a new NewSolutionEvent.
         * @param [properties] Properties to set
         */
        constructor(properties?: rankland_live_contest_common.INewSolutionEvent);

        /** NewSolutionEvent solutionId. */
        public solutionId: number;

        /** NewSolutionEvent userId. */
        public userId: string;

        /** NewSolutionEvent problemAlias. */
        public problemAlias: string;

        /** NewSolutionEvent time. */
        public time?: (rankland_live_contest_common.ITimeDuration|null);

        /**
         * Decodes a NewSolutionEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns NewSolutionEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_common.NewSolutionEvent;
    }

    /** Properties of a SolutionOnProgressEvent. */
    interface ISolutionOnProgressEvent {

        /** SolutionOnProgressEvent solutionId */
        solutionId?: (number|null);

        /** SolutionOnProgressEvent percentageProgress */
        percentageProgress?: (number|null);

        /** SolutionOnProgressEvent time */
        time?: (rankland_live_contest_common.ITimeDuration|null);
    }

    /** Represents a SolutionOnProgressEvent. */
    class SolutionOnProgressEvent implements ISolutionOnProgressEvent {

        /**
         * Constructs a new SolutionOnProgressEvent.
         * @param [properties] Properties to set
         */
        constructor(properties?: rankland_live_contest_common.ISolutionOnProgressEvent);

        /** SolutionOnProgressEvent solutionId. */
        public solutionId: number;

        /** SolutionOnProgressEvent percentageProgress. */
        public percentageProgress: number;

        /** SolutionOnProgressEvent time. */
        public time?: (rankland_live_contest_common.ITimeDuration|null);

        /**
         * Decodes a SolutionOnProgressEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SolutionOnProgressEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_common.SolutionOnProgressEvent;
    }

    /** Properties of a SolutionOnResultSettleEvent. */
    interface ISolutionOnResultSettleEvent {

        /** SolutionOnResultSettleEvent solutionId */
        solutionId?: (number|null);

        /** SolutionOnResultSettleEvent result */
        result?: (rankland_live_contest_common.Result|null);

        /** SolutionOnResultSettleEvent time */
        time?: (rankland_live_contest_common.ITimeDuration|null);
    }

    /** Represents a SolutionOnResultSettleEvent. */
    class SolutionOnResultSettleEvent implements ISolutionOnResultSettleEvent {

        /**
         * Constructs a new SolutionOnResultSettleEvent.
         * @param [properties] Properties to set
         */
        constructor(properties?: rankland_live_contest_common.ISolutionOnResultSettleEvent);

        /** SolutionOnResultSettleEvent solutionId. */
        public solutionId: number;

        /** SolutionOnResultSettleEvent result. */
        public result: rankland_live_contest_common.Result;

        /** SolutionOnResultSettleEvent time. */
        public time?: (rankland_live_contest_common.ITimeDuration|null);

        /**
         * Decodes a SolutionOnResultSettleEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SolutionOnResultSettleEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_common.SolutionOnResultSettleEvent;
    }

    /** Properties of a SolutionOnResultChangeEvent. */
    interface ISolutionOnResultChangeEvent {

        /** SolutionOnResultChangeEvent solutionId */
        solutionId?: (number|null);

        /** SolutionOnResultChangeEvent previousResult */
        previousResult?: (rankland_live_contest_common.Result|null);

        /** SolutionOnResultChangeEvent result */
        result?: (rankland_live_contest_common.Result|null);

        /** SolutionOnResultChangeEvent time */
        time?: (rankland_live_contest_common.ITimeDuration|null);
    }

    /** Represents a SolutionOnResultChangeEvent. */
    class SolutionOnResultChangeEvent implements ISolutionOnResultChangeEvent {

        /**
         * Constructs a new SolutionOnResultChangeEvent.
         * @param [properties] Properties to set
         */
        constructor(properties?: rankland_live_contest_common.ISolutionOnResultChangeEvent);

        /** SolutionOnResultChangeEvent solutionId. */
        public solutionId: number;

        /** SolutionOnResultChangeEvent previousResult. */
        public previousResult: rankland_live_contest_common.Result;

        /** SolutionOnResultChangeEvent result. */
        public result: rankland_live_contest_common.Result;

        /** SolutionOnResultChangeEvent time. */
        public time?: (rankland_live_contest_common.ITimeDuration|null);

        /**
         * Decodes a SolutionOnResultChangeEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SolutionOnResultChangeEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_common.SolutionOnResultChangeEvent;
    }

    /** Properties of a ContestConfigPatch. */
    interface IContestConfigPatch {

        /** ContestConfigPatch name */
        name?: (string|null);

        /** ContestConfigPatch contest */
        contest?: (google.protobuf.IStruct|null);

        /** ContestConfigPatch problems */
        problems?: (google.protobuf.IListValue|null);

        /** ContestConfigPatch users */
        users?: (google.protobuf.IListValue|null);

        /** ContestConfigPatch markers */
        markers?: (google.protobuf.IListValue|null);

        /** ContestConfigPatch series */
        series?: (google.protobuf.IListValue|null);

        /** ContestConfigPatch sorter */
        sorter?: (google.protobuf.IValue|null);

        /** ContestConfigPatch contributors */
        contributors?: (google.protobuf.IValue|null);
    }

    /** Represents a ContestConfigPatch. */
    class ContestConfigPatch implements IContestConfigPatch {

        /**
         * Constructs a new ContestConfigPatch.
         * @param [properties] Properties to set
         */
        constructor(properties?: rankland_live_contest_common.IContestConfigPatch);

        /** ContestConfigPatch name. */
        public name?: (string|null);

        /** ContestConfigPatch contest. */
        public contest?: (google.protobuf.IStruct|null);

        /** ContestConfigPatch problems. */
        public problems?: (google.protobuf.IListValue|null);

        /** ContestConfigPatch users. */
        public users?: (google.protobuf.IListValue|null);

        /** ContestConfigPatch markers. */
        public markers?: (google.protobuf.IListValue|null);

        /** ContestConfigPatch series. */
        public series?: (google.protobuf.IListValue|null);

        /** ContestConfigPatch sorter. */
        public sorter?: (google.protobuf.IValue|null);

        /** ContestConfigPatch contributors. */
        public contributors?: (google.protobuf.IValue|null);

        /** ContestConfigPatch _name. */
        public _name?: "name";

        /**
         * Decodes a ContestConfigPatch message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ContestConfigPatch
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_common.ContestConfigPatch;
    }

    /** Properties of a ContestConfigChangeEvent. */
    interface IContestConfigChangeEvent {

        /** ContestConfigChangeEvent changedFields */
        changedFields?: (string[]|null);

        /** ContestConfigChangeEvent config */
        config?: (rankland_live_contest_common.IContestConfigPatch|null);

        /** ContestConfigChangeEvent time */
        time?: (rankland_live_contest_common.ITimeDuration|null);
    }

    /** Represents a ContestConfigChangeEvent. */
    class ContestConfigChangeEvent implements IContestConfigChangeEvent {

        /**
         * Constructs a new ContestConfigChangeEvent.
         * @param [properties] Properties to set
         */
        constructor(properties?: rankland_live_contest_common.IContestConfigChangeEvent);

        /** ContestConfigChangeEvent changedFields. */
        public changedFields: string[];

        /** ContestConfigChangeEvent config. */
        public config?: (rankland_live_contest_common.IContestConfigPatch|null);

        /** ContestConfigChangeEvent time. */
        public time?: (rankland_live_contest_common.ITimeDuration|null);

        /**
         * Decodes a ContestConfigChangeEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ContestConfigChangeEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_common.ContestConfigChangeEvent;
    }
}

/** Namespace google. */
export namespace google {

    /** Namespace protobuf. */
    namespace protobuf {

        /** Properties of a Struct. */
        interface IStruct {

            /** Struct fields */
            fields?: ({ [k: string]: google.protobuf.IValue }|null);
        }

        /** Represents a Struct. */
        class Struct implements IStruct {

            /**
             * Constructs a new Struct.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IStruct);

            /** Struct fields. */
            public fields: { [k: string]: google.protobuf.IValue };

            /**
             * Decodes a Struct message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Struct
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Struct;
        }

        /** Properties of a Value. */
        interface IValue {

            /** Value nullValue */
            nullValue?: (google.protobuf.NullValue|null);

            /** Value numberValue */
            numberValue?: (number|null);

            /** Value stringValue */
            stringValue?: (string|null);

            /** Value boolValue */
            boolValue?: (boolean|null);

            /** Value structValue */
            structValue?: (google.protobuf.IStruct|null);

            /** Value listValue */
            listValue?: (google.protobuf.IListValue|null);
        }

        /** Represents a Value. */
        class Value implements IValue {

            /**
             * Constructs a new Value.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IValue);

            /** Value nullValue. */
            public nullValue?: (google.protobuf.NullValue|null);

            /** Value numberValue. */
            public numberValue?: (number|null);

            /** Value stringValue. */
            public stringValue?: (string|null);

            /** Value boolValue. */
            public boolValue?: (boolean|null);

            /** Value structValue. */
            public structValue?: (google.protobuf.IStruct|null);

            /** Value listValue. */
            public listValue?: (google.protobuf.IListValue|null);

            /** Value kind. */
            public kind?: ("nullValue"|"numberValue"|"stringValue"|"boolValue"|"structValue"|"listValue");

            /**
             * Decodes a Value message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Value
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Value;
        }

        /** NullValue enum. */
        enum NullValue {
            NULL_VALUE = 0
        }

        /** Properties of a ListValue. */
        interface IListValue {

            /** ListValue values */
            values?: (google.protobuf.IValue[]|null);
        }

        /** Represents a ListValue. */
        class ListValue implements IListValue {

            /**
             * Constructs a new ListValue.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IListValue);

            /** ListValue values. */
            public values: google.protobuf.IValue[];

            /**
             * Decodes a ListValue message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ListValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ListValue;
        }
    }
}
