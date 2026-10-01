import {describe,expect,it} from "vitest";
import {classifyReceipt} from "../src/domain/receiptDiscrepancy.js";
describe("receiving discrepancy classification",()=>{it("labels shortage, overage, damage, and exact count",()=>{expect(classifyReceipt(10,8,"GOOD")).toBe("SHORTAGE");expect(classifyReceipt(10,12,"GOOD")).toBe("OVERAGE");expect(classifyReceipt(10,10,"DAMAGED")).toBe("DAMAGED");expect(classifyReceipt(10,10,"GOOD")).toBe("NONE")});it("rejects fractional or negative units",()=>expect(()=>classifyReceipt(2,-1,"GOOD")).toThrow())});
