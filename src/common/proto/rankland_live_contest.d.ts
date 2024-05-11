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

    /** Properties of a ContestConfigChangeEvent. */
    interface IContestConfigChangeEvent {
    }

    /** Represents a ContestConfigChangeEvent. */
    class ContestConfigChangeEvent implements IContestConfigChangeEvent {

        /**
         * Constructs a new ContestConfigChangeEvent.
         * @param [properties] Properties to set
         */
        constructor(properties?: rankland_live_contest_common.IContestConfigChangeEvent);

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
}
