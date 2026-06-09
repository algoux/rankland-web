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
         * Creates a new ClientEvent instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ClientEvent instance
         */
        public static create(properties?: rankland_live_contest_client.IClientEvent): rankland_live_contest_client.ClientEvent;

        /**
         * Encodes the specified ClientEvent message. Does not implicitly {@link rankland_live_contest_client.ClientEvent.verify|verify} messages.
         * @param message ClientEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: rankland_live_contest_client.IClientEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ClientEvent message, length delimited. Does not implicitly {@link rankland_live_contest_client.ClientEvent.verify|verify} messages.
         * @param message ClientEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: rankland_live_contest_client.IClientEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ClientEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ClientEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_client.ClientEvent;

        /**
         * Decodes a ClientEvent message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ClientEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): rankland_live_contest_client.ClientEvent;

        /**
         * Verifies a ClientEvent message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ClientEvent message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ClientEvent
         */
        public static fromObject(object: { [k: string]: any }): rankland_live_contest_client.ClientEvent;

        /**
         * Creates a plain object from a ClientEvent message. Also converts values to other types if specified.
         * @param message ClientEvent
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: rankland_live_contest_client.ClientEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ClientEvent to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
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
         * Creates a new BatchClientEvent instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BatchClientEvent instance
         */
        public static create(properties?: rankland_live_contest_client.IBatchClientEvent): rankland_live_contest_client.BatchClientEvent;

        /**
         * Encodes the specified BatchClientEvent message. Does not implicitly {@link rankland_live_contest_client.BatchClientEvent.verify|verify} messages.
         * @param message BatchClientEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: rankland_live_contest_client.IBatchClientEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BatchClientEvent message, length delimited. Does not implicitly {@link rankland_live_contest_client.BatchClientEvent.verify|verify} messages.
         * @param message BatchClientEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: rankland_live_contest_client.IBatchClientEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BatchClientEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BatchClientEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_client.BatchClientEvent;

        /**
         * Decodes a BatchClientEvent message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BatchClientEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): rankland_live_contest_client.BatchClientEvent;

        /**
         * Verifies a BatchClientEvent message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BatchClientEvent message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BatchClientEvent
         */
        public static fromObject(object: { [k: string]: any }): rankland_live_contest_client.BatchClientEvent;

        /**
         * Creates a plain object from a BatchClientEvent message. Also converts values to other types if specified.
         * @param message BatchClientEvent
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: rankland_live_contest_client.BatchClientEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BatchClientEvent to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
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
         * Creates a new GetContestEventsResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetContestEventsResponse instance
         */
        public static create(properties?: rankland_live_contest_client.IGetContestEventsResponse): rankland_live_contest_client.GetContestEventsResponse;

        /**
         * Encodes the specified GetContestEventsResponse message. Does not implicitly {@link rankland_live_contest_client.GetContestEventsResponse.verify|verify} messages.
         * @param message GetContestEventsResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: rankland_live_contest_client.IGetContestEventsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetContestEventsResponse message, length delimited. Does not implicitly {@link rankland_live_contest_client.GetContestEventsResponse.verify|verify} messages.
         * @param message GetContestEventsResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: rankland_live_contest_client.IGetContestEventsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetContestEventsResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetContestEventsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_client.GetContestEventsResponse;

        /**
         * Decodes a GetContestEventsResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetContestEventsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): rankland_live_contest_client.GetContestEventsResponse;

        /**
         * Verifies a GetContestEventsResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetContestEventsResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetContestEventsResponse
         */
        public static fromObject(object: { [k: string]: any }): rankland_live_contest_client.GetContestEventsResponse;

        /**
         * Creates a plain object from a GetContestEventsResponse message. Also converts values to other types if specified.
         * @param message GetContestEventsResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: rankland_live_contest_client.GetContestEventsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetContestEventsResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
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
         * Creates a new TimeDuration instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TimeDuration instance
         */
        public static create(properties?: rankland_live_contest_common.ITimeDuration): rankland_live_contest_common.TimeDuration;

        /**
         * Encodes the specified TimeDuration message. Does not implicitly {@link rankland_live_contest_common.TimeDuration.verify|verify} messages.
         * @param message TimeDuration message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: rankland_live_contest_common.ITimeDuration, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TimeDuration message, length delimited. Does not implicitly {@link rankland_live_contest_common.TimeDuration.verify|verify} messages.
         * @param message TimeDuration message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: rankland_live_contest_common.ITimeDuration, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TimeDuration message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TimeDuration
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_common.TimeDuration;

        /**
         * Decodes a TimeDuration message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TimeDuration
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): rankland_live_contest_common.TimeDuration;

        /**
         * Verifies a TimeDuration message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TimeDuration message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TimeDuration
         */
        public static fromObject(object: { [k: string]: any }): rankland_live_contest_common.TimeDuration;

        /**
         * Creates a plain object from a TimeDuration message. Also converts values to other types if specified.
         * @param message TimeDuration
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: rankland_live_contest_common.TimeDuration, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TimeDuration to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
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
         * Creates a new NewSolutionEvent instance using the specified properties.
         * @param [properties] Properties to set
         * @returns NewSolutionEvent instance
         */
        public static create(properties?: rankland_live_contest_common.INewSolutionEvent): rankland_live_contest_common.NewSolutionEvent;

        /**
         * Encodes the specified NewSolutionEvent message. Does not implicitly {@link rankland_live_contest_common.NewSolutionEvent.verify|verify} messages.
         * @param message NewSolutionEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: rankland_live_contest_common.INewSolutionEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified NewSolutionEvent message, length delimited. Does not implicitly {@link rankland_live_contest_common.NewSolutionEvent.verify|verify} messages.
         * @param message NewSolutionEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: rankland_live_contest_common.INewSolutionEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a NewSolutionEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns NewSolutionEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_common.NewSolutionEvent;

        /**
         * Decodes a NewSolutionEvent message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns NewSolutionEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): rankland_live_contest_common.NewSolutionEvent;

        /**
         * Verifies a NewSolutionEvent message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a NewSolutionEvent message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns NewSolutionEvent
         */
        public static fromObject(object: { [k: string]: any }): rankland_live_contest_common.NewSolutionEvent;

        /**
         * Creates a plain object from a NewSolutionEvent message. Also converts values to other types if specified.
         * @param message NewSolutionEvent
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: rankland_live_contest_common.NewSolutionEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this NewSolutionEvent to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
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
         * Creates a new SolutionOnProgressEvent instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SolutionOnProgressEvent instance
         */
        public static create(properties?: rankland_live_contest_common.ISolutionOnProgressEvent): rankland_live_contest_common.SolutionOnProgressEvent;

        /**
         * Encodes the specified SolutionOnProgressEvent message. Does not implicitly {@link rankland_live_contest_common.SolutionOnProgressEvent.verify|verify} messages.
         * @param message SolutionOnProgressEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: rankland_live_contest_common.ISolutionOnProgressEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SolutionOnProgressEvent message, length delimited. Does not implicitly {@link rankland_live_contest_common.SolutionOnProgressEvent.verify|verify} messages.
         * @param message SolutionOnProgressEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: rankland_live_contest_common.ISolutionOnProgressEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SolutionOnProgressEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SolutionOnProgressEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_common.SolutionOnProgressEvent;

        /**
         * Decodes a SolutionOnProgressEvent message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SolutionOnProgressEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): rankland_live_contest_common.SolutionOnProgressEvent;

        /**
         * Verifies a SolutionOnProgressEvent message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SolutionOnProgressEvent message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SolutionOnProgressEvent
         */
        public static fromObject(object: { [k: string]: any }): rankland_live_contest_common.SolutionOnProgressEvent;

        /**
         * Creates a plain object from a SolutionOnProgressEvent message. Also converts values to other types if specified.
         * @param message SolutionOnProgressEvent
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: rankland_live_contest_common.SolutionOnProgressEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SolutionOnProgressEvent to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
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
         * Creates a new SolutionOnResultSettleEvent instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SolutionOnResultSettleEvent instance
         */
        public static create(properties?: rankland_live_contest_common.ISolutionOnResultSettleEvent): rankland_live_contest_common.SolutionOnResultSettleEvent;

        /**
         * Encodes the specified SolutionOnResultSettleEvent message. Does not implicitly {@link rankland_live_contest_common.SolutionOnResultSettleEvent.verify|verify} messages.
         * @param message SolutionOnResultSettleEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: rankland_live_contest_common.ISolutionOnResultSettleEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SolutionOnResultSettleEvent message, length delimited. Does not implicitly {@link rankland_live_contest_common.SolutionOnResultSettleEvent.verify|verify} messages.
         * @param message SolutionOnResultSettleEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: rankland_live_contest_common.ISolutionOnResultSettleEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SolutionOnResultSettleEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SolutionOnResultSettleEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_common.SolutionOnResultSettleEvent;

        /**
         * Decodes a SolutionOnResultSettleEvent message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SolutionOnResultSettleEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): rankland_live_contest_common.SolutionOnResultSettleEvent;

        /**
         * Verifies a SolutionOnResultSettleEvent message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SolutionOnResultSettleEvent message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SolutionOnResultSettleEvent
         */
        public static fromObject(object: { [k: string]: any }): rankland_live_contest_common.SolutionOnResultSettleEvent;

        /**
         * Creates a plain object from a SolutionOnResultSettleEvent message. Also converts values to other types if specified.
         * @param message SolutionOnResultSettleEvent
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: rankland_live_contest_common.SolutionOnResultSettleEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SolutionOnResultSettleEvent to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
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
         * Creates a new SolutionOnResultChangeEvent instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SolutionOnResultChangeEvent instance
         */
        public static create(properties?: rankland_live_contest_common.ISolutionOnResultChangeEvent): rankland_live_contest_common.SolutionOnResultChangeEvent;

        /**
         * Encodes the specified SolutionOnResultChangeEvent message. Does not implicitly {@link rankland_live_contest_common.SolutionOnResultChangeEvent.verify|verify} messages.
         * @param message SolutionOnResultChangeEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: rankland_live_contest_common.ISolutionOnResultChangeEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SolutionOnResultChangeEvent message, length delimited. Does not implicitly {@link rankland_live_contest_common.SolutionOnResultChangeEvent.verify|verify} messages.
         * @param message SolutionOnResultChangeEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: rankland_live_contest_common.ISolutionOnResultChangeEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SolutionOnResultChangeEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SolutionOnResultChangeEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_common.SolutionOnResultChangeEvent;

        /**
         * Decodes a SolutionOnResultChangeEvent message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SolutionOnResultChangeEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): rankland_live_contest_common.SolutionOnResultChangeEvent;

        /**
         * Verifies a SolutionOnResultChangeEvent message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SolutionOnResultChangeEvent message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SolutionOnResultChangeEvent
         */
        public static fromObject(object: { [k: string]: any }): rankland_live_contest_common.SolutionOnResultChangeEvent;

        /**
         * Creates a plain object from a SolutionOnResultChangeEvent message. Also converts values to other types if specified.
         * @param message SolutionOnResultChangeEvent
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: rankland_live_contest_common.SolutionOnResultChangeEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SolutionOnResultChangeEvent to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
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
         * Creates a new ContestConfigPatch instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ContestConfigPatch instance
         */
        public static create(properties?: rankland_live_contest_common.IContestConfigPatch): rankland_live_contest_common.ContestConfigPatch;

        /**
         * Encodes the specified ContestConfigPatch message. Does not implicitly {@link rankland_live_contest_common.ContestConfigPatch.verify|verify} messages.
         * @param message ContestConfigPatch message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: rankland_live_contest_common.IContestConfigPatch, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ContestConfigPatch message, length delimited. Does not implicitly {@link rankland_live_contest_common.ContestConfigPatch.verify|verify} messages.
         * @param message ContestConfigPatch message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: rankland_live_contest_common.IContestConfigPatch, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ContestConfigPatch message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ContestConfigPatch
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_common.ContestConfigPatch;

        /**
         * Decodes a ContestConfigPatch message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ContestConfigPatch
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): rankland_live_contest_common.ContestConfigPatch;

        /**
         * Verifies a ContestConfigPatch message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ContestConfigPatch message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ContestConfigPatch
         */
        public static fromObject(object: { [k: string]: any }): rankland_live_contest_common.ContestConfigPatch;

        /**
         * Creates a plain object from a ContestConfigPatch message. Also converts values to other types if specified.
         * @param message ContestConfigPatch
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: rankland_live_contest_common.ContestConfigPatch, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ContestConfigPatch to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
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
         * Creates a new ContestConfigChangeEvent instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ContestConfigChangeEvent instance
         */
        public static create(properties?: rankland_live_contest_common.IContestConfigChangeEvent): rankland_live_contest_common.ContestConfigChangeEvent;

        /**
         * Encodes the specified ContestConfigChangeEvent message. Does not implicitly {@link rankland_live_contest_common.ContestConfigChangeEvent.verify|verify} messages.
         * @param message ContestConfigChangeEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: rankland_live_contest_common.IContestConfigChangeEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ContestConfigChangeEvent message, length delimited. Does not implicitly {@link rankland_live_contest_common.ContestConfigChangeEvent.verify|verify} messages.
         * @param message ContestConfigChangeEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: rankland_live_contest_common.IContestConfigChangeEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ContestConfigChangeEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ContestConfigChangeEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_common.ContestConfigChangeEvent;

        /**
         * Decodes a ContestConfigChangeEvent message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ContestConfigChangeEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): rankland_live_contest_common.ContestConfigChangeEvent;

        /**
         * Verifies a ContestConfigChangeEvent message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ContestConfigChangeEvent message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ContestConfigChangeEvent
         */
        public static fromObject(object: { [k: string]: any }): rankland_live_contest_common.ContestConfigChangeEvent;

        /**
         * Creates a plain object from a ContestConfigChangeEvent message. Also converts values to other types if specified.
         * @param message ContestConfigChangeEvent
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: rankland_live_contest_common.ContestConfigChangeEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ContestConfigChangeEvent to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
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
             * Creates a new Struct instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Struct instance
             */
            public static create(properties?: google.protobuf.IStruct): google.protobuf.Struct;

            /**
             * Encodes the specified Struct message. Does not implicitly {@link google.protobuf.Struct.verify|verify} messages.
             * @param message Struct message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IStruct, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Struct message, length delimited. Does not implicitly {@link google.protobuf.Struct.verify|verify} messages.
             * @param message Struct message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IStruct, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Struct message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Struct
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Struct;

            /**
             * Decodes a Struct message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Struct
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Struct;

            /**
             * Verifies a Struct message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Struct message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Struct
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Struct;

            /**
             * Creates a plain object from a Struct message. Also converts values to other types if specified.
             * @param message Struct
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Struct, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Struct to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
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
             * Creates a new Value instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Value instance
             */
            public static create(properties?: google.protobuf.IValue): google.protobuf.Value;

            /**
             * Encodes the specified Value message. Does not implicitly {@link google.protobuf.Value.verify|verify} messages.
             * @param message Value message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Value message, length delimited. Does not implicitly {@link google.protobuf.Value.verify|verify} messages.
             * @param message Value message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Value message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Value
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Value;

            /**
             * Decodes a Value message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Value
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Value;

            /**
             * Verifies a Value message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Value message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Value
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Value;

            /**
             * Creates a plain object from a Value message. Also converts values to other types if specified.
             * @param message Value
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Value, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Value to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
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
             * Creates a new ListValue instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ListValue instance
             */
            public static create(properties?: google.protobuf.IListValue): google.protobuf.ListValue;

            /**
             * Encodes the specified ListValue message. Does not implicitly {@link google.protobuf.ListValue.verify|verify} messages.
             * @param message ListValue message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IListValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ListValue message, length delimited. Does not implicitly {@link google.protobuf.ListValue.verify|verify} messages.
             * @param message ListValue message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IListValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ListValue message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ListValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ListValue;

            /**
             * Decodes a ListValue message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ListValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ListValue;

            /**
             * Verifies a ListValue message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ListValue message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ListValue
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.ListValue;

            /**
             * Creates a plain object from a ListValue message. Also converts values to other types if specified.
             * @param message ListValue
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.ListValue, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ListValue to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }
}

/** Namespace rankland_live_contest_producer. */
export namespace rankland_live_contest_producer {

