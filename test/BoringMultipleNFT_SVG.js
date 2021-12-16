const { ADDRESS_ZERO, prepare, getApprovalDigest } = require("./utilities")
const { expect } = require("chai")
const { ecsign } = require("ethereumjs-util")

describe("BoringMultipleNFT", function () {
    before(async function () {
        await prepare(this, ["MockMultipleNFT_SVG"])
        this.contract = await this.MockMultipleNFT_SVG.deploy()
        await this.contract.deployed()
    })

    it("TotalSupply is 0", async function () {
        expect(await this.contract.totalSupply()).to.equal(0)
    })

    it("Mint token", async function () {
        await this.contract.mint(7)
        console.log(await this.contract.tokenURI(0))
    })

})
