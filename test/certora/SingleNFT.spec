methods {
    balanceOf(address user) returns (uint256) envfree;
    totalSupply() returns (uint256) envfree;
    ownerOf(uint256 tokenId) returns (address) envfree;
    allowed() returns (address) envfree;
    getApproved(uint256 tokenId) returns (address) envfree;
    isApprovedForAll(address _owner, address _operator) returns (bool) envfree;
}

/*
// To "proof" the contract, I'm trialing an opposite approach to start with the thing we don't
// want happening and iterate until we either find a counter example or close all paths.

// We want to make sure no unauthorized addresses can steal the NFT (or actually change the owner in any way)

rule StealV1(method f) {
    address ownerBefore = ownerOf(0);

    env e;
    // If you're already the owner, it's not stealing...
    require e.msg.sender != ownerBefore;
    calldataarg args;
    f(e, args);

    address ownerAfter = ownerOf(0);
    assert ownerBefore == ownerAfter;

    // This gives us 3 places to look, these are the only places that can change the owner (and maybe let us steal it)

    // Failed on StealV1: Violated for:
    // transferFrom(address,address,uint256),
    // safeTransferFrom(address,address,uint256),
    // safeTransferFrom(address,address,uint256,bytes),
}
*/

// By looking at those functions we can see the approved address and operators could change the owner, so we need
// to do 3 things:
// - Try to steal it when we're not the operator and not the approved address
// - Try to change the approved address (which could lead to stealing)
// - Try to change the operator (which could lead to stealing)

rule StealV2_Part1(method f) {
    address ownerBefore = ownerOf(0);

    env e;
    // If you're already the owner, it's not stealing...
    require e.msg.sender != ownerBefore;
    // If you're the approved address, it's not stealing...
    require e.msg.sender != getApproved(0);
    // If you're an operator, it's not stealing...
    require !isApprovedForAll(ownerBefore, e.msg.sender);
    calldataarg args;
    f(e, args);

    address ownerAfter = ownerOf(0);
    assert ownerBefore == ownerAfter;

    // This passed, so we can close off this path as a way to steal
}

rule StealV2_Part2(method f) {
    address ownerBefore = ownerOf(0);
    address approvedBefore = getApproved(0);

    env e;
    // If you're already the owner, it's not stealing...
    require e.msg.sender != ownerBefore;
    // If you're the approved address, it's not stealing? According the the EIP is it, but we'll allow it
    require e.msg.sender != getApproved(0);
    // If you're an operator, it's not stealing...
    require !isApprovedForAll(ownerBefore, e.msg.sender);
    calldataarg args;
    f(e, args);

    address approvedAfter = getApproved(0);
    assert approvedBefore == approvedAfter;

    // This passed, so we can't manipulate the approved address as a first step towards stealing
}

rule StealV2_Part3(method f, address operator) {
    address ownerBefore = ownerOf(0);
    bool operatorBefore = isApprovedForAll(ownerBefore, operator);

    env e;
    // If you're already the owner, it's not stealing...
    require e.msg.sender != ownerBefore;
    calldataarg args;
    f(e, args);

    bool operatorAfter = isApprovedForAll(ownerBefore, operator);
    assert operatorBefore == operatorAfter;

    // This passed, so we can't manipulate the operators as a first step towards stealing
}

// All change paths that would lead to changing the owner of the NFT by an unauthorized party are covered
// So it looks like the NFT cannot be stolen :D

// Here's some other rules and the original proof that kind of tests the same, but wasn't deduced the same way:

invariant TotalSupplyAlwaysOne()
    totalSupply() == 1

invariant BalanceOfOwnerIsOne()
    balanceOf(ownerOf(0)) == 1

rule OnlyOneOwner(address other, method f) {
    address currentOwner = ownerOf(0);
    require currentOwner != 0;
    require other != currentOwner;

    env e;
    calldataarg args;
    f(e, args);
    address newOwner = ownerOf(0);
    assert newOwner != currentOwner || newOwner != other;
}

rule NoExternalAllowedOrOwnerChange(method f) {
    address allowedBefore = getApproved(0);
    address ownerBefore = ownerOf(0);

    env e;
    require e.msg.sender != ownerOf(0);
    require e.msg.sender != getApproved(0);
    require !isApprovedForAll(ownerOf(0), e.msg.sender);
    calldataarg args;
    f(e, args);

    address allowedAfter = getApproved(0);
    address ownerAfter = ownerOf(0);

    assert allowedBefore == allowedAfter;
    assert ownerBefore == ownerAfter;
}

rule NoExternalOperatorChange(method f, address operator) {
    address ownerBefore = ownerOf(0);
    bool operatorBefore = isApprovedForAll(ownerBefore, operator);

    env e;
    require e.msg.sender != ownerOf(0);
    require e.msg.sender != getApproved(0);
    require !isApprovedForAll(ownerOf(0), e.msg.sender);
    calldataarg args;
    f(e, args);

    bool operatorAfter = isApprovedForAll(ownerBefore, operator);

    assert operatorBefore == operatorAfter;
}