    /** Properties of a ProducerEvent. */
    interface IProducerEvent {

        /** ProducerEvent eventId */
        eventId?: (number|null);

        /** ProducerEvent type */
        type?: (rankland_live_contest_common.EventType|null);

        /** ProducerEvent newSolutionData */
        newSolutionData?: (rankland_live_contest_common.INewSolutionEvent|null);

        /** ProducerEvent solutionOnProgressData */
        solutionOnProgressData?: (rankland_live_contest_common.ISolutionOnProgressEvent|null);

        /** ProducerEvent solutionOnResultSettleData */
        solutionOnResultSettleData?: (rankland_live_contest_common.ISolutionOnResultSettleEvent|null);

        /** ProducerEvent solutionOnResultChangeData */
        solutionOnResultChangeData?: (rankland_live_contest_common.ISolutionOnResultChangeEvent|null);

        /** ProducerEvent contestConfigChangeData */
        contestConfigChangeData?: (rankland_live_contest_common.IContestConfigChangeEvent|null);
    }

    /** Represents a ProducerEvent. */
    class ProducerEvent implements IProducerEvent {

        /**
         * Constructs a new ProducerEvent.
         * @param [properties] Properties to set
         */
        constructor(properties?: rankland_live_contest_producer.IProducerEvent);

