const puppeteer = require('./puppeteer');

const { pageElements } = require('../pages/metamask/page');
const {
  welcomePageElements,
  firstTimeFlowPageElements,
  metametricsPageElements,
  firstTimeFlowFormPageElements,
  endOfFlowPageElements,
} = require('../pages/metamask/first-time-flow-page');
const { mainPageElements } = require('../pages/metamask/main-page');
const { unlockPageElements } = require('../pages/metamask/unlock-page');
const {
  notificationPageElements,
  permissionsPageElements,
  confirmPageElements,
} = require('../pages/metamask/notification-page');
const { setNetwork, getNetwork, interactionLog } = require('./helpers');

let walletAddress;

module.exports = {
  walletAddress: () => {
    return walletAddress;
  },
  // workaround for metamask random blank page on first run
  async fixBlankPage() {
    await puppeteer.metamaskWindow().waitForTimeout(1000);
    for (let times = 0; times < 5; times++) {
      if (
        (await puppeteer.metamaskWindow().$(welcomePageElements.app)) === null
      ) {
        await puppeteer.metamaskWindow().reload();
        await puppeteer.metamaskWindow().waitForTimeout(2000);
      } else {
        break;
      }
    }
  },
  async changeAccount(number) {
    interactionLog('metamask changing account')
    await puppeteer.waitAndClick(mainPageElements.accountMenu.button)
    await puppeteer.changeAccount(number)
  },

  async importMetaMaskWalletUsingPrivateKey(key) {
    interactionLog('metamask importing wallet from private key')
    await puppeteer.waitAndClick(mainPageElements.accountMenu.button);
    await puppeteer.waitAndClickByText('.account-menu__item__text', 'Import Account');
    await puppeteer.waitAndType('#private-key-box', key);
    await puppeteer.metamaskWindow().waitForTimeout(500);
    await puppeteer.waitAndClickByText(mainPageElements.accountMenu.importButton, 'Import');
    await puppeteer.metamaskWindow().waitForTimeout(2000);
    return true;
},

  async confirmWelcomePage() {
    interactionLog('metamask confirming welcome page')
    await module.exports.fixBlankPage();
    await puppeteer.waitAndClick(welcomePageElements.confirmButton);
    return true;
  },

  async unlock(password) {
    interactionLog('metamask unlocking')
    await module.exports.fixBlankPage();
    await puppeteer.waitAndType(unlockPageElements.passwordInput, password);
    await puppeteer.waitAndClick(unlockPageElements.unlockButton);
    return true;
  },
  async importWallet(secretWords, password) {
    interactionLog('metamask importing wallet')
    await puppeteer.waitAndClick(firstTimeFlowPageElements.importWalletButton);
    await puppeteer.waitAndClick(metametricsPageElements.optOutAnalyticsButton);
    interactionLog('metamask filling in secret words')
    await puppeteer.waitAndType(
      firstTimeFlowFormPageElements.secretWordsInput,
      secretWords,
    );
    interactionLog('metamask filling in password')
    await puppeteer.waitAndType(
      firstTimeFlowFormPageElements.passwordInput,
      password,
    );
    await puppeteer.waitAndType(
      firstTimeFlowFormPageElements.confirmPasswordInput,
      password,
    );
    await puppeteer.waitAndClick(firstTimeFlowFormPageElements.termsCheckbox);
    await puppeteer.waitAndClick(firstTimeFlowFormPageElements.importButton);

    await puppeteer.waitFor(pageElements.loadingSpinner);
    await puppeteer.waitAndClick(endOfFlowPageElements.allDoneButton);
    await puppeteer.waitFor(mainPageElements.walletOverview);

    // close popup if present
    if (
      (await puppeteer.metamaskWindow().$(mainPageElements.popup.container)) !==
      null
    ) {
      await puppeteer.waitAndClick(mainPageElements.popup.closeButton);
    }
    return true;
  },
  async changeNetwork(network) {
    interactionLog('metamask changing network')
    setNetwork(network);
    await puppeteer.waitAndClick(mainPageElements.networkSwitcher.button);
    if (network === 'main' || network === 'mainnet') {
      interactionLog('metamask selecting mainnet')
      await puppeteer.waitAndClick(
        mainPageElements.networkSwitcher.networkButton(0),
      );
    } else if (network === 'ropsten') {
      interactionLog('metamask selecting ropsten')
      await puppeteer.waitAndClick(
        mainPageElements.networkSwitcher.networkButton(1),
      );
    } else if (network === 'kovan') {
      interactionLog('metamask selecting kovan')
      await puppeteer.waitAndClick(
        mainPageElements.networkSwitcher.networkButton(2),
      );
    } else if (network === 'rinkeby') {
      interactionLog('metamask selecting rinkeby')
      await puppeteer.waitAndClick(
        mainPageElements.networkSwitcher.networkButton(3),
      );
    } else if (network === 'goerli') {
      interactionLog('metamask selecting goerli')
      await puppeteer.waitAndClick(
        mainPageElements.networkSwitcher.networkButton(4),
      );
    } else if (network === 'localhost') {
      interactionLog('metamask selecting localhost')
      await puppeteer.waitAndClick(
        mainPageElements.networkSwitcher.networkButton(5),
      );
    } else if (typeof network === 'object') {
      interactionLog(`selecting ${network.networkName}`)
      await puppeteer.waitAndClickByText(
        mainPageElements.networkSwitcher.dropdownMenuItem,
        network.networkName,
      );
    } else {
      interactionLog(`selecting custom - ${network}`)
      await puppeteer.waitAndClickByText(
        mainPageElements.networkSwitcher.dropdownMenuItem,
        network,
      );
    }

    if (typeof network === 'object') {
      await puppeteer.waitForText(
        mainPageElements.networkSwitcher.networkName,
        network.networkName,
      );
    } else {
      await puppeteer.waitForText(
        mainPageElements.networkSwitcher.networkName,
        network,
      );
    }

    return true;
  },
  async addNetwork(network) {
    interactionLog('metamask adding network')
    if (
      process.env.NETWORK_NAME &&
      process.env.RPC_URL &&
      process.env.CHAIN_ID
    ) {
      network = {
        networkName: process.env.NETWORK_NAME,
        rpcUrl: process.env.RPC_URL,
        chainId: process.env.CHAIN_ID,
        symbol: process.env.SYMBOL,
        blockExplorer: process.env.BLOCK_EXPLORER,
        isTestnet: process.env.IS_TESTNET,
      };
    }
    await puppeteer.waitAndClick(mainPageElements.accountMenu.button);
    await puppeteer.waitAndClick(mainPageElements.accountMenu.settingsButton);
    await puppeteer.waitAndClick(mainPageElements.settingsPage.networksButton);
    await puppeteer.waitAndClick(
      mainPageElements.networksPage.addNetworkButton,
    );
    await puppeteer.waitAndType(
      mainPageElements.addNetworkPage.networkNameInput,
      network.networkName,
    );
    await puppeteer.waitAndType(
      mainPageElements.addNetworkPage.rpcUrlInput,
      network.rpcUrl,
    );
    await puppeteer.waitAndType(
      mainPageElements.addNetworkPage.chainIdInput,
      network.chainId,
    );

    if (network.symbol) {
      await puppeteer.waitAndType(
        mainPageElements.addNetworkPage.symbolInput,
        network.symbol,
      );
    }

    if (network.blockExplorer) {
      await puppeteer.waitAndType(
        mainPageElements.addNetworkPage.blockExplorerInput,
        network.blockExplorer,
      );
    }
    await puppeteer.waitAndClick(mainPageElements.addNetworkPage.saveButton);
    await puppeteer.waitAndClick(mainPageElements.networksPage.closeButton);
    await puppeteer.waitForText(
      mainPageElements.networkSwitcher.networkName,
      network.networkName,
    );
    return true;
  },
  async acceptAccess() {
    interactionLog('metamask accepting access')
    await puppeteer.metamaskWindow().waitForTimeout(3000);
    const notificationPage = await puppeteer.switchToMetamaskNotification();
    await puppeteer.waitAndClick(
      notificationPageElements.nextButton,
      notificationPage,
    );
    await puppeteer.waitAndClick(
      permissionsPageElements.connectButton,
      notificationPage,
    );
    await puppeteer.metamaskWindow().waitForTimeout(3000);
    return true;
  },
  async confirmTransaction() {
    await puppeteer.metamaskWindow().waitForTimeout(3000);
    const notificationPage = await puppeteer.switchToMetamaskNotification();

    interactionLog('metamask confirming transaction')
    await puppeteer.waitAndClick(
      confirmPageElements.confirmButton,
      notificationPage,
    );
    await puppeteer.metamaskWindow().waitForTimeout(3000);
    return true;
  },
  async rejectTransaction() {
    interactionLog('metamask rejecting transaction')
    await puppeteer.metamaskWindow().waitForTimeout(3000);
    const notificationPage = await puppeteer.switchToMetamaskNotification();
    await puppeteer.waitAndClick(
      confirmPageElements.rejectButton,
      notificationPage,
    );
    await puppeteer.metamaskWindow().waitForTimeout(3000);
    return true;
  },
  async getWalletAddress() {
    interactionLog('metamask getting wallet address')
    await puppeteer.waitAndClick(mainPageElements.options.button);
    await puppeteer.waitAndClick(mainPageElements.options.accountDetailsButton);
    walletAddress = await puppeteer.waitAndGetValue(
      mainPageElements.accountModal.walletAddressInput,
    );
    await puppeteer.waitAndClick(mainPageElements.accountModal.closeButton);
    return walletAddress;
  },
  async initialSetup({ secretWords, network, password }) {
    interactionLog('metamask performing initial setup')
    const isCustomNetwork =
      process.env.NETWORK_NAME && process.env.RPC_URL && process.env.CHAIN_ID;

    await puppeteer.init();
    await puppeteer.assignWindows();
    await puppeteer.metamaskWindow().waitForTimeout(1000);
    await puppeteer.metamaskWindow().bringToFront()

    if (puppeteer.metamaskWindow().url().endsWith('welcome')) {
      await module.exports.confirmWelcomePage();
      await module.exports.importWallet(secretWords, password);
      if (isCustomNetwork) {
        await module.exports.addNetwork(network);
      } else {
        await module.exports.changeNetwork(network);
      }
    } else {
      await module.exports.unlock(password);
    }

    walletAddress = await module.exports.getWalletAddress();
    await puppeteer.switchToCypressWindow();
    return true;
  },
  async disconnectWallet() {
    interactionLog('metamask disconnecting wallet')
    await puppeteer.switchToMetamaskWindow();

    await puppeteer.waitAndClick(mainPageElements.options.button);
    await puppeteer.waitAndClick(mainPageElements.options.connectedSitesButton);
    await puppeteer.waitAndClick(mainPageElements.connectedSites.disconnectButton);
    await puppeteer.waitAndClickByText('.btn-primary', 'Disconnect');

    await puppeteer.switchToCypressWindow();
    return true;
  }
};
