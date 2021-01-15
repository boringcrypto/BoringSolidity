const { ADDRESS_ZERO, prepare } = require("./utilities")
const { expect } = require("chai")

describe("BoringRebase", function () {
  before(async function () {
    await prepare(this, ["MockBoringRebase"])
    this.contract = await this.MockBoringRebase.deploy()
    await this.contract.deployed()
  })

  it("Calculates first toShare correctly", async function () {
    expect(await this.contract.toBase(100)).to.equal(100);
  })

  it("Calculates first toElastic correctly", async function () {
    expect(await this.contract.toElastic(100)).to.equal(100);
  })

  it("Sets elastic and base", async function () {
    this.contract.set(1000, 500);
  })

  it("Calculates toShare correctly", async function () {
    expect(await this.contract.toBase(100)).to.equal(50);
  })

  it("Calculates toElastic correctly", async function () {
    expect(await this.contract.toElastic(100)).to.equal(200);
  })

  it("Adds elastic correctly", async function () {
    await this.contract.add(100);
    const total = await this.contract.total();
    expect(total.elastic).to.equal(1100);
    expect(total.base).to.equal(550);
  })

  it("Removes base correctly", async function () {
    await this.contract.sub(50);
    const total = await this.contract.total();
    expect(total.elastic).to.equal(1000);
    expect(total.base).to.equal(500);
  })

  it("Removes base correctly when empty", async function () {
    this.contract = await this.MockBoringRebase.deploy()
    await this.contract.deployed()

    await this.contract.sub(0);
    const total = await this.contract.total();
    expect(total.elastic).to.equal(0);
    expect(total.base).to.equal(0);
  })

  it("Adds elastic correctly when empty", async function () {
    await this.contract.add(100);
    const total = await this.contract.total();
    expect(total.elastic).to.equal(100);
    expect(total.base).to.equal(100);
  })

  it("Adds just elastic correctly when empty", async function () {
    await this.contract.addElastic(50);
    const total = await this.contract.total();
    expect(total.elastic).to.equal(150);
    expect(total.base).to.equal(100);
  })
})
