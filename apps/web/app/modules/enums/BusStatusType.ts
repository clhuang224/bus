export enum BusStatusType {
    /** 正常 */
    NORMAL = 0,
    /** 車禍 */
    ACCIDENT = 1,
    /** 故障 */
    BREAKDOWN = 2,
    /** 塞車 */
    TRAFFIC_JAM = 3,
    /** 緊急求援 */
    EMERGENCY = 4,
    /** 加油 */
    REFUEL = 5,
    /** 不明 */
    UNKNOWN_STATUS = 90,
    /** 去回不明 */
    UNKNOWN_DIRECTION = 91,
    /** 偏移路線 */
    DEVIATED_ROUTE = 98,
    /** 非營運狀態 */
    NOT_IN_SERVICE = 99,
    /** 客滿 */
    FULL = 100,
    /** 包車出租 */
    CHARTERED = 101,
    /** 未知 */
    UNKNOWN = 255
}
