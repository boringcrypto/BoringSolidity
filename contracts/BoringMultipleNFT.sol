// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./libraries/BoringAddress.sol";
import "./libraries/BoringMath.sol";

// solhint-disable avoid-low-level-calls

interface ERC721TokenReceiver {
    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes calldata _data
    ) external returns (bytes4);
}

abstract contract BoringMultipleNFT {
    /// This contract is an EIP-721 compliant contract with enumerable support
    /// To optimize for gas, tokenId is sequential and start at 0. Also, tokens can't be removed/burned.
    using BoringAddress for address;
    using BoringMath for uint256;
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    uint256 public totalSupply = 0;

    struct TokenInfo {
        address owner;
        uint24 index; // index in the tokensOf array, one address can hold a maximum of 16,777,216 tokens
        uint72 data; // data field can be usse to store traits
    }

    // operator mappings as per usual
    mapping (address => mapping(address => bool)) public isApprovedForAll;
    mapping (address => uint256[]) public tokensOf; // Array of tokens owned by
    mapping (uint256 => TokenInfo) internal _tokens; // The index in the tokensOf array for the token, needed to remove tokens from tokensOf
    mapping (uint256 => address) public getApproved; // keep track of approved nft

    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return
            interfaceID == this.supportsInterface.selector || // EIP-165       
            interfaceID == 0x80ac58cd; // EIP-721
    }

    function approve(address approved, uint256 tokenId) public payable {
        address owner = _tokens[tokenId].owner; 
        require(msg.sender == owner || isApprovedForAll[owner][msg.sender], "Not allowed");
        getApproved[tokenId] = approved; 
        emit Approval(msg.sender, approved, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        return _tokens[tokenId].owner;
    }

    function balanceOf(address owner) public view returns (uint256) {
        return tokensOf[owner].length;
    }

    function _transferBase(uint tokenId, address from, address to, uint72 data) internal {
        address owner = _tokens[tokenId].owner;
        require(from == owner, "From not owner"); // Maybe we should just completely ignore the from parameter?

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
        _tokens[tokenId] = TokenInfo({
            owner: to,
            index: index,
            data: data
        });

        // EIP-721 seems to suggest not to emit the Approval event here as it is indicated by the Transfer event.
        getApproved[tokenId] = address(0);
        emit Transfer(from, to, tokenId);
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal {
        require(msg.sender == from || msg.sender == getApproved[tokenId] || isApprovedForAll[from][msg.sender], "Transfer not allowed");
        require(to != address(0), "No zero address");
        // check for owner == from is in base
        _transferBase(tokenId, from, to, 0);
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
                ERC721TokenReceiver(to).onERC721Received(msg.sender, from, tokenId, data) ==
                    bytes4(keccak256("onERC721Received(address,address,uint256,bytes)")),
                "Wrong return value"
            );
        }
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        return _tokenURI(tokenId);
    }

    function _tokenURI(uint256 tokenId) internal view virtual returns (string memory);

    function tokenByIndex(uint256 index) public pure returns (uint256) {
        return index; // This works due the optimization of sequential tokenIds and no burning
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256) {
        return tokensOf[owner][index];
    }

    function _mint(address owner, uint72 data) internal {
        _transferBase(totalSupply, address(0), owner, data);
        totalSupply++;
    }
}