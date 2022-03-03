const { expect, assert } = require("chai")
const { ADDRESS_ZERO, getApprovalDigest, getDomainSeparator, prepare } = require("./utilities")
const { ecsign } = require("ethereumjs-util")

describe("BoringMultipleNFT", async function () {
    before(async function () {
        await prepare(this, ["MockBoringMultipleNFT"])
        this.contract = await this.MockBoringMultipleNFT.deploy()
        await this.contract.deployed()

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
            assert.isTrue(await this.contract.supportsInterface("0x5b5e139f", { gasLimit: 30000 })) // EIP-721 metadata extension
            assert.isTrue(await this.contract.supportsInterface("0x780e9d63", { gasLimit: 30000 })) // EIP-721 enumeration extension
            assert.isFalse(await this.contract.supportsInterface("0xffffffff", { gasLimit: 30000 })) // Must be false
            assert.isFalse(await this.contract.supportsInterface("0xabcdef12", { gasLimit: 30000 })) // Not implemented, so false
            assert.isFalse(await this.contract.supportsInterface("0x00000000", { gasLimit: 30000 })) // Not implemented, so false
        })
    })

    describe("mint function", async function () {
        it("should mint the NFT and transfer the NFT from 0 to the to address", async function () {
            await expect(this.contract.mint(this.alice.address)).to.emit(this.contract, "Transfer").withArgs(ADDRESS_ZERO, this.alice.address, 0)

            await expect(this.contract.mint(this.alice.address)).to.emit(this.contract, "Transfer").withArgs(ADDRESS_ZERO, this.alice.address, 1)

            await expect(this.contract.mint(this.bob.address)).to.emit(this.contract, "Transfer").withArgs(ADDRESS_ZERO, this.bob.address, 2)
        })

        it("should keep track of the total supply", async function () {
            assert.equal(Number(await this.contract.totalSupply()), 3)
        })

        it("should add to the totalSupply if someone else mint the nft", async function () {
            await this.contract.mint(this.alice.address)
            assert.equal(Number(await this.contract.totalSupply()), 4)
        })
    })

    describe("balanceOf function", async function () {
        it("should count all NFTs assigned to an owner", async function () {
            assert.equal(Number(await this.contract.balanceOf(this.alice.address)), 3)
            assert.equal(Number(await this.contract.balanceOf(this.bob.address)), 1)
            assert.equal(Number(await this.contract.balanceOf(this.carol.address)), 0)

            await this.contract.mint(this.bob.address)
            assert.equal(Number(await this.contract.balanceOf(this.bob.address)), 2)
            // ---SUMMARY---
            // alice owns 0, 1, 3
            // bob owns 2, 4
        })

        it("should revert for queries about the 0 address", async function () {
            await expect(this.contract.balanceOf(ADDRESS_ZERO)).to.be.revertedWith("No 0 owner")
        })
    })

    describe("ownerOf function", async function () {
        it("should find the owner of an NFT", async function () {
            assert.equal(await this.contract.ownerOf(0), this.alice.address)
            assert.equal(await this.contract.ownerOf(1), this.alice.address)
            assert.equal(await this.contract.ownerOf(2), this.bob.address)
            assert.equal(await this.contract.ownerOf(3), this.alice.address)
            // ---SUMMARY---
            // alice owns 0, 1, 3
            // bob owns 2, 4
        })

        it("should revert if the token owner is 0", async function () {
            await expect(this.contract.ownerOf(5)).to.be.revertedWith("No owner")
        })
    })

    describe("tokenByIndex function", async function () {
        it("should return the index of the token", async function () {
            assert.equal(Number(await this.contract.tokenByIndex(0)), 0)
            assert.equal(Number(await this.contract.tokenByIndex(1)), 1)
            assert.equal(Number(await this.contract.tokenByIndex(2)), 2)
            assert.equal(Number(await this.contract.tokenByIndex(3)), 3)
            // ---SUMMARY---
            // alice owns 0, 1, 3
            // bob owns 2, 4
        })

        it("should revert is greater than totalSupply", async function () {
            await expect(this.contract.tokenByIndex(5)).to.be.revertedWith("Out of bounds")
        })
    })

    describe("tokenOfOwnerByIndex function", async function () {
        it("should return the token id by owner by index", async function () {
            assert.equal(await this.contract.tokenOfOwnerByIndex(this.alice.address, 0), 0)
            assert.equal(await this.contract.tokenOfOwnerByIndex(this.alice.address, 1), 1)
            assert.equal(await this.contract.tokenOfOwnerByIndex(this.bob.address, 0), 2)
            assert.equal(await this.contract.tokenOfOwnerByIndex(this.bob.address, 1), 4)
            // ---SUMMARY---
            // alice owns 0, 1, 3
            // bob owns 2, 4
        })

        it("should revert is the owner is the 0 address", async function () {
            await expect(this.contract.tokenOfOwnerByIndex(ADDRESS_ZERO, 0)).to.be.reverted
        })

        it("should revert is the index is out of bounds", async function () {
            await expect(this.contract.tokenOfOwnerByIndex(this.alice.address, 2000)).to.be.reverted
        })
    })

    describe("transferFrom function", async function () {
        it("should throw if from is not the current owner", async function () {
            await expect(this.contract.transferFrom(this.bob.address, this.alice.address, 1)).to.be.revertedWith("Transfer not allowed")
        })

        it("should throw if msg.sender is not the owner ", async function () {
            await expect(this.contract.connect(this.bob).transferFrom(this.bob.address, this.carol.address, 1)).to.be.revertedWith(
                "From not owner"
            )
        })

        it("should throw if _to is the zero address", async function () {
            await expect(this.contract.transferFrom(this.alice.address, ADDRESS_ZERO, 1)).to.be.revertedWith("No zero address")
        })

        it("should throw if token Id is invalid", async function () {
            await expect(this.contract.transferFrom(ADDRESS_ZERO, this.bob.address, 100000000)).to.be.revertedWith("Transfer not allowed") // maybe the error message should be changed.
        })

        it("should throw unauthorized operator", async function () {
            await expect(this.contract.connect(this.carol).transferFrom(this.alice.address, this.bob.address, 1)).to.be.revertedWith(
                "Transfer not allowed"
            ) // maybe the error message should be changed.
        })

        it("should transfer when the operator is authorized by the original owner of the NFT", async function () {
            await expect(this.contract.connect(this.alice).setApprovalForAll(this.carol.address, true))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.alice.address, this.carol.address, true)

            await expect(this.contract.connect(this.carol).transferFrom(this.alice.address, this.bob.address, 1))
                .to.emit(this.contract, "Transfer")
                .withArgs(this.alice.address, this.bob.address, 1)
            // ---SUMMARY---
            // alice owns 0, 3
            // bob owns 1, 2, 4
            // carol approved to transfer alice's token
        })

        it("should transfer an nft from the owner to the receiver", async function () {
            await expect(this.contract.connect(this.bob).transferFrom(this.bob.address, this.alice.address, 1))
                .to.emit(this.contract, "Transfer")
                .withArgs(this.bob.address, this.alice.address, 1)

            assert.equal(Number(await this.contract.balanceOf(this.bob.address)), 2)
            assert.equal(Number(await this.contract.balanceOf(this.alice.address)), 3)
            assert.equal(await this.contract.ownerOf(1), this.alice.address)
            // ---SUMMARY---
            // alice owns 0,1, 3
            // bob owns  2, 4
            // carol approved to transfer alice's token
        })

        it("should allow the approved operator address to send to itself", async function () {
            // I think we can remove that one right Boring ?
            await expect(this.contract.connect(this.carol).transferFrom(this.alice.address, this.carol.address, 1))
                .to.emit(this.contract, "Transfer")
                .withArgs(this.alice.address, this.carol.address, 1)

            assert.equal(Number(await this.contract.balanceOf(this.bob.address)), 2)
            assert.equal(Number(await this.contract.balanceOf(this.alice.address)), 2)
            assert.equal(Number(await this.contract.balanceOf(this.carol.address)), 1)
            assert.equal(await this.contract.ownerOf(1), this.carol.address)
            // ---SUMMARY---
            // alice owns 0, 3
            // bob owns  2, 4
            //carol owns 1
            // carol approved to transfer alice's token
        })

        it("should not work after the operator is unapproved by the original owner of the NFT", async function () {
            await expect(this.contract.connect(this.alice).setApprovalForAll(this.carol.address, false))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.alice.address, this.carol.address, false)

            await expect(this.contract.connect(this.carol).transferFrom(this.alice.address, this.bob.address, 1)).to.be.revertedWith(
                "Transfer not allowed"
            )
            // ---SUMMARY---
            // alice owns 0, 3
            // bob owns  2, 4
            //carol owns 1
            // carol approved to transfer alice's token
        })
    })

    describe("tokenURI function", async function () {
        it("should return a distinct Uniform Resource Identifier (URI) for a given asset in our case nothing since it is supposed to be implemented by the user of the contract", async function () {
            assert.equal(await this.contract.tokenURI(0), "")
            assert.equal(await this.contract.tokenURI(1), "")
            await expect(this.contract.tokenURI(20)).to.be.revertedWith("Not minted")
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
            // alice owns 0, 3
            // bob owns  2, 4
            //carol owns 1
        })
    })

    describe("approve function", async function () {
        it("should throw if the msg.sender is not the owner of the NFT", async function () {
            await expect(this.contract.connect(this.alice).approve(this.carol.address, 1)).to.be.revertedWith("Not allowed")
        })

        it("should throw if the operator is unauthorized", async function () {
            await expect(this.contract.connect(this.carol).approve(this.alice.address, 2)).to.be.revertedWith("Not allowed")
        })

        it("should change or reaffirm the approved address(es) for an NFT", async function () {
            await expect(this.contract.connect(this.alice).approve(this.carol.address, 3))
                .to.emit(this.contract, "Approval")
                .withArgs(this.alice.address, this.carol.address, 3)

            assert.equal(await this.contract.getApproved(3), this.carol.address)
        })

        it("should reset the approve to none after transfer", async function () {
            await expect(this.contract.connect(this.carol).transferFrom(this.alice.address, this.carol.address, 3))
                .to.emit(this.contract, "Transfer")
                .withArgs(this.alice.address, this.carol.address, 3)

            assert.equal(await this.contract.getApproved(3), ADDRESS_ZERO)

            await expect(this.contract.connect(this.carol).transferFrom(this.carol.address, this.alice.address, 3))
                .to.emit(this.contract, "Transfer")
                .withArgs(this.carol.address, this.alice.address, 3)
            // ---SUMMARY---
            // alice owns 0, 3
            // bob owns  2, 4
            //carol owns 1
            // carol approved to interact with alice's 3 token
        })
    })

    describe("getApproved function", async function () {
        it("should throw if tokenId is invalid", async function () {
            await expect(this.contract.getApproved(20)).to.be.revertedWith("Invalid tokenId")
        })

        it("should return the zero address if there is none", async function () {
            assert.equal(await this.contract.getApproved(1), ADDRESS_ZERO)
        })
        it("should return the approved address after it was approved", async function () {
            await expect(this.contract.connect(this.bob).approve(this.carol.address, 2))
                .to.emit(this.contract, "Approval")
                .withArgs(this.bob.address, this.carol.address, 2)

            assert.equal(await this.contract.getApproved(2), this.carol.address)
        })

        it("should return the previous approved address after it was unapproved (i.e set Approval to address zero)", async function () {
            await expect(this.contract.connect(this.bob).approve(ADDRESS_ZERO, 2))
                .to.emit(this.contract, "Approval")
                .withArgs(this.bob.address, ADDRESS_ZERO, 2)

            assert.equal(await this.contract.getApproved(2), ADDRESS_ZERO)
            // ---SUMMARY---
            // alice owns 0, 3
            // bob owns  2, 4
            //carol owns 1
            // carol approved to interact with alice's 3 token
        })
    })

    describe("safeTransferFrom function", async function () {
        it("should throw if from is not the current owner", async function () {
            await expect(
                this.contract.functions["safeTransferFrom(address,address,uint256)"](this.bob.address, this.alice.address, 0)
            ).to.be.revertedWith("Transfer not allowed")
        })

        it("should throw if msg.sender is not the owner ", async function () {
            await expect(this.contract.connect(this.bob).transferFrom(this.bob.address, this.carol.address, 1)).to.be.revertedWith(
                "From not owner"
            )
        })

        it("should throw if _to is the zero address", async function () {
            await expect(
                this.contract.functions["safeTransferFrom(address,address,uint256)"](this.alice.address, ADDRESS_ZERO, 0)
            ).to.be.revertedWith("No zero address")
        })

        it("should throw if token Id is invalid", async function () {
            await expect(
                this.contract.functions["safeTransferFrom(address,address,uint256)"](ADDRESS_ZERO, this.bob.address, 100000000)
            ).to.be.revertedWith("Transfer not allowed") // maybe the error message should be changed.
        })

        it("should throw unauthorized operator", async function () {
            await expect(
                this.contract.connect(this.carol).functions["safeTransferFrom(address,address,uint256)"](this.alice.address, this.bob.address, 0)
            ).to.be.revertedWith("Transfer not allowed")
        })

        it("should transfer when the operator is authorized by the original owner of the NFT", async function () {
            await expect(this.contract.connect(this.carol).setApprovalForAll(this.alice.address, true))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.carol.address, this.alice.address, true)

            await expect(
                this.contract.connect(this.alice).functions["safeTransferFrom(address,address,uint256)"](this.carol.address, this.bob.address, 1)
            )
                .to.emit(this.contract, "Transfer")
                .withArgs(this.carol.address, this.bob.address, 1)
            // ---SUMMARY---
            // alice owns 0, 3
            // bob owns  1, 2, 4
            // carol approved to interact with alice's 3 token
            // alice approved to interact with carol's token
        })

        it("should not work after the operator is unapproved by the original owner of the NFT", async function () {
            await expect(this.contract.connect(this.carol).setApprovalForAll(this.alice.address, false))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.carol.address, this.alice.address, false)

            await expect(
                this.contract.connect(this.alice).functions["safeTransferFrom(address,address,uint256)"](this.carol.address, this.bob.address, 1)
            ).to.be.revertedWith("Transfer not allowed")
            // ---SUMMARY---
            // alice owns 0, 3
            // bob owns  1, 2, 4
            // carol approved to interact with alice's 3 token
            // alice approved to interact with carol's token
        })

        it("should transfer an nft from the owner to the receiver", async function () {
            await expect(
                this.contract.connect(this.bob).functions["safeTransferFrom(address,address,uint256)"](this.bob.address, this.alice.address, 1)
            )
                .to.emit(this.contract, "Transfer")
                .withArgs(this.bob.address, this.alice.address, 1)

            assert.equal(Number(await this.contract.balanceOf(this.alice.address)), 3)
            assert.equal(Number(await this.contract.balanceOf(this.bob.address)), 2)
            assert.equal(await this.contract.ownerOf(1), this.alice.address)
            // ---SUMMARY---
            // alice owns 0, 1,  3
            // bob owns  2, 4
            // carol approved to interact with alice's 3 token
            // alice approved to interact with carol's token
        })

        it("should call onERC721TokenReceived on the contract it was transferred to", async function () {
            await expect(
                this.contract
                    .connect(this.alice)
                    .functions["safeTransferFrom(address,address,uint256)"](this.alice.address, this.receiver.address, 3)
            )
                .to.emit(this.contract, "Transfer")
                .withArgs(this.alice.address, this.receiver.address, 3)
            assert.equal(await this.receiver.operator(), this.alice.address)
            assert.equal(await this.receiver.from(), this.alice.address)
            assert.equal(await this.receiver.tokenId(), 3)
            assert.equal(await this.receiver.data(), "0x")
            assert.equal(await this.contract.ownerOf(3), this.receiver.address)
            await this.receiver.returnToken()
            assert.equal(await this.contract.ownerOf(3), this.alice.address)
            // ---SUMMARY---
            // alice owns 0, 1 ,3
            // bob owns  2, 4
            // mock receiver owns nft 3 from alice right ?
            // carol approved to interact with alice's 3 token
            // alice approved to interact with carol's token
        })

        it("should call onERC721TokenReceived on the contract it was transferred to and throw as the contract returns the wrong value", async function () {
            await expect(
                this.contract
                    .connect(this.alice)
                    .functions["safeTransferFrom(address,address,uint256)"](this.alice.address, this.wrongReceiver.address, 1)
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
                this.contract.functions["safeTransferFrom(address,address,uint256,bytes)"](
                    this.bob.address,
                    this.alice.address,
                    0,
                    "0x32352342135123432532544353425345"
                )
            ).to.be.revertedWith("Transfer not allowed")
        })

        it("should throw if msg.sender is not the owner ", async function () {
            await expect(
                this.contract
                    .connect(this.bob)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.bob.address,
                        this.alice.address,
                        0,
                        "0x32352342135123432532544353425345"
                    )
            ).to.be.revertedWith("From not owner")
        })

        it("should throw if _to is the zero address", async function () {
            await expect(
                this.contract.functions["safeTransferFrom(address,address,uint256,bytes)"](
                    this.alice.address,
                    ADDRESS_ZERO,
                    0,
                    "0x32352342135123432532544353425345"
                )
            ).to.be.revertedWith("No zero address")
        })

        it("should throw if token Id is invalid", async function () {
            await expect(
                this.contract.functions["safeTransferFrom(address,address,uint256,bytes)"](
                    ADDRESS_ZERO,
                    this.bob.address,
                    100000000,
                    "0x32352342135123432532544353425345"
                )
            ).to.be.revertedWith("Transfer not allowed") // maybe the error message should be changed.
        })

        it("should throw unauthorized operator", async function () {
            await expect(
                this.contract
                    .connect(this.carol)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.alice.address,
                        this.bob.address,
                        0,
                        "0x32352342135123432532544353425345"
                    )
            ).to.be.revertedWith("Transfer not allowed")
        })

        it("should transfer when the operator is authorized by the original owner of the NFT", async function () {
            await expect(this.contract.connect(this.alice).setApprovalForAll(this.bob.address, true))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.alice.address, this.bob.address, true)

            await expect(
                this.contract
                    .connect(this.bob)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.alice.address,
                        this.bob.address,
                        1,
                        "0x32352342135123432532544353425345"
                    )
            )
                .to.emit(this.contract, "Transfer")
                .withArgs(this.alice.address, this.bob.address, 1)
            // ---SUMMARY---
            // alice owns 0,3 maybe
            // bob owns 1, 2, 4
            // carol approved to interact with alice's 3 token
            // alice approved to interact with carol's token
        })

        it("should not work after the operator is unapproved by the original owner of the NFT", async function () {
            await expect(this.contract.connect(this.alice).setApprovalForAll(this.bob.address, false))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.alice.address, this.bob.address, false)

            await expect(
                this.contract
                    .connect(this.bob)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.alice.address,
                        this.bob.address,
                        1,
                        "0x32352342135123432532544353425345"
                    )
            ).to.be.revertedWith("Transfer not allowed")

            // ---SUMMARY---
            // alice owns 0,3 maybe
            // bob owns 1, 2, 4
            // carol approved to interact with alice's 3 token
            // alice approved to interact with carol's token
        })

        it("should transfer an nft from the owner to the receiver", async function () {
            await expect(
                this.contract
                    .connect(this.alice)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.alice.address,
                        this.bob.address,
                        3,
                        "0x32352342135123432532544353425345"
                    )
            )
                .to.emit(this.contract, "Transfer")
                .withArgs(this.alice.address, this.bob.address, 3)

            assert.equal(Number(await this.contract.balanceOf(this.alice.address)), 1)
            assert.equal(Number(await this.contract.balanceOf(this.bob.address)), 4)
            assert.equal(await this.contract.ownerOf(3), this.bob.address)
            // ---SUMMARY---
            // alice owns 0
            // bob owns 1, 2, 3, 4
            // carol approved to interact with alice's 3 token
            // alice approved to interact with carol's token
        })

        it("should call onERC721TokenReceived on the contract it was transferred to", async function () {
            await expect(
                this.contract
                    .connect(this.bob)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.bob.address,
                        this.receiver.address,
                        3,
                        "0x32352342135123432532544353425345"
                    )
            )
                .to.emit(this.contract, "Transfer")
                .withArgs(this.bob.address, this.receiver.address, 3)

            assert.equal(await this.receiver.operator(), this.bob.address)
            assert.equal(await this.receiver.from(), this.bob.address)
            assert.equal(await this.receiver.tokenId(), 3)
            assert.equal(await this.receiver.data(), "0x32352342135123432532544353425345")
            assert.equal(await this.contract.ownerOf(3), this.receiver.address)
            await this.receiver.returnToken()
            assert.equal(await this.contract.ownerOf(3), this.bob.address)
            // ---SUMMARY---
            // alice owns 0
            // bob owns 1, 2, 3, 4
            // carol approved to interact with alice's 3 token
            // alice approved to interact with carol's token
        })

        it("should call onERC721TokenReceived on the contract it was transferred to and throw as the contract returns the wrong value", async function () {
            await expect(
                this.contract
                    .connect(this.bob)
                    .functions["safeTransferFrom(address,address,uint256,bytes)"](
                        this.bob.address,
                        this.wrongReceiver.address,
                        1,
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
