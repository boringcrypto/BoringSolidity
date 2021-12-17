const { expect, assert } = require("chai")
const { ADDRESS_ZERO, getApprovalDigest, getDomainSeparator, prepare } = require("./utilities")
const { ecsign } = require("ethereumjs-util")

describe("BoringMultipleNFT", async function () {
    before(async function () {
        await prepare(this, ["MockBoringMultipleNFT"])
        this.contract = await this.MockBoringMultipleNFT.deploy()
        await this.contract.deployed()
    })

    describe("deployment basic requirements", async function () {
        // test basic requirements of contract deployment. // Might have missed few others.
        it("should not be null, empty, undefined, address 0", async function () {
            const contractAddress = await this.contract.address
            assert.notEqual(contractAddress, "")
            assert.notEqual(contractAddress, "0x0000000000000000000000000000000000000000")
            assert.notEqual(contractAddress, null)
            assert.notEqual(contractAddress, undefined)
        })
    })

    describe("supports interface", async function () {
        // supports interface  // Might need to support other interface.
        it("should support the interface 0x80ac58cd", async function () {
            const interface = await this.contract.supportsInterface(0x80ac58cd) // does it need to support other interfaces ?
            assert.equal(interface, true)
        })
    })

    describe("mint function", async function () {
        // testing mint function
        it("should mint the transaction and send amount to the contract minting nfts", async function () {
            await expect(this.contract.mint(this.alice.address))
                .to.emit(this.contract, "Transfer")
                .withArgs("0x0000000000000000000000000000000000000000", this.alice.address, 0)
            await expect(this.contract.mint(this.bob.address))
                .to.emit(this.contract, "Transfer")
                .withArgs("0x0000000000000000000000000000000000000000", this.bob.address, 1)

            const supply = await this.contract.totalSupply()
            assert.equal(Number(supply), 2)
        })

        // test totalSupply()
        it("should keep track of the total supply", async function () {
            const totalSupply = await this.contract.totalSupply()
            assert.equal(Number(totalSupply), 2)
        })

        // test mint again and supply keep track
        it("should add to the totalSupply if someone else mint the nft", async function () {
            const secondMintedNFT = await this.contract.mint(this.alice.address)
            assert.equal(secondMintedNFT.from, this.alice.address)
            assert.equal(secondMintedNFT.to, this.contract.address)
            const supply = await this.contract.totalSupply()
            assert.equal(Number(supply), 3)
        })
    })

    describe("balanceOf function", async function () {
        // test balanceOf and thus tokensOf
        it("should count all NFTs assigned to an owner", async function () {
            const balanceOfAlice = await this.contract.balanceOf(this.alice.address)
            const thirdMintedNft = await this.contract.mint(this.bob.address)
            const balanceOfBob = await this.contract.balanceOf(this.bob.address)
            const supply = await this.contract.totalSupply()

            assert.equal(Number(balanceOfAlice), 2)
            assert.equal(Number(balanceOfBob), 1)
            assert.equal(Number(supply), 3)
        })
    })

    describe("ownerOf function", async function () {
        // test ownerOf and thus _tokens
        it("should find the owner of an NFT", async function () {
            const ownerOfFirstToken = await this.contract.ownerOf(0)
            const ownerOfSecondToken = await this.contract.ownerOf(1)
            const ownerOfThirdToken = await this.contract.ownerOf(2)
            const ownerOfFourthToken = await this.contract.ownerOf(4)
            assert.equal(ownerOfFirstToken, this.alice.address)
            assert.equal(ownerOfSecondToken, this.alice.address)
            assert.equal(ownerOfThirdToken, this.bob.address)

            // should it return the address 0 when there is no owner ?
            assert.equal(ownerOfFourthToken, 0x0000000000000000000000000000000000000000)
        })
    })

    describe("tokenByIndex function", async function () {
        // test tokenByIndex
        it("should return the index of the token", async function () {
            let max = 100000
            let randomNumber = Math.floor(Math.random() * max)
            const tokenOne = await this.contract.tokenByIndex(0)
            const tokenTwo = await this.contract.tokenByIndex(1)
            const tokenThree = await this.contract.tokenByIndex(2)
            const tokenRandomNumber = await this.contract.tokenByIndex(randomNumber)

            assert.equal(Number(tokenOne), 0)
            assert.equal(Number(tokenTwo), 1)
            assert.equal(Number(tokenThree), 2)
            assert.equal(Number(tokenRandomNumber), tokenRandomNumber)
        })
    })

    describe("tokenOfOwnerByIndex function", async function () {
        //test tokenOfOwnerByIndex thus tokensOf
        it("should return the token id by owner by index", async function () {
            const indexOneOfNFTOwnedByAlice = await this.contract.tokenOfOwnerByIndex(this.alice.address, 0)
            const indexTwoOfNFTOwnedByAlice = await this.contract.tokenOfOwnerByIndex(this.alice.address, 1)
            const indexTwoOfNFTOwnedByBob = await this.contract.tokenOfOwnerByIndex(this.bob.address, 0)

            assert.equal(indexOneOfNFTOwnedByAlice, 0)
            assert.equal(indexTwoOfNFTOwnedByAlice, 1)
            assert.equal(indexTwoOfNFTOwnedByBob, 2)

            // returns error when it is not minted and when the address 0x0000000000000000000000000000000000000000
        })
    })

    describe("transferFrom function", async function () {
        // test transferFrom
        it("should transfer an nft from the owner to the receiver", async function () {
            const sendFromAliceToBob = await this.contract.transferFrom(this.alice.address, this.bob.address, 0)
            const supply = await this.contract.totalSupply()

            assert.equal(Number(sendFromAliceToBob.value), 0)
            assert.equal(Number(sendFromAliceToBob.value), 0)
            assert.equal(Number(supply), 3)

            const balanceOfBob = await this.contract.balanceOf(this.bob.address)
            const balanceOfAlice = await this.contract.balanceOf(this.alice.address)

            assert.equal(Number(balanceOfBob), 2)
            assert.equal(Number(balanceOfAlice), 1)

            const ownerOfFirstToken = await this.contract.ownerOf(0)

            assert.equal(ownerOfFirstToken, this.bob.address)
        })
    })

    describe("tokenURI function", async function () {
        // test tokenURI
        it("should return a distinct Uniform Resource Identifier (URI) for a given asset in our case nothing since it is supposed to be implemented by the user of the contract", async function () {
            const token0URI = await this.contract.tokenURI(0)
            const token1URI = await this.contract.tokenURI(1)
            assert.equal(token0URI, "")
            assert.equal(token1URI, "")
        })
    })

    describe("approve function", async function () {
        // test approve thus getApproved
        it("should Change or reaffirm the approved address for an NFT", async function () {
            // is it normal ?
            const test = await this.contract.getApproved(1)
            assert.equal(test, 0x0000000000000000000000000000000000000000)

            const approve1 = await this.contract.approve(this.bob.address, 1)
            const approvedAddressToken1 = await this.contract.getApproved(1)

            // const approve2 = await this.contract.approve(this.alice.address, 2)
            // const approvedAddressToken2 = await this.contract.getApproved(2)

            // should throw an error if the owner of the token try to approve his/her own address.
            // const approveAliceAddress = await this.contract.approve(this.alice.address, 0)

            assert.equal(approvedAddressToken1, this.bob.address)
            // assert.equal(approvedAddressToken2, this.alice.address)
        })
    })

    describe("isApprovedForAll function", async function () {
        //test isApprovedForAll
        it("should query if an address is an authorized operator for another address", async function () {
            const isBobApprovedToManageAliceAssets = await this.contract.isApprovedForAll(this.alice.address, this.bob.address)
            const iscontractAddressApprovedToManageAliceAssets = await this.contract.isApprovedForAll(this.alice.address, this.contract.address)

            assert.equal(isBobApprovedToManageAliceAssets, false)
            assert.equal(iscontractAddressApprovedToManageAliceAssets, false)
        })
    })

    describe("setApprovalForAll function", async function () {
        //test setApprovalForAll
        it('should enable or disable approval for a third party ("operator") to manage all of msg.sender assets', async function () {
            const contractAddressApprovedToManageAliceAssets = await this.contract.setApprovalForAll(this.alice.address, true)
            assert.equal(contractAddressApprovedToManageAliceAssets.to, this.contract.address)

            //in this case msg.sender is 0x5FbDB2315678afecb367f032d93F642f64180aa3 aka this.contract.address.
            const iscontractAddressApprovedToManageAliceAssets = await this.contract.isApprovedForAll(this.alice.address, this.contract.address)
            // console.log(iscontractAddressApprovedToManageAliceAssets)
            assert.equal(iscontractAddressApprovedToManageAliceAssets, true)
        })
    })

    describe("safeTransferFrom function", async function () {
        // test safeTransferFrom
        it("should  transfers the ownership of an NFT from one address to another address ", async function () {
            // should be transfer not allowed error
            try {
                let transferFromBobToAliceToken1 = await this.contract.functions["safeTransferFrom(address,address,uint256)"](
                    this.bob.address,
                    this.alice.address,
                    1
                )
            } catch (error) {
                assert(error, "Error: VM Exception while processing transaction: revert Transfer not allowed")
            }

            // // should be transfer not owner error
            try {
                let transferFromAliceToBobToken0 = await this.contract.functions["safeTransferFrom(address,address,uint256)"](
                    this.alice.address,
                    this.bob.address,
                    0
                )
            } catch (error) {
                assert(error, "Error: VM Exception while processing transaction: revert From not owner")
            }

            // should be transfer allowed
            const transferFromAliceToBobToken0 = await this.contract.functions["safeTransferFrom(address,address,uint256)"](
                this.alice.address,
                this.bob.address,
                1
            )
            assert.equal(transferFromAliceToBobToken0.from, this.alice.address)
            assert.equal(transferFromAliceToBobToken0.to, this.bob.address)
            assert.equal(Number(transferFromAliceToBobToken0.value._hex), 0)

            // how do you use chai for expect throw error
            // await expect(transferFromAliceToBob).to.throw(Error, 'VM Exception while processing transaction: revert Transfer not allowed')
        })
    })
})
