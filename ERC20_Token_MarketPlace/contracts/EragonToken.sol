// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract EragonToken is ERC20{
    constructor() ERC20("EragonToken", "ET"){
        _mint(msg.sender, 1000*10**18);
    }

    function transferToken(address receiver, uint amount) external {
        require(balanceOf(msg.sender) >= amount, "You dont have that much token.");
        _transfer(msg.sender, receiver, amount);
    }

    function checkBalance(address add) external view returns(uint balance){
        balance = balanceOf(add);
    }
}
