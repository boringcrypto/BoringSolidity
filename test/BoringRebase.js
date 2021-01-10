const { ADDRESS_ZERO, prepare } = require("./utilities")
const { expect } = require("chai")

describe("BoringRebase", function () {
  before(async function () {
    await prepare(this, ["MockBoringRebase"])
    this.contract = await this.MockBoringRebase.deploy()
    await this.contract.deployed()
  })

  it("Calculates first toShare correctly", async function () {
    expect(await this.contract.toShare(100)).to.equal(100);
  })

  it("Calculates first toAmount correctly", async function () {
    expect(await this.contract.toAmount(100)).to.equal(100);
  })

  it("Sets amount and share", async function () {
    this.contract.set(1000, 500);
  })

  it("Calculates toShare correctly", async function () {
    expect(await this.contract.toShare(100)).to.equal(50);
  })

  it("Calculates toAmount correctly", async function () {
    expect(await this.contract.toAmount(100)).to.equal(200);
  })
})
