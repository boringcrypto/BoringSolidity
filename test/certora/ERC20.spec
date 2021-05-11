methods {
    balanceOf(address user) returns (uint256) envfree;
    totalSupply() returns (uint256) envfree;
}

ghost sumOfBalances() returns uint256;

hook Sstore balanceOf[KEY address a] uint256 balance (uint256 old_balance) STORAGE {
	havoc sumOfBalances assuming 
        sumOfBalances@new() == sumOfBalances@old() + (balance - old_balance);
}

rule TransferDoesntChangeTotalSupply(address to, uint256 amount) {
    uint256 totalSupplyBefore = totalSupply();
    env e;
    transfer(e, to, amount); 
    assert totalSupply() == totalSupplyBefore;
}

rule TransferFromDoesntChangeTotalSupply(address from, address to, uint256 amount) {
    uint256 totalSupplyBefore = totalSupply();
    env e;
    transferFrom(e, from, to, amount); 
    assert totalSupply() == totalSupplyBefore;
}

rule TransferSumOfFromAndToBalancesStaySame(address to, uint256 amount) {
    env e;
    mathint sum = balanceOf(e.msg.sender) + balanceOf(to);
    require sum < max_uint256;
    transfer(e, to, amount); 
    assert balanceOf(e.msg.sender) + balanceOf(to) == sum;
}

rule TransferFromSumOfFromAndToBalancesStaySame(address from, address to, uint256 amount) {
    env e;
    mathint sum = balanceOf(from) + balanceOf(to);
    require sum < max_uint256;
    transferFrom(e, from, to, amount); 
    assert balanceOf(from) + balanceOf(to) == sum;
}

rule TransferDoesntChangeOtherBalance(address to, uint256 amount, address other) {
    env e;
    require other != e.msg.sender;
    require other != to;
    uint256 balanceBefore = balanceOf(other);
    transfer(e, to, amount); 
    assert balanceBefore == balanceOf(other);
}

rule TransferFromDoesntChangeOtherBalance(address from, address to, uint256 amount, address other) {
    env e;
    require other != from;
    require other != to;
    uint256 balanceBefore = balanceOf(other);
    transferFrom(e, from, to, amount); 
    assert balanceBefore == balanceOf(other);
}

rule SumOfBalancesIsTotalSupply(method f) {
    require sumOfBalances() == totalSupply();

    env e;
    if (f.selector != transfer(address, uint256).selector && f.selector != transferFrom(address, address, uint256).selector) {
        calldataarg args;
        f(e, args);
    }

    if (f.selector == transfer(address, uint256).selector) {
        address to;
        uint256 amount;
        require balanceOf(e.msg.sender) + balanceOf(amount) < max_uint256;
        transfer(e, to, amount);
    }

    if (f.selector == transferFrom(address, address, uint256).selector) {
        address from;
        address to;
        uint256 amount;
        require balanceOf(from) + balanceOf(amount) < max_uint256;
        transferFrom(e, from, to, amount);
    }

    assert sumOfBalances() == totalSupply();
}

rule OtherBalanceOnlyGoesUp(address other, method f) {
    env e;
    // totalSupply would have already overflowed in this case, so we can assume this
    uint256 balanceBefore = balanceOf(other);

    if (f.selector == transferFrom(address, address, uint256).selector) {
        address from;
        address to;
        uint256 amount;
        require(other != from);
        require balanceOf(from) + balanceBefore < max_uint256;

        transferFrom(e, from, to, amount);
    } else if (f.selector == transfer(address, uint256).selector) {
        require other != e.msg.sender;
        require balanceOf(e.msg.sender) + balanceBefore < max_uint256;
        calldataarg args;
        f(e, args);
    } else {
        require other != e.msg.sender;
        calldataarg args;
        f(e, args);
    }

    assert balanceOf(other) >= balanceBefore;
}