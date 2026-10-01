import {describe,expect,it} from "vitest";
import {movementPlan} from "../src/domain/movementPlan.js";
describe("warehouse Inventory movement plan",()=>{it("creates stable idempotent debit and credit legs",()=>expect(movementPlan("task-1","p",4,"a","b")).toEqual([{locationId:"a",quantity:-4,idempotencyKey:"task-1:source"},{locationId:"b",quantity:4,idempotencyKey:"task-1:destination"}]));it("rejects same-bin and fractional transfers",()=>{expect(()=>movementPlan("t","p",1.2,"a","b")).toThrow();expect(()=>movementPlan("t","p",2,"a","a")).toThrow()})});