        /** ProducerEvent eventId. */
        public eventId: number;

        /** ProducerEvent type. */
        public type: rankland_live_contest_common.EventType;

        /** ProducerEvent newSolutionData. */
        public newSolutionData?: (rankland_live_contest_common.INewSolutionEvent|null);

        /** ProducerEvent solutionOnProgressData. */
        public solutionOnProgressData?: (rankland_live_contest_common.ISolutionOnProgressEvent|null);

        /** ProducerEvent solutionOnResultSettleData. */
        public solutionOnResultSettleData?: (rankland_live_contest_common.ISolutionOnResultSettleEvent|null);

        /** ProducerEvent solutionOnResultChangeData. */
        public solutionOnResultChangeData?: (rankland_live_contest_common.ISolutionOnResultChangeEvent|null);

        /** ProducerEvent contestConfigChangeData. */
        public contestConfigChangeData?: (rankland_live_contest_common.IContestConfigChangeEvent|null);

        /** ProducerEvent data. */
        public data?: ("newSolutionData"|"solutionOnProgressData"|"solutionOnResultSettleData"|"solutionOnResultChangeData"|"contestConfigChangeData");

        /**
         * Creates a new ProducerEvent instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ProducerEvent instance
         */
        public static create(properties?: rankland_live_contest_producer.IProducerEvent): rankland_live_contest_producer.ProducerEvent;

