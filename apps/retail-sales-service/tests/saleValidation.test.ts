import { describe, expect, it } from "vitest";
import { validateSaleAmounts } from "../src/domain/saleValidation.js";
describe("sale validation",()=>{
 it("calculates valid whole-unit totals",()=>expect(validateSaleAmounts([{productId:"p",locationId:"l",quantity:2,unitPrice:125}],[{method:"CASH",amount:250}])).toBe(250));
 it("rejects fractional quantities, prices, tenders, duplicates and mismatches",()=>{
  expect(()=>validateSaleAmounts([{productId:"p",locationId:"l",quantity:1.5,unitPrice:2}],[{method:"CASH",amount:3}])).toThrow();
  expect(()=>validateSaleAmounts([{productId:"p",locationId:"l",quantity:1,unitPrice:2.5}],[{method:"CASH",amount:2.5}])).toThrow();
  expect(()=>validateSaleAmounts([{productId:"p",locationId:"l",quantity:1,unitPrice:2}],[{method:"CASH",amount:1}])).toThrow();
  expect(()=>validateSaleAmounts([{productId:"p",locationId:"l",quantity:1,unitPrice:2}],[{method:"CRYPTO",amount:2}])).toThrow();
 });
});
