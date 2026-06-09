import assert from "node:assert/strict";
import {
  addIsoDays,
  calculateRentalDays,
  doesIsoRangeOverlapBlocked,
  getBlockedIsoDates,
  isIsoDateBlocked,
} from "../../lib/api-client-react/src/availability";

const blocks = [
  { startDate: "2026-06-12", endDate: "2026-06-14" },
  { startDate: "2026-06-20", endDate: "2026-06-20" },
];

assert.equal(addIsoDays("2026-06-30", 1), "2026-07-01");
assert.equal(calculateRentalDays("2026-06-10", "2026-06-13"), 3);
assert.equal(calculateRentalDays("2026-06-10", "2026-06-10"), 0);

assert.equal(isIsoDateBlocked("2026-06-12", blocks), true);
assert.equal(isIsoDateBlocked("2026-06-14", blocks), true);
assert.equal(isIsoDateBlocked("2026-06-15", blocks), false);

assert.equal(
  doesIsoRangeOverlapBlocked(
    { startDate: "2026-06-10", endDate: "2026-06-12" },
    blocks,
  ),
  true,
);
assert.equal(
  doesIsoRangeOverlapBlocked(
    { startDate: "2026-06-15", endDate: "2026-06-19" },
    blocks,
  ),
  false,
);

assert.deepEqual(
  [...getBlockedIsoDates(blocks)].sort(),
  ["2026-06-12", "2026-06-13", "2026-06-14", "2026-06-20"],
);

console.log("availability tests passed");