        /**
         * Encodes the specified ProducerEvent message. Does not implicitly {@link rankland_live_contest_producer.ProducerEvent.verify|verify} messages.
         * @param message ProducerEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: rankland_live_contest_producer.IProducerEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ProducerEvent message, length delimited. Does not implicitly {@link rankland_live_contest_producer.ProducerEvent.verify|verify} messages.
         * @param message ProducerEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: rankland_live_contest_producer.IProducerEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ProducerEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ProducerEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_producer.ProducerEvent;

        /**
         * Decodes a ProducerEvent message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ProducerEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): rankland_live_contest_producer.ProducerEvent;

        /**
         * Verifies a ProducerEvent message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ProducerEvent message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ProducerEvent
         */
        public static fromObject(object: { [k: string]: any }): rankland_live_contest_producer.ProducerEvent;

        /**
         * Creates a plain object from a ProducerEvent message. Also converts values to other types if specified.
         * @param message ProducerEvent
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: rankland_live_contest_producer.ProducerEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ProducerEvent to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a BatchProducerEvent. */
    interface IBatchProducerEvent {

        /** BatchProducerEvent events */
        events?: (rankland_live_contest_producer.IProducerEvent[]|null);

        /** BatchProducerEvent streamRevision */
        streamRevision?: (number|null);
    }

