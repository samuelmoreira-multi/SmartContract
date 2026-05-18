// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface mínima do CertificateToken para emitir recompensas
interface ICertificateToken {
    function mint(address to, uint256 amount) external;
}

// Interface do Chainlink para consultar preço ETH/USD
interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (uint80, int256 answer, uint256, uint256, uint80);
}

contract Staking is Ownable, ReentrancyGuard {
    ICertificateToken public certToken; // Contrato do token de recompensa
    AggregatorV3Interface public priceFeed; // Oráculo Chainlink ETH/USD

    // Saldo em stake de cada usuário (em wei)
    mapping(address => uint256) public stakedBalance;

    // Momento do último resgate de recompensa por usuário
    mapping(address => uint256) public lastClaimed;

    // Recompensa base: 1 CERT por ETH por dia
    uint256 public constant BASE_REWARD = 1e18;

    // Evento disparado ao fazer stake
    event Staked(address indexed user, uint256 amount);

    // Evento disparado ao retirar stake
    event Unstaked(address indexed user, uint256 amount);

    // Evento disparado ao resgatar recompensa
    event RewardClaimed(address indexed user, uint256 reward);

    constructor(address _certToken, address _priceFeed) Ownable(msg.sender) {
        certToken = ICertificateToken(_certToken);
        // Endereço do Chainlink ETH/USD na Sepolia
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    // Usuário deposita ETH para participar como validador
    function stake() external payable nonReentrant {
        require(msg.value > 0, "Valor de stake deve ser maior que zero");

        // Resgata recompensas pendentes antes de alterar o saldo
        if (stakedBalance[msg.sender] > 0) {
            _claim(msg.sender);
        }

        stakedBalance[msg.sender] += msg.value;
        lastClaimed[msg.sender] = block.timestamp;

        emit Staked(msg.sender, msg.value);
    }

    // Usuário retira ETH do stake
    function unstake(uint256 amount) external nonReentrant {
        require(
            stakedBalance[msg.sender] >= amount,
            "Saldo em stake insuficiente"
        );

        // Resgata recompensas antes de retirar
        _claim(msg.sender);

        stakedBalance[msg.sender] -= amount;

        // Transfere o ETH de volta para o usuário
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Falha na transferencia de ETH");

        emit Unstaked(msg.sender, amount);
    }

    // Usuário resgata recompensas sem retirar o stake
    function claimReward() external nonReentrant {
        require(stakedBalance[msg.sender] > 0, "Nenhum stake ativo");
        _claim(msg.sender);
    }

    // Lógica interna: calcula e emite a recompensa para o usuário
    function _claim(address user) internal {
        uint256 reward = calculateReward(user);
        if (reward > 0) {
            lastClaimed[user] = block.timestamp;
            certToken.mint(user, reward);
            emit RewardClaimed(user, reward);
        }
    }

    // Calcula a recompensa com base no tempo e no preço ETH/USD via Chainlink
    function calculateReward(address user) public view returns (uint256) {
        if (stakedBalance[user] == 0) return 0;

        uint256 timeElapsed = block.timestamp - lastClaimed[user];
        uint256 daysElapsed = timeElapsed / 1 days;

        if (daysElapsed == 0) return 0;

        // Busca o preço atual do ETH em USD no Chainlink (8 decimais)
        (, int256 ethPrice, , , ) = priceFeed.latestRoundData();
        require(ethPrice > 0, "Preco invalido no oraculo");

        // Recompensa = saldo * dias * BASE_REWARD * preço / fator de escala
        uint256 reward = (stakedBalance[user] *
            daysElapsed *
            BASE_REWARD *
            uint256(ethPrice)) / (1000 * 1e8 * 1e18);

        return reward;
    }

    // Retorna o preço atual do ETH em USD consultando o Chainlink
    function getETHPrice() external view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }
}
