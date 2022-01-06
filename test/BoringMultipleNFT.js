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
        // supports interface for EIP-165 and EIP-721
        it("should support the interface 0x80ac58cd", async function () {
            assert.isTrue(await this.contract.supportsInterface(0x01ffc9a7))
            assert.isTrue(await this.contract.supportsInterface(0x80ac58cd))
        })
    })

    describe("mint function", async function () {
        // testing mint function and Transfer function. 
        it("should mint the NFT and transfer the NFT from 0 to the to address", async function () {
            await expect(this.contract.mint(this.alice.address))
                .to.emit(this.contract, "Transfer")
                .withArgs(ADDRESS_ZERO, this.alice.address, 0)
            await expect(this.contract.mint(this.bob.address))
                .to.emit(this.contract, "Transfer")
                .withArgs(ADDRESS_ZERO, this.bob.address, 1)
        })

        // test totalSupply()
        it("should keep track of the total supply", async function () {
            const totalSupply = await this.contract.totalSupply()
            assert.equal(Number(totalSupply), 2)
        })

        // test mint again and supply keep track
        it("should add to the totalSupply if someone else mint the nft", async function () {
            await this.contract.mint(this.alice.address)
            assert.equal(Number(await this.contract.totalSupply()), 3)
        })
    })

    describe("balanceOf function", async function () {
        // test balanceOf and thus tokensOf
        it("should count all NFTs assigned to an owner", async function () {
            assert.equal(Number(await this.contract.balanceOf(this.alice.address)), 2)
            assert.equal(Number(await this.contract.balanceOf(this.bob.address)), 1)
            await this.contract.mint(this.bob.address)
            assert.equal(Number(await this.contract.balanceOf(this.bob.address)), 2)
        })

        it("should revert for queries about the 0 address", async function () {
            // should it return the address 0 when there is no owner ?
            await expect(this.contract.balanceOf(ADDRESS_ZERO)).to.be.revertedWith("No 0 owner")
        })
    })

    describe("ownerOf function", async function () {
        // test ownerOf and thus _tokens
        it("should find the owner of an NFT", async function () {
            assert.equal(await this.contract.ownerOf(0), this.alice.address)
            assert.equal(await this.contract.ownerOf(1), this.bob.address)
            assert.equal(await this.contract.ownerOf(2), this.alice.address)
            assert.equal(await this.contract.ownerOf(3), this.bob.address)
        })

        it("should revert if the token owner is 0", async function () {
            // should it return the address 0 when there is no owner ?
            await expect(this.contract.ownerOf(5)).to.be.revertedWith("No owner")
        })
    })

    describe("tokenByIndex function", async function () {
        // test tokenByIndex
        it("should return the index of the token", async function () {
            assert.equal(Number(await this.contract.tokenByIndex(0)), 0)
            assert.equal(Number(await this.contract.tokenByIndex(1)), 1)
            assert.equal(Number(await this.contract.tokenByIndex(2)), 2)
            assert.equal(Number(await this.contract.tokenByIndex(3)), 3)
        })

        it("should revert is greater than totalSupply", async function () {
            await expect(this.contract.tokenByIndex(4)).to.be.revertedWith("Out of bounds")
        })
    })

    describe("tokenOfOwnerByIndex function", async function () {
        //test tokenOfOwnerByIndex thus tokensOf
        it("should return the token id by owner by index", async function () {
            assert.equal(await this.contract.tokenOfOwnerByIndex(this.alice.address, 0), 0)
            assert.equal(await this.contract.tokenOfOwnerByIndex(this.alice.address, 1), 2)
            assert.equal(await this.contract.tokenOfOwnerByIndex(this.bob.address, 0), 1)
            assert.equal(await this.contract.tokenOfOwnerByIndex(this.bob.address, 1), 3)
        })

        it("should revert is the owner is the 0 address", async function () {
            await expect(this.contract.tokenOfOwnerByIndex(ADDRESS_ZERO)).to.be.reverted
        })

        it("should revert is the index is out of bounds", async function () {
            await expect(this.contract.tokenOfOwnerByIndex(ADDRESS_ZERO)).to.be.reverted
        })
    })

    describe("transferFrom function", async function () {
        // test transferFrom
        it("should transfer an nft from the owner to the receiver", async function () {
            const sendFromAliceToBob = await this.contract.transferFrom(this.alice.address, this.bob.address, 0)
            const supply = await this.contract.totalSupply()

            assert.equal(Number(sendFromAliceToBob.value), 0)
            assert.equal(Number(sendFromAliceToBob.value), 0)
            assert.equal(Number(supply), 4)

            const balanceOfBob = await this.contract.balanceOf(this.bob.address)
            const balanceOfAlice = await this.contract.balanceOf(this.alice.address)

            assert.equal(Number(balanceOfBob), 3)
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

        it("should query if an address is an authorized operator for another address", async function () {

            await expect(this.contract.setApprovalForAll(this.bob.address, true))
            .to.emit(this.contract, "ApprovalForAll")
            .withArgs( this.alice.address, this.bob.address, true)

            const isApprovedForBob = await this.contract.isApprovedForAll(this.alice.address, this.bob.address)
            const isApprovedForAlice = await this.contract.isApprovedForAll(this.bob.address, this.alice.address)
            
            assert.equal(isApprovedForBob, true)
            assert.equal(isApprovedForAlice, false)

        })



        it("should emits when the approved address for an NFT is changed or reaffirmed", async function () {
            // the zero address indicates there is no approved address
            const notApprovedNFT = await this.contract.getApproved(0)
            assert.equal(notApprovedNFT, 0x0000000000000000000000000000000000000000)
            
            // approve the address of bob.
            await expect(this.contract.connect(this.bob).approve(this.carol.address, 0))
            .to.emit(this.contract, "Approval")
            .withArgs(this.bob.address,this.carol.address, 0)


            // const ApprovedNFT = await this.contract.getApproved(0)
            // assert.equal(ApprovedNFT, 0x0000000000000000000000000000000000000000)

            
         }) 



        // test approve thus getApproved
        // it("should change or reaffirm the approved address for an NFT", async function () {
        //     // is it normal ?
        //     const notApprovedNFT = await this.contract.getApproved(1)
        //     assert.equal(notApprovedNFT, 0x0000000000000000000000000000000000000000)

        //     const approve1 = await this.contract.approve(this.bob.address, 1)
        //     console.log(approve1)
        //     const approvedAddressToken1 = await this.contract.getApproved(1)

        //     // const approve2 = await this.contract.approve(this.alice.address, 2)
        //     // const approvedAddressToken2 = await this.contract.getApproved(2)

        //     // should throw an error if the owner of the token try to approve his/her own address.
        //     // const approveAliceAddress = await this.contract.approve(this.alice.address, 0)

        //     assert.equal(approvedAddressToken1, this.bob.address)
        //     // assert.equal(approvedAddressToken2, this.alice.address)
        // })
    })

    // describe("isApprovedForAll function", async function () {
    //     //test isApprovedForAll
    //     it("should query if an address is an authorized operator for another address", async function () {
    //         const isBobApprovedToManageAliceAssets = await this.contract.isApprovedForAll(this.alice.address, this.bob.address)
    //         const iscontractAddressApprovedToManageAliceAssets = await this.contract.isApprovedForAll(this.alice.address, this.contract.address)

    //         assert.equal(isBobApprovedToManageAliceAssets, false)
    //         assert.equal(iscontractAddressApprovedToManageAliceAssets, false)
    //     })
    // })

    // describe("setApprovalForAll function", async function () {
    //     //test setApprovalForAll
    //     it('should enable or disable approval for a third party ("operator") to manage all of msg.sender assets', async function () {
    //         const contractAddressApprovedToManageAliceAssets = await this.contract.setApprovalForAll(this.alice.address, true)
    //         assert.equal(contractAddressApprovedToManageAliceAssets.to, this.contract.address)

    //         //in this case msg.sender is 0x5FbDB2315678afecb367f032d93F642f64180aa3 aka this.contract.address.
    //         const iscontractAddressApprovedToManageAliceAssets = await this.contract.isApprovedForAll(this.alice.address, this.contract.address)
    //         // console.log(iscontractAddressApprovedToManageAliceAssets)
    //         assert.equal(iscontractAddressApprovedToManageAliceAssets, true)
    //     })
    // })

    // describe("safeTransferFrom function", async function () {
    //     // test safeTransferFrom
    //     it("should  transfers the ownership of an NFT from one address to another address ", async function () {
    //         // should be transfer not allowed error
    //         try {
    //             let transferFromBobToAliceToken1 = await this.contract.functions["safeTransferFrom(address,address,uint256)"](
    //                 this.bob.address,
    //                 this.alice.address,
    //                 1
    //             )
    //         } catch (error) {
    //             assert(error, "Error: VM Exception while processing transaction: revert Transfer not allowed")
    //         }

    //         // // should be transfer not owner error
    //         try {
    //             let transferFromAliceToBobToken0 = await this.contract.functions["safeTransferFrom(address,address,uint256)"](
    //                 this.alice.address,
    //                 this.bob.address,
    //                 0
    //             )
    //         } catch (error) {
    //             assert(error, "Error: VM Exception while processing transaction: revert From not owner")
    //         }

    //         // should be transfer allowed
    //         const transferFromAliceToBobToken0 = await this.contract.functions["safeTransferFrom(address,address,uint256)"](
    //             this.alice.address,
    //             this.bob.address,
    //             1
    //         )
    //         assert.equal(transferFromAliceToBobToken0.from, this.alice.address)
    //         assert.equal(transferFromAliceToBobToken0.to, this.bob.address)
    //         assert.equal(Number(transferFromAliceToBobToken0.value._hex), 0)

    //         // how do you use chai for expect throw error
    //         // await expect(transferFromAliceToBob).to.throw(Error, 'VM Exception while processing transaction: revert Transfer not allowed')
    //     })
    // })
})