    /** Represents a BatchProducerEvent. */
    class BatchProducerEvent implements IBatchProducerEvent {

        /**
         * Constructs a new BatchProducerEvent.
         * @param [properties] Properties to set
         */
        constructor(properties?: rankland_live_contest_producer.IBatchProducerEvent);

        /** BatchProducerEvent events. */
        public events: rankland_live_contest_producer.IProducerEvent[];

        /** BatchProducerEvent streamRevision. */
        public streamRevision: number;

        /**
         * Creates a new BatchProducerEvent instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BatchProducerEvent instance
         */
        public static create(properties?: rankland_live_contest_producer.IBatchProducerEvent): rankland_live_contest_producer.BatchProducerEvent;

        /**
         * Encodes the specified BatchProducerEvent message. Does not implicitly {@link rankland_live_contest_producer.BatchProducerEvent.verify|verify} messages.
         * @param message BatchProducerEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: rankland_live_contest_producer.IBatchProducerEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BatchProducerEvent message, length delimited. Does not implicitly {@link rankland_live_contest_producer.BatchProducerEvent.verify|verify} messages.
         * @param message BatchProducerEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: rankland_live_contest_producer.IBatchProducerEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BatchProducerEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BatchProducerEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rankland_live_contest_producer.BatchProducerEvent;

        /**
         * Decodes a BatchProducerEvent message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BatchProducerEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): rankland_live_contest_producer.BatchProducerEvent;

        /**
         * Verifies a BatchProducerEvent message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BatchProducerEvent message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BatchProducerEvent
         */
        public static fromObject(object: { [k: string]: any }): rankland_live_contest_producer.BatchProducerEvent;

        /**
         * Creates a plain object from a BatchProducerEvent message. Also converts values to other types if specified.
         * @param message BatchProducerEvent
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: rankland_live_contest_producer.BatchProducerEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BatchProducerEvent to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }
}
