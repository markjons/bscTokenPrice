import express from 'express';
import bodyParser from 'body-parser';
import Web3 from 'web3';

const app = express();

const PORT = 5000;

app.use(bodyParser.json());

app.get('/price/:contract', (req, res) => {

    const tokenContractAddress = req.params.contract;

    let response = [];
    
    let pancakeSwapAbi =  [
        {"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},
    ];
    let tokenAbi = [
        {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    ];

    
    
    let pancakeSwapContract = "0x10ED43C718714eb63d5aA57B78B54704E256024E".toLowerCase();
    const web3 = new Web3("https://bsc-dataseed1.binance.org");
    async function calcSell( tokensToSell, tokenAddres){
        const web3 = new Web3("https://bsc-dataseed1.binance.org");
        const BNBTokenAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" //BNB
    
        let tokenRouter = await new web3.eth.Contract( tokenAbi, tokenAddres );
        let tokenDecimals = await tokenRouter.methods.decimals().call();
        
        tokensToSell = setDecimals(tokensToSell, tokenDecimals);
        let amountOut;
        try {
            let router = await new web3.eth.Contract( pancakeSwapAbi, pancakeSwapContract );
            amountOut = await router.methods.getAmountsOut(tokensToSell, [tokenAddres ,BNBTokenAddress]).call();
            amountOut =  web3.utils.fromWei(amountOut[1]);
        } catch (error) {}
        
        if(!amountOut) return 0;
        return amountOut;
    }

    async function calcBNBPrice(){
        const web3 = new Web3("https://bsc-dataseed1.binance.org");
        const BNBTokenAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" //BNB
        const USDTokenAddress  = "0x55d398326f99059fF775485246999027B3197955" //USDT
        let bnbToSell = web3.utils.toWei("1", "ether") ;
        let amountOut;
        try {
            let router = await new web3.eth.Contract( pancakeSwapAbi, pancakeSwapContract );
            amountOut = await router.methods.getAmountsOut(bnbToSell, [BNBTokenAddress ,USDTokenAddress]).call();
            amountOut =  web3.utils.fromWei(amountOut[1]);
        } catch (error) {}
        if(!amountOut) return 0;
        return amountOut;
    }

    function setDecimals( number, decimals ){
        number = number.toString();
        let numberAbs = number.split('.')[0]
        let numberDecimals = number.split('.')[1] ? number.split('.')[1] : '';
        while( numberDecimals.length < decimals ){
            numberDecimals += "0";
        }
        return numberAbs + numberDecimals;
    }
    

    (async () => {
        const tokenAddres = tokenContractAddress;
        let bnbPrice = await calcBNBPrice();

        let tokens_to_sell = 1; 
        let priceInBnb = await calcSell(tokens_to_sell, tokenAddres)/tokens_to_sell;

        response.push({
            bnb_price: bnbPrice,
            token_in_bnb: priceInBnb,
            token_in_usd: priceInBnb*bnbPrice
        });

        res.send(response);
    })();
});

app.listen(PORT, () => console.log(`Server is running on port: http://localhost:5000`));