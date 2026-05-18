// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateToken is ERC20, Ownable {
    constructor() ERC20("CertificateToken", "CERT") Ownable(msg.sender) {
        // Emite 1.000.000 tokens iniciais para o deployer
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    // Apenas o owner pode emitir novos tokens (chamado pelo contrato de Staking)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // Apenas o owner pode queimar tokens
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
