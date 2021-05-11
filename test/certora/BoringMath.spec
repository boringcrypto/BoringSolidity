methods {
	add(uint256 a, uint256 b) returns (uint256) envfree
	sub(uint256 a, uint256 b) returns (uint256) envfree
	mul(uint256 a, uint256 b) returns (uint256) envfree
    to128(uint256 a) returns (uint128 c) envfree
    to64(uint256 a) returns (uint64 c) envfree
    to32(uint256 a) returns (uint32 c) envfree

    add128(uint128 a, uint128 b) returns (uint128 c) envfree
    sub128(uint128 a, uint128 b) returns (uint128 c) envfree

    add64(uint64 a, uint64 b) returns (uint64 c) envfree
    sub64(uint64 a, uint64 b) returns (uint64 c) envfree

    add32(uint32 a, uint32 b) returns (uint32 c) envfree
    sub32(uint32 a, uint32 b) returns (uint32 c) envfree
}

rule AddCorrect(uint256 a, uint256 b) {
    uint256 c = add@withrevert(a, b);
    bool reverted = lastReverted;
    // add must return the mathimatical addition of a and b, or revert
    assert reverted || c == a + b;
    // add can ONLY revert if the mathimatical addition of a and b overflows
    assert !reverted || a + b > max_uint256;
}

rule SubCorrect(uint256 a, uint256 b) {
    uint256 c = sub@withrevert(a, b);
    bool reverted = lastReverted;
    assert reverted || c == a - b;
    assert !reverted || a < b;
}

rule MulCorrectIfNotReverted(uint256 a, uint256 b) {
    require a * b <= max_uint256;
    uint256 c = mul@withrevert(a, b);
    bool reverted = lastReverted;
    assert reverted || c == a * b;
    assert !reverted || a * b > max_uint256;
}

rule CorrectCastTo128(uint256 a) {
    uint128 c = to128@withrevert(a);
    bool reverted = lastReverted;
    assert reverted || c == a;
    assert !reverted || a > max_uint128;
}

rule CorrectCastTo64(uint256 a) {
    uint64 c = to64@withrevert(a);
    bool reverted = lastReverted;
    assert reverted || c == a;
    assert !reverted || a > max_uint64;
}

rule CorrectCastTo32(uint256 a) {
    uint32 c = to32@withrevert(a);
    bool reverted = lastReverted;
    assert reverted || c == a;
    assert !reverted || a > max_uint32;
}

rule Add128Correct(uint128 a, uint128 b) {
    uint128 c = add128@withrevert(a, b);
    bool reverted = lastReverted;
    assert reverted || c == a + b;
    assert !reverted || a + b > max_uint128;
}

rule Sub128Correct(uint128 a, uint128 b) {
    uint128 c = sub128@withrevert(a, b);
    bool reverted = lastReverted;
    assert reverted || c == a - b;
    assert !reverted || a < b;
}

rule Add64Correct(uint64 a, uint64 b) {
    uint64 c = add64@withrevert(a, b);
    bool reverted = lastReverted;
    assert reverted || c == a + b;
    assert !reverted || a + b > max_uint64;
}

rule Sub64Correct(uint64 a, uint64 b) {
    uint64 c = sub64@withrevert(a, b);
    bool reverted = lastReverted;
    assert reverted || c == a - b;
    assert !reverted || a < b;
}

rule Add32Correct(uint32 a, uint32 b) {
    uint32 c = add32@withrevert(a, b);
    bool reverted = lastReverted;
    assert reverted || c == a + b;
    assert !reverted || a + b > max_uint32;
}

rule Sub32Correct(uint32 a, uint32 b) {
    uint32 c = sub32@withrevert(a, b);
    bool reverted = lastReverted;
    assert reverted || c == a - b;
    assert !reverted || a < b;
}

