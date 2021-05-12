methods {
    balanceOf(address user) returns (uint256) envfree;
    totalSupply() returns (uint256) envfree;
    allowance(address from, address spender) returns (uint256) envfree;
}

rule TransferCorrect(address to, uint256 amount) {
    env e;
    require e.msg.value == 0;
    uint256 fromBalanceBefore = balanceOf(e.msg.sender);
    uint256 toBalanceBefore = balanceOf(to);
    require fromBalanceBefore + toBalanceBefore <= max_uint256;

    transfer@withrevert(e, to, amount);
    bool reverted = lastReverted;
    if (!reverted) {
        if (e.msg.sender == to) {
            assert balanceOf(e.msg.sender) == fromBalanceBefore;
        } else {
            assert balanceOf(e.msg.sender) == fromBalanceBefore - amount;
            assert balanceOf(to) == toBalanceBefore + amount;
        }
    } else {
        assert amount > fromBalanceBefore || to == 0;
    }
}

rule TransferFromCorrect(address from, address to, uint256 amount) {
    env e;
    require e.msg.value == 0;
    uint256 fromBalanceBefore = balanceOf(from);
    uint256 toBalanceBefore = balanceOf(to);
    uint256 allowanceBefore = allowance(from, e.msg.sender);
    require fromBalanceBefore + toBalanceBefore <= max_uint256;

    transferFrom@withrevert(e, from, to, amount);
    bool reverted = lastReverted;
    if (!reverted) {
        if (from == to) {
            assert balanceOf(from) == fromBalanceBefore;
            assert allowance(from, e.msg.sender) == allowanceBefore;
        } else {
            assert balanceOf(from) == fromBalanceBefore - amount;
            assert balanceOf(to) == toBalanceBefore + amount;
            if (allowanceBefore == max_uint256) {
                assert allowance(from, e.msg.sender) == max_uint256;
            } else {
                assert allowance(from, e.msg.sender) == allowanceBefore - amount;
            }
        }
    } else {
        assert allowanceBefore < amount || amount > fromBalanceBefore || to == 0;
    }
}

invariant ZeroAddressNoBalance()
    balanceOf(0) == 0

ghost sumOfBalances() returns uint256;

hook Sstore balanceOf[KEY address a] uint256 balance (uint256 old_balance) STORAGE {
	havoc sumOfBalances assuming 
        sumOfBalances@new() == sumOfBalances@old() + (balance - old_balance);
}

rule NoChangeTotalSupply(method f) {
    uint256 totalSupplyBefore = totalSupply();
    env e;
    calldataarg args;
    f(e, args);
    assert totalSupply() == totalSupplyBefore;
}

rule ChangingAllowance(method f, address from, address spender) {
    uint256 allowanceBefore = allowance(from, spender);
    env e;
    if (f.selector == approve(address, uint256).selector) {
        address spender_;
        uint256 amount;
        approve(e, spender_, amount);
        if (from == e.msg.sender && spender == spender_) {
            assert allowance(from, spender) == amount;
        } else {
            assert allowance(from, spender) == allowanceBefore;
        }
    } else if (f.selector == permit(address,address,uint256,uint256,uint8,bytes32,bytes32).selector) {
        address from_;
        address spender_;
        uint256 amount;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
        permit(e, from_, spender_, amount, deadline, v, r, s);
        if (from == from_ && spender == spender_) {
            assert allowance(from, spender) == amount;
        } else {
            assert allowance(from, spender) == allowanceBefore;
        }
    } else if (f.selector == transferFrom(address,address,uint256).selector) {
        address from_;
        address to;
        address amount;
        transferFrom(e, from_, to, amount);
        uint256 allowanceAfter = allowance(from, spender);
        if (from == from_ && spender == e.msg.sender) {
            assert from == to || allowanceBefore == max_uint256 || allowanceAfter == allowanceBefore - amount;
        } else {
            assert allowance(from, spender) == allowanceBefore;
        }
    } else {
        calldataarg args;
        f(e, args);
        assert allowance(from, spender) == allowanceBefore;
    }
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
        require balanceOf(e.msg.sender) + balanceOf(to) < max_uint256;
        transfer(e, to, amount);
    }

    if (f.selector == transferFrom(address, address, uint256).selector) {
        address from;
        address to;
        uint256 amount;
        require balanceOf(from) + balanceOf(to) < max_uint256;
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