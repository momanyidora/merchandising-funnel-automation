import { describe,expect,it } from "vitest";
import { reconcile } from "../src/domain/reconciliation.js";
describe("register reconciliation",()=>{
 it("calculates tender totals and signed variance",()=>expect(reconcile(new Map([["CASH",500],["CARD",200],["GIFT_CARD",0]]),[{method:"CASH",actual:450},{method:"CARD",actual:200},{method:"GIFT_CARD",actual:0}])).toEqual({expectedTotal:700,actualTotal:650,variance:-50}));
 it("requires all tender types and whole non-negative counts",()=>{expect(()=>reconcile(new Map(),[{method:"CASH",actual:1}])).toThrow();expect(()=>reconcile(new Map(),[{method:"CASH",actual:1.5},{method:"CARD",actual:0},{method:"GIFT_CARD",actual:0}])).toThrow()});
});
