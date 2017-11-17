# EToken lib
## NodeJS

    npm install -s etoken-lib
    
    const EToken = require('etoken-lib');
    const eToken = new EToken('http://localhost:8545'); // Ethereum node RPC url.
    eToken.setPrivateKey(privateKeyToSignransactions);
    // eToken.web3 is now ready to send transactions.
    
## Browser

    <script src='../build/bundle.min.js'></script>
    <script>
        const EToken = require('etoken-lib');
        const eToken = new EToken('http://localhost:8545'); // Ethereum node RPC url.
        eToken.setPrivateKey(privateKeyToSignransactions);
        // eToken.web3 is now ready to send transactions.
    </script>
