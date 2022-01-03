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
            assert.notEqual(contractAddress, ADDRESS_ZERO)
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
        // testing mint function and Transfer event. 
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

        // it("should throws when minting same id twice", async function () {
        //     await expect(expect(this.contract.mint(this.alice.address))
        //         .to.emit(this.contract, "Transfer")
        //         .withArgs(ADDRESS_ZERO, this.alice.address, 0)).to.be.revertedWith("Expected '3' to be equal 0")
        // })
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
            await expect(this.contract.tokenOfOwnerByIndex(ADDRESS_ZERO, 0)).to.be.reverted
        })

        it("should revert is the index is out of bounds", async function () {
            await expect(this.contract.tokenOfOwnerByIndex(this.alice.address,2000)).to.be.reverted
        })
    })





    describe("transferFrom function", async function () {
        // test transferFrom how do you test "valid" address and a "valid" NFT ?  
        /// @notice Transfer ownership of an NFT -- THE CALLER IS RESPONSIBLE
        ///  TO CONFIRM THAT `_to` IS CAPABLE OF RECEIVING NFTS OR ELSE
        ///  THEY MAY BE PERMANENTLY LOST HOW to test that the address is capable of receiveing the nft ? 

        it("should throws if msg.sender is not the owner ", async function () {
            await expect(this.contract.transferFrom(this.bob.address, this.alice.address, 0))
            .to.be.revertedWith("Transfer not allowed")
        })

        it("should throws if _to is the zero address", async function () {
            await expect(this.contract.transferFrom(this.alice.address, ADDRESS_ZERO, 0))
            .to.be.revertedWith("No zero address")     
         })

         it("should throws if token Id is invalid", async function () {
            await expect(this.contract.transferFrom(ADDRESS_ZERO, this.bob.address, 100000000))
            .to.be.revertedWith("Transfer not allowed")    // maybe the error message should be changed. 
         })

         it("should throws unauthorized operator", async function () {

            await expect(this.contract.connect(this.carol).transferFrom(this.alice.address, this.bob.address, 0))
            .to.be.revertedWith("Transfer not allowed")    // maybe the error message should be changed. 
         })

         it("should transfer when the operator is authorized by the original owner of the NFT", async function () {

            await expect(this.contract.connect(this.alice).setApprovalForAll(this.carol.address, true))
            .to.emit(this.contract, "ApprovalForAll")
            .withArgs(this.alice.address, this.carol.address, true)

            await this.contract.connect(this.carol).transferFrom(this.alice.address, this.bob.address, 0)
         })
         

        it("should transfer an nft from the owner to the receiver", async function () {
            const sendFromAliceToBob = await this.contract.connect(this.bob).transferFrom(this.bob.address, this.alice.address, 0)
            assert.equal(Number(sendFromAliceToBob.value), 0)

            const balanceOfBob = await this.contract.balanceOf(this.bob.address)
            const balanceOfAlice = await this.contract.balanceOf(this.alice.address)

            assert.equal(Number(balanceOfBob), 2)
            assert.equal(Number(balanceOfAlice), 2)

            const ownerOfFirstToken = await this.contract.ownerOf(0)

            assert.equal(ownerOfFirstToken, this.alice.address)
        })

        it("should allow the approved operator address to send to itself", async function () {
            const sendFromAliceToCarol = await this.contract.connect(this.carol).transferFrom(this.alice.address, this.carol.address, 0)
            assert.equal(Number(sendFromAliceToCarol.value), 0)

            const balanceOfBob = await this.contract.balanceOf(this.bob.address)
            const balanceOfAlice = await this.contract.balanceOf(this.alice.address)
            const balanceOfCarol = await this.contract.balanceOf(this.carol.address)

            assert.equal(Number(balanceOfBob), 2)
            assert.equal(Number(balanceOfAlice), 1)
            assert.equal(Number(balanceOfCarol), 1)

            const ownerOfFirstToken = await this.contract.ownerOf(0)

            assert.equal(ownerOfFirstToken, this.carol.address)
        })


        it("should not work after the operator is unapproved by the original owner of the NFT", async function () {
           
            await expect(this.contract.connect(this.alice).setApprovalForAll(this.carol.address, false))
            .to.emit(this.contract, "ApprovalForAll")
            .withArgs(this.alice.address, this.carol.address, false)

            await expect(this.contract.connect(this.carol).transferFrom(this.alice.address, this.bob.address, 0))
            .to.be.revertedWith("Transfer not allowed")

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
    
    describe("setApprovalForAll and isApprovedForAll function", async function () {
        //test isApprovedForAll
        it("should query if an address is an authorized operator for another address", async function () {
            assert.equal(await this.contract.isApprovedForAll(this.alice.address, this.bob.address), false)
            assert.equal(await this.contract.isApprovedForAll(this.alice.address, this.contract.address), false)
            assert.equal(await this.contract.isApprovedForAll(this.alice.address, this.carol.address), false)
    
        })
        //test setApprovalForAll
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


        })

    })


    describe("approve function", async function () {

        it("should throw if the msg.sender is not the owner of the NFT", async function () {
            await expect(this.contract.connect(this.alice).approve(this.carol.address, 0))
            .to.be.revertedWith("Not allowed")
        })  

        it("should throw if the operator is unauthorized", async function () {
            await expect(this.contract.connect(this.carol).approve(this.alice.address, 1))
            .to.be.revertedWith("Not allowed")
        })

        it("should change or reaffirm the approved address(es) for an NFT", async function () { 
            await expect(this.contract.connect(this.alice).approve(this.carol.address, 2))
            .to.emit(this.contract, "Approval")
            .withArgs(this.alice.address, this.carol.address, 2)
            assert.equal(await this.contract.getApproved(2), this.carol.address)
        })
        
        })


        describe("getApproved function", async function () {

            // how do you test that what is an invalid NFT ? 

            it("should throw if tokenId is invalid", async function () {
                const test = await this.contract.connect(this.alice).getApproved(20)
    
                // console.log(test)
            })
    
            it("should get the approved address(es) for a single NFT", async function () {
                assert.equal(await this.contract.getApproved(2), this.carol.address)
            })

            it("should return the zero address if there is none", async function () {
                assert.equal(await this.contract.getApproved(1),ADDRESS_ZERO)

            })
            it("should return the approved address after it was approved", async function () {
                await expect(this.contract.connect(this.bob).approve(this.carol.address, 1))
                .to.emit(this.contract, "Approval")
                .withArgs(this.bob.address, this.carol.address, 1)

                assert.equal(await this.contract.getApproved(1),this.carol.address)
            })
    
            })
        


        describe("safeTransferFrom function", async function () {

            // test safeTransferFrom how do you test "valid" address and a "valid" NFT  and how do we also test data (nft property stored on the blockchain)?  
        it("should throws if msg.sender is not the owner ", async function () {
            await expect(this.contract.functions["safeTransferFrom(address,address,uint256)"](this.bob.address, this.alice.address, 0))
            .to.be.revertedWith("Transfer not allowed")
        })

        it("should throws if _to is the zero address", async function () {
            await expect(this.contract.functions["safeTransferFrom(address,address,uint256)"](this.alice.address, ADDRESS_ZERO, 0))
            .to.be.revertedWith("No zero address")     
         })

         it("should throws if token Id is invalid", async function () {
            await expect(this.contract.functions["safeTransferFrom(address,address,uint256)"](ADDRESS_ZERO, this.bob.address, 100000000))
            .to.be.revertedWith("Transfer not allowed")    // maybe the error message should be changed. 
         })

         it("should throws unauthorized operator", async function () {
            await expect(this.contract.connect(this.carol).functions["safeTransferFrom(address,address,uint256)"](this.alice.address, this.bob.address, 0))
            .to.be.revertedWith("Transfer not allowed")    // maybe the error message should be changed. 
         })

         it("should transfer when the operator is authorized by the original owner of the NFT", async function () {

            await expect(this.contract.connect(this.carol).setApprovalForAll(this.alice.address, true))
            .to.emit(this.contract, "ApprovalForAll")
            .withArgs(this.carol.address, this.alice.address, true)

            await this.contract.connect(this.alice).functions["safeTransferFrom(address,address,uint256)"](this.carol.address, this.bob.address, 0)
         })
         

        it("should transfer an nft from the owner to the receiver", async function () {
            const sendFromAliceToBob = await this.contract.connect(this.bob).functions["safeTransferFrom(address,address,uint256)"](this.bob.address, this.alice.address, 0)
            assert.equal(Number(sendFromAliceToBob.value), 0)

            const balanceOfBob = await this.contract.balanceOf(this.bob.address)
            const balanceOfAlice = await this.contract.balanceOf(this.alice.address)

            assert.equal(Number(balanceOfBob), 2)
            assert.equal(Number(balanceOfAlice), 2)

            const ownerOfFirstToken = await this.contract.ownerOf(0)

            assert.equal(ownerOfFirstToken, this.alice.address)
        })
        
        })
})
