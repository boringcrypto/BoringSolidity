const { ADDRESS_ZERO, prepare, getApprovalDigest } = require("./utilities")
const { expect } = require("chai")
const { ecsign } = require("ethereumjs-util")

describe("BoringFactory", function () {
  before(async function () {
    await prepare(this, ["BoringFactory", "MockMasterContract"])
    this.contract = await this.BoringFactory.deploy()
    await this.contract.deployed()
    this.master = await this.MockMasterContract.deploy()
    await this.master.deployed()
  })

  it("Can create clone", async function () {
    let initData = await this.master.getInitData(1234);
    await expect(this.contract.deploy(this.master.address, initData))
      .to.emit(this.contract, "LogDeploy")
  })

  it("Reverts on masterContract address 0", async function () {
    let initData = await this.master.getInitData(1234);
    await expect(this.contract.deploy(ADDRESS_ZERO, initData))
      .to.revertedWith("BoringFactory: No masterContract")
  })
})
