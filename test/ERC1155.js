const { expect, assert } = require("chai")
const { ADDRESS_ZERO, getApprovalDigest, getDomainSeparator, prepare } = require("./utilities")
const { ecsign } = require("ethereumjs-util")

describe("ERC115", function () {
    before(async function () {
        await prepare(this, ["MockERC1155"])
        await prepare(this, ["MockERC1155Receiver"])
        await prepare(this, ["MockERC1155WrongReceiver"])


    this.contract = await this.MockERC1155.deploy()
    await this.contract.deployed()

    this.receiver = await this.MockERC1155Receiver.deploy()
    await this.receiver.deployed()

    this.wrongReceiver = await this.MockERC1155WrongReceiver.deploy()
    await this.wrongReceiver.deployed()
    
    })

    describe("token creation", function () {
        // is is suppose to throw when tryin to have initialSupply equal to zero ? 

        it("should create a token", async function () {
           
            await expect(this.contract.functions["create(uint256,string)"](21000000, "BTC"))
            .to.emit(this.contract, "TransferSingle")
            .withArgs(this.alice.address,ADDRESS_ZERO,ADDRESS_ZERO,1,21000000)

            // is it ok to have the same URI ? 
            await expect(this.contract.connect(this.bob).functions["create(uint256,string)"](21000000, "WBTC"))
            .to.emit(this.contract, "TransferSingle")
            .withArgs(this.bob.address,ADDRESS_ZERO,ADDRESS_ZERO,2,21000000)

        })

        it ("should give the address of the creator", async function () {
            
            assert.equal(await this.contract.functions["creators(uint256)"](1), this.alice.address)
            assert.equal(await this.contract.functions["creators(uint256)"](2), this.bob.address)

        })


        // should we check that the from is the contract address at the creation of a new token ? 

        it("should make sure we have unique id for each token", async function () {
            assert.equal(await this.contract.functions["uniqueness()"](), 2)
        })
        })
    
    describe("support interfaces", function () {
        it("should support the interface EIP-165 and EIP-721 + extensions", async function () {
            assert.isTrue(await this.contract.supportsInterface("0x01ffc9a7", { gasLimit: 30000 })) // EIP-165
            assert.isTrue(await this.contract.supportsInterface("0xd9b67a26", { gasLimit: 30000 })) // EIP-1155
            // assert.isTrue(await this.contract.supportsInterface("0x0e89341c", { gasLimit: 30000 })) // EIP-721 metadata extension
            // assert.isFalse(await this.contract.supportsInterface("0x4e2312e0", { gasLimit: 30000 })) // Not implemented, so false
            // assert.isFalse(await this.contract.supportsInterface("0xffffffff", { gasLimit: 30000 })) // Must be false
            // assert.isFalse(await this.contract.supportsInterface("0x00000000", { gasLimit: 30000 })) // Not implemented, so false
        })
    })


    describe ("mint function", function (){
        it("should throws when to is the address zero", async function () {
            await expect(this.contract.connect(this.alice).mint(ADDRESS_ZERO, 1 , 10000)).to.be.revertedWith("No 0 address")
        })

        // i think it should throw when minting value higher than the initial supply no ? 

        // it("should throws when value is greater than then initialSupply", async function () {
        //     await this.contract.connect(this.alice).mint(this.alice.address, 1 , 210000000)
            
        // })

        // thinking but might be not needed is it suppose to throw when unauthorize mint for someone else ? 



        it ("alice should be able to mint part of supply of token 1" , async function () {
            await expect(this.contract.connect(this.alice).mint(this.alice.address, 1, 1000))
                  .to.emit(this.contract, "TransferSingle")
                  .withArgs(this.alice.address,ADDRESS_ZERO, this.alice.address, 1, 1000)

        })

        it ("alice should be able to mint part of supply of token 2" , async function () {
            await expect(this.contract.connect(this.alice).mint(this.alice.address, 2, 2000))
                  .to.emit(this.contract, "TransferSingle")
                  .withArgs(this.alice.address,ADDRESS_ZERO, this.alice.address, 2, 2000)

        })


        it ("bob should be able to mint part of supply  of token 1" , async function () {
            await expect(this.contract.connect(this.bob).mint(this.bob.address, 1, 3000))
                  .to.emit(this.contract, "TransferSingle")
                  .withArgs(this.bob.address,ADDRESS_ZERO, this.bob.address, 1, 3000)

        })

        it ("bob should be able to mint part of supply of token 2" , async function () {
            await expect(this.contract.connect(this.bob).mint(this.bob.address, 2, 4000))
                  .to.emit(this.contract, "TransferSingle")
                  .withArgs(this.bob.address,ADDRESS_ZERO, this.bob.address, 2, 4000)

        })

        // ---SUMMARY---
        // alice owns 1000 BTC, 2000 WBTC
        // bob owns 3000 BTC, 4000 WBTC
    })


    describe('balanceof function', function () {

        it('should return the number of tokens for one specific id by an address', async function () {
            // hello boring maybe you know a cleaner to test it for array
            const token1AliceBalance = await this.contract.connect(this.alice).functions["balanceOf(address,uint256)"](this.alice.address, 1)
            const token2AliceBalance = await this.contract.connect(this.bob).functions["balanceOf(address,uint256)"](this.alice.address, 2)
            assert.equal(Number(token1AliceBalance[0]) , 1000)
            assert.equal(Number(token2AliceBalance[0]) , 2000)
             // ---SUMMARY---
            // alice owns 1000 BTC, 2000 WBTC
            // bob owns 3000 BTC, 4000 WBTC

        })
    })

    describe('balanceofBatch function', function () {

        // don't get why it doesn't work
        /*
        it ('should throw when one of type of arguments is not an array',  async function () {
            await expect(this.contract.functions["balanceOfBatch(address[],uint256[])"](this.alice.address, [1,2]))
            .to.be.revertedWith("Error: invalid value for array")
        })
        */
 

        it ('should throw when address[].length != uint256[].length',  async function () {
           await expect(this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.alice.address], [1,2]))
           .to.be.revertedWith("ERC1155: Length mismatch")


           await expect(this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.alice.address, this.bob.address], [1]))
           .to.be.revertedWith("ERC1155: Length mismatch")
        })



        it("should return the number of multiple tokens owned by alice's address", async function () {
            // hello boring maybe you know a cleaner to test it for array
            const balanceBatch = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.alice.address, this.alice.address], [1,2])
            assert.equal(Number(balanceBatch['balances']['0']), 1000)
            assert.equal(Number(balanceBatch['balances']['1']), 2000)
            // ---SUMMARY---
            // alice owns 1000 BTC, 2000 WBTC
            // bob owns 3000 BTC, 4000 WBTC
        })


        it("should return the number of multiple tokens owned by bob's address", async function () {
            // hello boring maybe you know a cleaner to test it for array
            const balanceBatch = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.bob.address, this.bob.address], [1,2])
            assert.equal(Number(balanceBatch['balances']['0']), 3000)
            assert.equal(Number(balanceBatch['balances']['1']), 4000)
            // ---SUMMARY---
            // alice owns 1000 BTC, 2000 WBTC
            // bob owns 3000 BTC, 4000 WBTC
        })


        it("should return the number of multiple tokens owned by mulitple address", async function () {
            // hello boring maybe you know a cleaner to test it for array
            const balanceBatch = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.alice.address, this.bob.address], [1,2])
            assert.equal(Number(balanceBatch['balances']['0']), 1000)
            assert.equal(Number(balanceBatch['balances']['1']), 4000)
            // ---SUMMARY---
            // alice owns 1000 BTC, 2000 WBTC
            // bob owns 3000 BTC, 4000 WBTC
        })

        it("should return the number of multiple tokens owned by alice address zero if none", async function () {
            // hello boring maybe you know a cleaner to test it for array
            const balanceBatch = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.alice.address, this.alice.address], [1,4])
            assert.equal(Number(balanceBatch['balances']['0']), 1000)
            assert.equal(Number(balanceBatch['balances']['1']), 0)
            // ---SUMMARY---
            // alice owns 1000 BTC, 2000 WBTC
            // bob owns 3000 BTC, 4000 WBTC
        })

        it("should return the number of multiple tokens owned by alice address zero if none", async function () {
            // hello boring maybe you know a cleaner to test it for array
            const balanceBatch = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.alice.address, this.bob.address], [3,4])
            assert.equal(Number(balanceBatch['balances']['0']), 0)
            assert.equal(Number(balanceBatch['balances']['1']), 0)
            // ---SUMMARY---
            // alice owns 1000 BTC, 2000 WBTC
            // bob owns 3000 BTC, 4000 WBTC
        })
    })


    describe ("burn function", function (){

        // is it ok to have an operator being able to burn on the behalf of someone else ? 

        it ("alice should be able to burn part of supply of token 1" , async function () {
            await expect(this.contract.connect(this.alice).burn(this.alice.address, 1, 500))
                  .to.emit(this.contract, "TransferSingle")
                  .withArgs(this.alice.address,this.alice.address, ADDRESS_ZERO , 1, 500)
        })

        it ("alice should be able to burn part of supply of token 2" , async function () {
            await expect(this.contract.connect(this.alice).burn(this.alice.address, 2, 1000))
                  .to.emit(this.contract, "TransferSingle")
                  .withArgs(this.alice.address, this.alice.address, ADDRESS_ZERO,  2, 1000)

        })


        it ("bob should be able to burn part of supply of token 1" , async function () {
            await expect(this.contract.connect(this.bob).burn(this.bob.address, 1, 1500))
                  .to.emit(this.contract, "TransferSingle")
                  .withArgs(this.bob.address, this.bob.address, ADDRESS_ZERO, 1, 1500)

        })

        it ("bob should be able to burn part of supply of token 2" , async function () {
            await expect(this.contract.connect(this.bob).burn(this.bob.address, 2, 2000))
                  .to.emit(this.contract, "TransferSingle")
                  .withArgs(this.bob.address, this.bob.address, ADDRESS_ZERO, 2, 2000)
        })
        // ---SUMMARY---
        // alice owns 500 BTC, 1000 WBTC
        // bob owns 1500 BTC, 2000 WBTC
    })


    describe("setApprovalForAll", function () {
        it ("should revert when the operator set approval whereas it is not the owner", async function () {
            // right ? 
            
        })

        it ("should authorize the operator ", async function () {
            var isCarolApprovedForAliceToken = await this.contract.functions["isApprovedForAll(address,address)"](this.alice.address, this.carol.address)
            assert.equal(isCarolApprovedForAliceToken['0'], false)

            await expect(this.contract.connect(this.alice).setApprovalForAll(this.carol.address, true))
            .to.emit(this.contract, "ApprovalForAll")
            .withArgs(this.alice.address, this.carol.address, true)

            var isCarolApprovedForAliceToken = await this.contract.functions["isApprovedForAll(address,address)"](this.alice.address, this.carol.address)
            assert.equal(isCarolApprovedForAliceToken['0'], true)

        })

        it ("should unauthorize the operator after the owner unauthorized the operator", async function () {
            var isCarolApprovedForAliceToken = await this.contract.functions["isApprovedForAll(address,address)"](this.alice.address, this.carol.address)
            assert.equal(isCarolApprovedForAliceToken['0'], true)

            await expect(this.contract.connect(this.alice).setApprovalForAll(this.carol.address, false))
            .to.emit(this.contract, "ApprovalForAll")
            .withArgs(this.alice.address, this.carol.address, false)

            var isCarolApprovedForAliceToken = await this.contract.functions["isApprovedForAll(address,address)"](this.alice.address, this.carol.address)
            assert.equal(isCarolApprovedForAliceToken['0'], false)

        })

    })


    describe("safeTransferFrom", function () {
        // is it supposed to be mandotary to pass the byte arg it throws when the byte is empty string. 
        it ("should throws when transferring to the address zero", async function () {
            await expect(this.contract.connect(this.alice).functions["safeTransferFrom(address,address,uint256,uint256,bytes)"](
                this.alice.address, ADDRESS_ZERO, 1, 10, "0x")).to.be.revertedWith("No 0 address")
        })

        it ("should throws when balance for token 'id' is lower than 'value' sent", async function () {
            await expect(this.contract.connect(this.alice).functions["safeTransferFrom(address,address,uint256,uint256,bytes)"](
                this.alice.address, this.bob.address, 1, 501, "0x")).to.be.revertedWith("BoringMath: Underflow")
        })

        it ("should throws when token id is not owner by the owner of the address", async function () {
            await expect(this.contract.connect(this.alice).functions["safeTransferFrom(address,address,uint256,uint256,bytes)"](
                this.alice.address, this.bob.address, 5, 501, "0x")).to.be.revertedWith("BoringMath: Underflow")
        })

        it ("should throws when operator is unauthorized", async function () {
            await expect(this.contract.connect(this.bob).functions["safeTransferFrom(address,address,uint256,uint256,bytes)"](
                this.alice.address, this.bob.address, 1, 501, "0x")).to.be.revertedWith("Transfer not allowed")
        })

        // for NFT maybe we should check the from is the owner as well ?

        it ("should send from the owner to the receiver", async function () {
            await expect(this.contract.connect(this.alice)
            .functions["safeTransferFrom(address,address,uint256,uint256,bytes)"](this.alice.address, this.bob.address, 1, 10, "0x"))
                .to.emit(this.contract, "TransferSingle")
                .withArgs(this.alice.address,this.alice.address, this.bob.address, 1, 10)
            const balanceBatch = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.alice.address, this.bob.address], [1,1])
            assert.equal(Number(balanceBatch['balances']['0']), 490)
            assert.equal(Number(balanceBatch['balances']['1']), 1510)
        })

        it ("should send when 'value' is equal to zero", async function () {
            await expect(this.contract.connect(this.alice)
            .functions["safeTransferFrom(address,address,uint256,uint256,bytes)"](this.alice.address, this.bob.address, 1, 0, "0x"))
                .to.emit(this.contract, "TransferSingle")
                .withArgs(this.alice.address,this.alice.address, this.bob.address, 1, 0)
        })

        it ("should send to from the owner to itself with value zero", async function () {
            await expect(this.contract.connect(this.alice)
            .functions["safeTransferFrom(address,address,uint256,uint256,bytes)"](this.alice.address, this.alice.address, 1, 0, "0x"))
                .to.emit(this.contract, "TransferSingle")
                .withArgs(this.alice.address,this.alice.address, this.alice.address, 1, 0)
        })

        it ("should send to from the owner to itself with value different than zero", async function () {
            await expect(this.contract.connect(this.alice)
            .functions["safeTransferFrom(address,address,uint256,uint256,bytes)"](this.alice.address, this.alice.address, 1, 10, "0x"))
                .to.emit(this.contract, "TransferSingle")
                .withArgs(this.alice.address,this.alice.address, this.alice.address, 1, 10)
        })

        it ("should send on behalf of the owner to the receiver from the operator", async function () {

            await expect(this.contract.connect(this.alice).setApprovalForAll(this.carol.address, true))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.alice.address, this.carol.address, true)

            await expect(this.contract.connect(this.carol)
            .functions["safeTransferFrom(address,address,uint256,uint256,bytes)"](this.alice.address, this.bob.address, 1, 10, "0x"))
                .to.emit(this.contract, "TransferSingle")
                .withArgs(this.carol.address,this.alice.address, this.bob.address, 1, 10)
            const balanceBatch = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.alice.address, this.bob.address], [1,1])
            assert.equal(Number(balanceBatch['balances']['0']), 480)
            assert.equal(Number(balanceBatch['balances']['1']), 1520)
        })

        it ("should not send on behalf of the owner to the receiver from the operator after unapproval", async function () {

            await expect(this.contract.connect(this.alice).setApprovalForAll(this.carol.address, false))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.alice.address, this.carol.address, false)

            await expect(this.contract.connect(this.carol)
            .functions["safeTransferFrom(address,address,uint256,uint256,bytes)"](this.alice.address, this.bob.address, 1, 10, "0x"))
                .to.be.revertedWith("Transfer not allowed")
             // ---SUMMARY---
            // alice owns 480 BTC, 1000 WBTC
            // bob owns 1520 BTC, 2000 WBTC
        })

        it("should call onERC1155TokenReceived on the contract it was transferred to", async function () {
            await expect(
                this.contract.connect(this.alice)
                .functions["safeTransferFrom(address,address,uint256,uint256,bytes)"](this.alice.address, this.receiver.address, 1, 10, "0x"))
                .to.emit(this.contract, "TransferSingle")
                .withArgs(this.alice.address, this.alice.address, this.receiver.address, 1, 10)

            assert.equal(await this.receiver.operator(), this.alice.address)
            assert.equal(await this.receiver.from(), this.alice.address)
            assert.equal(await this.receiver.id(), 1)
            assert.equal(await this.receiver.value(), 10)
            assert.equal(await this.receiver.data(), "0x")
            assert.equal(await this.contract.connect(this.alice).functions["balanceOf(address,uint256)"](this.receiver.address, 1),10)
            assert.equal(await this.contract.connect(this.alice).functions["balanceOf(address,uint256)"](this.alice.address, 1),470)
            await this.receiver.returnSingleToken()
            assert.equal(await this.contract.connect(this.alice).functions["balanceOf(address,uint256)"](this.alice.address, 1), 480)
            // ---SUMMARY---
            // alice owns 480 BTC, 1000 WBTC
            // bob owns 1520 BTC, 2000 WBTC
        })

        it("should call onERC1155TokenReceived on the contract it was transferred to and throw as the contract returns the wrong value", async function () {
            await expect(
                this.contract.connect(this.alice)
                .functions["safeTransferFrom(address,address,uint256,uint256,bytes)"](this.alice.address, this.wrongReceiver.address, 1, 10, "0x"))
                .to.be.revertedWith("Wrong return value")

            assert.equal(await this.wrongReceiver.operator(),ADDRESS_ZERO)
            assert.equal(await this.wrongReceiver.from(), ADDRESS_ZERO)
            assert.equal(await this.wrongReceiver.id(), 0)
            assert.equal(await this.wrongReceiver.value(), 0)
            assert.equal(await this.wrongReceiver.data(), "0x")
            assert.equal(await this.contract.connect(this.alice).functions["balanceOf(address,uint256)"](this.wrongReceiver.address, 1), 0)
            assert.equal(await this.contract.connect(this.alice).functions["balanceOf(address,uint256)"](this.alice.address, 1),480)
            await expect(this.wrongReceiver.returnSingleToken()).to.be.revertedWith("function call to a non-contract account")
             // ---SUMMARY---
            // alice owns 480 BTC, 1000 WBTC
            // bob owns 1520 BTC, 2000 WBTC

        })
      

    })

    describe ("safeBatchTransferFrom", function () {

        // is it supposed to be mandotary to pass the byte arg it throws when the byte is empty string. 
        // don't get why it doesn't work I think the Error is correct ? 
        // it ("should throws when not using array either for ids and or values", async function () {
        //     await expect(this.contract.connect(this.alice).functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](
        //         this.alice.address, this.bob.address, 1, 10, "0x")).to.be.revertedWith("Error: invalid value for array")

        // })


        it ("should throw when ids[].length != values[].length", async function () {
            await expect(this.contract.connect(this.alice).functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](
                this.alice.address, this.bob.address, [1,2], [10], "0x")).to.be.revertedWith("ERC1155: Length mismatch")

            await expect(this.contract.connect(this.alice).functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](
                this.alice.address, this.bob.address, [1], [10, 10], "0x")).to.be.revertedWith("ERC1155: Length mismatch")
        })
        
        it ("should throws when transferring to the address zero", async function () {
            await expect(this.contract.connect(this.alice).functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](
                this.alice.address, ADDRESS_ZERO, [1], [10], "0x")).to.be.revertedWith("No 0 address")
        })


        it ("should throws when balance for token 'id' is lower than 'value' sent", async function () {
            await expect(this.contract.connect(this.alice).functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](
                this.alice.address, this.bob.address, [1], [501], "0x")).to.be.revertedWith("BoringMath: Underflow")

            await expect(this.contract.connect(this.alice).functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](
                this.alice.address, this.bob.address, [1, 2], [501, 10], "0x")).to.be.revertedWith("BoringMath: Underflow")
        })

        it ("should throws when token id is not owned by the owner of the address", async function () {
            await expect(this.contract.connect(this.alice).functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](
                this.alice.address, this.bob.address, [5,1], [10,10], "0x")).to.be.revertedWith("BoringMath: Underflow")
            
        })

        it ("should throws when operator is unauthorized", async function () {
            await expect(this.contract.connect(this.carol).functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](
                this.alice.address, this.bob.address, [1,2], [10,10], "0x")).to.be.revertedWith("Transfer not allowed")
        })

        // // for NFT maybe we should check the from is the owner as well ?

        it ("should send from the owner to the receiver", async function () {
            await expect(this.contract.connect(this.alice)
            .functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](this.alice.address, this.bob.address, [1,2], [10, 10], "0x"))
                .to.emit(this.contract, "TransferBatch")
                .withArgs(this.alice.address,this.alice.address, this.bob.address, [1,2], [10,10])

            const balanceBatchToken1 = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.alice.address, this.bob.address], [1,1])
            const balanceBatchToken2 = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.alice.address, this.bob.address], [2,2])
            assert.equal(Number(balanceBatchToken1['balances']['0']), 470)
            assert.equal(Number(balanceBatchToken1['balances']['1']), 1530)
            assert.equal(Number(balanceBatchToken2['balances']['0']), 990)
            assert.equal(Number(balanceBatchToken2['balances']['1']), 2010)
             // ---SUMMARY---
            // alice owns 470 BTC, 990 WBTC
            // bob owns 1530 BTC, 2010 WBTC
        })

        it ("should send when 'value' is equal to zero", async function () {
            await expect(this.contract.connect(this.alice)
            .functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](this.alice.address, this.bob.address, [1,2], [0,0], "0x"))
                .to.emit(this.contract, "TransferBatch")
                .withArgs(this.alice.address,this.alice.address, this.bob.address, [1,2], [0,0])
        })

        it ("should send to from the owner to itself with value zero", async function () {
            await expect(this.contract.connect(this.alice)
            .functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](this.alice.address, this.alice.address, [1,2], [0,0], "0x"))
                .to.emit(this.contract, "TransferBatch")
                .withArgs(this.alice.address,this.alice.address, this.alice.address, [1,2], [0,0])
        })

        it ("should send to from the owner to itself with value different than zero", async function () {
            await expect(this.contract.connect(this.alice)
            .functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](this.alice.address, this.alice.address, [1,2], [10,10], "0x"))
                .to.emit(this.contract, "TransferBatch")
                .withArgs(this.alice.address,this.alice.address, this.alice.address, [1,2], [10,10])
        })

        it ("should send on behalf of the owner to the receiver from the operator", async function () {

            await expect(this.contract.connect(this.alice).setApprovalForAll(this.carol.address, true))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.alice.address, this.carol.address, true)

            await expect(this.contract.connect(this.carol)
            .functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](this.alice.address, this.bob.address, [1,2], [10,10], "0x"))
                .to.emit(this.contract, "TransferBatch")
                .withArgs(this.carol.address,this.alice.address, this.bob.address, [1,2], [10,10])
            const balanceBatchToken1 = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.alice.address, this.bob.address], [1,1])
            const balanceBatchToken2 = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.alice.address, this.bob.address], [2,2])

            assert.equal(Number(balanceBatchToken1['balances']['0']), 460)
            assert.equal(Number(balanceBatchToken1['balances']['1']), 1540)
            assert.equal(Number(balanceBatchToken2['balances']['0']), 980)
            assert.equal(Number(balanceBatchToken2['balances']['1']), 2020)
            // ---SUMMARY---
            // alice owns 460 BTC, 980 WBTC
            // bob owns 1540 BTC, 2020 WBTC
        })

        it ("should not send on behalf of the owner to the receiver from the operator after unapproval", async function () {

            await expect(this.contract.connect(this.alice).setApprovalForAll(this.carol.address, false))
                .to.emit(this.contract, "ApprovalForAll")
                .withArgs(this.alice.address, this.carol.address, false)

            await expect(this.contract.connect(this.carol)
            .functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](this.alice.address, this.bob.address, [1,2], [10,10], "0x"))
                .to.be.revertedWith("Transfer not allowed")
        })
            // ---SUMMARY---
            // alice owns 460 BTC, 980 WBTC
            // bob owns 1540 BTC, 2020 WBTC

        it("should call onERC1155TokenReceived on the contract it was transferred to", async function () {
            await expect(
                this.contract.connect(this.alice)
                .functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](this.alice.address, this.receiver.address, [1,2], [10, 20], "0x"))
                .to.emit(this.contract, "TransferBatch")
                .withArgs(this.alice.address, this.alice.address, this.receiver.address, [1,2], [10,20])

            assert.equal(await this.receiver.operator(), this.alice.address)
            assert.equal(await this.receiver.from(), this.alice.address)
            assert.equal(await this.receiver.ids(0), 1)
            assert.equal(await this.receiver.ids(1), 2)
            assert.equal(await this.receiver.values(0), 10)
            assert.equal(await this.receiver.values(1), 20)
            assert.equal(await this.receiver.data(), "0x")

            var aliceBalanceBatchToken1 = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.alice.address, this.alice.address], [1,2])
            assert.equal(Number(aliceBalanceBatchToken1['balances']['0']), 450)
            assert.equal(Number(aliceBalanceBatchToken1['balances']['1']), 960)
            var receiverBalanceBatchToken1 = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.receiver.address, this.receiver.address], [1,2])
            assert.equal(Number(receiverBalanceBatchToken1['balances']['0']), 10)
            assert.equal(Number(receiverBalanceBatchToken1['balances']['1']), 20)

            await this.receiver.returnBatchToken()

            var aliceBalanceBatchToken1 = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.alice.address, this.alice.address], [1,2])
            assert.equal(Number(aliceBalanceBatchToken1['balances']['0']), 460)
            assert.equal(Number(aliceBalanceBatchToken1['balances']['1']), 980)

            var receiverBalanceBatchToken1 = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.receiver.address, this.receiver.address], [1,2])
            assert.equal(Number(receiverBalanceBatchToken1['balances']['0']), 0)
            assert.equal(Number(receiverBalanceBatchToken1['balances']['1']), 0)
            // ---SUMMARY---
            // alice owns 460 BTC, 980 WBTC
            // bob owns 1540 BTC, 2020 WBTC
        })

        it("should call onERC1155TokenReceived on the contract it was transferred to and throw as the contract returns the wrong value", async function () {
            await expect(
                this.contract.connect(this.alice)
                .functions["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](this.alice.address, this.wrongReceiver.address, [1,2], [10, 20], "0x"))
                .to.be.revertedWith("Wrong return value")

            assert.equal(await this.wrongReceiver.operator(), ADDRESS_ZERO)
            assert.equal(await this.wrongReceiver.from(), ADDRESS_ZERO)
            assert.equal(await this.wrongReceiver.data(), "0x")
            
            // returns error when trying to check those functions. 
            // assert.equal(await this.wrongReceiver.ids(0), 1)
            // assert.equal(await this.wrongReceiver.ids(1), 2)
            // assert.equal(await this.wrongReceiver.values(0), 10)
            // assert.equal(await this.wrongReceiver.values(1), 20)

            var aliceBalanceBatchToken1 = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.alice.address, this.alice.address], [1,2])
            assert.equal(Number(aliceBalanceBatchToken1['balances']['0']), 460)
            assert.equal(Number(aliceBalanceBatchToken1['balances']['1']), 980)
            var receiverBalanceBatchToken1 = await this.contract.functions["balanceOfBatch(address[],uint256[])"]([this.wrongReceiver.address, this.wrongReceiver.address], [1,2])
            assert.equal(Number(receiverBalanceBatchToken1['balances']['0']), 0)
            assert.equal(Number(receiverBalanceBatchToken1['balances']['1']), 0)

            await expect(this.wrongReceiver.returnBatchToken()).to.be.revertedWith("function call to a non-contract account")
            // ---SUMMARY---
            // alice owns 460 BTC, 980 WBTC
            // bob owns 1540 BTC, 2020 WBTC
        })
   
    }) 

   
})
