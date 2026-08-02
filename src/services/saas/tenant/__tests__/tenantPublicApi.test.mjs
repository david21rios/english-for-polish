import assert from "node:assert/strict";
import { test } from "node:test";

import * as tenantApi from "../index.js";

test("exports only createTenantRepository", () => {
  assert.deepEqual(Object.keys(tenantApi), ["createTenantRepository"]);
});
