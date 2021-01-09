# BentoBox

[![Coverage Status](https://coveralls.io/repos/github/sushiswap/bentobox/badge.svg?branch=master)](https://coveralls.io/github/sushiswap/bentobox?branch=master)

Platforms like Compound and Aave allow users to deposit assets as collateral and borrow other assets against this. These protocols have attracted billions of dollars, but they suffer from some major limitations. Taking away these limitations could see much larger adoption. BentoBox aims to do just that.

We solve these issues by having a platform with:

- Isolated lending pairs. Anyone can create a pair, it’s up to users which pairs they find safe enough. Risk is isolated to just that pair.
- Flexible oracles, both on-chain and off-chain.
  Liquid interest rates based on a specific target utilization range, such as 70-80%.
- Contracts optimized for low gas.
- The supplied assets can be used for flash loans, providing extra revenue for suppliers.

## Docs

[Development](docs/DEVELOPMENT.md)

[Deployment](docs/DEPLOYMENT.md)

## Security
Audits are being performed by Quantstamp and Peckshield

We use [Slither](https://github.com/crytic/slither) for static analysis. Reports and comments are here:

[BentoBox.sol](docs/Slither_BentoBox.md)


## Licence

UNLICENCED
