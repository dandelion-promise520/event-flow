import test from "node:test";
import assert from "node:assert";
// @ts-ignore
import { isTicketWithinDateRange } from "../lib/utils";

test("isTicketWithinDateRange 过滤逻辑测试", () => {
  const ticketTime = "2026-06-16T10:00:00.000Z";

  // 1. 无筛选范围，应通过
  assert.strictEqual(isTicketWithinDateRange(ticketTime, undefined), true);

  // 2. 只有开始日期 (from) 且门票时间在其之后，应通过
  assert.strictEqual(
    isTicketWithinDateRange(ticketTime, {
      from: new Date("2026-06-16T00:00:00.000Z"),
    }),
    true
  );

  // 3. 只有开始日期 (from) 且门票时间在其之前，应不通过
  assert.strictEqual(
    isTicketWithinDateRange(ticketTime, {
      from: new Date("2026-06-17T00:00:00.000Z"),
    }),
    false
  );

  // 4. 起始和结束日期都在范围内 (from & to)，应通过
  assert.strictEqual(
    isTicketWithinDateRange(ticketTime, {
      from: new Date("2026-06-15T00:00:00.000Z"),
      to: new Date("2026-06-17T00:00:00.000Z"),
    }),
    true
  );

  // 5. 门票时间正好在结束日期 (to) 当天的深夜，也应通过 (需要覆盖 23:59:59.999)
  assert.strictEqual(
    isTicketWithinDateRange("2026-06-16T23:59:00.000Z", {
      from: new Date("2026-06-16T00:00:00.000Z"),
      to: new Date("2026-06-16T00:00:00.000Z"), // 同一天
    }),
    true
  );

  // 6. 门票时间在结束日期 (to) 之后，应不通过
  assert.strictEqual(
    isTicketWithinDateRange(ticketTime, {
      from: new Date("2026-06-14T00:00:00.000Z"),
      to: new Date("2026-06-15T23:59:59.000Z"),
    }),
    false
  );
});
