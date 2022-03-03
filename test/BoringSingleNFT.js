const { expect, assert } = require("chai")
const { ADDRESS_ZERO, getApprovalDigest, getDomainSeparator, prepare } = require("./utilities")
const { ecsign, Address } = require("ethereumjs-util")

describe("BoringSingleNFT", async function () {
    before(async function () {
        await prepare(this, ["MockBoringSingleNFT"])
        this.contract = await this.MockBoringSingleNFT.deploy()
        // alice is the deployer and hence the owner of the NFT.
        await this.contract.connect(this.alice).deployed()

        await prepare(this, ["MockERC721Receiver"])
        this.receiver = await this.MockERC721Receiver.deploy()
        await this.receiver.deployed()

        await prepare(this, ["MockERC721ReceiverWrong"])
        this.wrongReceiver = await this.MockERC721ReceiverWrong.deploy()
        await this.wrongReceiver.deployed()
    })

    describe("deployment basic requirements", async function () {
        it("should not be null, empty, undefined, address 0", async function () {
            const contractAddress = await this.contract.address
            assert.notEqual(contractAddress, "")
            assert.notEqual(contractAddress, ADDRESS_ZERO)
            assert.notEqual(contractAddress, null)
            assert.notEqual(contractAddress, undefined)
        })
    })

    describe("supports interface", async function () {
        it("should support the interface EIP-165 and EIP-721 + extensions", async function () {
            assert.isTrue(await this.contract.supportsInterface("0x01ffc9a7", { gasLimit: 30000 })) // EIP-165
            assert.isTrue(await this.contract.supportsInterface("0x80ac58cd", { gasLimit: 30000 })) // EIP-721
            // assert.isTrue(await this.contract.supportsInterface("0x5b5e139f", { gasLimit: 30000 })) // EIP-721 metadata extension
            // assert.isTrue(await this.contract.supportsInterface("0x780e9d63", { gasLimit: 30000 })) // EIP-721 enumeration extension
            assert.isFalse(await this.contract.supportsInterface("0xffffffff", { gasLimit: 30000 })) // Must be false
            assert.isFalse(await this.contract.supportsInterface("0xabcdef12", { gasLimit: 30000 })) // Not implemented, so false
            assert.isFalse(await this.contract.supportsInterface("0x00000000", { gasLimit: 30000 })) // Not implemented, so false
        })
    })

    describe("balanceOf function", async function () {
        it("should revert for queries about the 0 address", async function () {
            await expect(this.contract.balanceOf(ADDRESS_ZERO)).to.be.revertedWith("No zero address") // not consistent with "No 0 owner"
        })
        it("should count all NFTs assigned to an owner", async function () {
            assert.equal(Number(await this.contract.balanceOf(this.alice.address)), 1)
            assert.equal(Number(await this.contract.balanceOf(this.bob.address)), 0)
            assert.equal(Number(await this.contract.balanceOf(this.carol.address)), 0)
            // ---SUMMARY---
            // alice owns the single NFT.
            // no one else does.
        })
    })

    describe("ownerOf function", async function () {
        it("should find the owner of an NFT", async function () {
            assert.equal(await this.contract.ownerOf(0), this.alice.address)
            // ---SUMMARY---
            // alice owns the single NFT.
            // no one else does.
        })

        it("should revert if the token owner is 0", async function () {
            await expect(this.contract.ownerOf(5)).to.be.revertedWith("Invalid token ID")
        })
    })

    describe("transferFrom function", async function () {
        it("should throw token Id is invalid", async function () {
            await expect(this.contract.transferFrom(this.alice.address, this.bob.address, 1)).to.be.revertedWith("Invalid token ID")
        })

        it("should throw if from is not the current owner", async function () {
            await expect(this.contract.transferFrom(this.bob.address, this.alice.address, 0)).to.be.revertedWith("From not owner")
        })

        it("should throw if msg.sender is not the owner ", async function () {
            await expect(this.contract.connect(this.bob).transferFrom(this.alice.address, this.bob.address, 0)).to.be.revertedWith(
                "Transfer not allowed"
            )
        })

        it("should throw if _to is the zero address", async function () {
            await expect(this.contract.transferFrom(this.alice.address, ADDRESS_ZERO, 0)).to.be.revertedWith("No zero address")
        })

        it("should throw unauthorized operator", async function () {
            await expect(this.contract.connect(this.carol).transferFrom(this.alice.address, this.bob.address, 0)).to.be.revertedWith(
                "Transfer not allowed"
            )
        })

        it("should transfer when the operator is authorized by the original owner of the NFT", async function () {
            await expect(this.contract.connect(this.alice).setApprovalForAll(this.bob.address, true))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.alice.address, this.bob.address, true)

            await expect(this.contract.connect(this.bob).transferFrom(this.alice.address, this.carol.address, 0))
                .to.emit(this.contract, "Transfer")
                .withArgs(this.alice.address, this.carol.address, 0)

            assert.equal(Number(await this.contract.balanceOf(this.carol.address)), 1)
            assert.equal(await this.contract.ownerOf(0), this.carol.address)
            // ---SUMMARY---
            // carol is the hodler
            // bob is authorized to interact with alice's NFT if owned
        })

        it("should transfer an nft from the owner to the receiver", async function () {
            await expect(this.contract.connect(this.carol).transferFrom(this.carol.address, this.alice.address, 0))
                .to.emit(this.contract, "Transfer")
                .withArgs(this.carol.address, this.alice.address, 0)

            assert.equal(Number(await this.contract.balanceOf(this.alice.address)), 1)
            assert.equal(await this.contract.ownerOf(0), this.alice.address)
            // ---SUMMARY---
            // alice is the hodler
            // bob is authorized to interact with alice's NFT if owned
        })

        it("should not work after the operator is unapproved by the original owner of the NFT", async function () {
            await expect(this.contract.connect(this.alice).setApprovalForAll(this.bob.address, false))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.alice.address, this.bob.address, false)

            await expect(this.contract.connect(this.bob).transferFrom(this.alice.address, this.bob.address, 0)).to.be.revertedWith(
                "Transfer not allowed"
            )
            // ---SUMMARY---
            // alice is the hodler
        })
    })

    describe("tokenURI function", async function () {
        it("should return a distinct Uniform Resource Identifier (URI) for a given asset in our case nothing since it is supposed to be implemented by the user of the contract", async function () {
            assert.equal(await this.contract.tokenURI(0), "")
        })
        it("should throw when token is invalid", async function () {
            await expect(this.contract.tokenURI(20)).to.be.revertedWith("Invalid token ID")
        })
    })

    describe("setApprovalForAll and isApprovedForAll function", async function () {
        it("should query if an address is an authorized operator for another address", async function () {
            assert.equal(await this.contract.isApprovedForAll(this.alice.address, this.bob.address), false)
            assert.equal(await this.contract.isApprovedForAll(this.alice.address, this.contract.address), false)
            assert.equal(await this.contract.isApprovedForAll(this.alice.address, this.carol.address), false)
        })
        it('should enable or disable approval for multiple third party ("operator") to manage all of msg.sender assets', async function () {
            await expect(this.contract.connect(this.alice).setApprovalForAll(this.carol.address, true))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.alice.address, this.carol.address, true)

            await expect(this.contract.connect(this.alice).setApprovalForAll(this.bob.address, true))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.alice.address, this.bob.address, true)

            assert.equal(await this.contract.isApprovedForAll(this.alice.address, this.carol.address), true)
            assert.equal(await this.contract.isApprovedForAll(this.alice.address, this.bob.address), true)

            await expect(this.contract.connect(this.alice).setApprovalForAll(this.carol.address, false))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.alice.address, this.carol.address, false)

            await expect(this.contract.connect(this.alice).setApprovalForAll(this.bob.address, false))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.alice.address, this.bob.address, false)

            assert.equal(await this.contract.isApprovedForAll(this.alice.address, this.carol.address), false)
            assert.equal(await this.contract.isApprovedForAll(this.alice.address, this.bob.address), false)
            // ---SUMMARY---
            // alice is the hodler
        })
    })

    describe("approve function", async function () {
        it("should throw if the msg.sender is not the owner of the NFT", async function () {
            await expect(this.contract.connect(this.carol).approve(this.bob.address, 0)).to.be.revertedWith("Not allowed")
        })

        it("should throw if the operator is unauthorized", async function () {
            await expect(this.contract.connect(this.bob).approve(this.bob.address, 0)).to.be.revertedWith("Not allowed")
        }) // how do you test that ? already tested above maybe ?

        it("should change or reaffirm the approved address(es) for an NFT", async function () {
            await expect(this.contract.connect(this.alice).approve(this.bob.address, 0))
                .to.emit(this.contract, "Approval")
                .withArgs(this.alice.address, this.bob.address, 0)

            assert.equal(await this.contract.getApproved(0), this.bob.address)

            await expect(this.contract.connect(this.bob).transferFrom(this.alice.address, this.carol.address, 0))
                .to.emit(this.contract, "Transfer")
                .withArgs(this.alice.address, this.carol.address, 0)

            // assert if it was reset to none after transfer
            assert.equal(await this.contract.ownerOf(0), this.carol.address)
            assert.equal(await this.contract.getApproved(0), ADDRESS_ZERO)

            // is that normal that after bob approved and after I reset setApprovalForAll to false bob can still transfer stuff from alice to carol ?

            // await expect(this.contract.connect(this.alice).setApprovalForAll(this.bob.address, false))
            //     .to.emit(this.contract, "ApprovalForAll")
            //     .withArgs(this.alice.address, this.bob.address, false)

            // await expect(this.contract.connect(this.bob).transferFrom(this.alice.address, this.carol.address, 0))
            //     .to.emit(this.contract, "Transfer")
            //     .withArgs(this.alice.address, this.carol.address, 0)

            // ---SUMMARY---
            // carol is the hodler
        })
    })

    describe("getApproved function", async function () {
        it("should throw if tokenId is invalid", async function () {
            await expect(this.contract.getApproved(1)).to.be.revertedWith("Invalid token ID")
        })

        it("should get the approved address(es) for a single NFT", async function () {
            assert.equal(await this.contract.getApproved(0), ADDRESS_ZERO)
        })

        it("should return the approved address after it was approved", async function () {
            await expect(this.contract.connect(this.carol).approve(this.bob.address, 0))
                .to.emit(this.contract, "Approval")
                .withArgs(this.carol.address, this.bob.address, 0)

            assert.equal(await this.contract.getApproved(0), this.bob.address)
        })

        it("should return the previous approved address after it was unapproved (i.e set Approval to address zero)", async function () {
            await expect(this.contract.connect(this.carol).approve(ADDRESS_ZERO, 0))
                .to.emit(this.contract, "Approval")
                .withArgs(this.carol.address, ADDRESS_ZERO, 0)

            assert.equal(await this.contract.getApproved(0), ADDRESS_ZERO)
            // ---SUMMARY---
            // carol is the hodler
        })
    })

    describe("safeTransferFrom function", async function () {
        it("should throw if from is not the current owner", async function () {
            await expect(
                this.contract.functions["safeTransferFrom(address,address,uint256)"](this.carol.address, this.alice.address, 0)
            ).to.be.revertedWith("Transfer not allowed")
        })

        it("should throw if msg.sender is not the owner ", async function () {
            await expect(this.contract.connect(this.carol).transferFrom(this.bob.address, this.bob.address, 0)).to.be.revertedWith(
                "From not owner"
            )
        })

        it("should throw if _to is the zero address", async function () {
            await expect(
                this.contract.connect(this.carol).functions["safeTransferFrom(address,address,uint256)"](this.carol.address, ADDRESS_ZERO, 0)
            ).to.be.revertedWith("No zero address")
        })

        it("should throw if token Id is invalid", async function () {
            await expect(
                this.contract.connect(this.carol).functions["safeTransferFrom(address,address,uint256)"](this.carol.address, this.bob.address, 2)
            ).to.be.revertedWith("Invalid token ID")
        })

        it("should throw unauthorized operator", async function () {
            await expect(
                this.contract.connect(this.bob).functions["safeTransferFrom(address,address,uint256)"](this.carol.address, this.bob.address, 0)
            ).to.be.revertedWith("Transfer not allowed")
        })

        it("should transfer when the operator is authorized by the original owner of the NFT", async function () {
            await expect(this.contract.connect(this.carol).setApprovalForAll(this.alice.address, true))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.carol.address, this.alice.address, true)

            await expect(
                this.contract
                    .connect(this.alice)
                    .functions["safeTransferFrom(address,address,uint256)"](this.carol.address, this.alice.address, 0)
            )
                .to.emit(this.contract, "Transfer")
                .withArgs(this.carol.address, this.alice.address, 0)

            assert.equal(await this.contract.ownerOf(0), this.alice.address)
            // ---SUMMARY---
            // alice is the hodler
            // alice apporved for all carol's asset.
        })

        it("should transfer an nft from the owner to the receiver", async function () {
            await expect(
                this.contract
                    .connect(this.alice)
                    .functions["safeTransferFrom(address,address,uint256)"](this.alice.address, this.carol.address, 0)
            )
                .to.emit(this.contract, "Transfer")
                .withArgs(this.alice.address, this.carol.address, 0)

            assert.equal(await this.contract.ownerOf(0), this.carol.address)
            // ---SUMMARY---
            // carol is the hodler
            // alice apporved for all carol's asset.
        })

        it("should not work after the operator is unapproved by the original owner of the NFT", async function () {
            await expect(this.contract.connect(this.carol).setApprovalForAll(this.alice.address, false))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.carol.address, this.alice.address, false)

            await expect(
                this.contract.connect(this.alice).functions["safeTransferFrom(address,address,uint256)"](this.carol.address, this.bob.address, 0)
            ).to.be.revertedWith("Transfer not allowed")
            // ---SUMMARY---
            // carol is the hodler
            // alice apporved for all carol's asset.
        })

        it("should call onERC721TokenReceived on the contract it was transferred to", async function () {
            await expect(
                this.contract
                    .connect(this.carol)
                    .functions["safeTransferFrom(address,address,uint256)"](this.carol.address, this.receiver.address, 0)
            )
                .to.emit(this.contract, "Transfer")
                .withArgs(this.carol.address, this.receiver.address, 0)
            assert.equal(await this.receiver.operator(), this.carol.address)
            assert.equal(await this.receiver.from(), this.carol.address)
            assert.equal(await this.receiver.tokenId(), 0)
            assert.equal(await this.receiver.data(), "0x")
            assert.equal(await this.contract.ownerOf(0), this.receiver.address)
            await this.receiver.returnToken()
            assert.equal(await this.contract.ownerOf(0), this.carol.address)
            // ---SUMMARY---
            // carol is the holder
        })

        it("should call onERC721TokenReceived on the contract it was transferred to and throw as the contract returns the wrong value", async function () {
            await expect(
                this.contract
                    .connect(this.carol)
                    .functions["safeTransferFrom(address,address,uint256)"](this.carol.address, this.wrongReceiver.address, 0)
            ).to.be.revertedWith("Wrong return value")
            assert.equal(await this.wrongReceiver.operator(), ADDRESS_ZERO)
            assert.equal(await this.wrongReceiver.from(), ADDRESS_ZERO)
            assert.equal(await this.wrongReceiver.tokenId(), 0)
            assert.equal(await this.wrongReceiver.data(), "0x")

            await expect(this.wrongReceiver.returnToken()).to.be.revertedWith("Transaction reverted without a reason")
        })
    })

    describe("safeTransferFrom function with bytes of data", async function () {
        it("should throw if from is not the current owner", async function () {
            await expect(
                this.contract
                    .connect(this.carol)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.bob.address,
                        this.alice.address,
                        0,
                        "0x32352342135123432532544353425345"
                    )
            ).to.be.revertedWith("From not owner")
        })

        it("should throw if msg.sender is not the owner ", async function () {
            await expect(
                this.contract
                    .connect(this.alice)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.carol.address,
                        this.alice.address,
                        0,
                        "0x32352342135123432532544353425345"
                    )
            ).to.be.revertedWith("Transfer not allowed")
        })

        it("should throw if _to is the zero address", async function () {
            await expect(
                this.contract
                    .connect(this.carol)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.carol.address,
                        ADDRESS_ZERO,
                        0,
                        "0x32352342135123432532544353425345"
                    )
            ).to.be.revertedWith("No zero address")
        })

        it("should throw if token Id is invalid", async function () {
            await expect(
                this.contract
                    .connect(this.carol)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.carol.address,
                        this.bob.address,
                        100000000,
                        "0x32352342135123432532544353425345"
                    )
            ).to.be.revertedWith("Invalid token ID")
        })

        it("should throw unauthorized operator", async function () {
            await expect(
                this.contract
                    .connect(this.alice)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.carol.address,
                        this.alice.address,
                        0,
                        "0x32352342135123432532544353425345"
                    )
            ).to.be.revertedWith("Transfer not allowed")
        })

        it("should transfer when the operator is authorized by the original owner of the NFT", async function () {
            await expect(this.contract.connect(this.carol).setApprovalForAll(this.alice.address, true))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.carol.address, this.alice.address, true)

            await expect(
                this.contract
                    .connect(this.alice)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.carol.address,
                        this.alice.address,
                        0,
                        "0x32352342135123432532544353425345"
                    )
            )
                .to.emit(this.contract, "Transfer")
                .withArgs(this.carol.address, this.alice.address, 0)
            assert.equal(await this.contract.ownerOf(0), this.alice.address)
            // ---SUMMARY---
            // alice is the holder
            // alice is approved to interact with all carol's asset.
        })

        it("should transfer an nft from the owner to the receiver", async function () {
            await expect(
                this.contract
                    .connect(this.alice)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.alice.address,
                        this.carol.address,
                        0,
                        "0x32352342135123432532544353425345"
                    )
            )
                .to.emit(this.contract, "Transfer")
                .withArgs(this.alice.address, this.carol.address, 0)

            assert.equal(await this.contract.ownerOf(0), this.carol.address)
            // ---SUMMARY---
            // carol is the holder
            // alice is approved to interact with all carol's asset.
        })

        it("should not work after the operator is unapproved by the original owner of the NFT", async function () {
            await expect(this.contract.connect(this.carol).setApprovalForAll(this.alice.address, false))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.carol.address, this.alice.address, false)

            await expect(
                this.contract
                    .connect(this.alice)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.carol.address,
                        this.alice.address,
                        0,
                        "0x32352342135123432532544353425345"
                    )
            ).to.be.revertedWith("Transfer not allowed")
            // ---SUMMARY---
            // carol is the holder
        })

        it("should call onERC721TokenReceived on the contract it was transferred to", async function () {
            await expect(
                this.contract
                    .connect(this.carol)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.carol.address,
                        this.receiver.address,
                        0,
                        "0x32352342135123432532544353425345"
                    )
            )
                .to.emit(this.contract, "Transfer")
                .withArgs(this.carol.address, this.receiver.address, 0)

            assert.equal(await this.receiver.operator(), this.carol.address)
            assert.equal(await this.receiver.from(), this.carol.address)
            assert.equal(await this.receiver.tokenId(), 0)
            assert.equal(await this.receiver.data(), "0x32352342135123432532544353425345")
            assert.equal(await this.contract.ownerOf(0), this.receiver.address)
            await this.receiver.returnToken()
            assert.equal(await this.contract.ownerOf(0), this.carol.address)
            // ---SUMMARY---
            // carol is the holder
        })

        it("should call onERC721TokenReceived on the contract it was transferred to and throw as the contract returns the wrong value", async function () {
            await expect(
                this.contract
                    .connect(this.carol)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.carol.address,
                        this.wrongReceiver.address,
                        0,
                        "0x32352342135123432532544353425345"
                    )
            ).to.be.revertedWith("Wrong return value")

            assert.equal(await this.wrongReceiver.operator(), ADDRESS_ZERO)
            assert.equal(await this.wrongReceiver.from(), ADDRESS_ZERO)
            assert.equal(await this.wrongReceiver.tokenId(), 0)
            assert.equal(await this.wrongReceiver.data(), "0x")

            await expect(this.wrongReceiver.returnToken()).to.be.revertedWith("Transaction reverted without a reason")
        })
    })
})
