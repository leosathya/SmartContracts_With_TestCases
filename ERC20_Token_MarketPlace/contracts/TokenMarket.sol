// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "./EragonToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenMarket is Ownable{
    EragonToken eragon;

    uint public tokensPerEth = 100;
    mapping(address => uint) public eraBalance;

    event BuyEra(address indexed buyer, uint eraAmount, uint ethAmount);
    event SellEra(address indexed seller, uint ethAmount, uint eraAmount);

    constructor(address tokenAddress){
        eragon = EragonToken(tokenAddress);
    }

    function buy() external payable {
        require(msg.value > 0, "Nothing you can buy.");
        uint eraAmount = msg.value * 100;
        uint contractEraAmount = eragon.balanceOf(address(this));
        require(contractEraAmount >= eraAmount, "This Mush Eragon not Available."); 

        (bool sent) = eragon.transfer(msg.sender, eraAmount);
        require(sent, "Transfer failed.");
        emit BuyEra(msg.sender, eraAmount, msg.value);
    }

    function sell(uint _eraAmount) external{
        require(_eraAmount > 0, "can't sell");
        uint accountEraBal = eragon.balanceOf(msg.sender);
        require(accountEraBal >= _eraAmount, "dont have that much eragon");
        uint contractEthBal = address(this).balance;
        uint ethToPay = _eraAmount / tokensPerEth;
        require(contractEthBal >= ethToPay, "Not that much present in contract.");

        (bool sent ) = eragon.transferFrom(msg.sender, address(this), _eraAmount);
        require(sent, "Eragon transfer failed.");

        (sent, ) = msg.sender.call{value: ethToPay}("");
        require(sent, "Eth transfer failed");

        emit SellEra(msg.sender, ethToPay, _eraAmount);
    }
    function withdraw()external onlyOwner{
        uint ethToPay = address(this).balance;
        require(ethToPay > 0, "Nothing to withdraw");

        (bool send, ) = msg.sender.call{value: ethToPay}("");
        require(send, "Transaction failed.");
    }

    function eraAccountBalance(address add) external view returns(uint balance){
        balance = eragon.balanceOf(add);
    }

    function ethAccountBalance(address add) external view returns(uint balance){
        balance = add.balance;
    }
}