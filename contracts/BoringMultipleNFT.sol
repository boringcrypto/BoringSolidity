// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "./interfaces/IERC721.sol";
import "./interfaces/IERC721TokenReceiver.sol";
import "./libraries/BoringAddress.sol";

// solhint-disable avoid-low-level-calls

struct TraitsData {
    uint8 trait0;
    uint8 trait1;
    uint8 trait2;
    uint8 trait3;
    uint8 trait4;
    uint8 trait5;
    uint8 trait6;
    uint8 trait7;
    uint8 trait8;
}

abstract contract BoringMultipleNFT is IERC721, IERC721Metadata, IERC721Enumerable {
    /// This contract is an EIP-721 compliant contract with enumerable support
    /// To optimize for gas, tokenId is sequential and start at 0. Also, tokens can't be removed/burned.
    using BoringAddress for address;

    string public name;
    string public symbol;

    constructor(string memory name_, string memory symbol_) {
        name = name_;
        symbol = symbol_;
    }

    uint256 public totalSupply = 0;

    struct TokenInfo {
        // There 3 pack into a single storage slot 160 + 24 + 9*8 = 256 bits
        address owner;
        uint24 index; // index in the tokensOf array, one address can hold a maximum of 16,777,216 tokens
        TraitsData data; // data field can be used to store traits
    }

    // operator mappings as per usual
    mapping(address => mapping(address => bool)) public isApprovedForAll;
    mapping(address => uint256[]) public tokensOf; // Array of tokens owned by
    mapping(uint256 => TokenInfo) internal _tokens; // The index in the tokensOf array for the token, needed to remove tokens from tokensOf
    mapping(uint256 => address) internal _approved; // keep track of approved nft

    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return
            interfaceID == this.supportsInterface.selector || // EIP-165
            interfaceID == 0x80ac58cd || // EIP-721
            interfaceID == 0x5b5e139f || // EIP-721 metadata extension
            interfaceID == 0x780e9d63; // EIP-721 enumeration extension
    }

    function approve(address approved, uint256 tokenId) public payable {
        address owner = _tokens[tokenId].owner;
        require(msg.sender == owner || isApprovedForAll[owner][msg.sender], "Not allowed");
        _approved[tokenId] = approved;
        emit Approval(owner, approved, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address approved) {
        require(tokenId < totalSupply, "Invalid tokenId");
        return _approved[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _tokens[tokenId].owner;
        require(owner != address(0), "No owner");
        return owner;
    }

    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "No 0 owner");
        return tokensOf[owner].length;
    }

    function _transferBase(
        uint256 tokenId,
        address from,
        address to,
        TraitsData memory data
    ) internal {
        address owner = _tokens[tokenId].owner;
        require(from == owner, "From not owner");

        uint24 index;
        // Remove the token from the current owner's tokensOf array
        if (from != address(0)) {
            index = _tokens[tokenId].index; // The index of the item to remove in the array
            data = _tokens[tokenId].data;
            uint256 last = tokensOf[from].length - 1;
            uint256 lastTokenId = tokensOf[from][last];
            tokensOf[from][index] = lastTokenId; // Copy the last item into the slot of the one to be removed
            _tokens[lastTokenId].index = index; // Update the token index for the last item that was moved
            tokensOf[from].pop(); // Delete the last item
        }

        index = uint24(tokensOf[to].length);
        tokensOf[to].push(tokenId);
        _tokens[tokenId] = TokenInfo({owner: to, index: index, data: data});

        // EIP-721 seems to suggest not to emit the Approval event here as it is indicated by the Transfer event.
        _approved[tokenId] = address(0);
        emit Transfer(from, to, tokenId);
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal {
        require(msg.sender == from || msg.sender == _approved[tokenId] || isApprovedForAll[from][msg.sender], "Transfer not allowed");
        require(to != address(0), "No zero address");
        // check for owner == from is in base
        _transferBase(tokenId, from, to, TraitsData(0, 0, 0, 0, 0, 0, 0, 0, 0));
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public payable {
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public payable {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public payable {
        _transfer(from, to, tokenId);
        if (to.isContract()) {
            require(
                IERC721TokenReceiver(to).onERC721Received(msg.sender, from, tokenId, data) ==
                    bytes4(keccak256("onERC721Received(address,address,uint256,bytes)")),
                "Wrong return value"
            );
        }
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(tokenId < totalSupply, "Not minted");
        return _tokenURI(tokenId);
    }

    function _tokenURI(uint256 tokenId) internal view virtual returns (string memory);

    function tokenByIndex(uint256 index) public view returns (uint256) {
        require(index < totalSupply, "Out of bounds");
        return index; // This works due the optimization of sequential tokenIds and no burning
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256) {
        return tokensOf[owner][index];
    }

    //
    function _mint(address owner, TraitsData memory data) internal returns (uint256 tokenId) {
        tokenId = totalSupply;
        _transferBase(tokenId, address(0), owner, data);
        totalSupply++;
    }
}
